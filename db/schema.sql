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
-- New columns on users (added in May 2026): link_code, age, country,
-- parental-consent flags.
--
-- link_code is a unique short code each user can share so the other
-- party (parent or student) can link to them.
--
-- country (originally `state`) holds the full country name as a string.
-- The earlier US-state-only design was widened on 2026-05-17.
-- ------------------------------------------------------------------

alter table users add column if not exists link_code text;
alter table users add column if not exists age integer;
alter table users add column if not exists state text;
alter table users add column if not exists country text;
-- Backfill country from any existing state values, then drop the old col.
update users set country = state where country is null and state is not null;
alter table users drop column if exists state;
alter table users add column if not exists consent_required boolean not null default false;
alter table users add column if not exists consent_granted_at timestamptz;
-- Admin flag. Set manually from psql by an operator. The /admin page only
-- renders for users where this is true.
alter table users add column if not exists is_admin boolean not null default false;

-- ------------------------------------------------------------------
-- Stripe subscription state (added May 2026). Free tier uses none of
-- these; subscribers fill them via the /api/stripe/webhook handler.
-- ------------------------------------------------------------------
alter table users add column if not exists stripe_customer_id      text;
alter table users add column if not exists stripe_subscription_id  text;
alter table users add column if not exists subscription_status     text;  -- trialing | active | past_due | canceled | …
alter table users add column if not exists subscription_plan       text;  -- monthly | yearly
alter table users add column if not exists current_period_end      timestamptz;
create unique index if not exists users_stripe_customer_id_uq on users(stripe_customer_id) where stripe_customer_id is not null;

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

-- Per-question detail and attempt metadata. JSONB column holds an array of
-- { q, type, userAnswer, correctAnswer, correct, note? } items so dashboards
-- can show exactly what was right / wrong on each attempt.
alter table quiz_attempts add column if not exists answers jsonb not null default '[]'::jsonb;
alter table quiz_attempts add column if not exists attempt_number integer;
alter table quiz_attempts add column if not exists duration_seconds integer;

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

-- ------------------------------------------------------------------
-- Student + parent profile pages.
--
-- Email reminders are driven by columns on student_profiles. For under-13
-- students, parent_authorised_reminders must be true (set by a linked
-- parent) before any reminder email is sent, regardless of the student's
-- own reminder_enabled toggle.
-- ------------------------------------------------------------------

create table if not exists student_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  display_name text,
  school_name text,
  grade_level text,
  subjects text[] not null default '{}',
  study_plan_courses text[] not null default '{}',
  study_goal text,
  timezone text,
  reminder_enabled boolean not null default false,
  reminder_frequency text not null default 'weekly'
    check (reminder_frequency in ('daily', 'weekdays', 'mwf', 'twr', 'weekly', 'biweekly')),
  reminder_time_local time not null default '17:00',
  reminder_content text not null default 'generic'
    check (reminder_content in ('generic', 'continuation', 'weak_topics')),
  parent_authorised_reminders boolean not null default false,
  last_reminder_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists parent_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  display_name text,
  relationship text not null default 'parent'
    check (relationship in ('parent', 'guardian', 'tutor', 'other')),
  timezone text,
  weekly_digest_enabled boolean not null default true,
  weekly_digest_day integer not null default 0 check (weekly_digest_day between 0 and 6),
  weekly_digest_time_local time not null default '09:00',
  last_digest_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Index used by the cron job that finds due reminders / digests.
create index if not exists idx_student_profiles_reminders
  on student_profiles (reminder_enabled, last_reminder_sent_at)
  where reminder_enabled = true;
create index if not exists idx_parent_profiles_digests
  on parent_profiles (weekly_digest_enabled, last_digest_sent_at)
  where weekly_digest_enabled = true;

-- ------------------------------------------------------------------
-- AI token-cost observability. Every Claude API call writes one row.
-- Admins can query / aggregate to see spend per intent / per user.
-- ------------------------------------------------------------------

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  user_email text,
  intent text,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_created_at on ai_usage (created_at desc);
create index if not exists idx_ai_usage_user on ai_usage (user_id);
create index if not exists idx_ai_usage_intent on ai_usage (intent);
create index if not exists idx_ai_usage_model on ai_usage (model);

-- ------------------------------------------------------------------
-- Cached AI-generated lessons. Generating a section's Learn lesson is
-- a Sonnet call; storing the result means subsequent views are instant
-- and cost zero tokens. Keyed by (course_id, book_id, section_idx).
-- ------------------------------------------------------------------

create table if not exists cached_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  book_id text not null,
  section_idx integer not null,
  section_kind text not null default 'section',
  content text not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, book_id, section_idx, section_kind)
);

