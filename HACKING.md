# Atrium Institute — Hacking Notes

Reference for future development. Tells a new contributor (human or AI agent) how the app is laid out, where things live, and how to make common changes without breaking the rest.

Last updated alongside the comprehensive admin push (commit `dbb3f23`).

## What this app is

A tutoring web app for middle and high school students. 21 courses (math from Arithmetic through Real Analysis and Differential Equations, English Grades 6 through 12), interactive quizzes with an AI tutor named Max, cached pre-generated lessons, parent dashboards, study plans, and a comprehensive admin page.

Live at https://atriuminstitute.ai. GitHub: `aadyatripathy2030/atriuminstitute`. Owner email: `aadyatripathy2030@gmail.com`. DNS managed at Squarespace. Email sent from a verified `atriuminstitute.ai` domain via Resend.

## Stack

- **Frontend**: vanilla HTML, CSS, JavaScript. No framework. No build step. Single page app with multiple top-level views shown / hidden via display:none toggling.
- **Backend**: Node.js 18+ using the built-in `http` module. No Express. One runtime dependency (`pg`).
- **Database**: Render Postgres in production. Local dev falls back to a JSON file (`./data.json`) when `DATABASE_URL` is unset.
- **AI**: Anthropic Claude. Sonnet 4.5 (`claude-sonnet-4-5-20250929`) for the heavy thinking (chat, mistake review, lesson generation, study plan). Haiku 4.5 (`claude-haiku-4-5-20251001`) for grading, hints, activity summary.
- **Email**: Resend for sign-in codes and (optionally) study reminder + parent digest emails.
- **Hosting**: Render web service (auto-deploys from `main` branch) plus Render Postgres in the same region.
- **Auth**: passwordless. Email + 6-digit verification code (15 min TTL). 30-day HttpOnly session cookie. No social login.

## Top-level file structure

```
.
├── server.js                  HTTP server, all /api routes, Claude proxy with usage tracking
├── prompts.js                 All AI system prompts, intent-routed, cacheable
├── db.js                      Backend switcher: picks postgres vs jsonfile based on DATABASE_URL
├── db-postgres.js             Postgres backend (production)
├── db-jsonfile.js             JSON-file backend (local dev / tests)
├── email.js                   Resend integration + console fallback
├── curriculum-loader.js       Server-side curriculum loader (vm sandbox) — used by /api/admin/prebuild
├── index.html                 Single entry point. Every top-level view is a hidden div toggled by class
├── styles.css                 All styling
├── auth.js                    Sign-in / sign-up, role toggle, hideAllTopLevel, session bootstrapping
├── parent.js                  Parent dashboard: linked students, 360 view per student
├── profile.js                 Student / parent profile page
├── activity.js                Student activity page with AI summary
├── tokens.js                  Per-user Token Cost page
├── admin.js                   /admin page (8 tabs, gated on users.is_admin)
├── app.js                     Course / book / quiz UI, lesson walker, hint ladder, study plan widget
├── study.js                   Study Methods panel + Pomodoro / spaced rep widgets
├── ai.js                      Browser-side AI wrapper (talks to /api/claude with intent)
├── activity-labels.js         Shared activity-event formatter (icons, relative time, resolved names)
├── courses.js                 COURSES registry (course id -> course object)
├── extras.js                  Hand-written extra questions per section
├── english-extras.js          Auto-generated English topics (run from tools/)
├── *-data.js                  Per-course question banks (one file per course)
├── expansions/                Per-course quiz expansions, lazy-loaded by app.js
├── db/schema.sql              Postgres schema. Idempotent. Run via npm run migrate
├── DEPLOY.md                  Render deployment walkthrough
├── README.md                  User-facing overview
└── tools/                     Operator scripts (run with node tools/<name>.js or via npm)
    ├── migrate.js                  Apply db/schema.sql with detailed diff report
    ├── check-schema.js             Verify which tables / columns exist
    ├── set-admin.js                Flip users.is_admin for one or more emails
    ├── prebuild-lessons.js         CLI version of prebuild (admin page also does this server-side)
    ├── split-expansions.js         Splits monolithic expansions.js into per-course files
    ├── expand-quizzes.js           Pads each section to 20 questions via Claude
    ├── generate-english-topics.js  Builds english-extras.js
    ├── list-users.js               Print users table
    ├── import-school-districts.js  Load US school districts from a CSV into school_districts
    └── ping-cron.js                Posts to /api/cron/send-reminders (for Render Cron Jobs)
```

