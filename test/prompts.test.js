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

test('chat prompt contains the active-quiz protection rules', () => {
  // If this regresses, students will be able to ask Max to solve the active
  // quiz question and he will comply. That breaks the whole grading loop.
  const text = prompts.PROMPTS.chat;
  assert.match(text, /Current question:/, 'chat prompt must reference the "Current question:" dynamic marker');
  assert.match(text, /active-quiz/i, 'chat prompt must define an active-quiz mode');
  assert.match(text, /MUST NOT/, 'chat prompt must spell out what Max cannot do in active-quiz mode');
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
