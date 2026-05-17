// Email sender. Uses Resend if RESEND_API_KEY is set; otherwise logs codes to the
// server console so you can still test locally without setting up email.

const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Atrium Institute <onboarding@resend.dev>';
const SITE_NAME = 'Atrium Institute';

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

module.exports = { sendVerificationCode };
