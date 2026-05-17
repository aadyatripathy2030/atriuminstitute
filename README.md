# Atrium Institute

Interactive math and English tutoring web app for middle and high school students.

- 6 math courses (Pre-Algebra → Calculus) + 7 English grade levels (6–12)
- Auto-graded quizzes, cumulative tests, course-wide final exams
- AI tutor ("Max") integrated everywhere — explanations, mistake reviews, in-chat practice
- Study Methods panel with 10 techniques + interactive Pomodoro, spaced-rep planner, recall timer
- Email-based sign-in (6-digit code), per-user progress synced across devices
- Server-side spend protections (per-IP rate limit, daily request cap)

Live: [atriuminstitute.com](https://atriuminstitute.com)

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS + MathJax (no build step, no framework)
- **Backend:** Node.js with `http` (no Express, no dependencies — zero `npm install` needed)
- **Database:** JSON file (`data.json`) — small footprint, easy backup; migrate to Postgres for higher scale
- **AI:** Anthropic Claude (via server-side proxy so the API key stays private)
- **Email:** Resend (for verification codes)

## Quick start (local development)

```bash
git clone https://github.com/atrium-math/atrium-math.git
cd atrium-math
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY (required for the AI tutor)
node server.js
```

Open http://localhost:8765. Without `RESEND_API_KEY` set, sign-in codes print to the server terminal instead of being emailed — fine for local testing.

## Environment variables

See `.env.example` for the full list with descriptions. The minimums:

| Variable | Required? | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers the AI tutor "Max" |
| `RESEND_API_KEY` | Production only | Sends verification codes by email |
| `EMAIL_FROM` | Optional | Verified From address (default: Resend sandbox) |
| `PORT` | Optional | Defaults to 8765 |
| `DATABASE_URL` | Production | Postgres connection string (Render Postgres). When unset, the app falls back to a local JSON file at `DB_PATH`. |
| `DB_PATH` | Optional | JSON-file DB path (only used when `DATABASE_URL` is unset). Default `./data.json`. |
| `RATE_LIMIT_PER_HOUR` | Optional | Claude requests per IP per hour (default 30) |
| `DAILY_REQUEST_CAP` | Optional | Site-wide Claude requests per day (default 1000) |

## Project structure

```
.
├── server.js              # HTTP server, /api routes, Claude proxy
├── db.js                  # Backend switcher: Postgres if DATABASE_URL set, else JSON file
├── db-postgres.js         # Render Postgres backend (production)
├── db-jsonfile.js         # JSON-file backend (local dev / fallback)
├── db/schema.sql          # Schema applied to Postgres via tools/migrate.js
├── prompts.js             # Server-side AI system prompts (intent-routed, cacheable)
├── email.js               # Resend integration + console fallback
├── auth.js                # Frontend: sign-in (email + 6-digit code, role toggle)
├── ai.js                  # Frontend: Claude API wrapper
├── app.js                 # Frontend: course/quiz UI + state
├── study.js               # Frontend: Study Methods panel + Pomodoro
├── index.html             # Single-page entry point
├── styles.css             # All styling
├── courses.js             # Course registry (one entry per subject)
├── *-data.js              # Per-course base questions
├── extras.js              # Hand-written extra questions
├── english-extras.js      # Auto-generated English topics (built by tools/)
├── expansions/            # Per-course quiz expansions, lazy-loaded by app.js
│   └── <courseId>.js      # One file per course, produced by tools/split-expansions.js
└── tools/                 # Helper scripts (run with `node tools/<script>.js`)
    ├── expand-quizzes.js          # Fills each section to 20 questions via Claude
    ├── split-expansions.js        # Splits expansions.js into per-course files
    └── generate-english-topics.js # Adds new English topics via Claude
```

## Deployment

The server runs on any Node 18+ host. In production it needs a Postgres database (Render's disk is ephemeral, so the JSON-file fallback would lose user data on every redeploy).

**Recommended setup: Render web service + Render Postgres.** See `DEPLOY.md` for step-by-step. Other Postgres providers (Neon, Supabase, AWS RDS) work too — just set `DATABASE_URL` to the connection string and run `node tools/migrate.js` once against it.

Local development can skip Postgres entirely: leave `DATABASE_URL` unset and the app uses a `data.json` file in the project directory. Useful for iterating without a real DB, not for anything you want to keep.

`DEPLOY.md` has a step-by-step Render walkthrough. For Fly.io, install `flyctl`, then:

```bash
fly launch
fly volumes create atrium_data --size 1
fly secrets set ANTHROPIC_API_KEY=… RESEND_API_KEY=… DB_PATH=/data/data.json
# Edit fly.toml to mount the volume at /data, then:
fly deploy
fly certs add atriuminstitute.com
```

## Content authoring tools

`tools/expand-quizzes.js` and `tools/generate-english-topics.js` use the Claude API to bulk-generate quiz questions and new topics. Run them locally with your API key set. They are resumable via local cache files.

The expansion flow has two steps:

1. `node tools/expand-quizzes.js` writes a local `expansions.js` (not committed).
2. `node tools/split-expansions.js` slices that file into `expansions/<courseId>.js` files, which ARE committed and served to the browser.

The browser loads each course's expansion only when the user opens that course, so first paint never has to download all 13 courses' worth of question data.

## Security notes

- The Anthropic API key never leaves the server — the browser hits a same-origin `/api/claude` proxy
- Sign-in uses HttpOnly, SameSite=Lax cookies (30-day session)
- Verification codes are 6 digits, valid for 15 minutes, single-use
- `/api/claude` requires an authenticated session AND passes IP + daily-budget rate limits

## License

Proprietary — all rights reserved. This source is published for transparency, not for reuse.
