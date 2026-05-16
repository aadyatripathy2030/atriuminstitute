# Deploying Atrium Math to Render

End-to-end this takes about 10 minutes. You need a GitHub account and a Render account (both free).

## 1. Put the code on GitHub

From this `course-site` folder, run:

```bash
git init
git add .
git commit -m "Initial Atrium Math commit"
```

Then on github.com, create a new empty private repository called `atrium-math` (or anything you like). GitHub will show you commands like these — run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/atrium-math.git
git branch -M main
git push -u origin main
```

> ⚠️ The `.gitignore` excludes `.apikey`, so your API key stays local. Confirm by checking that `.apikey` is NOT in the GitHub repo's file list before you continue.

## 2. Create the Render service

1. Go to https://render.com and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if you haven't, then pick the `atrium-math` repo.
4. Fill in:
   - **Name:** `atrium-math` (this becomes the URL prefix)
   - **Region:** pick the one closest to you
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** *(leave blank — no build step)*
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Scroll down to **Environment Variables** and click **Add Environment Variable** for each:
   - `ANTHROPIC_API_KEY` = your Anthropic API key (paste it; it'll be encrypted)
   - `SITE_PASSWORD` = a password of your choice (anyone visiting must enter this)
   - `RATE_LIMIT_PER_HOUR` = `30` (max Claude calls per visitor per hour — adjust as needed)
   - `DAILY_REQUEST_CAP` = `1000` (global daily cap on Claude calls; resets UTC midnight)
6. Click **Create Web Service**.

Render now builds and deploys. After ~2 minutes you'll get a URL like `https://atrium-math.onrender.com`. Open it → enter your password → you're live.

## 3. Cap your Anthropic spend (extra safety)

Even with the in-app protections, set a hard cap at the source:

1. Go to https://console.anthropic.com → **Settings** → **Billing**
2. Set a monthly **spending limit** (e.g. $10/month). The API will return errors past this, so the app can never overcharge you.

## Notes on the free tier

- Free Render services **sleep after 15 minutes of inactivity**. The first visitor after a quiet period waits ~30 seconds for the server to wake up. Upgrade to the `$7/month Starter` plan to keep it always on.
- localStorage in the browser keeps each user's quiz progress separately — no database needed.

## Pushing updates later

After you edit code locally:

```bash
git add .
git commit -m "your message"
git push
```

Render auto-deploys the new version within a minute or two.

## Local development still works

`node server.js` from this folder runs at http://localhost:8765 as before. If you don't set `SITE_PASSWORD` locally, the password gate is skipped.
