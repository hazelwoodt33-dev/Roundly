-- Roundly — full schema (paste into Supabase SQL editor
-- Canonical migration: supabase/migrations/20250605000000_initial_schema.sql
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS where needed.

-- ---------------------------------------------------------------------------
-- Tables (dependency order: profiles → events → event_players → scores)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course text not null,
  location text,
  event_date date not null default current_date,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.event_players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  event_player_id uuid not null references public.event_players (id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  strokes int not null check (strokes between 1 and 15),
  updated_at timestamptz not null default now(),
  unique (event_player_id, hole_number)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists events_invite_code_idx on public.events (invite_code);
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists event_players_event_id_idx on public.event_players (event_id);
create index if not exists event_players_user_id_idx on public.event_players (user_id);
create index if not exists scores_event_player_id_idx on public.scores (event_player_id);

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer avoids policy recursion on event_players)
-- ---------------------------------------------------------------------------

create or replace function public.is_event_member(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.event_players
    where event_id = p_event_id and user_id = p_user_id
  )
  or exists (
    select 1
    from public.events
    where id = p_event_id and created_by = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_players enable row level security;
alter table public.scores enable row level security;

-- profiles
drop policy if exists "Users can read all profiles" on public.profiles;
create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- events (policies created after event_players table exists)
drop policy if exists "Authenticated users can read events they joined or created" on public.events;
create policy "Authenticated users can read events they joined or created"
  on public.events for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_event_member(id, auth.uid())
  );

drop policy if exists "Authenticated users can create events" on public.events;
create policy "Authenticated users can create events"
  on public.events for insert
  to authenticated
  with check (created_by = auth.uid());

-- event_players
drop policy if exists "Players can read members of their events" on public.event_players;
create policy "Players can read members of their events"
  on public.event_players for select
  to authenticated
  using (public.is_event_member(event_id, auth.uid()));

drop policy if exists "Users can join events" on public.event_players;
create policy "Users can join events"
  on public.event_players for insert
  to authenticated
  with check (user_id = auth.uid());

-- scores
drop policy if exists "Players can read scores for their events" on public.scores;
create policy "Players can read scores for their events"
  on public.scores for select
  to authenticated
  using (
    exists (
      select 1
      from public.event_players ep
      where ep.id = scores.event_player_id
        and public.is_event_member(ep.event_id, auth.uid())
    )
  );

drop policy if exists "Players can upsert their own scores" on public.scores;
create policy "Players can upsert their own scores"
  on public.scores for insert
  to authenticated
  with check (
    exists (
      select 1 from public.event_players ep
      where ep.id = scores.event_player_id and ep.user_id = auth.uid()
    )
  );

drop policy if exists "Players can update their own scores" on public.scores;
create policy "Players can update their own scores"
  on public.scores for update
  to authenticated
  using (
    exists (
      select 1 from public.event_players ep
      where ep.id = scores.event_player_id and ep.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Auth trigger: auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Join event by invite code (bypasses RLS for lookup)
-- ---------------------------------------------------------------------------

create or replace function public.join_event(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_user_id uuid := auth.uid();
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_event_id
  from public.events
  where invite_code = upper(trim(p_invite_code));

  if v_event_id is null then
    raise exception 'Invalid invite code';
  end if;

  select display_name into v_display_name
  from public.profiles
  where id = v_user_id;

  insert into public.event_players (event_id, user_id, display_name)
  values (
    v_event_id,
    v_user_id,
    coalesce(v_display_name, 'Player')
  )
  on conflict (event_id, user_id) do nothing;

  return v_event_id;
end;
$$;

create or replace function public.create_event(
  p_title text,
  p_course text,
  p_location text,
  p_event_date date,
  p_invite_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_user_id uuid := auth.uid();
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select display_name into v_display_name
  from public.profiles
  where id = v_user_id;

  if v_display_name is null then
    insert into public.profiles (id, display_name)
    values (v_user_id, 'Player')
    on conflict (id) do nothing;
    v_display_name := 'Player';
  end if;

  insert into public.events (title, course, location, event_date, invite_code, created_by)
  values (
    trim(p_title),
    trim(p_course),
    trim(p_location),
    p_event_date,
    upper(trim(p_invite_code)),
    v_user_id
  )
  returning id into v_event_id;

  insert into public.event_players (event_id, user_id, display_name)
  values (v_event_id, v_user_id, v_display_name);

  return v_event_id;
end;
$$;

grant execute on function public.is_event_member(uuid, uuid) to authenticated;
grant execute on function public.join_event(text) to authenticated;
grant execute on function public.create_event(text, text, text, date, text) to authenticated;

-- See supabase/migrations/20250607000000_courses.sql for courses support.

-- ---------------------------------------------------------------------------
-- Realtime (idempotent)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scores'
  ) then
    alter publication supabase_realtime add table public.scores;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'event_players'
  ) then
    alter publication supabase_realtime add table public.event_players;
  end if;
end $$;
