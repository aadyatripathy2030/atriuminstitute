const test = require('node:test');
const assert = require('node:assert/strict');
const s = require('../safety-lib');

test('crisis detector catches first-person crisis messages', () => {
  for (const t of ['i want to die', 'I wanna kill myself', "im going to end it all", "I don't want to live anymore",
    'i want to end my life', 'kms', 'I have been thinking about suicide', 'i self harm sometimes',
    'everyone would be better off without me', 'I’m gonna kill myself']) {
    assert.equal(s.isCrisisMessage(t), true, t);
  }
});

test('crisis detector ignores academic and figurative uses', () => {
  for (const t of ['How does Romeo commit suicide in Act 5?', 'the theme of death in Hamlet', 'solve x^2=4',
    'this problem is killing me', 'I could die of boredom with fractions', 'explain the poem about dying']) {
    assert.equal(s.isCrisisMessage(t), false, t);
  }
});

test('lastUserText reads the latest user turn in either content shape', () => {
  assert.equal(s.lastUserText([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }]), 'c');
  assert.equal(s.lastUserText([{ role: 'user', content: [{ type: 'text', text: 'hi' }] }]), 'hi');
  assert.equal(s.lastUserText(null), '');
});

test('crisis responses carry 988 in both JSON and SSE form', () => {
  assert.match(s.crisisJson().content[0].text, /988/);
  const sse = s.crisisSse();
  const delta = sse.split('\n').find(l => l.startsWith('data:') && l.includes('content_block_delta'));
  assert.ok(delta && /988/.test(delta));
});
