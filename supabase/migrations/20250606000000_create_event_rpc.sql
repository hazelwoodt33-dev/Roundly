-- Fix event creation: allow creators to read their events immediately,
-- and add create_event() RPC (same pattern as join_event).

drop policy if exists "Authenticated users can read events they joined or created" on public.events;
create policy "Authenticated users can read events they joined or created"
  on public.events for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_event_member(id, auth.uid())
  );

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

grant execute on function public.create_event(text, text, text, date, text) to authenticated;
