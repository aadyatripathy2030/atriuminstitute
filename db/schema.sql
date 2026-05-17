-- Atrium Institute — Postgres schema. Targets Render Postgres (or any
-- vanilla Postgres 13+). Run this once via `node tools/migrate.js`, or
-- paste it into psql. Everything in here is idempotent (uses
-- `if not exists` / `add column if not exists`) so it's safe to re-run
-- against an existing database.

-- ------------------------------------------------------------------
-- Core auth tables (unchanged from earlier migrations)
-- ------------------------------------------------------------------

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

-- ------------------------------------------------------------------
-- New columns on users (added in May 2026): link_code, age, state,
-- parental-consent flags.
--
-- link_code is a unique short code each user can share so the other
-- party (parent or student) can link to them.
-- ------------------------------------------------------------------

alter table users add column if not exists link_code text;
alter table users add column if not exists age integer;
alter table users add column if not exists state text;
alter table users add column if not exists consent_required boolean not null default false;
alter table users add column if not exists consent_granted_at timestamptz;

create unique index if not exists idx_users_link_code on users (link_code) where link_code is not null;

-- ------------------------------------------------------------------
-- Parent-student linking
-- ------------------------------------------------------------------

create table if not exists parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references users (id) on delete cascade,
  student_user_id uuid not null references users (id) on delete cascade,
  status text not null default 'active' check (status in ('pending', 'active', 'rejected')),
  initiated_by_user_id uuid not null references users (id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (parent_user_id, student_user_id)
);

create index if not exists idx_links_parent on parent_student_links (parent_user_id);
create index if not exists idx_links_student on parent_student_links (student_user_id);

-- ------------------------------------------------------------------
-- Quiz attempts: structured record of every quiz the student finishes.
-- Useful for dashboards (score over time, weak topics) and avoids
-- having to parse the progress jsonb blob to compute analytics.
-- ------------------------------------------------------------------

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  course_id text not null,
  book_id text not null,
  section_idx integer not null,
  section_kind text not null default 'section' check (section_kind in ('section', 'cumulative', 'final')),
  score integer not null,
  total integer not null,
  passed boolean not null,
  started_at timestamptz,
  completed_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_user_id on quiz_attempts (user_id);
create index if not exists idx_quiz_attempts_completed_at on quiz_attempts (completed_at desc);
create index if not exists idx_quiz_attempts_user_course on quiz_attempts (user_id, course_id);

-- ------------------------------------------------------------------
-- Activity log: append-only event stream. Used for the activity
-- timeline shown to both the student and their linked parents.
-- ------------------------------------------------------------------

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  kind text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_user_created on activity_log (user_id, created_at desc);
create index if not exists idx_activity_kind on activity_log (kind);
