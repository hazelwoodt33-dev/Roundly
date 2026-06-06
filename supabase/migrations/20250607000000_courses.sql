-- Golf courses and holes

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.course_holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  par int not null check (par between 3 and 6),
  stroke_index int not null check (stroke_index between 1 and 18),
  unique (course_id, hole_number),
  unique (course_id, stroke_index)
);

create index if not exists course_holes_course_id_idx on public.course_holes (course_id);

alter table public.events
  add column if not exists course_id uuid references public.courses (id);

create index if not exists events_course_id_idx on public.events (course_id);

-- Auto-generate 18 holes when a course is created
create or replace function public.generate_course_holes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.course_holes (course_id, hole_number, par, stroke_index)
  select new.id, gs, 4, gs
  from generate_series(1, 18) as gs;
  return new;
end;
$$;

drop trigger if exists on_course_created on public.courses;
create trigger on_course_created
  after insert on public.courses
  for each row execute function public.generate_course_holes();

-- RLS
alter table public.courses enable row level security;
alter table public.course_holes enable row level security;

drop policy if exists "Authenticated users can read courses" on public.courses;
create policy "Authenticated users can read courses"
  on public.courses for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read course holes" on public.course_holes;
create policy "Authenticated users can read course holes"
  on public.course_holes for select
  to authenticated
  using (true);

-- Seed sample courses (18 holes auto-generated per course)
insert into public.courses (name)
values
  ('Pebble Beach Golf Links'),
  ('Augusta National Golf Club'),
  ('St Andrews Old Course')
on conflict (name) do nothing;

-- Update create_event to accept optional course_id
drop function if exists public.create_event(text, text, text, date, text);

create or replace function public.create_event(
  p_title text,
  p_course text,
  p_location text,
  p_event_date date,
  p_invite_code text,
  p_course_id uuid default null
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
  v_course_name text := trim(p_course);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_course_id is not null then
    select name into v_course_name
    from public.courses
    where id = p_course_id;

    if v_course_name is null then
      raise exception 'Course not found';
    end if;
  elsif v_course_name = '' then
    raise exception 'Course is required';
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

  insert into public.events (
    title, course, location, event_date, invite_code, created_by, course_id
  )
  values (
    trim(p_title),
    v_course_name,
    trim(p_location),
    p_event_date,
    upper(trim(p_invite_code)),
    v_user_id,
    p_course_id
  )
  returning id into v_event_id;

  insert into public.event_players (event_id, user_id, display_name)
  values (v_event_id, v_user_id, v_display_name);

  return v_event_id;
end;
$$;

grant execute on function public.create_event(text, text, text, date, text, uuid) to authenticated;
