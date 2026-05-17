# Deploying Atrium Institute to Render

End-to-end this takes about 15 minutes the first time. You need a GitHub account and a Render account (both free to start).

The production setup is a Render **Web Service** + a Render **PostgreSQL** database in the same region, plus a few environment variables.

## 1. Create the Postgres database first

Render Postgres is provisioned independently of the web service, and you'll need its connection URL when configuring the web service.

1. Sign in to https://render.com.
2. Click **New +** → **PostgreSQL**.
3. Fill in:
   - **Name:** `atrium-db`
   - **Region:** pick the one you'll also use for the web service (low latency between them matters)
   - **PostgreSQL version:** latest (16+)
   - **Plan:** `Free` to start (~90-day expiry on the free tier; upgrade later to keep it).
4. Click **Create Database**. Wait ~1 minute for provisioning.

### Apply the schema

Once the database shows status "Available":

- Click into the database in the Render dashboard.
- Scroll to **Connect** → **PSQL Command** and use the web shell button.
- Open `db/schema.sql` from this repo and paste its contents into the shell. Hit Enter.
- You should see four `CREATE TABLE` lines and a few `CREATE INDEX` lines, then `ALTER TABLE` confirmations.

Alternative: run `npm run migrate` locally with `DATABASE_URL` set to the External URL of your Render Postgres. The migration is idempotent.

## 2. Push the code to GitHub

This repo is already on GitHub at `aadyatripathy2030/atriuminstitute`. If you're forking or starting fresh:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/atrium-math.git
git branch -M main
git push -u origin main
```

The `.gitignore` already excludes secrets (`.env`, `.apikey`, `data.json`). Double-check those aren't in your GitHub file list before continuing.

## 3. Create the web service

1. Render dashboard → **New +** → **Web Service**.
2. Connect GitHub and pick the repo.
3. Fill in:
   - **Name:** `atrium-math` (becomes the URL prefix)
   - **Region:** same region as the database
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install --omit=dev` *(skips the ESLint dev-only deps)*
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
4. Scroll to **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `RESEND_API_KEY` — your Resend API key (for sending verification emails)
   - `EMAIL_FROM` — verified From address, e.g. `Atrium Institute <hello@atriuminstitute.com>`
   - `RATE_LIMIT_PER_HOUR` — `30`
   - `DAILY_REQUEST_CAP` — `1000`
   - `DATABASE_URL` — **don't paste manually**. Click the dropdown, pick **Add from Database**, select `atrium-db`, then choose **Internal Database URL**. Render keeps this link so password rotations don't break the wiring.
5. Click **Create Web Service**.

Render builds, installs dependencies, and deploys. After ~2 minutes you'll get a URL like `https://atrium-math.onrender.com`. Sign in with email → 6-digit code arrives in your inbox → you're in.

## 4. Cap your Anthropic spend (extra safety)

Even with the in-app rate limits, set a hard cap at the source:

1. https://console.anthropic.com → **Settings** → **Billing**
2. Set a monthly **spending limit** (e.g. $10/month). The API returns errors past this, so the app can never overcharge you.

## Notes on the free tier

- Free Render web services **sleep after 15 minutes** of inactivity. First visitor after a quiet period waits ~30s. Upgrade to the `$7/month Starter` plan to keep it always on.
- Free Postgres expires after ~90 days. Upgrade to a paid plan before then if you have real users.

## Pushing updates later

```bash
git add .
git commit -m "your message"
git push
```

Render auto-deploys both the web service and any schema migrations (if you add a build-step hook). For now schema changes are run manually via `npm run migrate`.

## Local development

`node server.js` runs at http://localhost:8765. With no `DATABASE_URL` set it uses a local `data.json` file, so you don't need Postgres locally. With no `RESEND_API_KEY` the verification codes print to the server console.
