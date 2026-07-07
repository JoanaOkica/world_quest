-- 0008_profile_trigger.sql
-- Create a profile row automatically when a user completes auth. A user "only
-- exists after SMS verification" (docs/data-model.md), which is exactly when the
-- auth.users row appears, so this trigger is that moment. Display name defaults
-- to a friendly placeholder the user can change on the profile screen.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, phone_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Traveler'),
    new.phone is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