create index if not exists idx_cached_lessons_lookup
  on cached_lessons (course_id, book_id, section_idx, section_kind);

-- ------------------------------------------------------------------
-- Goal-based study plan. Each student can have one active plan with a
-- goal description, a target date, the course they're working toward,
-- and an AI-generated week-by-week section schedule stored as JSONB.
-- ------------------------------------------------------------------

create table if not exists study_plans (
  user_id uuid primary key references users (id) on delete cascade,
  goal_text text not null,
  target_date date,
  course_id text,
  plan_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI model preference. Lets a student opt out of the default balanced
-- model selection and pin every call to Haiku (fast) or Sonnet (best).
alter table student_profiles
  add column if not exists ai_model_preference text not null default 'balanced'
  check (ai_model_preference in ('balanced', 'fast', 'best'));

-- ------------------------------------------------------------------
-- Curriculum reference data (May 2026). Multi-subject by design — math
-- is the first subject loaded but Language Arts (and any future
-- subject) drop in as additional JSON files under curriculum/ with
-- their own subject_id. Schema reused as-is, no per-subject tables.
--
-- The import flow:
--   1. node tools/import-curriculum.js scans curriculum/*.json
--   2. each file declares one subject and its courses + reference data
--   3. import is transactional and idempotent (delete + reload all
--      curriculum_* rows in one tx)
-- ------------------------------------------------------------------

create table if not exists curriculum_subjects (
  id text primary key,                       -- 'math', 'language_arts', ...
  title text not null,
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists curriculum_courses (
  id text primary key,
  subject_id text references curriculum_subjects(id) on delete cascade,
  title text not null,
  grade_levels integer[] not null default '{}',
  display_order integer not null default 0,
  total_weeks integer,
  total_lessons integer,
  updated_at timestamptz not null default now()
);

-- subject_id column added in the multi-subject refactor; pre-existing
-- math courses get backfilled by the import script.
alter table curriculum_courses
  add column if not exists subject_id text references curriculum_subjects(id) on delete cascade;

-- legacy_course_id points to the existing courses.js course (e.g.
-- "prealgebra", "algebra") whose content already covers this curriculum
-- course, so we don't generate duplicate quizzes/lessons. Multiple
-- curriculum_courses rows can share a legacy id (e.g. grade6, grade7,
-- grade8 all map to prealgebra). Free-form text since the existing
-- course catalogue lives in JS, not in the DB.
alter table curriculum_courses
  add column if not exists legacy_course_id text;

create index if not exists idx_curriculum_courses_legacy
  on curriculum_courses (legacy_course_id);

create index if not exists idx_curriculum_courses_grades
  on curriculum_courses using gin (grade_levels);
create index if not exists idx_curriculum_courses_subject
  on curriculum_courses (subject_id);

create table if not exists curriculum_units (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references curriculum_courses(id) on delete cascade,
  unit_number integer not null,
  unit_title text not null,
  weeks integer,
  unique (course_id, unit_number)
);

create index if not exists idx_curriculum_units_course on curriculum_units (course_id);

create table if not exists curriculum_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references curriculum_courses(id) on delete cascade,
  unit_number integer not null,
  lesson_number text not null,
  lesson_title text not null,
  learning_objective text,
  ccss_code text,
  key_concepts text,
  prerequisites text,
  key_vocabulary text,
  common_misconceptions text,
  real_world_hook text,
  practices text,                            -- math: "1, 3, 5" (SMPs). LA: equivalent practice codes.
  meta jsonb not null default '{}'::jsonb,   -- subject-specific extras (LA genre, text_type, anchor_standard, etc.)
  display_order integer not null default 0,
  unique (course_id, lesson_number)
);

-- Migrate the original smps column to practices if a prior import left it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'curriculum_lessons' and column_name = 'smps'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'curriculum_lessons' and column_name = 'practices'
  ) then
    alter table curriculum_lessons rename column smps to practices;
  elsif exists (
    select 1 from information_schema.columns
    where table_name = 'curriculum_lessons' and column_name = 'smps'
  ) then
    -- Both exist (rare). Copy smps -> practices where practices is null, then drop smps.
    update curriculum_lessons set practices = smps where practices is null and smps is not null;
    alter table curriculum_lessons drop column smps;
  end if;
end$$;

alter table curriculum_lessons
  add column if not exists meta jsonb not null default '{}'::jsonb;

create index if not exists idx_curriculum_lessons_course on curriculum_lessons (course_id);
create index if not exists idx_curriculum_lessons_unit on curriculum_lessons (course_id, unit_number);

-- Generic per-subject practices framework. Math = 8 SMPs. LA can have
-- its own set (e.g. close reading, evidence-based writing, listening
-- and discussion). curriculum_smps is dropped if it was created by an
-- earlier import; the new table covers both subjects.
drop table if exists curriculum_smps;

create table if not exists curriculum_practices (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references curriculum_subjects(id) on delete cascade,
  code text not null,                        -- 'SMP 1' or 'CR.1', etc.
  practice text not null,
  what_students_do text,
  implications text,
  display_order integer not null default 0,
  unique (subject_id, code)
);

create index if not exists idx_curriculum_practices_subject
  on curriculum_practices (subject_id);

create table if not exists curriculum_misconceptions (
  id uuid primary key default gen_random_uuid(),
  topic_area text,
  misconception text not null,
  why_it_happens text,
  diagnostic_approach text,
  remediation text
);

alter table curriculum_misconceptions
  add column if not exists subject_id text references curriculum_subjects(id) on delete cascade;

create index if not exists idx_curriculum_misconceptions_topic on curriculum_misconceptions (topic_area);
create index if not exists idx_curriculum_misconceptions_subject on curriculum_misconceptions (subject_id);

create table if not exists curriculum_real_world_contexts (
  id uuid primary key default gen_random_uuid(),
  theme text,
  context text not null,
  math_connections text
);

alter table curriculum_real_world_contexts
  add column if not exists subject_id text references curriculum_subjects(id) on delete cascade;

create index if not exists idx_curriculum_real_world_theme on curriculum_real_world_contexts (theme);
create index if not exists idx_curriculum_real_world_subject on curriculum_real_world_contexts (subject_id);

-- Glossary: term is unique across all subjects historically. For LA we
-- expect different terminology, so swap the unique to (subject_id, term).
create table if not exists curriculum_glossary (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  definition text,
  first_introduced text
);

alter table curriculum_glossary
  add column if not exists subject_id text references curriculum_subjects(id) on delete cascade;

-- Drop the old single-column unique on term if it exists, swap to
-- (subject_id, term).
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'curriculum_glossary_term_key'
  ) then
    alter table curriculum_glossary drop constraint curriculum_glossary_term_key;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'curriculum_glossary_subject_term_uq'
  ) then
    alter table curriculum_glossary
      add constraint curriculum_glossary_subject_term_uq unique (subject_id, term);
  end if;
end$$;

-- ------------------------------------------------------------------
-- One-time backfill for installations that loaded the curriculum
-- BEFORE the multi-subject refactor. Those rows have subject_id = null
-- because the column didn't exist at insert time. Without this step,
-- re-running import-curriculum.js raises a primary-key conflict on
-- curriculum_courses because its per-subject DELETE doesn't match
-- subject_id IS NULL rows.
--
-- Safe on a clean DB: the inserts use ON CONFLICT and the updates
-- match zero rows when there's nothing to backfill.
-- ------------------------------------------------------------------

insert into curriculum_subjects (id, title, display_order)
  values ('math', 'Mathematics', 1)
  on conflict (id) do nothing;

update curriculum_courses              set subject_id = 'math' where subject_id is null;
update curriculum_misconceptions       set subject_id = 'math' where subject_id is null;
update curriculum_real_world_contexts  set subject_id = 'math' where subject_id is null;
update curriculum_glossary             set subject_id = 'math' where subject_id is null;

-- User grade. Drives the grade-based filter on the courses page. Set at
-- signup (when the student gives their age) and overridable from the
-- Profile page. Nullable for parents and for students who haven't told
-- us yet.
alter table users add column if not exists grade_level integer
  check (grade_level is null or (grade_level between 1 and 12));

-- ------------------------------------------------------------------
-- User favorites. Students can star a topic (book) from the courses
-- grid so it shows up on their My Favorites page. Keyed by the
-- existing courses.js course + book ids -- not the curriculum_courses
-- ids -- because favorites are used to launch the legacy learn/quiz
-- flow directly.
-- ------------------------------------------------------------------

create table if not exists user_favorites (
  user_id uuid not null references users (id) on delete cascade,
  course_id text not null,
  book_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, book_id)
);

create index if not exists idx_favorites_user_created
  on user_favorites (user_id, created_at desc);

-- ------------------------------------------------------------------
-- Cached AI-generated quizzes for curriculum lessons. Keyed on the
-- curriculum_course id + lesson_number (e.g. "grade6" / "1.1") so the
-- same quiz is reused across users. Generated via the gen-questions
-- intent the first time a student clicks Start Quiz on a lesson.
-- ------------------------------------------------------------------

create table if not exists curriculum_lesson_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  lesson_number text not null,
  questions jsonb not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, lesson_number)
);

create index if not exists idx_curriculum_quizzes_lookup
  on curriculum_lesson_quizzes (course_id, lesson_number);
