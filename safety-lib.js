// Crisis-message detection for Max (the AI tutor).
//
// California SB 243 requires a published protocol for suicidal ideation and
// self-harm, with referral to crisis services. We don't leave that to the
// model: if a student's own message matches one of these first-person
// patterns, the server answers with a fixed message that points to 988 and
// the Crisis Text Line, and never sends the message to the model.
//
// The patterns are deliberately first-person ("I want to die", "kill
// myself") so that essays or questions ABOUT a book's themes don't trip it.
// It is a safety net, not a diagnosis: false positives cost one canned
// reply; false negatives fall back to the system prompt's own guardrail.

const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm|cut|stab|hang|shoot|poison|starve)\s+(my\s*self|myself)\b/i,
  /\bk\s*m\s*s\b/i,                                   // "kms"
  /\bunalive\s+(my\s*self|myself)\b/i,
  /\b(i\s*(?:'?m|am)?\s*(?:going|gonna|want|wanna|planning|plan|thinking about|thinking of|about)\s*(?:to\s*)?)(die|end it|end it all|end my life|commit suicide|kill myself|not wake up)\b/i,
  /\bi\s+(?:want|wanna|wish|would like)\s+(?:to\s+)?(?:be\s+)?(?:die|dead|disappear forever|not exist|not be alive|stop existing)\b/i,
  /\b(end|take)\s+my\s+(own\s+)?life\b/i,
  /\bsuicid(e|al)\b.*\b(i|me|my|i'm|im)\b|\b(i|me|my|i'm|im)\b.*\bsuicid(e|al)\b/i,
  /\b(i\s*(?:'?m|am)|i\s+feel)\s+(?:so\s+)?(?:better off dead|worthless and want to die)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bno (reason|point) (to|in) (live|living|being alive)\b/i,
  /\bdon'?t want to (live|be alive|exist|wake up)( anymore)?\b/i,
  /\bself[-\s]?harm(ing)?\b.*\b(i|me|my)\b|\b(i|me|my)\b.*\bself[-\s]?harm(ing)?\b/i,
];

function isCrisisMessage(text) {
  if (typeof text !== 'string') return false;
  const t = text.replace(/[’‘]/g, "'").slice(0, 4000);
  return CRISIS_PATTERNS.some(re => re.test(t));
}

// The student's most recent message from an Anthropic-style messages array.
function lastUserText(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) {
      return m.content.filter(c => c && c.type === 'text' && typeof c.text === 'string').map(c => c.text).join('\n');
    }
    return '';
  }
  return '';
}

const CRISIS_REPLY = [
  "I'm really glad you told me. What you're feeling matters, and you deserve to talk with a real person right now, not an AI.",
  '',
  '- **Call or text 988** (Suicide & Crisis Lifeline, US). It\'s free, confidential, and open 24/7.',
  '- **Text HOME to 741741** to reach the Crisis Text Line.',
  '- If you\'re in danger right now, **call 911** or go to the nearest emergency room.',
  '- Outside the US, find a local helpline at **findahelpline.com**.',
  '',
  'Please also tell a trusted adult (a parent, a teacher, or your school counselor) today. I\'m an AI tutor, so I can\'t help with this the way they can. I\'ll be here for math and English whenever you want to come back.',
].join('\n');

// Anthropic-shaped responses so the existing client code renders the reply
// exactly like a normal one.
function crisisJson(model) {
  return {
    id: 'msg_safety', type: 'message', role: 'assistant', model: model || 'safety',
    content: [{ type: 'text', text: CRISIS_REPLY }],
    stop_reason: 'end_turn', stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

function crisisSse(model) {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify(Object.assign({ type }, data))}\n\n`;
  return ev('message_start', { message: Object.assign(crisisJson(model), { content: [] }) })
    + ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
    + ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: CRISIS_REPLY } })
    + ev('content_block_stop', { index: 0 })
    + ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 0 } })
    + ev('message_stop', {});
}

module.exports = { isCrisisMessage, lastUserText, CRISIS_REPLY, crisisJson, crisisSse };
