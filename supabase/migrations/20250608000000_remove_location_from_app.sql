-- Stop requiring location in create_event (column kept for existing rows).

drop function if exists public.create_event(text, text, text, date, text);
drop function if exists public.create_event(text, text, text, date, text, uuid);

create or replace function public.create_event(
  p_title text,
  p_course text,
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
    null,
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

grant execute on function public.create_event(text, text, date, text, uuid) to authenticated;
