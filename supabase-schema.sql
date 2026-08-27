create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  nexus_id text,
  first_name text not null,
  last_name text not null,
  full_name text,
  email text,
  password text not null,
  role text not null default 'user',
  wallet_balance numeric(12, 2) not null default 0,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table members add column if not exists email text;
alter table members add column if not exists nexus_id text;
alter table members add column if not exists role text not null default 'user';
alter table members add column if not exists wallet_balance numeric(12, 2) not null default 0;
alter table members add column if not exists avatar_url text;
alter table members add column if not exists is_active boolean not null default true;
update members set nexus_id = member_id where nexus_id is null;
create index if not exists members_nexus_id_idx on members(nexus_id);
create unique index if not exists members_nexus_id_unique on members(nexus_id) where nexus_id is not null;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now()
);

alter table members add column if not exists profile_id uuid references profiles(id) on delete set null;
update members m
set profile_id = p.id
from profiles p
where m.profile_id is null and m.email is not null and lower(m.email) = lower(p.email);
create index if not exists members_profile_id_idx on members(profile_id);

create schema if not exists private;

create or replace function private.search_member_by_nexus_id(search_nexus_id text)
returns table (
  id uuid,
  nexus_id text,
  member_id text,
  full_name text,
  first_name text,
  last_name text,
  avatar_url text,
  profile_id uuid,
  profile_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, coalesce(m.nexus_id, m.member_id), m.member_id,
         m.full_name, m.first_name, m.last_name, m.avatar_url,
         p.id, p.email
  from public.members as m
  left join public.profiles as p on p.id = m.profile_id
  where m.is_active = true
    and (m.nexus_id = search_nexus_id or m.member_id = search_nexus_id)
  limit 1;
$$;

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

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  sender_id text not null,
  content text not null,
  type text not null default 'text',
  file_url text,
  file_name text,
  created_at timestamptz default now()
);

create index if not exists support_messages_conversation_idx on support_messages(conversation_id, created_at);

alter table members enable row level security;
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;
alter table support_messages enable row level security;

drop policy if exists "Anyone can create a member account" on members;
create policy "Anyone can create a member account" on members
  for insert with check (true);

drop policy if exists "Members can view their own account" on members;
drop policy if exists "Users can search members by nexus_id" on members;

revoke select on table members from anon, authenticated;
grant usage on schema private to authenticated;
revoke execute on function private.search_member_by_nexus_id(text) from public;
grant execute on function private.search_member_by_nexus_id(text) to authenticated;
grant select on table public.profiles to postgres;

drop policy if exists "Users can view their own chats" on chats;
create policy "Users can view their own chats" on chats
  for select using (owner_id = auth.uid());

drop policy if exists "Users can insert their own chats" on chats;
create policy "Users can insert their own chats" on chats
  for insert with check (owner_id = auth.uid());

drop policy if exists "Users can view chat members" on chat_members;
create policy "Users can view chat members" on chat_members
  for select using (profile_id = auth.uid());

drop policy if exists "Users can view messages in their chats" on messages;
create policy "Users can view messages in their chats" on messages
  for select using (exists (
    select 1 from chats c where c.id = messages.chat_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Users can insert messages" on messages;
create policy "Users can insert messages" on messages
  for insert with check (sender_id = auth.uid());

drop policy if exists "Support messages can be read" on support_messages;
create policy "Support messages can be read" on support_messages
  for select using (true);

drop policy if exists "Support messages can be sent" on support_messages;
create policy "Support messages can be sent" on support_messages
  for insert with check (true);
