-- 0007_friends.sql
-- Friend graph operations. Friend discovery is by EXACT handle only — never
-- fuzzy or proximity search — to prevent enumeration/scraping
-- (docs/safety-and-security.md §Anti-enumeration). These SECURITY DEFINER
-- functions are the only way to reach a non-friend's row, and only by exact id.

-- Look up a user by their exact handle. Returns nothing on no match. Exposes
-- only id + display_name, never location or contact info.
create or replace function find_user_by_handle(p_handle text)
returns table (id uuid, display_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name
  from profiles p
  where lower(p.handle) = lower(p_handle)
    and p.id <> auth.uid()
    and not is_blocked(p.id, auth.uid())
  limit 1;
$$;

-- Send a friend request (pending). Idempotent-ish: no-op if a row already
-- exists in either direction. Blocked pairs cannot connect.
create or replace function send_friend_request(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_target = auth.uid() then
    raise exception 'cannot friend yourself';
  end if;
  if is_blocked(p_target, auth.uid()) then
    raise exception 'blocked';
  end if;
  if exists (
    select 1 from friendships f
    where (f.user_a = auth.uid() and f.user_b = p_target)
       or (f.user_a = p_target and f.user_b = auth.uid())
  ) then
    return; -- already connected or pending
  end if;
  insert into friendships (user_a, user_b, status)
  values (auth.uid(), p_target, 'pending');
end;
$$;

-- Accept a pending request that was sent TO the caller.
create or replace function accept_friend_request(p_from uuid)
returns void language sql security definer set search_path = public as $$
  update friendships
  set status = 'accepted'
  where user_a = p_from and user_b = auth.uid() and status = 'pending';
$$;

-- The caller's friendships, with the other party's display name, in one call.
create or replace function my_friendships()
returns table (
  other_id uuid, display_name text, status text, direction text
)
language sql stable security definer set search_path = public as $$
  select
    case when f.user_a = auth.uid() then f.user_b else f.user_a end as other_id,
    p.display_name,
    f.status,
    case when f.user_a = auth.uid() then 'outgoing' else 'incoming' end as direction
  from friendships f
  join profiles p
    on p.id = case when f.user_a = auth.uid() then f.user_b else f.user_a end
  where f.user_a = auth.uid() or f.user_b = auth.uid();
$$;
