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
| `DB_PATH` | Optional | Defaults to `./data.json` |
| `RATE_LIMIT_PER_HOUR` | Optional | Claude requests per IP per hour (default 30) |
| `DAILY_REQUEST_CAP` | Optional | Site-wide Claude requests per day (default 1000) |

## Project structure

```
.
├── server.js              # HTTP server, /api routes, Claude proxy
├── db.js                  # JSON file storage (users, codes, sessions, progress)
├── email.js               # Resend integration + console fallback
├── auth.js                # Frontend: sign-in modal + progress sync
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

The server is a tiny zero-dependency Node app — it runs anywhere Node 18+ runs.

**Important:** the JSON file database (`data.json`) needs a persistent disk to survive redeploys. Render's free tier has ephemeral disk, so on Render Free your users would lose their accounts on each deploy. Options:

- **Fly.io** (free tier with persistent volume) — point `DB_PATH` at the mounted volume
- **Render** + migrate `db.js` to Postgres (Supabase free tier works)
- **Render** + paid plan with persistent disk
- Self-hosted VPS

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
