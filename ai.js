// Browser-side AI wrapper — talks to the local /api/claude proxy so no key is required in the browser.
const MODEL_FAST = 'claude-haiku-4-5-20251001';
const MODEL_SMART = 'claude-sonnet-4-5-20250929';

const AI = {
  available: true, // assumed true since proxy exists; failures surface as errors

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
    const system = `You are a math grader. Given a problem, the student's answer, and the correct answer, decide if the student's answer is equivalent to the correct one.

Allow:
- Different notation ("5/2", "2.5", "\\frac{5}{2}")
- Equivalent simplified forms
- Missing units if the numeric value matches
- Different variable orders (e.g. "3, 5" vs "5, 3" for solution sets)
- Minor typos

Reject:
- Different numeric value
- Wrong sign
- Partial answer when a full one is needed

Return ONLY JSON: {"correct": true|false, "note": "brief reason (<=15 words)"}`;

    const user = `Problem: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}`;

    const text = await this._call({
      model: MODEL_FAST,
      system,
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

  streamExplainMistake(question, userAnswer, correctAnswer, why, topic) {
    // `why` is free text the student typed (or a "(skipped)" placeholder).
    const system = `You are Max, a warm, patient tutor who handles both math and English. The student already submitted a wrong answer on this problem — now they want to learn from it. Tailor your explanation to whichever subject the problem is about.

Your job:
1. Read the student's own description of what they think went wrong. Acknowledge it briefly and honestly — if they've diagnosed correctly, confirm it; if they're off, gently redirect to what likely actually tripped them up based on their answer.
2. Give concrete, numbered fix steps tailored to what they described.
3. Walk through the correct solution step by step.
4. End with one encouraging sentence.

Rules:
- Plain, easy-to-understand language — no jargon, no textbook-speak.
- Show at least one worked example with different numbers so they see the technique fresh.
- Use a simple ASCII diagram (in a \`\`\`code fence\`\`\`) or Markdown table whenever the concept is visual or comparative.
- Markdown with LaTeX (\\( ... \\) inline, \\[ ... \\] display).
- Under ~300 words.
- Never condescending.
- If the student skipped describing, go straight to a clean walkthrough with example + diagram.`;

    const user = `Topic: ${topic}
Problem: ${question}
Student's answer: ${userAnswer || '(blank)'}
Correct answer: ${correctAnswer}
Student's own description of what went wrong: ${why}

Address their self-diagnosis, give tailored fix steps, show the solution, encourage.`;

    return this._stream({
      model: MODEL_SMART,
      system,
      messages: [{ role: 'user', content: user }],
      max_tokens: 1200,
      temperature: 0.4
    });
  },

  async generateQuestions(courseTitle, bookTitle, section, count) {
    const existing = section.questions.map((q, i) => `${i + 1}. ${q.q} (answer: ${q.answer})`).join('\n');
    const system = `You generate practice quiz questions for a student. Return ONLY a JSON array — no prose, no code fences, no markdown wrapping. Each item has keys: type ("regular" or "word"), q (the question text), answer (the correct answer, concise), solution (one short sentence explaining how to get it).`;
    const user = `Course: ${courseTitle}
Topic: ${bookTitle}
Section: ${section.title}

Existing questions to NOT duplicate:
${existing}

Generate ${count} NEW practice questions at the same difficulty level as the existing ones. Roughly mix ${Math.ceil(count * 0.6)} regular problems and ${Math.floor(count * 0.4)} word problems.

Rules:
- For math: use LaTeX with \\( ... \\) for inline math. Keep answers concise.
- For English: answers should be short and checkable (e.g., a word, a phrase, "True/False", or a brief sample sentence).
- Avoid copy-pasting existing questions — vary numbers, names, scenarios.
- Every question must have a single, clearly correct (or most-correct) answer.

Return ONLY the JSON array.`;

    const text = await this._call({
      model: MODEL_SMART,
      system,
      messages: [{ role: 'user', content: user }],
      max_tokens: 3500,
      temperature: 0.6
    });

    let match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    let jsonStr = match[0];
    try {
      const parsed = JSON.parse(jsonStr);
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
    const system = `You generate new sub-section (mini-quiz) topics and their 5-question quizzes. Return ONLY a JSON array. No prose, no code fences, no markdown wrapping.`;
    const user = `Course: ${courseTitle}
Topic/Chapter: ${book.title}
Existing sub-section titles already in this topic: ${existing}

Generate ${count} more NEW sub-section titles that would naturally fit under this topic — think of sub-skills, adjacent concepts, common problem types, or depth extensions. Avoid duplicating existing titles.

For EACH new sub-section, include a 5-question practice quiz with a mix of "regular" problems (3) and "word" problems (2). Each question has keys: type, q, answer, solution.

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
  },
  ...${count} total objects
]

Rules:
- Math: use LaTeX \\( ... \\) for inline math. Keep answers concise and checkable.
- English: keep answers short and checkable (word, phrase, identifier, brief example).
- Each question must have one clear correct answer.
- Vary scenarios and numbers across questions.`;

    const text = await this._call({
      model: MODEL_SMART,
      system,
      messages: [{ role: 'user', content: user }],
      max_tokens: 8000,
      temperature: 0.6
    });

    // Extract the JSON array even if wrapped in code fences.
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
    const system = `You generate cumulative-test questions covering an entire topic. Return ONLY a JSON array — no prose, no code fences.`;
    const user = `Course: ${courseTitle}
Topic: ${book.title}
Sub-sections in this topic: ${topics}

Existing cumulative questions (do not duplicate):
${existing}

Generate ${count} NEW cumulative questions that test understanding across the sub-sections above. Mix roughly 60% "regular" problems and 40% "word" problems. Vary difficulty and cover different sub-sections.

Output format (return ONLY this array):
[
  {"type":"regular","q":"...","answer":"...","solution":"..."},
  {"type":"word","q":"...","answer":"...","solution":"..."},
  ...${count} total
]

Rules:
- Math: use LaTeX \\( ... \\). Keep answers concise and checkable.
- English: keep answers short and checkable.
- Each question must have one clear correct answer.`;

    const text = await this._call({
      model: MODEL_SMART,
      system,
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

  streamChat(history, contextBlurb) {
    const hasStudent = contextBlurb && contextBlurb.includes('Student profile:');
    const inQuiz = contextBlurb && contextBlurb.includes('Current question:');
    const system = `You are Max, a warm and patient tutor who teaches both math and English Language Arts. You can help with: algebra, geometry, calculus, probability, word problems, grammar, punctuation, reading comprehension, literary analysis, essay writing, poetry, vocabulary, and research writing. If the student asks about something unrelated to math or English (coding questions unrelated to writing, personal problems, game strategy, etc.), politely redirect to academics.

${hasStudent ? `## STUDENT PROFILE
${contextBlurb.split('\n\n')[0]}

Use the student's name naturally. Tune your tone and depth to their age, grade, and stated confidence. If they said their pace is "Quick and to the point," be brief; if they said "Slow, thorough walk-throughs," be more detailed. Lean into the topics they flagged as hardest.
` : ''}

${inQuiz ? `## CURRENT QUIZ CONTEXT
The student is IN THE MIDDLE OF a graded quiz right now. Here is the active question and its answer:

${contextBlurb.split('\n\n').slice(1).join('\n\n')}

## ANTI-CHEATING RULES (STRICT)
- DO NOT reveal, state, hint at, or compute the final answer to the active quiz question above.
- DO NOT walk through the full solution of the active quiz question.
- DO NOT give away intermediate values that uniquely determine the final answer.
- If the student asks for the answer, or asks you to solve it for them, politely refuse and say something like: "I can't give you the answer while you're taking the quiz — but I can help you understand the concept so you can solve it yourself."
- You CAN: explain the underlying concept in general, review a similar (but different) worked example with different numbers, clarify vocabulary, answer "what does this notation mean?" type questions, suggest which technique category applies (e.g. "this is a substitution problem").
- You CAN'T: plug in the actual numbers from the question and work it out.
- After the student submits and sees the grade, they'll be in a post-quiz review — but while the question is still active on screen, treat it as a closed-book test.` : `The student is not currently taking a quiz, so you can freely teach, work through examples, and answer their math or English questions fully.`}

## TEACHING STYLE
- **Make it easy to understand.** Plain conversational language, not textbook-speak. If a sentence has a word a 12-year-old wouldn't know, swap it. Define jargon the first time you must use it.
- **Use lots of examples.** Whenever you explain a concept, immediately follow with at least 2 worked examples — one super-simple, then a slightly harder one. Number them ("Example 1:", "Example 2:").
- **Use diagrams whenever they help.** ASCII art is fine — number lines, simple coordinate grids, geometry sketches, tables for organizing comparisons. Use Markdown code fences (\`\`\`) for ASCII diagrams so they render in fixed-width font. For data or comparisons, use Markdown tables. Don't force diagrams when text is clearer, but lean toward including them for any visual concept (shapes, graphs, sequences, fractions, geometry, etc.).
- **Build up step by step.** Break ideas into small, numbered steps. Never skip a step that "feels obvious" — what's obvious to you may not be to the student.
- Use Markdown + LaTeX (\\( ... \\) inline, \\[ ... \\] display).
- Ask a quick check-in question after a chunk of teaching to make sure they're with you.
- Celebrate progress. Treat mistakes as learning opportunities.`;

    return this._stream({
      model: MODEL_SMART,
      system,
      messages: history,
      max_tokens: 1500,
      temperature: 0.5
    });
  }
};
