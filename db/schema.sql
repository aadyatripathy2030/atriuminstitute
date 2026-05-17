-- Atrium Institute — Postgres schema. Targets Render Postgres (or any
-- vanilla Postgres). Run this once against your DATABASE_URL using
-- `node tools/migrate.js`, or paste it into the Render psql shell.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'student' check (role in ('student', 'parent')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_email on users (email);

create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_codes_email on verification_codes (email);
create index if not exists idx_codes_expires_at on verification_codes (expires_at);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_expires_at on sessions (expires_at);

create table if not exists progress (
  user_id uuid not null references users (id) on delete cascade,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
