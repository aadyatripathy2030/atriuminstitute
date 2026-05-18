// Email sender. Uses Resend if RESEND_API_KEY is set; otherwise logs codes to the
// server console so you can still test locally without setting up email.

const crypto = require('crypto');
const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Atrium Institute <onboarding@resend.dev>';
const SITE_NAME = 'Atrium Institute';
const SITE_URL = process.env.SITE_URL || 'https://atriuminstitute.ai';
// Secret used to sign one-click unsubscribe tokens. Random-but-stable across
// restarts if UNSUBSCRIBE_SECRET is set. If not set, we use a fallback
// constant — fine for local dev, not great for production rotations.
const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET || 'atrium-unsub-default-CHANGE-ME';

function unsubscribeToken(userId, kind) {
  // kind = 'reminder' | 'digest'. Prevents one unsub link from cancelling
  // both subscriptions.
  return crypto.createHmac('sha256', UNSUB_SECRET).update(`${userId}:${kind}`).digest('hex').slice(0, 32);
}

function verifyUnsubscribeToken(userId, kind, token) {
  if (!token) return false;
  const expected = unsubscribeToken(userId, kind);
  try { return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected)); }
  catch { return false; }
}

function unsubscribeUrl(userId, kind) {
  const t = unsubscribeToken(userId, kind);
  return `${SITE_URL}/unsubscribe?u=${encodeURIComponent(userId)}&k=${kind}&t=${t}`;
}

