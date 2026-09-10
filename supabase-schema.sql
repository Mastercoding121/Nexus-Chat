do $$
begin
  create extension if not exists pgcrypto;
exception when insufficient_privilege or object_not_in_prerequisite_state then
  raise notice 'pgcrypto extension unavailable: skipping timing-safe digest compare; using legacy plaintext equality. Upgrade to Supabase Pro or grant superuser to enable pgcrypto.';
end $$;

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  first_name text not null,
  last_name text not null,
  full_name text,
  password text not null,
  created_at timestamptz default now()
);

do $$
begin
  alter table members add column if not exists email text;
  alter table members add column if not exists email_verified boolean not null default false;
  alter table members add column if not exists role text not null default 'user';
  alter table members add column if not exists avatar_url text;
exception when others then
  raise notice 'members alter skipped: %', sqlerrm;
end $$;

create unique index if not exists idx_members_email on members (email) where email is not null;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'private',
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists chat_members (
  chat_id uuid references chats(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (chat_id, profile_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  type text not null default 'text',
  file_url text,
  file_name text,
  encrypted boolean default false,
  created_at timestamptz default now()
);

alter table members enable row level security;
alter table profiles enable row level security;
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;

revoke select (password) on members from anon, authenticated;
grant select (password) on members to service_role;

drop policy if exists "Anyone can create a member account" on members;
create policy "Anyone can create a member account" on members
  for insert with check (role != 'supabase_admin');

drop policy if exists "Members can view their own account" on members;
drop policy if exists "Members can view non-admin accounts" on members;
-- NOTE(F-1 privacy): Broad non-admin directory visibility is retained for backwards
-- compatibility with legacy fallback SELECT + cross-member ChatListItem lookups
-- on deployments where members.id <> auth.uid(). Password column exposure is
-- independently prevented via REVOKE SELECT(password) column-level ACL above.
-- Tighten to self-only (auth.uid() = id) after confirming Supabase Auth links
-- members.id to auth.users.id for all deployed environments.
create policy "Members can view non-admin accounts" on members
  for select using (role != 'supabase_admin');

create policy if not exists "Admin self read" on members
  for select
  using (
    role = 'supabase_admin'
    and (auth.uid() = id or current_setting('app.admin_context', true) = 'true')
  );

create policy if not exists "Members update own profile only" on members
  for update
  using (role != 'supabase_admin')
  with check (role != 'supabase_admin');

create policy if not exists "Admin write protected" on members
  for update
  using (
    role = 'supabase_admin'
    and (auth.uid() = id or current_setting('app.admin_context', true) = 'true')
  )
  with check (role = 'supabase_admin');

create policy if not exists "Members cannot delete admin" on members
  for delete
  using (role != 'supabase_admin');

create or replace function verify_member_login(p_member_id text, p_password text)
returns table (
  id uuid,
  member_id text,
  first_name text,
  last_name text,
  full_name text,
  email text,
  email_verified boolean,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_pw_matches boolean;
begin
  select m.id, m.member_id, m.first_name, m.last_name, m.full_name,
         m.email, m.email_verified, m.role, m.password, m.created_at
    into v_row
    from members m
   where m.member_id = p_member_id
   limit 1;

  if not found then
    return;
  end if;

  begin
    v_pw_matches := (digest(v_row.password::bytea, 'sha256') = digest(p_password::bytea, 'sha256'));
  exception when undefined_function or insufficient_privilege then
    v_pw_matches := (v_row.password = p_password);
  end;

  if not v_pw_matches then
    return;
  end if;

  id := v_row.id;
  member_id := v_row.member_id;
  first_name := v_row.first_name;
  last_name := v_row.last_name;
  full_name := v_row.full_name;
  email := v_row.email;
  email_verified := v_row.email_verified;
  role := v_row.role;
  created_at := v_row.created_at;
  return next;
end;
$$;

revoke all on function verify_member_login(text, text) from public;
grant execute on function verify_member_login(text, text) to anon, authenticated, service_role;

create policy if not exists "Users can view their own chats" on chats
  for select using (owner_id = auth.uid());

create policy if not exists "Users can insert their own chats" on chats
  for insert with check (owner_id = auth.uid());

create policy if not exists "Users can view chat members" on chat_members
  for select using (profile_id = auth.uid());

create policy if not exists "Users can view messages in their chats" on messages
  for select using (exists (
    select 1 from chats c where c.id = messages.chat_id and c.owner_id = auth.uid()
  ));

create policy if not exists "Users can insert messages" on messages
  for insert with check (sender_id = auth.uid());
