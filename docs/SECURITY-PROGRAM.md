# Atrium Institute: Written Information Security Program

Required by the amended COPPA Rule (16 CFR 312.8). Referenced from the Privacy Policy, section 7.

- **Version:** 2026-11-25
- **Next review due:** 2027-11-25 (at least yearly, and after any security incident or major change)

## 1. Coordinator

The site operator (the account owner of the Render service and the `hello@atriuminstitute.ai` mailbox) is the security coordinator. They are responsible for this program, the yearly review, and incident response.

## 2. What we protect

- **Accounts:** email, role, age, grade, country, school details.
- **Learning records:** quiz attempts, progress, mastery, activity log.
- **Behavior events and signals.**
- **Snap & Solve:** thumbnails and solutions.
- **AI usage records.**
- **Parental consent records.**

Chat text with Max is not stored.

## 3. Safeguards in place

| Area | Safeguard | Where |
|---|---|---|
| Transport | HTTPS only (Render + Cloudflare) | hosting |
| Authentication | One-time 15-minute email codes, no passwords; per-email and per-IP rate limits | `server.js`, `test/auth-limits.test.js` |
| Sessions | Random tokens, HTTP-only + SameSite cookies, 30-day expiry, hourly cleanup | `server.js`, `db.cleanup()` |
| Authorization | Parents can only read linked students (`requireLinkedStudent`); admin endpoints check `is_admin` | `server.js` |
| Children | Under-13 accounts locked until signed parental consent; no third-party disclosure (AI) before consent | `consentBlocked()`, `recordParentalConsent()` |
| Secrets | API keys only in Render environment variables, never sent to the browser | `server.js` |
| Data at rest | Render managed Postgres, encrypted at rest | hosting |
| Retention | Automated hourly purge per the published schedule | `RETENTION` / `purgeExpiredData()` in `db-postgres.js` |
| AI abuse / cost | Per-user rate limits, daily spend cap, server-chosen system prompts | `proxyClaude()` |
| AI safety | Guardrails in every student-facing prompt; server-side crisis check | `prompts.js`, `safety-lib.js`, tests |

## 4. Vendors

Each vendor is reviewed at the yearly review for: its security posture, whether it trains on our data, and its retention.

| Vendor | Data | Notes |
|---|---|---|
| Anthropic | Messages, context summary, Snap & Solve photos | Commercial API terms: no training on customer data. Consider requesting zero data retention. |
| Render | All stored data | SOC 2 Type II |
| Resend | Email addresses + email content | Transactional only |
| Stripe | Billing (only when the paywall is on) | PCI DSS Level 1 |

## 5. Yearly risk assessment checklist

- [ ] Review vendor terms (training, retention, subprocessors).
- [ ] Rotate API keys (Anthropic, Resend, Stripe, cron secret).
- [ ] Review admin accounts.
- [ ] Run `npm audit` and update dependencies.
- [ ] Re-test the parent-consent, export and withdraw flows end to end.
- [ ] Red-team Max: off-topic requests, prompt extraction, inappropriate content, crisis phrasing. Record the results below.
- [ ] Confirm the retention purge is running (look for `retention purge` lines in Render logs).
- [ ] Confirm the Privacy Policy, AI safety page, and consent notice still match the code. If the notice changed, bump `CONSENT_NOTICE_VERSION`.

## 6. Incident response

1. Contain: rotate keys, revoke sessions (`delete from sessions`), disable the affected feature.
2. Assess: what data, which users, and whether any children are affected.
3. Notify affected users (and parents of children under 13) without undue delay and as state law requires; notify the FTC where required.
4. Write a post-mortem and update this document.

## 7. Review log

| Date | Reviewer | Notes |
|---|---|---|
| 2026-11-25 | Initial version | Consent flow, retention purge, crisis protocol added |