function sendVerificationCode(email, code) {
  if (!RESEND_API_KEY) {
    // Dev mode — log the code so the user can grab it from server logs.
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 VERIFICATION CODE for ${email}`);
    console.log(`   →   ${code}`);
    console.log(`   (RESEND_API_KEY not set — code printed instead of emailed)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    return Promise.resolve({ ok: true, mode: 'console' });
  }

  const body = JSON.stringify({
    from: FROM_ADDRESS,
    to: [email],
    subject: `Your ${SITE_NAME} verification code`,
    html: htmlBody(code),
    text: textBody(code)
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: 'api.resend.com',
      path: '/emails',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, mode: 'resend' });
        } else {
          console.error('Resend error:', res.statusCode, data.slice(0, 300));
          reject(new Error('Failed to send email: HTTP ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function htmlBody(code) {
  return `<!DOCTYPE html>
<html><body style="font-family:Inter,system-ui,sans-serif;background:#f7f5f0;padding:40px 20px;color:#1e2238">
<table cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 4px 20px rgba(0,0,0,.05)">
<tr><td>
<div style="text-align:center;margin-bottom:24px">
  <div style="display:inline-block;width:48px;height:48px;border-radius:10px;background:#1e2238;color:#fff;text-align:center;line-height:48px;font-family:Georgia,serif;font-size:20px;font-weight:700">∑</div>
</div>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 12px;text-align:center">Welcome to ${SITE_NAME}</h1>
<p style="color:#6b7084;text-align:center;margin:0 0 28px;font-size:15px">Enter this code to sign in:</p>
<div style="background:#f7f5f0;border:1px solid #e6e2d7;border-radius:10px;padding:18px;text-align:center;margin-bottom:24px">
  <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#1e2238">${code}</div>
</div>
<p style="color:#6b7084;font-size:13px;margin:0 0 4px">This code expires in 15 minutes.</p>
<p style="color:#6b7084;font-size:13px;margin:0">If you didn't request this, you can safely ignore this email.</p>
</td></tr>
</table>
</body></html>`;
}

function textBody(code) {
  return `Welcome to ${SITE_NAME}\n\nYour verification code: ${code}\n\nThis code expires in 15 minutes.\nIf you didn't request this, you can safely ignore this email.\n`;
}

// ---------- Generic transactional sender (used by reminders + digests) ----------

function sendEmail({ to, subject, html, text, listUnsubscribeUrl }) {
  if (!RESEND_API_KEY) {
    console.log(`📧 [console fallback] would send "${subject}" to ${to}`);
    return Promise.resolve({ ok: true, mode: 'console' });
  }
  const body = JSON.stringify({
    from: FROM_ADDRESS,
    to: [to],
    subject,
    html,
    text,
    headers: listUnsubscribeUrl ? {
      'List-Unsubscribe': `<${listUnsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      hostname: 'api.resend.com',
      path: '/emails',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true });
        else {
          console.error('Resend error:', res.statusCode, data.slice(0, 300));
          reject(new Error('Failed to send email: HTTP ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------- Student reminder ----------

function studentReminderHtml({ name, contentType, primaryCourse, weakTopic, unsubUrl }) {
  const greeting = name ? `Hey ${name},` : 'Hey there,';
  let body = '';
  if (contentType === 'continuation' && primaryCourse) {
    body = `<p>Ready to keep going on <strong>${primaryCourse}</strong>?</p>`;
  } else if (contentType === 'weak_topics' && weakTopic) {
    body = `<p>You missed a few questions on <strong>${weakTopic}</strong> recently. A 10-minute session to lock it in?</p>`;
  } else {
    body = `<p>Just a quick nudge to keep your study habit going. Even 15 minutes counts.</p>`;
  }
  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#f7f5f0;padding:40px 20px;color:#1e2238">
<table cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 4px 20px rgba(0,0,0,.05)">
<tr><td>
<div style="text-align:center;margin-bottom:24px"><div style="display:inline-block;width:48px;height:48px;border-radius:10px;background:#1e2238;color:#fff;text-align:center;line-height:48px;font-family:Georgia,serif;font-size:20px;font-weight:700">∑</div></div>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:22px;margin:0 0 12px;text-align:center">${greeting}</h1>
${body}
<p style="text-align:center;margin:28px 0 12px"><a href="${SITE_URL}" style="display:inline-block;background:#1e2238;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:500">Open ${SITE_NAME}</a></p>
<p style="color:#6b7084;font-size:12px;margin:20px 0 0;text-align:center">
  Don't want these? <a href="${unsubUrl}" style="color:#6b7084">Turn off study reminders</a>.
</p>
</td></tr></table></body></html>`;
}

function studentReminderText({ name, contentType, primaryCourse, weakTopic, unsubUrl }) {
  const greeting = name ? `Hey ${name},` : 'Hey there,';
  let body;
  if (contentType === 'continuation' && primaryCourse) {
    body = `Ready to keep going on ${primaryCourse}?`;
  } else if (contentType === 'weak_topics' && weakTopic) {
    body = `You missed a few questions on ${weakTopic} recently. A 10-minute session to lock it in?`;
  } else {
    body = `Just a quick nudge to keep your study habit going. Even 15 minutes counts.`;
  }
  return `${greeting}\n\n${body}\n\nOpen ${SITE_NAME}: ${SITE_URL}\n\n— Atrium Institute\n\nTurn off study reminders: ${unsubUrl}\n`;
}

async function sendStudentReminder(user, opts = {}) {
  const unsubUrl = unsubscribeUrl(user.id, 'reminder');
  return sendEmail({
    to: user.email,
    subject: `A nudge from ${SITE_NAME}`,
    html: studentReminderHtml({ ...opts, unsubUrl }),
    text: studentReminderText({ ...opts, unsubUrl }),
    listUnsubscribeUrl: unsubUrl,
  });
}

// ---------- Parent weekly digest ----------

function parentDigestHtml({ name, studentSummaries, unsubUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  let rows = '';
  if (studentSummaries.length === 0) {
    rows = `<p style="color:#6b7084">No activity to report this week.</p>`;
  } else {
    rows = studentSummaries.map(s => `
      <div style="border:1px solid #e6e2d7;border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="font-weight:600;margin-bottom:6px">${s.name}</div>
        <div style="color:#1e2238;font-size:14px">${s.quizzesPassed} quizzes passed, ${s.quizzesFailed} did not pass.</div>
        ${s.weakTopics.length ? `<div style="color:#6b7084;font-size:13px;margin-top:6px">Weak topics: ${s.weakTopics.join(', ')}</div>` : ''}
      </div>
    `).join('');
  }
  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#f7f5f0;padding:40px 20px;color:#1e2238">
<table cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 4px 20px rgba(0,0,0,.05)">
<tr><td>
<div style="text-align:center;margin-bottom:24px"><div style="display:inline-block;width:48px;height:48px;border-radius:10px;background:#1e2238;color:#fff;text-align:center;line-height:48px;font-family:Georgia,serif;font-size:20px;font-weight:700">∑</div></div>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:22px;margin:0 0 12px">${greeting}</h1>
<p style="color:#6b7084;margin:0 0 20px">Here's how your students did this past week on ${SITE_NAME}.</p>
${rows}
<p style="text-align:center;margin:24px 0 12px"><a href="${SITE_URL}" style="display:inline-block;background:#1e2238;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:500">Open dashboard</a></p>
<p style="color:#6b7084;font-size:12px;margin:20px 0 0;text-align:center">
  Don't want these digests? <a href="${unsubUrl}" style="color:#6b7084">Unsubscribe from the weekly digest</a>.
</p>
</td></tr></table></body></html>`;
}

function parentDigestText({ name, studentSummaries, unsubUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  let body = '';
  if (studentSummaries.length === 0) {
    body = 'No activity to report this week.';
  } else {
    body = studentSummaries.map(s =>
      `- ${s.name}: ${s.quizzesPassed} passed, ${s.quizzesFailed} did not pass.${s.weakTopics.length ? ` Weak topics: ${s.weakTopics.join(', ')}` : ''}`
    ).join('\n');
  }
  return `${greeting}\n\nHere's how your students did this past week on ${SITE_NAME}:\n\n${body}\n\nDashboard: ${SITE_URL}\n\nUnsubscribe from the weekly digest: ${unsubUrl}\n`;
}

async function sendParentDigest(user, studentSummaries, opts = {}) {
  const unsubUrl = unsubscribeUrl(user.id, 'digest');
  return sendEmail({
    to: user.email,
    subject: `${SITE_NAME} weekly digest`,
    html: parentDigestHtml({ ...opts, studentSummaries, unsubUrl }),
    text: parentDigestText({ ...opts, studentSummaries, unsubUrl }),
    listUnsubscribeUrl: unsubUrl,
  });
}

// ---------- Parent / student link approval request ----------

async function sendLinkApprovalRequest(toEmail, { inviterEmail, inviterRole, approverRole }) {
  const inviterLabel = inviterRole === 'parent' ? 'parent' : 'student';
  const approverLabel = approverRole === 'parent' ? 'parent' : 'student';
  const subject = `${inviterEmail} wants to link with you on ${SITE_NAME}`;
  const approveUrl = `${SITE_URL}/#approvals`;
  const html = `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;background:#f7f5f0;padding:40px 20px;color:#1e2238">
<table cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border-radius:14px;padding:36px 32px;box-shadow:0 4px 20px rgba(0,0,0,.05)">
<tr><td>
<div style="text-align:center;margin-bottom:24px"><div style="display:inline-block;width:48px;height:48px;border-radius:10px;background:#1e2238;color:#fff;text-align:center;line-height:48px;font-family:Georgia,serif;font-size:20px;font-weight:700">∑</div></div>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:20px;margin:0 0 12px;text-align:center">A ${inviterLabel} is asking to link with you</h1>
<p><strong>${inviterEmail}</strong> entered your link code on ${SITE_NAME} and is asking to connect as your ${inviterLabel}. As the ${approverLabel} side, you need to approve before the link goes live.</p>
<p>This two-sided check prevents a wrong child or parent from being associated with you by someone who happens to know your link code.</p>
<p style="text-align:center;margin:28px 0 12px"><a href="${approveUrl}" style="display:inline-block;background:#1e2238;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:500">Open Atrium to review</a></p>
<p style="color:#6b7084;font-size:12px;margin:20px 0 0;text-align:center">If you weren't expecting this, just reject it from the same screen. The other person will see the rejection.</p>
</td></tr></table></body></html>`;
  const text = `${inviterEmail} entered your link code on ${SITE_NAME} and is asking to connect with you.\n\nYou're being asked to approve this connection as the ${approverLabel} side. Open ${approveUrl} to approve or reject.\n\nIf you weren't expecting this request, just reject it.\n`;
  return sendEmail({ to: toEmail, subject, html, text });
}

module.exports = {
  sendVerificationCode,
  sendStudentReminder,
  sendParentDigest,
  sendLinkApprovalRequest,
  unsubscribeToken,
  verifyUnsubscribeToken,
};
