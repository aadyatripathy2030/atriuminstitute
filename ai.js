// Browser-side AI wrapper. Talks to /api/claude so the Anthropic key stays
// on the server. Each method specifies an `intent` and the server attaches
// the corresponding vetted, cacheable system prompt (see prompts.js).

const MODEL_FAST = 'claude-haiku-4-5-20251001';
const MODEL_SMART = 'claude-sonnet-4-5-20250929';

const AI = {
  available: true,

  async _post(payload) {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API ${res.status}`);
    }
    return res;
  },

  async _call(payload) {
    const res = await this._post({ ...payload, stream: false });
    const data = await res.json();
    return data.content?.[0]?.text || '';
  },

  async *_stream(payload) {
    const res = await this._post({ ...payload, stream: true });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.text) {
            yield evt.delta.text;
          }
        } catch (_) {}
      }
    }
  },

  async gradeAnswer(question, userAnswer, correctAnswer) {
    const user = `Problem: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}`;

    const text = await this._call({
      intent: 'grade',
      model: MODEL_FAST,
      messages: [{ role: 'user', content: user }],
      max_tokens: 200,
      temperature: 0
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { correct: false, note: 'Could not parse grade' };
    try {
      const parsed = JSON.parse(match[0]);
      return { correct: !!parsed.correct, note: parsed.note || '' };
    } catch (_) {
      return { correct: false, note: 'Could not parse grade' };
    }
  },

  // `opts.profile` and `opts.sectionStats` enrich the review with personal
  // and session context. The static system prompt stays identical across
  // calls so prompt caching applies; the dynamic context goes in the user
  // message and an extra non-cached system block.
  streamExplainMistake(question, userAnswer, correctAnswer, why, topic, opts = {}) {
    const profile = opts.profile;
    const stats = opts.sectionStats;

    const extraBits = [];
    if (profile && profile.name) {
      const bits = [`Student: ${profile.name}`];
      if (profile.age) bits.push(`age ${profile.age}`);
      if (profile.grade) bits.push(`grade ${profile.grade}`);
      if (profile.confidence) bits.push(`self-rated confidence ${profile.confidence}/5`);
      if (profile.pace) bits.push(`prefers ${profile.pace.toLowerCase()}`);
      extraBits.push(bits.join(', ') + '.');
    }
    if (stats && stats.total) {
      const current = stats.current || 1;
      const wrong = stats.wrong != null ? stats.wrong : current;
      extraBits.push(`Section attempt context: mistake ${current} of ${wrong} on a ${stats.total}-question section.`);
    }
    const systemExtra = extraBits.length ? extraBits.join('\n') : undefined;

    const user = `Section / topic: ${topic}
Question: ${question}
Student's answer: ${userAnswer || '(blank)'}
Correct answer: ${correctAnswer}
Student's own description of what went wrong: ${why || '(skipped)'}

Address their self-diagnosis (or skip-acknowledge), give tailored fix-steps, walk through the correct solution, show one fresh worked example with new numbers, end on one specific encouraging line.`;

    return this._stream({
      intent: 'mistake',
      system_extra: systemExtra,
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 1200,
      temperature: 0.4
    });
  },

  async generateQuestions(courseTitle, bookTitle, section, count) {
    const existing = section.questions.map((q, i) => `${i + 1}. ${q.q} (answer: ${q.answer})`).join('\n');
    const user = `Course: ${courseTitle}
Topic: ${bookTitle}
Section: ${section.title}

Existing questions to NOT duplicate:
${existing}

Generate ${count} NEW practice questions at the same difficulty as the existing ones. Aim for roughly ${Math.ceil(count * 0.6)} regular problems and ${Math.floor(count * 0.4)} word problems.

Return ONLY the JSON array.`;

    const text = await this._call({
      intent: 'gen-questions',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 3500,
      temperature: 0.6
    });

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter(q => q && q.q && q.answer).map(q => ({
        type: q.type === 'word' ? 'word' : 'regular',
        q: String(q.q),
        answer: String(q.answer),
        solution: String(q.solution || '')
      }));
    } catch (_) {
      return null;
    }
  },

  async generateSections(courseTitle, book, count) {
    const existing = book.sections.map(s => `"${s.title}"`).join(', ');
    const user = `Course: ${courseTitle}
Topic/Chapter: ${book.title}
Existing sub-section titles already in this topic: ${existing}

Generate ${count} more NEW sub-section titles that would naturally fit under this topic. For EACH new sub-section, include a 5-question practice quiz (3 regular + 2 word). Each question has keys: type, q, answer, solution.

Output format (return ONLY this array):
[
  {
    "title": "Sub-section title here",
    "questions": [
      {"type":"regular","q":"...","answer":"...","solution":"..."},
      {"type":"regular","q":"...","answer":"...","solution":"..."},
      {"type":"regular","q":"...","answer":"...","solution":"..."},
      {"type":"word","q":"...","answer":"...","solution":"..."},
      {"type":"word","q":"...","answer":"...","solution":"..."}
    ]
  }
]`;

    const text = await this._call({
      intent: 'gen-sections',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 8000,
      temperature: 0.6
    });

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const arr = JSON.parse(match[0]);
      if (!Array.isArray(arr)) return null;
      return arr
        .filter(s => s && s.title && Array.isArray(s.questions) && s.questions.length >= 3)
        .map(s => ({
          title: String(s.title),
          generated: true,
          questions: s.questions
            .filter(q => q && q.q && q.answer)
            .map(q => ({
              type: q.type === 'word' ? 'word' : 'regular',
              q: String(q.q),
              answer: String(q.answer),
              solution: String(q.solution || '')
            }))
        }))
        .filter(s => s.questions.length > 0);
    } catch (_) {
      return null;
    }
  },

  async generateCumulativeQuestions(courseTitle, book, count) {
    const topics = book.sections.map(s => s.title).filter(Boolean).join('; ');
    const existing = book.cumulativeTest
      ? book.cumulativeTest.questions.map((q, i) => `${i + 1}. ${q.q} → ${q.answer}`).join('\n')
      : '';
    const user = `Course: ${courseTitle}
Topic: ${book.title}
Sub-sections in this topic: ${topics}

Existing cumulative questions (do not duplicate):
${existing}

Generate ${count} NEW cumulative questions covering the sub-sections above. Mix roughly 60% regular and 40% word problems. Vary difficulty.

Return ONLY the JSON array.`;

    const text = await this._call({
      intent: 'gen-cumulative',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 6000,
      temperature: 0.5
    });

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const arr = JSON.parse(match[0]);
      if (!Array.isArray(arr)) return null;
      return arr.filter(q => q && q.q && q.answer).map(q => ({
        type: q.type === 'word' ? 'word' : 'regular',
        q: String(q.q),
        answer: String(q.answer),
        solution: String(q.solution || '')
      }));
    } catch (_) {
      return null;
    }
  },

  streamRecommendation(profile, courseTitles) {
    const user = `Student profile:
Name: ${profile.name || 'unknown'}
Age: ${profile.age || 'unknown'}
Grade: ${profile.grade || 'unknown'}
Current class: ${profile.currentClass || 'unknown'}
Self-rated confidence: ${profile.confidence || 'unknown'}/5
Goal: ${profile.goal || 'unknown'}
Subject focus: ${profile.subject || 'unknown'}

Available courses: ${courseTitles.join(', ')}

Recommend 1 or 2 courses to start with and why, in 2-3 short sentences. Use their name. Be warm, not preachy.`;

    return this._stream({
      intent: 'recommendation',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 400,
      temperature: 0.6
    });
  },

  // Chat. `contextBlurb` carries dynamic per-call data (student profile,
  // current quiz state, anti-cheating rules). It's sent as the non-cached
  // second system block so the cached prefix stays stable across requests.
  streamChat(history, contextBlurb) {
    return this._stream({
      intent: 'chat',
      system_extra: contextBlurb || undefined,
      model: MODEL_SMART,
      messages: history,
      max_tokens: 1500,
      temperature: 0.5
    });
  }
};