## Database schema (Postgres)

All tables live in the `public` schema. See `db/schema.sql` for the full DDL. Every `ALTER TABLE ... ADD COLUMN` uses `IF NOT EXISTS` so re-running migrate is safe.

### `users`
The core account row. One per email.
- `id` uuid PK
- `email` text unique
- `role` text (`student` or `parent`)
- `verified` bool
- `created_at` timestamptz
- `link_code` text unique. 8-char shareable code so a parent and student can link.
- `age` int. Captured at signup (students). Drives the COPPA gate (under 13 -> consent required).
- `country` text. Captured at signup. (Used to be `state`; column was renamed.)
- `consent_required` bool. True if the student was under 13 at signup.
- `consent_granted_at` timestamptz. Set when an active parent link is created on a consent-required student.
- `is_admin` bool. Manually flipped via `npm run set-admin`. Controls /admin access.

### `verification_codes`
6-digit codes for sign-in. 15 min TTL. Single-use.

### `sessions`
30-day session tokens. HttpOnly cookie. Deleted on logout or via /api/admin/sessions/:token.

### `progress`
Legacy key-value progress storage per user. Still used by some quiz score tracking.

### `parent_student_links`
The many-to-many table joining parents and students. Status is `active` / `pending` / `rejected`. `initiated_by_user_id` records which side started the link.

### `quiz_attempts`
One row per finished quiz. Includes:
- `course_id`, `book_id`, `section_idx`, `section_kind`
- `score`, `total`, `passed`
- `started_at`, `completed_at`, `duration_seconds`
- `attempt_number` (computed atomically inside the INSERT for retries)
- `answers` jsonb (per-question detail: q, type, userAnswer, correctAnswer, correct, note)

### `activity_log`
Append-only event stream. Powers the student Activity page, the parent dashboard timeline, and the admin Activity tab. Common kinds:
- `signin`, `quiz_started`, `quiz_question_answered`, `quiz_pass`, `quiz_fail`
- `lesson_started`, `study_started`, `chat_topic_started`
- `hint_used`, `link_created`, `link_removed`
- `reminder_sent`, `digest_sent`
- `study_plan_created`

Each row has a `meta` jsonb. The server's allow-list of client-submitted kinds lives in `CLIENT_ACTIVITY_KINDS` in `server.js`; meta keys also have an allow-list in the same function.

### `student_profiles` (1:1 with users where role=student)
- `display_name`, `school_name`, `grade_level`
- `subjects` text[], `study_plan_courses` text[], `study_goal` text
- `timezone` text. IANA. Used by the reminder cron.
- `reminder_enabled` bool, `reminder_frequency`, `reminder_time_local`, `reminder_content`
- `parent_authorised_reminders` bool. Under-13 students need this true before any reminder fires, regardless of their own setting.
- `last_reminder_sent_at`
- `ai_model_preference` text (`balanced`, `fast`, `best`)
- `updated_at`

### `parent_profiles` (1:1 with users where role=parent)
Mirrors student_profiles but parent-flavoured. Has weekly_digest preferences instead of reminders.

### `ai_usage`
One row per Claude API call routed through /api/claude. Captures intent, model, input/output/cache tokens, and a USD cost computed at insert time using `MODEL_PRICING` in server.js.

### `cached_lessons`
Pre-generated Learn lessons keyed on (course_id, book_id, section_idx, section_kind). Unique constraint on the four. Content stored as text (Markdown with optional inline SVG / Mermaid). `model` records who wrote it.

### `study_plans` (1:1 with users)
Each student can have one active plan. `plan_json` is the AI-generated week-by-week schedule.

## API routes (all in server.js)

### Auth
- `POST /api/auth/signup` — Sends a code. Accepts `{ email, role?, age?, country?, linkCode? }`. Stash extras in `pendingSignupMeta` until /verify.
- `POST /api/auth/verify` — Verifies the code, creates session, applies pending metadata, logs `signin`.
- `POST /api/auth/logout` — Deletes session, clears cookie.
- `GET /api/auth/me` — Returns user public fields + linked accounts.

