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
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // 402 = server is saying Max is Pro-gated. Pop the upgrade modal.
      if (res.status === 402 && typeof openUpgradeModal === 'function') {
        openUpgradeModal();
      }
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

  async generateFlashcards(topic, count = 10) {
    const clean = String(topic || '').trim();
    if (!clean) return [];
    const text = await this._call({
      intent: 'flashcards',
      model: MODEL_FAST,
      messages: [{ role: 'user', content: `TOPIC: ${clean}\nCOUNT: ${count}` }],
      max_tokens: 1800,
      temperature: 0.3
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse flashcards');
    let parsed;
    try { parsed = JSON.parse(match[0]); }
    catch (_) { throw new Error('Could not parse flashcards'); }
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    return cards
      .filter(c => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim())
      .map(c => ({ front: c.front.trim(), back: c.back.trim() }));
  },

  async generateSatPractice(test, subject, count = 8) {
    const out = await this._call({
      intent: 'sat-practice',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: `TEST: ${test}\nSUBJECT: ${subject}\nCOUNT: ${count}` }],
      max_tokens: 3000,
      temperature: 0.5
    });
    const match = out.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse the questions.');
    let parsed;
    try { parsed = JSON.parse(match[0]); }
    catch (_) { throw new Error('Could not parse the questions.'); }
    const qs = Array.isArray(parsed.questions) ? parsed.questions : [];
    return qs.filter(function (q) {
      return q && typeof q.question === 'string' && Array.isArray(q.choices) && q.choices.length === 4
        && typeof q.answer === 'number' && q.answer >= 0 && q.answer < 4;
    }).map(function (q) {
      return { question: q.question, choices: q.choices.map(String), answer: q.answer,
               explanation: String(q.explanation || ''), topic: String(q.topic || '') };
    });
  },

  async gradeEssay(essay, assignment) {
    const text = String(essay || '').trim();
    if (!text) throw new Error('Paste an essay first.');
    const user = (assignment && assignment.trim())
      ? `ASSIGNMENT: ${assignment.trim()}\n\nESSAY:\n${text}`
      : `ESSAY:\n${text}`;
    const out = await this._call({
      intent: 'essay-grade',
      model: MODEL_SMART,
      messages: [{ role: 'user', content: user }],
      max_tokens: 1600,
      temperature: 0.2
    });
    const match = out.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse the feedback.');
    let parsed;
    try { parsed = JSON.parse(match[0]); }
    catch (_) { throw new Error('Could not parse the feedback.'); }
    // Normalise so the UI can rely on the shape.
    return {
      overall: parsed.overall || { score: 0, band: '—', summary: '' },
      rubric: Array.isArray(parsed.rubric) ? parsed.rubric : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      mechanics: Array.isArray(parsed.mechanics) ? parsed.mechanics : []
    };
  },

  async gradeAnswer(question, userAnswer, correctAnswer) {
    // Don't waste a Claude call on a non-answer. Strip wrapping quotes /
    // backticks and whitespace; if what's left is empty or only punctuation,
    // grade it incorrect locally.
    const raw = String(userAnswer == null ? '' : userAnswer);
    const trimmed = raw.trim();
    const stripped = trimmed.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();
    const isJunk = !stripped || /^[\s\p{P}\p{S}]+$/u.test(stripped);
    if (isJunk) {
      return { correct: false, note: 'No answer provided.' };
    }

    const user = `Problem: ${question}
Student's answer: ${stripped}
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

  // Generates the "where you stand" summary shown at the top of the
  // Activity page. The caller pre-builds the structured data block.
  streamActivitySummary(payload) {
    const lines = [];
    if (payload.studentName) lines.push(`Student: ${payload.studentName}`);
    if (payload.gradeLevel) lines.push(`Grade: ${payload.gradeLevel}`);
    if (payload.subjects && payload.subjects.length) lines.push(`Subjects of focus: ${payload.subjects.join(', ')}`);
    if (payload.studyGoal) lines.push(`Personal goal: ${payload.studyGoal}`);
    if (payload.studyPlanCourses && payload.studyPlanCourses.length) lines.push(`Courses in their study plan: ${payload.studyPlanCourses.join(', ')}`);

    const a = payload.attempts || [];
    if (a.length === 0) {
      lines.push('Quiz attempts: none yet.');
    } else {
      const passed = a.filter(x => x.passed).length;
      const failed = a.length - passed;
      const recent = a.slice(0, 8);
      lines.push(`Quiz attempts (last ${a.length}): ${passed} passed, ${failed} did not pass.`);
      lines.push('Recent attempts (newest first):');
      for (const r of recent) {
        const tag = r.passed ? 'pass' : 'fail';
        lines.push(`  - ${r.course} → ${r.book} → ${r.section}: ${r.score}/${r.total} (${tag})`);
      }
    }

    const weak = payload.weakSections || [];
    if (weak.length) {
      lines.push('Weak topics (failed 2+ times):');
      for (const w of weak.slice(0, 6)) lines.push(`  - ${w.course} → ${w.book} → ${w.section} (${w.failures} fails)`);
    }

    const events = payload.recentEvents || [];
    if (events.length) {
      lines.push(`Recent activity events (last ${events.length}): ${events.join(', ')}`);
    }

    const availableCourses = payload.availableCourses || [];
    if (availableCourses.length && a.length === 0) {
      lines.push(`Available courses to recommend a start from: ${availableCourses.slice(0, 15).join(', ')}`);
    }

    const user = lines.join('\n') + '\n\nWrite the 3-4 sentence "where you stand" summary now.';

    return this._stream({
      intent: 'activity_summary',
      model: MODEL_FAST,
      messages: [{ role: 'user', content: user }],
      max_tokens: 400,
      temperature: 0.4,
    });
  },

  // Hint ladder for a stuck quiz question. level is 1 / 2 / 3 — see the
  // 'hint' intent in prompts.js for the per-level behaviour.
  streamHint(question, userAnswer, correctAnswer, level) {
    const user = `Question: ${question}
Student's current attempt: ${userAnswer || '(blank)'}
Correct answer (do NOT reveal at level 1 or 2): ${correctAnswer}
Hint level: ${level}`;
    return this._stream({
      intent: 'hint',
      model: MODEL_FAST,
      messages: [{ role: 'user', content: user }],
      max_tokens: 700,
      temperature: 0.3,
    });
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
