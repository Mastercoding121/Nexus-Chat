create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  first_name text not null,
  last_name text not null,
  full_name text,
  password text not null,
  created_at timestamptz default now()
);

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
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;

create policy if not exists "Anyone can create a member account" on members
  for insert with check (true);

create policy if not exists "Members can view their own account" on members
  for select using (true);

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