### Per-user (any signed-in user)
- `POST /api/me/profile` — Sets age / country.
- `GET / POST /api/me/rich-profile` — The student or parent profile.
- `POST /api/me/links`, `DELETE /api/me/links/:id` — Link / unlink.
- `GET / POST /api/progress` — Old per-user progress key-value store.
- `POST /api/me/quiz-attempts` — Log a finished quiz with detailed answers.
- `GET /api/me/quiz-attempts`, `GET /api/me/weak-sections`, `GET /api/me/activity` — Read own data.
- `POST /api/me/activity` — Whitelisted client-emitted activity (lesson_started, hint_used, etc.).
- `GET /api/me/token-usage`, `GET /api/me/token-usage/summary` — Token Cost page data.
- `GET / POST / DELETE /api/me/study-plan` — Goal-based weekly plan.
- `GET /api/me/review-queue` — Spaced-repetition: past-failed sections due for review.

### Parent dashboard (gated on isParentOfStudent)
- `GET /api/parent/students` — All linked students.
- `GET /api/parent/students/:id/activity`
- `GET /api/parent/students/:id/quiz-attempts`
- `GET /api/parent/students/:id/weak-sections`
- `GET /api/parent/students/:id/progress`
- `GET /api/parent/students/:id/profile`
- `GET /api/parent/students/:id/study-plan`
- `POST /api/parent/students/:id/authorise-reminders` — Under-13 reminder gate.

### Admin (gated on users.is_admin)
- `GET /api/admin/stats` — Top-line counts and cost.
- `GET /api/admin/users` — All users with quiz / cost rollups.
- `GET / PATCH / DELETE /api/admin/users/:id` — Drill-down + actions (toggle admin, force-verify, swap role, delete).
- `GET /api/admin/activity` — Last 100 cross-user events.
- `GET /api/admin/quiz-analytics` — Most-failed sections, hardest individual questions, course stats.
- `GET /api/admin/cost-chart` — 30-day daily cost, top spenders, by intent.
- `GET /api/admin/sessions`, `DELETE /api/admin/sessions/:token` — List + revoke.
- `GET /api/admin/links` — All parent-student links.
- `GET /api/admin/lessons` — Cached lesson count by course.
- `POST /api/admin/prebuild-lessons`, `GET /api/admin/prebuild-lessons`, `POST /api/admin/prebuild-lessons/cancel` — Bulk pre-generate the lesson cache server-side. State held in memory.

### Lessons + AI
- `POST /api/claude` — Proxy to Anthropic. Reads `intent` and substitutes the server-side cached prompt. Records usage to `ai_usage`. Streaming supported.
- `POST /api/lessons` — Cache-or-generate. Returns cached lesson if it exists for (courseId, bookId, sectionIdx). Otherwise calls Claude with the `lesson` intent, sanitises, saves, returns.
- `DELETE /api/lessons` — Bust the cache for one section.

### Other
- `POST /api/cron/send-reminders` — Header-secret-gated dispatcher. Sends due reminders + parent digests. Ping every 15 min from Render Cron Job (`tools/ping-cron.js`).
- `GET /unsubscribe?u=...&k=reminder|digest&t=...` — Public. Signed HMAC token disables email subscription.

### SPA routes (served as `index.html` and resolved by frontend)
- `/admin`

## AI prompts and intents

All system prompts live in `prompts.js`. Each is a long string with `cache_control: { type: 'ephemeral' }` set on the static block so Anthropic prompt caching applies. Dynamic per-call context goes in a separate non-cached system block via the `system_extra` field.

