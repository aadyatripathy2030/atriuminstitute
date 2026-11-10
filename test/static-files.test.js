// The server only serves files the site uses; server code and docs stay private.
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const PORT = 18000 + Math.floor(Math.random() * 1000);

test('serves the site and hides everything else', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-static-'));
  const env = { ...process.env, PORT: String(PORT), DB_PATH: path.join(tmp, 'db.json'), DATABASE_URL: '' };
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: 'ignore' });
  t.after(() => { child.kill(); fs.rmSync(tmp, { recursive: true, force: true }); });

  const get = async (p) => (await globalThis.fetch(`http://127.0.0.1:${PORT}${p}`)).status;
  for (let i = 0; i < 50; i++) {
    try { await get('/'); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }

  const expect = {
    '/': 200, '/index.html': 200, '/styles.css': 200, '/app.js': 200, '/grade-lib.js': 200,
    '/router.js': 200, '/expansions/algebra.js': 200, '/favicon-32.png': 200,
    '/robots.txt': 200, '/sitemap.xml': 200, '/site.webmanifest': 200,
    '/faq': 200, '/courses/algebra/b1/3/lesson': 200, '/curriculum/x/1': 200,
    '/prompts.js': 404, '/db-postgres.js': 404, '/db-jsonfile.js': 404, '/stripe-lib.js': 404,
    '/quiz-lib.js': 404, '/server.js': 404, '/HACKING.md': 404, '/DEPLOY.md': 404,
    '/package.json': 404, '/data.json': 404, '/.env': 404, '/.apikey': 404,
    '/db/schema.sql': 404, '/test/db.test.js': 404, '/curriculum/nope.json': 404,
    '/node_modules/stripe/package.json': 404, '/%E0%A4%A': 400,
  };
  for (const [p, status] of Object.entries(expect)) assert.strictEqual(await get(p), status, p);
});
