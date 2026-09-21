// Tests for prompts.js — the server-side system-prompt module.

const test = require('node:test');
const assert = require('node:assert/strict');
const prompts = require('../prompts');

test('every known intent has a non-empty prompt string', () => {
  for (const intent of prompts.KNOWN_INTENTS) {
    const text = prompts.PROMPTS[intent];
    assert.equal(typeof text, 'string', `intent ${intent} should have a string prompt`);
    assert.ok(text.length > 100, `intent ${intent} prompt looks too short (${text.length} chars)`);
  }
});

test('chat and mistake prompts are big enough that Anthropic prompt caching can apply', () => {
  // Anthropic's minimum cacheable prefix is 1024 tokens. As a rough proxy we
  // use ~3.3 chars per token (English text), so ~3400 characters is the floor.
  // The two highest-volume prompts must clear it; the rest can stay compact.
  const CACHE_MIN_CHARS = 3400;
  assert.ok(
    prompts.PROMPTS.chat.length >= CACHE_MIN_CHARS,
    `chat prompt is ${prompts.PROMPTS.chat.length} chars (need >= ${CACHE_MIN_CHARS} for caching)`,
  );
  assert.ok(
    prompts.PROMPTS.mistake.length >= CACHE_MIN_CHARS,
    `mistake prompt is ${prompts.PROMPTS.mistake.length} chars (need >= ${CACHE_MIN_CHARS} for caching)`,
  );
});

test('chat prompt wires up the active-quiz marker in either mode', () => {
  const text = prompts.PROMPTS.chat;
  assert.match(text, /Current question:/, 'chat prompt must reference the "Current question:" dynamic marker');
  assert.match(text, /active-quiz/i, 'chat prompt must define an active-quiz mode');
});

test('the quiz answer lock is off by default', () => {
  // Deliberate product choice: Max answers the question a student has open in
  // a quiz. Quiz scores therefore do not represent unaided work.
  const text = prompts.PROMPTS.chat;
  assert.doesNotMatch(text, /MUST NOT/, 'lock is off, so Max should not be told to withhold the answer');
  assert.match(text, /You may state the answer/i, 'lock is off, so Max should be told he can answer');
});

test('QUIZ_ANSWER_LOCK=1 restores the strict active-quiz rules', () => {
  // The flag is read at module load, so check it in a fresh process.
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const text = execFileSync(
    process.execPath,
    ['-e', 'process.stdout.write(require("./prompts").PROMPTS.chat)'],
    {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, QUIZ_ANSWER_LOCK: '1' },
      encoding: 'utf8',
    },
  );
  assert.match(text, /Active-quiz mode \(strict\)/i, 'lock on should select the strict block');
  assert.match(text, /MUST NOT/, 'lock on must spell out what Max cannot do during a quiz');
});

test('buildSystem returns null for unknown intents', () => {
  assert.equal(prompts.buildSystem('not-a-real-intent'), null);
  assert.equal(prompts.buildSystem(''), null);
  assert.equal(prompts.buildSystem(null), null);
});

test('buildSystem attaches cache_control to the static block only', () => {
  const blocks = prompts.buildSystem('chat');
  assert.ok(Array.isArray(blocks));
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'text');
  assert.deepEqual(blocks[0].cache_control, { type: 'ephemeral' });
});

test('buildSystem appends extra context as a non-cached second block', () => {
  const blocks = prompts.buildSystem('chat', 'Student: Aadya, age 14.');
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0].cache_control, { type: 'ephemeral' });
  assert.equal(blocks[1].type, 'text');
  assert.equal(blocks[1].text, 'Student: Aadya, age 14.');
  assert.equal(blocks[1].cache_control, undefined, 'dynamic block must NOT be cached');
});

test('buildSystem ignores empty extra context', () => {
  assert.equal(prompts.buildSystem('chat', '').length, 1);
  assert.equal(prompts.buildSystem('chat', '   ').length, 1);
  assert.equal(prompts.buildSystem('chat', undefined).length, 1);
});
