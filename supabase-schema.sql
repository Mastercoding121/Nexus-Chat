create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  first_name text not null,
  last_name text not null,
  full_name text,
  email text,
  password text not null,
  role text not null default 'user',
  wallet_balance numeric(12, 2) not null default 0,
  avatar_url text,
  created_at timestamptz default now()
);

alter table members add column if not exists email text;
alter table members add column if not exists role text not null default 'user';
alter table members add column if not exists wallet_balance numeric(12, 2) not null default 0;
alter table members add column if not exists avatar_url text;

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

create policy if not exists "Support messages can be read" on support_messages
  for select using (true);

create policy if not exists "Support messages can be sent" on support_messages
  for insert with check (true);