`PROMPTS` object keys (intents):
- `chat` — Max chat. Includes anti-cheating rules that activate when the dynamic context contains "Current question:".
- `mistake` — Post-quiz mistake walkthrough.
- `grade` — Strict short-answer grader. Used by quiz answer submission.
- `recommendation` — First-run course suggestion.
- `activity_summary` — "Where you stand" paragraph for the Activity page.
- `lesson` — 5-step walker (The simple idea, The formulas, Walk-through example, One more example, You're ready). Allows inline SVG, Mermaid, ASCII art.
- `hint` — Three-level hint ladder for stuck quiz questions (gentle nudge / scaffold / full walkthrough).
- `study_plan` — JSON output: weekly plan with section assignments.
- `gen-questions`, `gen-sections`, `gen-cumulative` — Content authoring tools (run from /tools).

## Frontend pages (all in index.html as hidden divs)

Listed in `TOP_LEVEL_IDS` in `auth.js`. When adding a new page, add its id here so `hideAllTopLevel()` clears it before showing other views.

- `landing` — Public marketing page.
- `authGate` — Sign-in / Sign-up modal.
- `consentGate` — Under-13 student waiting for parent.
- `courses-home` — Main app home for signed-in students.
- `home` — Book detail (after picking a course).
- `detail` — Quiz detail / results.
- `study` — Full Study with Max page.
- `onboard` — Onboarding form (first-time students).
- `about`, `contact`, `privacy`, `terms` — Static info pages.
- `parentHome` — Family overview for parents.
- `parentStudentDetail` — Per-student 360 view.
- `profilePage` — Student / parent profile form.
- `activityPage` — Student's own activity with AI summary.
- `tokenUsagePage` — Per-user Token Cost.
- `adminPage` — /admin (8-tab dashboard).

`hideAllTopLevel` is exposed as `window.hideAllTopLevel` so every page-switching helper (parent.js, profile.js, activity.js, tokens.js, admin.js) can use the single source of truth.

## npm scripts

- `npm start` — Run the server.
- `npm run dev` — Same as start.
- `npm run lint` — ESLint over the backend files.
- `npm test` — Node native test runner against db.js + prompts.js.
- `npm run migrate` — Apply db/schema.sql with rich diff report.
- `npm run set-admin <email>` — Flip is_admin. `--list` shows current, `--revoke <email>` to remove.
- `npm run prebuild-lessons` — CLI version of lesson prebuild. Idempotent. Env knobs: `ONLY_COURSE`, `FORCE`, `DRY`, `CONCURRENCY`.

## Environment variables

Required:
- `ANTHROPIC_API_KEY` — Powers Max.
- `DATABASE_URL` — Render Postgres connection. Use the **internal** URL on the web service; the external URL for local CLI tools.
- `RESEND_API_KEY` — Sends real verification emails. Without it, codes print to server logs (dev mode).
- `EMAIL_FROM` — Verified Resend sender address (e.g. `Atrium Institute <hello@atriuminstitute.ai>`).

Optional:
- `CRON_SECRET` — Required for `/api/cron/send-reminders`. Match the header from the cron job.
- `UNSUBSCRIBE_SECRET` — HMAC key for unsubscribe URLs in emails.
- `SITE_URL` — Defaults to `https://atriuminstitute.ai`. Override for staging.
- `RATE_LIMIT_PER_HOUR` — Per-IP /api/claude rate limit (default 30).
- `DAILY_REQUEST_CAP` — Site-wide /api/claude daily cap (default 1000).
- `DB_PATH` — Only used if DATABASE_URL is unset (local dev).
- `PG_SSL` — Forces SSL on or off if auto-detection is wrong.
- `PG_POOL_MAX` — Postgres pool size.
- `ADMIN_EMAILS` — Currently unused. Admin gating is done via `users.is_admin`.

## Common workflows

### Deploy
Pushes to `main` auto-deploy to Render. Render's build runs `npm install --omit=dev` (devDeps like ESLint stay out of production).

### Apply a schema change
1. Edit `db/schema.sql`. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.
2. Push to GitHub.
3. From a laptop with the **external** Render Postgres URL: `npm run migrate`. The script prints a diff (added tables, new columns with types, new indexes, FKs, constraints).

### Set / revoke admin
```
$env:DATABASE_URL = "external-url"
npm run set-admin you@example.com other@example.com
npm run set-admin -- --list
npm run set-admin -- --revoke you@example.com
```

### Load US school districts

The signup form's school-district autocomplete reads from the `school_districts` table. A starter set of major districts ships in `db/seed-school-districts.csv` (~500 of the largest districts across all 50 states + DC). The full US dataset has roughly 13,000 districts; that file comes from the NCES Common Core of Data.

To load the bundled seed:
```
$env:DATABASE_URL = "external-url"
node tools/import-school-districts.js
```

To load the full NCES list:
1. Visit https://nces.ed.gov/ccd/elsi/ (ELSI tableGenerator) or https://nces.ed.gov/ccd/files.asp (raw data files).
2. Build / download a CSV with two columns: state postal code (e.g. "TX") and agency / district name. The importer accepts these column headers: `state_code` or `State`; `district_name` or `Agency Name`.
3. Save the file (any name, e.g. `nces-districts.csv`) and run:
```
$env:DATABASE_URL = "external-url"
node tools/import-school-districts.js --file=nces-districts.csv
```

Re-runs are idempotent. Seed rows that have been overwritten by a user signup keep their `source = 'user'` tag, so importing again won't reset the user-contributed count.

### Pre-generate cached lessons
Easiest: sign in as admin, go to `/admin` -> Lessons tab -> Start prebuild. Server runs in-process, polls every 2 seconds, idempotent.

CLI alternative (when you want to drive it from a laptop):
```
$env:DATABASE_URL = "external-url"
$env:ANTHROPIC_API_KEY = "sk-ant-..."
npm run prebuild-lessons
```
Env knobs: `ONLY_COURSE=algebra` to limit to one course; `FORCE=1` to regenerate already-cached lessons; `DRY=1` to print plan without spending tokens; `CONCURRENCY=5` to go faster.

### Regenerate lessons after a prompt change
The lesson cache survives across prompt changes. To rewrite everything with the latest prompt: prebuild with `FORCE=1` (or run admin prebuild with the Regenerate checkbox).

### Add a new top-level view
1. Add the markup to `index.html` (a hidden div with a unique id).
2. Add the id to `TOP_LEVEL_IDS` in `auth.js`.
3. Create a small `<name>.js` script and load it from index.html.
4. Implement `openX()` that calls `window.hideAllTopLevel()` first, then `show()` your view.
5. If the view needs a URL route, add to `SPA_ROUTES` in server.js and to admin.js or auth.js for the route check.

### Add a new admin tab
1. Add a `<button class="admin-tab" data-tab="X">` to index.html's admin-tabs row.
2. Add a `<section class="admin-tab-panel hidden" data-panel="X">` with the content.
3. In `admin.js`, add the lazy-load function (`loadX`) and call it from `switchTab` when `name === 'X'`.
4. Add the corresponding server endpoint in server.js (must call `requireAdmin`).
5. Add the matching DB function in db-postgres.js (and db-jsonfile.js for parity).

### Add a new AI intent
1. Write the system prompt in `prompts.js`. Make sure the static portion crosses ~3400 chars (1024 tokens) if you want prompt caching to help.
2. Add the intent name to the `PROMPTS` object.
3. Add a client wrapper in `ai.js` (e.g. `streamMyNewIntent(...)`). It should set `intent: '<name>'`.
4. The server's `/api/claude` proxy automatically attaches the cached system block based on `intent`. No server change needed unless you want a dedicated endpoint.

### Add a new activity event kind
1. Decide if it's server-emitted or client-emitted.
2. If client-emitted, add the kind name to `CLIENT_ACTIVITY_KINDS` (set) in server.js. Add any new meta keys to the allow-list in `handleLogClientActivity`.
3. Add a renderer for the new kind in `activity-labels.js` `describeActivity()`.
4. Call `logUserActivity('your_kind', { ... })` from the relevant frontend code, or `db.logActivity(userId, 'your_kind', { ... })` from the server.

## Major features in this codebase (rough chronological)

- Email-code authentication with role toggle (student / parent).
- Postgres backend with JSON-file fallback.
- Bidirectional parent-student linking via 8-char `link_code`.
- COPPA gate: under-13 students require a linked parent before they can use the app.
- Activity log + Activity page with AI-generated "where you stand" summary.
- Quiz attempt tracking with per-question detail, attempt number, duration.
- Hint ladder (gentle nudge -> scaffold -> full walkthrough).
- Stuck detection (2 consecutive fails surfaces a "want to review the lesson?" callout).
- Spaced repetition (review queue on courses home).
- Adaptive quiz difficulty (heuristic: word problems harder, late-in-section harder, reorders after streaks).
- Cached lesson system with 5-step walker (Story -> Formulas -> Walk-through -> One more -> You're ready) + Feynman "explain it back" step.
- SVG + Mermaid + ASCII art support in lessons. Sanitized server-side.
- Server-side lesson prebuild (admin button, in-memory job state).
- Goal-based study plan (weekly schedule generated by AI).
- Profile page (student + parent) with AI model preference.
- Email reminders + parent weekly digest. Triggered by /api/cron/send-reminders.
- Token Cost dashboard per-user (and admin-wide).
- Comprehensive admin page: 8 tabs, search, drill-down, quiz analytics, cost chart, sessions, links, lessons, prebuild trigger.
- Site footer with Privacy and Terms (comprehensive long-form docs).
- Sign-up vs Sign-in mode toggle. Age only required for student signups.

## Conventions

These are non-negotiable across all files:

1. **No em-dashes or en-dashes.** Use periods, commas, colons, parentheses, or the words "and / but / so / because". The CLAUDE.md global rule applies in code comments, commit messages, AI prompts, and UI strings.
2. **British spelling preferred** in code comments and operator-facing text (e.g. "personalise", "behaviour", "colour"). UI strings facing students may use US spelling for grade-level appropriateness.
3. **One idea per sentence.** No marketing polish.
4. **Comments explain why, not what.** Don't write `// loop over users` next to a loop over users. Write a comment when the reason for the code would surprise a reader.
5. **No `try { ... } catch (e) { console.error(e) }` without a fallback action.** Either fall back to a sensible default or rethrow.
6. **Idempotent migrations.** Every `ALTER TABLE` in db/schema.sql uses `IF NOT EXISTS`. Migrate must be safe to re-run.
7. **Self-protection on admin actions.** Anything that could delete or de-privilege the current user has a confirmation prompt and ideally a self-target block.
8. **Both DB backends in lockstep.** Every function added to `db-postgres.js` must have a matching implementation in `db-jsonfile.js`. Tests run against jsonfile.
9. **Tests don't talk to Postgres.** `delete process.env.DATABASE_URL` at the top of test/db.test.js so the jsonfile backend is selected.
10. **Render auto-deploys.** Don't commit anything to main that you haven't tested locally (or aren't prepared to roll back).

## Known limitations / explicit deferrals

- **COPPA verifiable parental consent (VPC).** The current parent linking flow is an attestation, not a VPC method per the FTC's safe-harbour list. Documented in the Privacy Policy and Terms.
- **Email reminders for under-13 students.** Disabled by default. Only enabled when a linked parent ticks the per-student authorise-reminders toggle in their dashboard's profile page.
- **No tests against the AI grader / hint ladder.** The grader is mostly behavioural; we test the parsing in `test/prompts.test.js` (cache-eligibility, structure of buildSystem) but don't run live API calls.
- **The Render Cron Job for reminders is configured outside the repo.** The endpoint exists but the schedule lives in Render's dashboard.
- **`/api/claude` is open to any signed-in user.** No per-user quota beyond the global rate-limit and daily-cap. If costs explode, add a per-user daily budget keyed off `ai_usage`.
- **Lesson prebuild state is in-memory.** Restarting the server mid-prebuild loses progress (re-run picks up since each section is idempotent in the cache).
- **No automated test for the admin or parent dashboards.** Visual regression tests deferred.
- **No data export / GDPR endpoint.** Account deletion is admin-only via the user detail modal in /admin.

## Quick "where does X live" cheat sheet

- "Why does the quiz say correct for a blank answer" -> `gradeAnswer` in `ai.js` (client-side junk filter) and `prompts.js` `GRADE_STATIC` (server-side rejection of blank/punctuation-only answers).
- "How are lessons stored" -> `cached_lessons` table, served by `POST /api/lessons` in `server.js`.
- "Where's the hint button" -> `requestNextHint` in `app.js`, calls `AI.streamHint` in `ai.js`, uses `hint` intent in `prompts.js`.
- "How does the parent dashboard authorize per-student data access" -> `requireLinkedStudent` in `server.js` (calls `db.isParentOfStudent`).
- "Where does the admin page check is_admin" -> `requireAdmin` in `server.js`.
- "How do I add a new course" -> Add a `<courseid>-data.js` file. Register it in `courses.js`. Re-run `npm run split-expansions` if you also expanded its question bank. Re-run admin prebuild to cache lessons.
- "Where's the AI cost dashboard" -> `/api/me/token-usage` for own usage, `/api/admin/cost-chart` for cross-user. Both fed by the `ai_usage` table.
- "How do I trigger the reminder dispatcher" -> `POST /api/cron/send-reminders` with header `X-Cron-Secret: <CRON_SECRET>`. The Render Cron Job pings this every 15 minutes.
