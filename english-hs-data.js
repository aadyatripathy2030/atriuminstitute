// High School English courses — Grades 9, 10, 11, 12.
const ENGLISH_G9_COURSE = {
  id: "eng9", subject: "english",
  title: "9th Grade English",
  subtitle: "Foundations of high school ELA",
  emoji: "📕", accent: "#9a3412", accent2: "#d79578",
  description: "Five units introducing literary analysis, essay writing, Shakespearean drama, argument, and research.",
  books: [
    {
      id: "e9-1", num: 1, title: "Fiction & Narrative Writing", subtitle: "Reading literature, writing stories",
      emoji: "📖", accent: "#9a3412", accent2: "#d79578",
      sections: [
        {
          title: "Elements of Fiction",
          lesson: "Fiction relies on **characters, setting, plot, conflict, and theme**. Conflict types include *person vs. person, person vs. self, person vs. nature, person vs. society*.",
          questions: [
            { type: "regular", q: "Name the five basic elements of fiction.", answer: "Characters, setting, plot, conflict, theme.", solution: "Core elements." },
            { type: "regular", q: "What kind of conflict is 'Hamlet struggling with his own doubt'?", answer: "Person vs. self.", solution: "Internal struggle." },
            { type: "regular", q: "Setting includes what?", answer: "Time and place of the story.", solution: "When and where." },
            { type: "regular", q: "What's the difference between plot and story?", answer: "Story = events in order they happen; plot = how events are arranged for the reader.", solution: "Arrangement matters." },
            { type: "word", q: "Identify one conflict in a book or movie you know.", answer: "Example: 'In Harry Potter, Harry vs. Voldemort — person vs. person.'", solution: "Name the conflict type." }
          ]
        },
        {
          title: "Narrative Writing",
          lesson: "A good narrative has a clear **point of view**, **vivid detail**, and a **narrative arc** (exposition → rising action → climax → falling action → resolution). Hook readers with dialogue, action, or an intriguing image.",
          questions: [
            { type: "regular", q: "What are the three main points of view?", answer: "First person (I), second person (you), third person (he/she/they).", solution: "Pronoun identifies POV." },
            { type: "regular", q: "What's the climax of a story?", answer: "The turning point with highest tension.", solution: "Story peak." },
            { type: "regular", q: "Which POV feels most personal?", answer: "First person.", solution: "Reader is in the narrator's head." },
            { type: "regular", q: "Why use vivid detail?", answer: "To engage readers' senses and make scenes feel real.", solution: "Show, don't tell." },
            { type: "word", q: "Write an opening line that hooks a reader.", answer: "Example: 'The day the letter arrived, everything I thought I knew turned to ash.'", solution: "Any strong hook." }
          ]
        },
        {
          title: "Tone and Mood",
          lesson: "**Tone** is the author's attitude (playful, sarcastic, reverent). **Mood** is the feeling evoked in the reader (suspenseful, somber, cheerful). Word choice, imagery, and pacing shape both.",
          questions: [
            { type: "regular", q: "Tone vs. mood — what's the difference?", answer: "Tone is the author's attitude; mood is the reader's feeling.", solution: "Author vs. reader." },
            { type: "regular", q: "What word choice creates a somber mood?", answer: "Heavy, dark, or mournful words (e.g., 'gray', 'silent', 'empty').", solution: "Vocabulary shapes mood." },
            { type: "regular", q: "Can a funny tone and serious mood coexist?", answer: "Yes — satire often does this.", solution: "They can differ." },
            { type: "regular", q: "What technique creates suspense?", answer: "Short sentences, foreshadowing, unanswered questions.", solution: "Pacing and withholding information." },
            { type: "word", q: "Describe the tone of the line: 'She smiled sweetly — and then slammed the door.'", answer: "Example: 'Sarcastic' or 'ironic'.", solution: "Mismatch between words and action." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Fiction & Narrative Writing",
        questions: [
          { type: "regular", q: "Elements of fiction?", answer: "Characters, setting, plot, conflict, theme.", solution: "Core list." },
          { type: "regular", q: "POV of: 'I ran through the trees'?", answer: "First person.", solution: "Uses 'I'." },
          { type: "regular", q: "A character who changes by the end is called?", answer: "Dynamic (or round).", solution: "Development." },
          { type: "regular", q: "Difference between tone and mood?", answer: "Tone = author's attitude; mood = reader's feeling.", solution: "Standard definition." },
          { type: "word", q: "Write a sentence with a suspenseful mood.", answer: "Example: 'The doorknob turned slowly. She stopped breathing.'", solution: "Short sentences, tension." },
          { type: "word", q: "Identify a theme from a book: 'The Hunger Games'.", answer: "Example: 'Oppression can be resisted through small acts of courage.'", solution: "Valid theme statement." }
        ]
      }
    },
    {
      id: "e9-2", num: 2, title: "Nonfiction & Research", subtitle: "Reading for truth and writing with evidence",
      emoji: "📰", accent: "#b45309", accent2: "#dcad6a",
      sections: [
        {
          title: "Types of Nonfiction",
          lesson: "Nonfiction includes **articles, essays, speeches, biographies, memoirs, and textbooks**. Each has a purpose: to inform, persuade, entertain, or reflect. Recognizing the purpose sharpens your reading.",
          questions: [
            { type: "regular", q: "Give three types of nonfiction.", answer: "Examples: articles, essays, biographies (or memoirs, speeches, textbooks).", solution: "Any valid three." },
            { type: "regular", q: "Difference between biography and memoir?", answer: "Biography is about someone else; memoir is written by the subject.", solution: "Perspective." },
            { type: "regular", q: "What's the purpose of an editorial?", answer: "To persuade or share an opinion.", solution: "Persuasive nonfiction." },
            { type: "regular", q: "What is an 'author's purpose'?", answer: "Why the author is writing — to inform, persuade, entertain, or reflect.", solution: "PIE + reflect." },
            { type: "word", q: "Is a cookbook fiction or nonfiction? What's its purpose?", answer: "Nonfiction; to inform.", solution: "Real content, informative." }
          ]
        },
        {
          title: "Evaluating Sources",
          lesson: "When researching, evaluate sources for **credibility** (is it reliable?), **relevance** (does it fit your topic?), and **bias** (what's the author's agenda?). Prefer peer-reviewed, established publications over random websites.",
          questions: [
            { type: "regular", q: "What does credibility mean?", answer: "Trustworthiness of the source.", solution: "Reliable and verifiable." },
            { type: "regular", q: "Is a blog always a reliable source?", answer: "Not always — depends on the author's credentials and citations.", solution: "Evaluate case by case." },
            { type: "regular", q: "What is bias?", answer: "The author's slant or preconception toward a topic.", solution: "Often unconscious." },
            { type: "regular", q: "Why do scholars prefer peer-reviewed sources?", answer: "They've been checked by experts before publication.", solution: "Quality control." },
            { type: "word", q: "Name one signal of an unreliable source.", answer: "Example: 'No author listed', 'lots of typos', 'no citations', 'extreme language'.", solution: "Red flags." }
          ]
        },
        {
          title: "Writing a Research Paper",
          lesson: "A research paper needs a clear **thesis**, **body** organized into sections or arguments, and a **conclusion**. Each claim is backed by cited evidence. Use a style guide (MLA or APA) for citation format.",
          questions: [
            { type: "regular", q: "Where is the thesis usually placed?", answer: "At the end of the introduction.", solution: "Standard placement." },
            { type: "regular", q: "What does MLA stand for?", answer: "Modern Language Association.", solution: "Citation style." },
            { type: "regular", q: "Two parts of an MLA in-text citation?", answer: "Author's last name and page number.", solution: "Basic format." },
            { type: "regular", q: "Where do full citations go?", answer: "On the Works Cited page.", solution: "Standard MLA structure." },
            { type: "word", q: "Why include a Works Cited page?", answer: "To credit sources and let readers verify or find them.", solution: "Credit + verification." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Nonfiction & Research",
        questions: [
          { type: "regular", q: "Biography vs. memoir?", answer: "Biography is about someone else; memoir is self-written.", solution: "Perspective differs." },
          { type: "regular", q: "Purpose of an op-ed?", answer: "To persuade.", solution: "Opinion piece." },
          { type: "regular", q: "Why check source credibility?", answer: "To avoid misinformation.", solution: "Reliable research." },
          { type: "regular", q: "Main citation style in English classes?", answer: "MLA.", solution: "Standard for humanities." },
          { type: "word", q: "Give an example of bias.", answer: "Example: 'An article about sugar sponsored by a candy company, downplaying health risks.'", solution: "Conflict of interest." },
          { type: "word", q: "What's the difference between paraphrasing and quoting?", answer: "Paraphrasing puts ideas in your own words; quoting uses exact words in quotation marks.", solution: "Both require citation." }
        ]
      }
    },
    {
      id: "e9-3", num: 3, title: "Drama & Shakespeare", subtitle: "Reading plays, especially Romeo & Juliet",
      emoji: "🎭", accent: "#b91c1c", accent2: "#e28585",
      sections: [
        {
          title: "Elements of Drama",
          lesson: "Drama differs from prose: it's meant to be **performed**. Key elements: **dialogue** (what characters say), **stage directions** (actions, setting), **acts** and **scenes**, and the **soliloquy** (a character speaking their thoughts aloud).",
          questions: [
            { type: "regular", q: "What is a soliloquy?", answer: "A character speaking their thoughts aloud, alone on stage.", solution: "Shakespeare uses many." },
            { type: "regular", q: "Difference between a play and a novel?", answer: "Plays are written to be performed; novels are written to be read.", solution: "Medium differs." },
            { type: "regular", q: "What are stage directions for?", answer: "To tell actors how to move, emote, or how the set looks.", solution: "Performance guidance." },
            { type: "regular", q: "How is drama organized?", answer: "Into acts and scenes.", solution: "Hierarchical structure." },
            { type: "word", q: "Name one famous soliloquy from Shakespeare.", answer: "Example: 'To be, or not to be' from Hamlet.", solution: "Any Shakespearean soliloquy." }
          ]
        },
        {
          title: "Romeo and Juliet: Themes & Characters",
          lesson: "*Romeo and Juliet* explores **love, fate, conflict, and youth**. Key characters: Romeo (impulsive), Juliet (passionate, brave), Mercutio (witty), Friar Laurence (well-meaning mediator), Tybalt (hot-tempered).",
          questions: [
            { type: "regular", q: "Who are the two feuding families in Romeo and Juliet?", answer: "The Montagues and Capulets.", solution: "Central conflict." },
            { type: "regular", q: "Who kills Mercutio?", answer: "Tybalt.", solution: "Act III turning point." },
            { type: "regular", q: "Name a theme of Romeo and Juliet.", answer: "Example: 'Love and fate collide with devastating consequences.'", solution: "Any valid theme." },
            { type: "regular", q: "What is a foil in drama?", answer: "A character who contrasts with another to highlight traits.", solution: "Mercutio is a foil to Romeo." },
            { type: "word", q: "What does 'a plague on both your houses' mean in context?", answer: "Mercutio curses both feuding families, blaming them for his death.", solution: "Dying words of Mercutio." }
          ]
        },
        {
          title: "Shakespearean Language",
          lesson: "Shakespeare wrote in **iambic pentameter** (10 syllables per line, alternating unstressed-stressed) and often used **thou/thee/thy** and inverted word order. Read passages aloud to hear the rhythm.",
          questions: [
            { type: "regular", q: "What is iambic pentameter?", answer: "A line of 10 syllables with an unstressed-stressed pattern (5 iambs).", solution: "Shakespeare's main meter." },
            { type: "regular", q: "What does 'thou' mean?", answer: "You (informal/singular).", solution: "Early modern English." },
            { type: "regular", q: "What does 'thy' mean?", answer: "Your.", solution: "Possessive of thou." },
            { type: "regular", q: "Meaning of 'wherefore' in 'O Romeo, Romeo, wherefore art thou Romeo?'", answer: "Why.", solution: "Juliet isn't asking where — she's asking why he's a Montague." },
            { type: "word", q: "Translate: 'I prithee, speak.'", answer: "I ask you, please speak. (or 'Please speak to me.')", solution: "Prithee = 'pray thee' = please." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Drama & Shakespeare",
        questions: [
          { type: "regular", q: "What's a soliloquy?", answer: "A character speaking thoughts aloud alone on stage.", solution: "Internal monologue spoken." },
          { type: "regular", q: "Families in Romeo and Juliet?", answer: "Montagues and Capulets.", solution: "Feuding houses." },
          { type: "regular", q: "Iambic pentameter has how many syllables per line?", answer: "10.", solution: "5 iambs × 2 syllables." },
          { type: "regular", q: "Meaning of 'thee'?", answer: "You (object form).", solution: "Early modern." },
          { type: "word", q: "Describe one theme from Romeo and Juliet.", answer: "Example: 'Impulsive love can lead to tragedy.'", solution: "Valid theme." },
          { type: "word", q: "Why is reading Shakespeare aloud helpful?", answer: "The rhythm and meaning become clearer when heard.", solution: "Oral performance aid." }
        ]
      }
    },
    {
      id: "e9-4", num: 4, title: "Argumentative Writing", subtitle: "Claims, evidence, counterarguments",
      emoji: "⚖️", accent: "#ca8a04", accent2: "#e8c56d",
      sections: [
        {
          title: "Building an Argument",
          lesson: "An argumentative essay has a **claim** (your position), **reasons** (why), **evidence** (proof), and a **counterargument** (addressing opposing views) with a **rebuttal** (answering them).",
          questions: [
            { type: "regular", q: "What's a claim?", answer: "Your main position or thesis.", solution: "What you argue." },
            { type: "regular", q: "Why include counterarguments?", answer: "To show you've considered other views and to strengthen your argument.", solution: "Credibility move." },
            { type: "regular", q: "What's a rebuttal?", answer: "Your response to a counterargument.", solution: "Defends your claim." },
            { type: "regular", q: "Examples of evidence?", answer: "Facts, statistics, expert quotes, case studies.", solution: "Supporting material." },
            { type: "word", q: "Write a claim about school lunches.", answer: "Example: 'School lunches should offer more vegetarian options.'", solution: "Debatable position." }
          ]
        },
        {
          title: "Logical Fallacies",
          lesson: "Fallacies weaken arguments. Watch for: **ad hominem** (attacking person, not idea), **straw man** (misrepresenting opponent), **slippery slope** (exaggerated chain of events), **bandwagon** (everyone does it).",
          questions: [
            { type: "regular", q: "What's an ad hominem?", answer: "Attacking the person rather than the argument.", solution: "Logical fallacy." },
            { type: "regular", q: "What's a straw man?", answer: "Misrepresenting someone's argument to make it easier to attack.", solution: "Fallacy." },
            { type: "regular", q: "Bandwagon fallacy says what?", answer: "You should believe it because everyone else does.", solution: "Popularity isn't proof." },
            { type: "regular", q: "Slippery slope example?", answer: "Example: 'If we allow X, then Y, Z, and disaster will follow.'", solution: "Unproven chain." },
            { type: "word", q: "Identify the fallacy: 'Don't listen to him — he's been wrong before!'", answer: "Ad hominem.", solution: "Attacks the person." }
          ]
        },
        {
          title: "Persuasive Appeals",
          lesson: "Aristotle's three appeals: **ethos** (credibility), **pathos** (emotion), and **logos** (logic). A strong argument uses all three thoughtfully.",
          questions: [
            { type: "regular", q: "What is ethos?", answer: "An appeal to credibility or character.", solution: "Trust." },
            { type: "regular", q: "Pathos appeals to what?", answer: "Emotion.", solution: "Feelings." },
            { type: "regular", q: "Logos is an appeal to what?", answer: "Logic and reason.", solution: "Facts, evidence." },
            { type: "regular", q: "Which appeal dominates in 'I have 20 years of medical experience'?", answer: "Ethos.", solution: "Establishes credibility." },
            { type: "word", q: "Write a pathos-based sentence about climate change.", answer: "Example: 'Imagine your grandchildren asking why we did nothing.'", solution: "Emotional appeal." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Argumentative Writing",
        questions: [
          { type: "regular", q: "Three parts of an argument?", answer: "Claim, reasons/evidence, counterargument with rebuttal.", solution: "Standard structure." },
          { type: "regular", q: "What's logos?", answer: "Appeal to logic.", solution: "Reasoning." },
          { type: "regular", q: "Why address counterarguments?", answer: "Shows thorough thinking and strengthens your case.", solution: "Credibility." },
          { type: "regular", q: "Name one logical fallacy.", answer: "Example: 'Ad hominem' (or straw man, bandwagon, slippery slope).", solution: "Any valid fallacy." },
          { type: "word", q: "Write a claim using pathos.", answer: "Example: 'No child should go to bed hungry.'", solution: "Emotional appeal." },
          { type: "word", q: "Fallacy: 'Everyone's doing it, so it must be right.'", answer: "Bandwagon.", solution: "Popularity appeal." }
        ]
      }
    },
    {
      id: "e9-5", num: 5, title: "Poetry", subtitle: "Forms, devices, and close reading",
      emoji: "🎵", accent: "#6366f1", accent2: "#a8afff",
      sections: [
        {
          title: "Poetic Forms",
          lesson: "Common forms include **sonnet** (14 lines, iambic pentameter), **haiku** (3 lines, 5-7-5 syllables), **limerick** (5 lines, humorous AABBA), and **free verse** (no set form).",
          questions: [
            { type: "regular", q: "How many lines in a sonnet?", answer: "14.", solution: "Standard length." },
            { type: "regular", q: "Haiku syllable pattern?", answer: "5-7-5.", solution: "Japanese form." },
            { type: "regular", q: "A Shakespearean sonnet has what rhyme scheme?", answer: "ABAB CDCD EFEF GG.", solution: "Three quatrains + couplet." },
            { type: "regular", q: "Does free verse rhyme?", answer: "Not required.", solution: "No set rules." },
            { type: "word", q: "Write one line that could fit in a haiku.", answer: "Example: 'Rain falls on the lake' (5 syllables).", solution: "Count syllables." }
          ]
        },
        {
          title: "Poetic Devices",
          lesson: "Poets use **metaphor, simile, personification, imagery, symbolism, alliteration, and assonance** to layer meaning and sound.",
          questions: [
            { type: "regular", q: "Device: 'Her laughter was sunshine.'", answer: "Metaphor.", solution: "Direct comparison." },
            { type: "regular", q: "Device: 'The silver slivers of moonlight silently slid.'", answer: "Alliteration.", solution: "Repeated 's' sounds." },
            { type: "regular", q: "What's symbolism?", answer: "Using an object to stand for an idea.", solution: "Dove = peace." },
            { type: "regular", q: "Difference between simile and metaphor?", answer: "Simile uses 'like' or 'as'; metaphor is direct.", solution: "Comparison type." },
            { type: "word", q: "Write a line using personification.", answer: "Example: 'The wind whispered secrets through the trees.'", solution: "Human quality to non-human." }
          ]
        },
        {
          title: "Close Reading Poetry",
          lesson: "Close reading = careful, slow attention to **word choice, rhythm, images, and structure**. Ask: Who is speaking? To whom? About what? What shifts happen? What's being emphasized?",
          questions: [
            { type: "regular", q: "Who is the 'speaker' of a poem?", answer: "The voice telling the poem (not always the poet).", solution: "Narrator role." },
            { type: "regular", q: "What is a 'volta'?", answer: "A turn in thought or argument, often in a sonnet.", solution: "Italian for 'turn'." },
            { type: "regular", q: "Why read poems multiple times?", answer: "Layered meaning emerges on re-reading.", solution: "Poetry rewards attention." },
            { type: "regular", q: "Closing line of a Shakespearean sonnet is often what?", answer: "A rhyming couplet that resolves or twists the theme.", solution: "Concluding couplet." },
            { type: "word", q: "In one sentence, summarize the value of close reading.", answer: "Example: 'Close reading reveals how every word carries meaning.'", solution: "Capture the idea." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Poetry",
        questions: [
          { type: "regular", q: "Sonnet length?", answer: "14 lines.", solution: "Standard." },
          { type: "regular", q: "Device: 'Stars dance in the night sky.'", answer: "Personification.", solution: "Human action." },
          { type: "regular", q: "Iambic pentameter = how many syllables per line?", answer: "10.", solution: "5 iambs." },
          { type: "regular", q: "Symbol of a red rose?", answer: "Love.", solution: "Traditional." },
          { type: "word", q: "Write a simile about the ocean.", answer: "Example: 'The ocean crashed like thunder.'", solution: "Uses 'like' or 'as'." },
          { type: "word", q: "Name one reason free verse gives poets freedom.", answer: "Example: 'Natural speech patterns aren't constrained by meter or rhyme.'", solution: "Flexibility." }
        ]
      }
    }
  ]
};

const ENGLISH_G10_COURSE = {
  id: "eng10", subject: "english",
  title: "10th Grade English",
  subtitle: "World literature, rhetoric, and deeper analysis",
  emoji: "📗", accent: "#65a30d", accent2: "#a8d577",
  description: "Five units on world literature, rhetoric, memoir, Shakespeare, and research.",
  books: [
    {
      id: "e10-1", num: 1, title: "World Literature", subtitle: "Stories from every continent",
      emoji: "🌍", accent: "#65a30d", accent2: "#a8d577",
      sections: [
        {
          title: "Cultural Context",
          lesson: "Reading across cultures means attending to **setting, values, and history** that shape the text. What characters find normal may reflect cultural assumptions different from your own.",
          questions: [
            { type: "regular", q: "Why read world literature?", answer: "To gain diverse perspectives and understand shared human themes across cultures.", solution: "Multiple viewpoints." },
            { type: "regular", q: "Cultural context affects what in a text?", answer: "Meaning, character motivations, themes, conflicts.", solution: "Everything shaped by culture." },
            { type: "regular", q: "What's an etic perspective?", answer: "Viewing a culture from outside.", solution: "Outside-in view." },
            { type: "regular", q: "What's an emic perspective?", answer: "Viewing a culture from within.", solution: "Inside view." },
            { type: "word", q: "Name a literary tradition from outside the English-speaking world.", answer: "Example: 'Japanese haiku, Indian epics like the Ramayana, Latin American magical realism.'", solution: "Any tradition." }
          ]
        },
        {
          title: "Archetypes and Universal Themes",
          lesson: "**Archetypes** are universal character or story patterns (the hero, the mentor, the quest, the coming-of-age). **Universal themes** (love, loss, justice) appear across cultures.",
          questions: [
            { type: "regular", q: "What's an archetype?", answer: "A recurring character type or story pattern across cultures.", solution: "Universal pattern." },
            { type: "regular", q: "Name three archetypes.", answer: "Example: 'the hero, the mentor, the trickster, the journey'.", solution: "Any valid." },
            { type: "regular", q: "What's the 'hero's journey'?", answer: "A common story pattern: call to adventure, trials, transformation, return.", solution: "Joseph Campbell's monomyth." },
            { type: "regular", q: "Why do universal themes resonate across cultures?", answer: "They touch shared human experiences.", solution: "Shared humanity." },
            { type: "word", q: "Identify an archetype in a story you know.", answer: "Example: 'Gandalf is the mentor archetype in The Hobbit.'", solution: "Any valid identification." }
          ]
        },
        {
          title: "Translation and Style",
          lesson: "Reading translated literature involves trust in the translator. Some meaning shifts: **idioms, tone, puns** may not translate directly. Compare translations to see interpretive choices.",
          questions: [
            { type: "regular", q: "Why might the same poem feel different in different translations?", answer: "Translators make stylistic and word choices that shape tone and meaning.", solution: "Translation is interpretation." },
            { type: "regular", q: "What's hard to translate?", answer: "Idioms, puns, wordplay, cultural references.", solution: "Untranslatable bits." },
            { type: "regular", q: "Literal vs. liberal translation?", answer: "Literal preserves words; liberal preserves meaning/feel.", solution: "Tradeoff." },
            { type: "regular", q: "Why might one read a work in its original language if possible?", answer: "To experience the author's exact rhythm, sound, and word choice.", solution: "Authentic engagement." },
            { type: "word", q: "Name a famous translated work.", answer: "Example: 'The Odyssey (Homer), One Hundred Years of Solitude (García Márquez).'", solution: "Any translated classic." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — World Literature",
        questions: [
          { type: "regular", q: "What's cultural context?", answer: "The time, place, and values that shape a text.", solution: "Background of the story." },
          { type: "regular", q: "Define archetype.", answer: "A universal character or story pattern.", solution: "Recurring type." },
          { type: "regular", q: "Universal theme vs. archetype?", answer: "Theme is an idea/message; archetype is a character or story pattern.", solution: "Different concepts." },
          { type: "regular", q: "What's hard about translating humor?", answer: "Wordplay and cultural references often don't carry over.", solution: "Language-specific." },
          { type: "word", q: "Name a universal theme in world literature.", answer: "Example: 'Love endures across hardship.'", solution: "Any universal." },
          { type: "word", q: "Name one work from a non-Western tradition.", answer: "Example: 'The Tale of Genji' (Japanese).", solution: "Any valid work." }
        ]
      }
    },
    {
      id: "e10-2", num: 2, title: "Rhetoric", subtitle: "Persuasion in speech and writing",
      emoji: "🎤", accent: "#0ea5e9", accent2: "#78cbef",
      sections: [
        {
          title: "Rhetorical Appeals (Ethos, Pathos, Logos)",
          lesson: "Aristotle's three appeals form the core of rhetoric. **Ethos** = credibility, **pathos** = emotion, **logos** = logic. Great speeches blend all three.",
          questions: [
            { type: "regular", q: "Ethos, pathos, logos — define each in one word.", answer: "Credibility, emotion, logic.", solution: "Three appeals." },
            { type: "regular", q: "Which appeal dominates in 'Four score and seven years ago...'?", answer: "Pathos (and ethos) — emotional and historical weight.", solution: "Lincoln evokes shared history/emotion." },
            { type: "regular", q: "Which appeal: 'Studies show 80% of teens benefit from more sleep.'", answer: "Logos.", solution: "Statistic = logic." },
            { type: "regular", q: "Why use all three appeals?", answer: "To persuade different audiences and cover all angles.", solution: "Well-rounded." },
            { type: "word", q: "Give an example of ethos.", answer: "Example: 'As a pediatrician with 20 years of experience...'", solution: "Establishes authority." }
          ]
        },
        {
          title: "Rhetorical Devices",
          lesson: "Rhetoricians use devices like **anaphora** (repeated beginnings: *I have a dream...*), **parallelism**, **antithesis** (contrasting ideas), **rhetorical questions**, and **metaphor** to amplify impact.",
          questions: [
            { type: "regular", q: "What is anaphora?", answer: "Repetition of the same words at the start of successive phrases.", solution: "E.g., 'We shall fight... We shall fight...'." },
            { type: "regular", q: "What's antithesis?", answer: "Contrasting ideas in parallel structure.", solution: "'Ask not what your country can do for you; ask what you can do for your country.'" },
            { type: "regular", q: "Rhetorical question asks...?", answer: "A question for effect, not answer.", solution: "'Isn't that obvious?'" },
            { type: "regular", q: "Why use parallelism?", answer: "For rhythm and emphasis.", solution: "Pleasing pattern." },
            { type: "word", q: "Write a sentence using anaphora.", answer: "Example: 'I came, I saw, I conquered.'", solution: "Repeated starts." }
          ]
        },
        {
          title: "Analyzing Speeches",
          lesson: "When analyzing a speech, ask: **Who is the speaker? Who is the audience? What's the occasion? What's the purpose? What devices are used?** SOAPStone: Speaker, Occasion, Audience, Purpose, Subject, Tone.",
          questions: [
            { type: "regular", q: "What does SOAPStone stand for?", answer: "Speaker, Occasion, Audience, Purpose, Subject, Tone.", solution: "Analysis framework." },
            { type: "regular", q: "Why does audience matter in rhetoric?", answer: "It shapes tone, language, and appeals.", solution: "Different audiences need different approaches." },
            { type: "regular", q: "What is the 'occasion' of a speech?", answer: "The context or event prompting it.", solution: "Time, place, situation." },
            { type: "regular", q: "Name a famous rhetorical speech.", answer: "Example: 'MLK's I Have a Dream, Lincoln's Gettysburg Address.'", solution: "Any famous." },
            { type: "word", q: "Why is tone important to analyze?", answer: "It reveals the speaker's attitude and influences how the audience responds.", solution: "Emotional tone shapes reception." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Rhetoric",
        questions: [
          { type: "regular", q: "Logos appeals to?", answer: "Logic.", solution: "Reasoning." },
          { type: "regular", q: "Define anaphora.", answer: "Repeating the same words at the start of successive phrases.", solution: "Rhetorical device." },
          { type: "regular", q: "What's SOAPStone used for?", answer: "Analyzing a speech or text.", solution: "Framework." },
          { type: "regular", q: "Example of pathos?", answer: "Example: 'Imagine your child in that classroom.'", solution: "Emotional appeal." },
          { type: "word", q: "Use antithesis in a sentence.", answer: "Example: 'Hope is not a strategy, but despair is not an answer.'", solution: "Contrasting ideas." },
          { type: "word", q: "Why study famous speeches?", answer: "To learn how persuasion works and build your own skills.", solution: "Model and learn." }
        ]
      }
    },
    {
      id: "e10-3", num: 3, title: "Memoir & Personal Narrative", subtitle: "Writing from experience",
      emoji: "📓", accent: "#7c3aed", accent2: "#b295ec",
      sections: [
        {
          title: "What Makes a Memoir",
          lesson: "A memoir is a true story from your life, but it's crafted. It uses **scene, reflection, and meaning**. Memoir isn't just what happened — it's what it meant.",
          questions: [
            { type: "regular", q: "Difference between memoir and autobiography?", answer: "Memoir focuses on a theme or period; autobiography covers the whole life.", solution: "Scope differs." },
            { type: "regular", q: "What's 'reflection' in memoir?", answer: "The writer's thoughts on what the experience meant.", solution: "Meaning-making." },
            { type: "regular", q: "Is memoir always strictly factual?", answer: "Mostly — some dialogue or detail may be reconstructed, but events should be true.", solution: "Truth with craft." },
            { type: "regular", q: "What tense is memoir usually written in?", answer: "Past tense (sometimes present for immediacy).", solution: "Reflective past is common." },
            { type: "word", q: "Name a famous memoir.", answer: "Example: 'The Diary of a Young Girl (Anne Frank), I Know Why the Caged Bird Sings (Angelou).'", solution: "Any memoir." }
          ]
        },
        {
          title: "Scene vs. Summary",
          lesson: "**Scene** dramatizes a moment with dialogue and detail. **Summary** condenses events. Skilled memoirists use scene for emotional peaks and summary to connect them.",
          questions: [
            { type: "regular", q: "What is a scene?", answer: "A dramatized moment with dialogue and sensory detail.", solution: "Show-don't-tell unit." },
            { type: "regular", q: "When to use summary?", answer: "To cover time or events quickly.", solution: "Compression tool." },
            { type: "regular", q: "Which is typically more vivid — scene or summary?", answer: "Scene.", solution: "Immersive detail." },
            { type: "regular", q: "Can one paragraph contain both?", answer: "Yes — writers often transition between them.", solution: "Mix well." },
            { type: "word", q: "Turn this summary into a scene: 'I was scared at the doctor's office.'", answer: "Example: 'My palms stuck to the paper crinkling beneath me. The nurse said, \"This will just feel like a pinch.\" I shut my eyes tight.'", solution: "Dialogue + sensory detail." }
          ]
        },
        {
          title: "Voice in Personal Writing",
          lesson: "**Voice** is your distinct way of telling a story. It comes from word choice, rhythm, humor, and honesty. Don't mimic others — write the way you think.",
          questions: [
            { type: "regular", q: "What is voice in writing?", answer: "The writer's distinct personality on the page.", solution: "Unique style." },
            { type: "regular", q: "How do you develop voice?", answer: "By writing honestly, reading widely, and trusting your natural rhythm.", solution: "Practice + authenticity." },
            { type: "regular", q: "Should voice be the same in every piece?", answer: "Roughly yes — though tone may shift with topic.", solution: "Voice is you; tone is the mood." },
            { type: "regular", q: "Voice vs. tone?", answer: "Voice = the writer's personality; tone = attitude toward a specific piece.", solution: "Personal vs. situational." },
            { type: "word", q: "Describe your own voice in one sentence.", answer: "Example: 'Casual, honest, with dry humor.'", solution: "Self-describe." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Memoir & Personal Narrative",
        questions: [
          { type: "regular", q: "Memoir vs. autobiography?", answer: "Memoir covers a theme/period; autobiography covers whole life.", solution: "Scope differs." },
          { type: "regular", q: "Scene includes what?", answer: "Dialogue and sensory detail.", solution: "Dramatized moment." },
          { type: "regular", q: "Voice = writer's ___ on the page.", answer: "Personality.", solution: "Distinct style." },
          { type: "regular", q: "Why is reflection essential in memoir?", answer: "It turns events into meaning.", solution: "Makes it more than a log." },
          { type: "word", q: "Summarize a memorable event from today in 1-2 sentences.", answer: "Example: student's own summary.", solution: "Any real summary." },
          { type: "word", q: "Turn it into a quick scene with dialogue.", answer: "Example: a dramatized moment with at least one line of dialogue.", solution: "Scene vs. summary." }
        ]
      }
    },
    {
      id: "e10-4", num: 4, title: "Shakespeare: Julius Caesar", subtitle: "Power, loyalty, tragedy",
      emoji: "👑", accent: "#dc2626", accent2: "#ef8989",
      sections: [
        {
          title: "Plot and Characters",
          lesson: "*Julius Caesar* tells of a conspiracy against Caesar. Key characters: **Caesar** (ambitious leader), **Brutus** (honorable, torn), **Cassius** (manipulative instigator), **Mark Antony** (loyal, skilled orator).",
          questions: [
            { type: "regular", q: "Who leads the conspiracy against Caesar?", answer: "Cassius.", solution: "Instigator." },
            { type: "regular", q: "Who is Caesar's close friend that betrays him?", answer: "Brutus.", solution: "Et tu, Brute?" },
            { type: "regular", q: "Who delivers the famous 'Friends, Romans, countrymen' speech?", answer: "Mark Antony.", solution: "Act III, scene 2." },
            { type: "regular", q: "What's Caesar's fate?", answer: "Assassinated by the conspirators.", solution: "Turning point." },
            { type: "word", q: "Describe Brutus's moral dilemma.", answer: "Example: 'Brutus loves Caesar but fears Caesar's ambition will harm Rome.'", solution: "Loyalty vs. republic." }
          ]
        },
        {
          title: "Rhetoric in Julius Caesar",
          lesson: "Mark Antony's funeral speech is a rhetorical masterpiece — he uses irony ('Brutus is an honorable man'), pathos, and Caesar's bloody cloak to turn the crowd against the conspirators.",
          questions: [
            { type: "regular", q: "What rhetorical device is 'Brutus is an honorable man' (repeated)?", answer: "Verbal irony (and anaphora).", solution: "Antony means the opposite." },
            { type: "regular", q: "How does Antony use the will?", answer: "To stir the crowd's emotions in his favor.", solution: "Pathos through generosity." },
            { type: "regular", q: "Who speaks first at Caesar's funeral?", answer: "Brutus.", solution: "Explains the reason." },
            { type: "regular", q: "Whose speech wins over the crowd?", answer: "Antony's.", solution: "Masterful rhetoric." },
            { type: "word", q: "Why is 'lend me your ears' a strong opening?", answer: "It's an active, inviting metaphor that gets attention and establishes trust.", solution: "Memorable hook." }
          ]
        },
        {
          title: "Themes: Power, Loyalty, Fate",
          lesson: "Themes include **ambition vs. virtue, friendship vs. duty, fate vs. free will, and the power of words**. The play asks: does doing the right thing justify violent means?",
          questions: [
            { type: "regular", q: "Name two themes of Julius Caesar.", answer: "Example: 'Power and its cost, loyalty and betrayal.'", solution: "Any two valid." },
            { type: "regular", q: "What omen is given to Caesar?", answer: "Beware the Ides of March.", solution: "The soothsayer's warning." },
            { type: "regular", q: "Does Brutus want power for himself?", answer: "No — he acts from principle, not ambition.", solution: "His tragic flaw." },
            { type: "regular", q: "Tragic hero applies to which character?", answer: "Brutus (arguably).", solution: "Noble hero with fatal flaw." },
            { type: "word", q: "State a theme about words/rhetoric in the play.", answer: "Example: 'Words can sway crowds more powerfully than weapons.'", solution: "Valid theme." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Shakespeare: Julius Caesar",
        questions: [
          { type: "regular", q: "Who says 'Et tu, Brute'?", answer: "Caesar, to Brutus.", solution: "Final betrayal." },
          { type: "regular", q: "Speech that turns the crowd?", answer: "Antony's funeral oration.", solution: "Masterful rhetoric." },
          { type: "regular", q: "Who warns Caesar of the Ides of March?", answer: "The soothsayer.", solution: "Famous warning." },
          { type: "regular", q: "Brutus's motivation?", answer: "To protect Rome from Caesar's ambition.", solution: "Principled." },
          { type: "word", q: "State one theme.", answer: "Example: 'Ambition can corrupt even noble intentions.'", solution: "Valid theme." },
          { type: "word", q: "Why is Antony's speech persuasive?", answer: "Irony, emotional appeal (Caesar's will), vivid details (bloody cloak).", solution: "Rhetoric + drama." }
        ]
      }
    },
    {
      id: "e10-5", num: 5, title: "Research & Synthesis", subtitle: "From question to paper",
      emoji: "🔎", accent: "#0891b2", accent2: "#67d2e2",
      sections: [
        {
          title: "Research Questions",
          lesson: "A strong research question is **focused, arguable, and investigable**. Too broad ('what is climate change?') is worse than focused ('how has rising sea level affected Louisiana coastal towns since 2000?').",
          questions: [
            { type: "regular", q: "What makes a research question strong?", answer: "Focused, arguable, investigable.", solution: "Three qualities." },
            { type: "regular", q: "Too broad or too narrow — which is worse?", answer: "Usually too broad (hard to address in one paper).", solution: "Narrow down." },
            { type: "regular", q: "What's an arguable question?", answer: "One with multiple possible answers, not just factual recall.", solution: "Room for analysis." },
            { type: "regular", q: "What's a hypothesis?", answer: "A tentative answer to your research question.", solution: "Initial claim." },
            { type: "word", q: "Turn 'pollution' into a focused research question.", answer: "Example: 'How has the ban on single-use plastics affected ocean waste in [specific region] since 2019?'", solution: "Focused, investigable." }
          ]
        },
        {
          title: "Synthesizing Sources",
          lesson: "**Synthesis** weaves multiple sources together to build your argument. Don't just summarize each source — connect them: where do they agree, disagree, extend each other?",
          questions: [
            { type: "regular", q: "What is synthesis?", answer: "Combining ideas from multiple sources into a unified discussion.", solution: "Weaving together." },
            { type: "regular", q: "Synthesis vs. summary?", answer: "Summary = recaps one source; synthesis = compares and combines multiple.", solution: "Scale difference." },
            { type: "regular", q: "What signals good synthesis?", answer: "Transitions between sources, comparison of claims, your own interpretation.", solution: "Active engagement." },
            { type: "regular", q: "Should every paragraph cite a source?", answer: "In a research paper, yes — claims need backing.", solution: "Evidence throughout." },
            { type: "word", q: "Why is synthesis harder than summary?", answer: "It requires understanding each source well enough to connect them.", solution: "Higher-order thinking." }
          ]
        },
        {
          title: "Citing and Avoiding Plagiarism",
          lesson: "Always cite: direct quotes, paraphrases, data, and specific ideas from sources. Common knowledge doesn't need citation. Use MLA or APA consistently.",
          questions: [
            { type: "regular", q: "When must you cite a source?", answer: "For quotes, paraphrases, specific facts, or ideas that aren't common knowledge.", solution: "Always credit specific borrowings." },
            { type: "regular", q: "What's common knowledge?", answer: "Widely known facts that don't require a source (e.g., 'Earth orbits the sun').", solution: "Exception." },
            { type: "regular", q: "Paraphrasing without citation is...?", answer: "Plagiarism.", solution: "Still uses others' ideas." },
            { type: "regular", q: "MLA in-text citation format?", answer: "(Author Page#).", solution: "Standard." },
            { type: "word", q: "Rewrite 'Einstein developed the theory of relativity' as plagiarism-safe.", answer: "Either cite (Einstein developed relativity (Smith 23)) or note it's common knowledge — the fact is broadly known.", solution: "Evaluate necessity." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Research & Synthesis",
        questions: [
          { type: "regular", q: "Strong research question is focused, arguable, and ___?", answer: "Investigable.", solution: "Can actually be studied." },
          { type: "regular", q: "Synthesis = combining ___.", answer: "Multiple sources into a unified discussion.", solution: "Definition." },
          { type: "regular", q: "Do common knowledge facts need citation?", answer: "No.", solution: "Exception to citation rule." },
          { type: "regular", q: "MLA in-text citation: what two pieces?", answer: "Author last name, page number.", solution: "Standard." },
          { type: "word", q: "Narrow 'video games and teens' into a research question.", answer: "Example: 'How has daily gaming time affected sleep patterns in 14-year-olds since 2020?'", solution: "Focused + investigable." },
          { type: "word", q: "Why is plagiarism a serious offense?", answer: "It undermines trust, steals credit, and is academically dishonest.", solution: "Multiple valid reasons." }
        ]
      }
    }
  ]
};

const ENGLISH_G11_COURSE = {
  id: "eng11", subject: "english",
  title: "11th Grade English",
  subtitle: "American literature, AP-style analysis",
  emoji: "📘", accent: "#7c2d12", accent2: "#b98468",
  description: "Five units on American literature, literary movements, complex texts, advanced composition, and argument.",
  books: [
    {
      id: "e11-1", num: 1, title: "American Literature: Origins", subtitle: "Colonial through Romantic eras",
      emoji: "🏛️", accent: "#7c2d12", accent2: "#b98468",
      sections: [
        {
          title: "Puritan and Colonial Writers",
          lesson: "Early American writing was shaped by Puritan values: **providence, sin, self-examination**. Key writers: Anne Bradstreet (poetry), William Bradford (history), Jonathan Edwards (sermons), Ben Franklin (secular Enlightenment).",
          questions: [
            { type: "regular", q: "Who wrote 'Sinners in the Hands of an Angry God'?", answer: "Jonathan Edwards.", solution: "Famous Puritan sermon." },
            { type: "regular", q: "What values shaped Puritan writing?", answer: "Religious devotion, self-examination, divine providence.", solution: "Puritan worldview." },
            { type: "regular", q: "What did Franklin represent as a writer?", answer: "Enlightenment values — reason, science, self-improvement.", solution: "Secular shift." },
            { type: "regular", q: "Anne Bradstreet is known for?", answer: "Being the first published American poet (a woman).", solution: "Colonial poet." },
            { type: "word", q: "How did Puritan writing differ from Franklin's?", answer: "Puritans centered God and sin; Franklin emphasized reason and practical virtue.", solution: "Religious vs. secular." }
          ]
        },
        {
          title: "Transcendentalism",
          lesson: "Mid-1800s movement emphasizing **self-reliance, nature, intuition, and individualism**. Leaders: Ralph Waldo Emerson, Henry David Thoreau. Key ideas: the divine in nature, trust your own conscience.",
          questions: [
            { type: "regular", q: "Who wrote 'Walden'?", answer: "Henry David Thoreau.", solution: "Lived at Walden Pond." },
            { type: "regular", q: "Central ideas of transcendentalism?", answer: "Self-reliance, nature, intuition, individual conscience.", solution: "Core beliefs." },
            { type: "regular", q: "Who wrote 'Self-Reliance'?", answer: "Ralph Waldo Emerson.", solution: "Famous essay." },
            { type: "regular", q: "What did Thoreau do at Walden Pond?", answer: "Lived simply in a cabin for two years to live deliberately.", solution: "Famous experiment." },
            { type: "word", q: "State a transcendentalist belief in one sentence.", answer: "Example: 'Trust your intuition — it connects you to the divine in nature.'", solution: "Captures key idea." }
          ]
        },
        {
          title: "Romanticism and Dark Romantics",
          lesson: "American Romantics celebrated emotion, nature, and imagination. **Dark Romantics** (Poe, Hawthorne, Melville) added a gothic twist: human evil, guilt, and the unknown.",
          questions: [
            { type: "regular", q: "Who wrote 'The Raven' and 'The Tell-Tale Heart'?", answer: "Edgar Allan Poe.", solution: "Master of gothic." },
            { type: "regular", q: "Who wrote 'The Scarlet Letter'?", answer: "Nathaniel Hawthorne.", solution: "Puritan guilt + Romanticism." },
            { type: "regular", q: "Romantic vs. Dark Romantic — key difference?", answer: "Romantics celebrate nature/emotion; Dark Romantics explore evil, guilt, the gothic.", solution: "Light vs. shadow." },
            { type: "regular", q: "What Moby-Dick author is a Dark Romantic?", answer: "Herman Melville.", solution: "Epic gothic novel." },
            { type: "word", q: "Give one Poe characteristic.", answer: "Example: 'Claustrophobic atmosphere and unreliable narrators.'", solution: "Poe's signature." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — American Literature: Origins",
        questions: [
          { type: "regular", q: "Who wrote 'Walden'?", answer: "Thoreau.", solution: "Transcendentalist." },
          { type: "regular", q: "Puritan writing centers on?", answer: "Religion, sin, providence.", solution: "Theological focus." },
          { type: "regular", q: "Transcendentalists valued?", answer: "Self-reliance, nature, intuition.", solution: "Core values." },
          { type: "regular", q: "Who wrote 'The Scarlet Letter'?", answer: "Hawthorne.", solution: "Dark Romantic." },
          { type: "word", q: "Name a key difference between Franklin and Edwards.", answer: "Example: 'Franklin focused on reason and practical self-improvement; Edwards on religious terror.'", solution: "Enlightenment vs. Puritan." },
          { type: "word", q: "Why is Poe considered a Dark Romantic?", answer: "He explores death, madness, and the macabre within Romantic emotion.", solution: "Gothic edge." }
        ]
      }
    },
    {
      id: "e11-2", num: 2, title: "Modern American Voices", subtitle: "20th century movements",
      emoji: "🗽", accent: "#2563eb", accent2: "#86a9e8",
      sections: [
        {
          title: "Realism and Naturalism",
          lesson: "Late 19th century: **Realism** showed life as it actually was (Mark Twain, Henry James). **Naturalism** (Stephen Crane, Jack London) added scientific, often bleak determinism: humans shaped by forces beyond their control.",
          questions: [
            { type: "regular", q: "Who wrote 'Huckleberry Finn'?", answer: "Mark Twain.", solution: "Realist classic." },
            { type: "regular", q: "Difference between Realism and Naturalism?", answer: "Realism depicts everyday life; Naturalism emphasizes deterministic forces.", solution: "Naturalism is darker." },
            { type: "regular", q: "Who wrote 'The Red Badge of Courage'?", answer: "Stephen Crane.", solution: "Naturalist novel." },
            { type: "regular", q: "What's regionalism?", answer: "A form of realism focused on a specific region's dialect and culture.", solution: "Twain's Mississippi." },
            { type: "word", q: "Why was realism a reaction to earlier movements?", answer: "Against romantic idealism — writers wanted to show life as it truly was.", solution: "Pushback." }
          ]
        },
        {
          title: "The Harlem Renaissance",
          lesson: "1920s flowering of African American art and literature in Harlem. Voices like **Langston Hughes, Zora Neale Hurston, Claude McKay** celebrated Black culture, confronted racism, and shaped modern American identity.",
          questions: [
            { type: "regular", q: "Who wrote 'The Weary Blues'?", answer: "Langston Hughes.", solution: "Harlem Renaissance poet." },
            { type: "regular", q: "Who wrote 'Their Eyes Were Watching God'?", answer: "Zora Neale Hurston.", solution: "Renaissance novelist." },
            { type: "regular", q: "What cultural shift did Harlem Renaissance mark?", answer: "A flourishing of Black art, literature, music, and pride.", solution: "Cultural awakening." },
            { type: "regular", q: "What musical form influenced the movement?", answer: "Jazz (and blues).", solution: "Artistic cross-pollination." },
            { type: "word", q: "Name one theme common to Harlem Renaissance works.", answer: "Example: 'Celebrating Black heritage and resisting racism.'", solution: "Valid theme." }
          ]
        },
        {
          title: "The Lost Generation and Modernism",
          lesson: "Post-WWI writers (Hemingway, Fitzgerald, Eliot) captured disillusionment, fragmentation, and loss. **Modernism**: experimental form, skepticism, and 'make it new'.",
          questions: [
            { type: "regular", q: "Who wrote 'The Great Gatsby'?", answer: "F. Scott Fitzgerald.", solution: "Lost Generation." },
            { type: "regular", q: "Who wrote 'The Sun Also Rises'?", answer: "Ernest Hemingway.", solution: "Lost Generation novelist." },
            { type: "regular", q: "What does 'modernist' form often feature?", answer: "Fragmentation, stream of consciousness, non-linear structure.", solution: "Experimental style." },
            { type: "regular", q: "What's the 'American Dream' theme in Gatsby?", answer: "Its pursuit can corrupt and fail to deliver happiness.", solution: "Critical view." },
            { type: "word", q: "Why called the 'Lost Generation'?", answer: "They felt aimless and disillusioned after WWI.", solution: "Post-war malaise." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Modern American Voices",
        questions: [
          { type: "regular", q: "Realism vs. Naturalism?", answer: "Realism = everyday life; Naturalism = deterministic forces.", solution: "Darker edge." },
          { type: "regular", q: "Harlem Renaissance peaked in which decade?", answer: "1920s.", solution: "Cultural blooming." },
          { type: "regular", q: "Who wrote 'The Great Gatsby'?", answer: "Fitzgerald.", solution: "Modernist classic." },
          { type: "regular", q: "Langston Hughes represented which movement?", answer: "Harlem Renaissance.", solution: "Major poet." },
          { type: "word", q: "State a theme of 'The Great Gatsby'.", answer: "Example: 'The American Dream is more illusion than reality.'", solution: "Valid theme." },
          { type: "word", q: "What's stream of consciousness?", answer: "A narrative style that mimics the flow of thoughts.", solution: "Modernist technique." }
        ]
      }
    },
    {
      id: "e11-3", num: 3, title: "Literary Analysis (Advanced)", subtitle: "Close reading at depth",
      emoji: "🔬", accent: "#0e7490", accent2: "#6fc0d1",
      sections: [
        {
          title: "Close Reading Passages",
          lesson: "Advanced close reading looks at **diction** (word choice), **syntax** (sentence structure), **figurative language**, **patterns of imagery**, and how the passage connects to the whole work.",
          questions: [
            { type: "regular", q: "What is diction?", answer: "Word choice.", solution: "Vocabulary." },
            { type: "regular", q: "What is syntax?", answer: "Sentence structure.", solution: "How sentences are built." },
            { type: "regular", q: "Why attend to patterns of imagery?", answer: "They reveal theme and tone.", solution: "Recurring imagery carries meaning." },
            { type: "regular", q: "What's a motif?", answer: "A recurring element that reinforces a theme.", solution: "Pattern across the work." },
            { type: "word", q: "What effect do short, choppy sentences often create?", answer: "Tension, urgency, fragmentation.", solution: "Syntax shapes feel." }
          ]
        },
        {
          title: "Formal vs. Informal Analysis",
          lesson: "Formal analysis uses **academic vocabulary** and evidence. Keep first-person minimal. Integrate quotations smoothly with proper citation. Focus on the text, not personal opinion.",
          questions: [
            { type: "regular", q: "Should literary analysis use first person heavily?", answer: "Usually no — keep focus on the text, not 'I'.", solution: "Conventional style." },
            { type: "regular", q: "How to integrate quotations?", answer: "Introduce them in your sentence, then cite.", solution: "Smooth integration." },
            { type: "regular", q: "Why avoid plot summary in analysis?", answer: "Analysis argues about the text, not just retells it.", solution: "Argument > summary." },
            { type: "regular", q: "What's a strong analytical claim?", answer: "An arguable interpretation backed by textual evidence.", solution: "Interpretive." },
            { type: "word", q: "Rewrite as analysis: 'I think Hamlet is sad.'", answer: "Example: 'Hamlet's melancholy manifests in his soliloquies, particularly in... (1.2.129).'", solution: "Formal, evidence-based." }
          ]
        },
        {
          title: "Symbolism and Allegory",
          lesson: "A **symbol** is an object or image standing for an abstract idea. An **allegory** is an extended symbolic story where most elements represent something else (e.g., *Animal Farm* = Russian Revolution).",
          questions: [
            { type: "regular", q: "Symbol vs. allegory?", answer: "Symbol = single object/image; allegory = extended symbolic story.", solution: "Scale difference." },
            { type: "regular", q: "Example of allegory?", answer: "Animal Farm (Orwell) — animals represent figures of the Russian Revolution.", solution: "Extended symbolism." },
            { type: "regular", q: "What does a white whale symbolize in Moby-Dick?", answer: "Obsession / evil / the unknowable (multiple interpretations).", solution: "Rich symbol." },
            { type: "regular", q: "Is a symbol always intentional?", answer: "Often, but interpretation can go beyond the author's intent.", solution: "Meaning is contextual." },
            { type: "word", q: "Give an example of a symbol in popular culture.", answer: "Example: 'A red rose symbolizes love.'", solution: "Object → concept." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Literary Analysis (Advanced)",
        questions: [
          { type: "regular", q: "Diction refers to?", answer: "Word choice.", solution: "Vocabulary." },
          { type: "regular", q: "Syntax refers to?", answer: "Sentence structure.", solution: "How sentences are built." },
          { type: "regular", q: "Symbol vs. allegory?", answer: "Symbol is single; allegory is extended.", solution: "Scope." },
          { type: "regular", q: "What is a motif?", answer: "A recurring element reinforcing a theme.", solution: "Repetition with purpose." },
          { type: "word", q: "What can short sentences convey?", answer: "Tension, urgency, emphasis.", solution: "Syntactic effect." },
          { type: "word", q: "Rewrite formally: 'I felt bad for Gatsby.'", answer: "Example: 'Fitzgerald evokes sympathy for Gatsby by contrasting his idealism with Daisy's carelessness.'", solution: "Formal analysis." }
        ]
      }
    },
    {
      id: "e11-4", num: 4, title: "Advanced Composition", subtitle: "Sophisticated writing",
      emoji: "🖋️", accent: "#be185d", accent2: "#e69abc",
      sections: [
        {
          title: "Strong Thesis Statements",
          lesson: "An AP-level thesis is **specific, arguable, and complex**. Avoid three-part 'boxes' — instead, state a nuanced claim. Weak: *The book shows many themes.* Strong: *Fitzgerald critiques the American Dream through Gatsby's self-made but hollow persona.*",
          questions: [
            { type: "regular", q: "What makes a thesis arguable?", answer: "It takes a position others could reasonably dispute.", solution: "Not a fact." },
            { type: "regular", q: "What's wrong with 'This book has many themes'?", answer: "It's not arguable, and it's too broad.", solution: "Vague and obvious." },
            { type: "regular", q: "Should a thesis be one sentence?", answer: "Usually yes — for clarity.", solution: "Concise main claim." },
            { type: "regular", q: "Placement of a thesis?", answer: "Usually end of introduction.", solution: "Standard." },
            { type: "word", q: "Write a strong thesis about technology's effect on attention.", answer: "Example: 'While smartphones promise connection, their design exploits dopamine loops that erode sustained attention.'", solution: "Arguable, specific." }
          ]
        },
        {
          title: "Sentence Variety and Style",
          lesson: "Mix **short and long sentences**. Vary openings (don't always start with the subject). Use **active voice** when possible. Parallel structure adds rhythm: *To lead, to listen, to learn.*",
          questions: [
            { type: "regular", q: "Active or passive: 'The law was broken by the thief.'", answer: "Passive.", solution: "Subject receives the action." },
            { type: "regular", q: "Convert to active.", answer: "The thief broke the law.", solution: "Subject does the action." },
            { type: "regular", q: "Why vary sentence length?", answer: "To create rhythm and avoid monotony.", solution: "Style variety." },
            { type: "regular", q: "What is parallel structure?", answer: "Using the same grammatical form for related ideas.", solution: "Rhythm and clarity." },
            { type: "word", q: "Fix parallel: 'She likes running, to swim, and to bike.'", answer: "Example: 'She likes running, swimming, and biking.'", solution: "All gerunds." }
          ]
        },
        {
          title: "Revision Strategies",
          lesson: "Revise in layers: **big picture** (thesis, organization), **paragraph level** (topic sentences, transitions), **sentence level** (clarity, rhythm), **word level** (precision). Read your draft aloud to catch awkward phrasing.",
          questions: [
            { type: "regular", q: "First thing to check in revision?", answer: "Thesis and overall argument.", solution: "Big picture first." },
            { type: "regular", q: "Why read drafts aloud?", answer: "To hear awkward rhythm and spot errors.", solution: "Sound test." },
            { type: "regular", q: "What's a transition?", answer: "A word or phrase linking ideas between sentences or paragraphs.", solution: "Coherence tool." },
            { type: "regular", q: "Revision vs. editing?", answer: "Revision changes content; editing fixes mechanics.", solution: "Different stages." },
            { type: "word", q: "Name three common transition words.", answer: "Example: 'However, therefore, furthermore.'", solution: "Linking words." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Advanced Composition",
        questions: [
          { type: "regular", q: "Strong thesis is ___ and ___?", answer: "Specific and arguable.", solution: "Plus usually complex." },
          { type: "regular", q: "Active: 'The ball was caught by Sam.'", answer: "Sam caught the ball.", solution: "Subject does action." },
          { type: "regular", q: "What's parallel structure?", answer: "Matching grammatical forms for related ideas.", solution: "Rhythmic pattern." },
          { type: "regular", q: "Revision vs. editing?", answer: "Revision changes content; editing is surface.", solution: "Different stages." },
          { type: "word", q: "Rewrite with better style: 'The book was read by me. It was boring.'", answer: "Example: 'I read the book, but found it boring.'", solution: "Active + combined." },
          { type: "word", q: "Turn into parallel: 'He is hardworking, smart, and has kindness.'", answer: "Example: 'He is hardworking, smart, and kind.'", solution: "All adjectives." }
        ]
      }
    },
    {
      id: "e11-5", num: 5, title: "Argument & Synthesis", subtitle: "AP-style argumentative writing",
      emoji: "🎯", accent: "#9333ea", accent2: "#c49ce8",
      sections: [
        {
          title: "Constructing Complex Arguments",
          lesson: "Advanced arguments **qualify claims** (avoid absolutes: *often, frequently, in many cases*), acknowledge nuance, and build from evidence toward interpretation, not vice versa.",
          questions: [
            { type: "regular", q: "Why qualify claims?", answer: "Absolutes are rarely true; qualifying shows nuance.", solution: "Intellectual honesty." },
            { type: "regular", q: "Example of a qualifier?", answer: "Often, generally, frequently, in most cases.", solution: "Softens absolutes." },
            { type: "regular", q: "Should evidence come before or after claim?", answer: "Claim first, then evidence, then explanation of how it supports.", solution: "PEE structure." },
            { type: "regular", q: "What's a concession in argument?", answer: "Acknowledging a valid point from the opposing side.", solution: "Builds credibility." },
            { type: "word", q: "Soften the absolute: 'Teenagers always procrastinate.'", answer: "Example: 'Teenagers often procrastinate, especially on open-ended tasks.'", solution: "Qualifier added." }
          ]
        },
        {
          title: "Synthesis Essays",
          lesson: "A **synthesis essay** draws on multiple sources to build your own argument. Each source is integrated — not just summarized. Use sources as evidence and as partners in your thinking.",
          questions: [
            { type: "regular", q: "What's the goal of a synthesis essay?", answer: "To build an original argument using multiple sources.", solution: "Original + sourced." },
            { type: "regular", q: "How many sources typically?", answer: "At least 3 for AP-style synthesis.", solution: "AP convention." },
            { type: "regular", q: "Should sources agree with your thesis?", answer: "Not all — including opposing views strengthens argument.", solution: "Engage opposition." },
            { type: "regular", q: "What distinguishes synthesis from research?", answer: "Synthesis is shorter and focuses on argumentation with given sources.", solution: "Related forms." },
            { type: "word", q: "Why integrate, not just summarize, sources?", answer: "To show your thinking and build a layered argument.", solution: "Integration > list." }
          ]
        },
        {
          title: "Counterarguments and Concessions",
          lesson: "Engaging opposing views is essential. **Concession**: grant what's true. **Counterargument + rebuttal**: address the strongest objection and refute it. This shows intellectual honesty and strengthens your claim.",
          questions: [
            { type: "regular", q: "What's a concession?", answer: "Acknowledging a valid opposing point.", solution: "Grants truth." },
            { type: "regular", q: "What's a rebuttal?", answer: "Your response showing your position still holds.", solution: "Defends claim." },
            { type: "regular", q: "Why engage the strongest counterargument?", answer: "Dodging it weakens your argument.", solution: "Don't straw man." },
            { type: "regular", q: "Can a concession strengthen your essay?", answer: "Yes — it shows you've considered opposing views honestly.", solution: "Credibility booster." },
            { type: "word", q: "Example concession in 'schools should require uniforms'?", answer: "Example: 'While uniforms limit individual expression, they also reduce peer pressure and save family money.'", solution: "Grants + pivots." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Argument & Synthesis",
        questions: [
          { type: "regular", q: "Why qualify claims?", answer: "To show nuance and avoid absolutes.", solution: "Honesty." },
          { type: "regular", q: "Synthesis essay uses how many sources?", answer: "Typically 3 or more.", solution: "AP standard." },
          { type: "regular", q: "What's a rebuttal?", answer: "A response to a counterargument.", solution: "Defends your claim." },
          { type: "regular", q: "Counterargument shows what?", answer: "You've engaged opposing views.", solution: "Strengthens position." },
          { type: "word", q: "Rewrite: 'Everyone loves pizza.'", answer: "Example: 'Pizza is popular across many cultures.'", solution: "Qualified claim." },
          { type: "word", q: "State a concession for 'homework is valuable'.", answer: "Example: 'While excessive homework can cause stress, targeted practice reinforces learning.'", solution: "Grants + pivots." }
        ]
      }
    }
  ]
};

const ENGLISH_G12_COURSE = {
  id: "eng12", subject: "english",
  title: "12th Grade English",
  subtitle: "British literature, AP-style writing, and critical theory",
  emoji: "📙", accent: "#1e40af", accent2: "#7a96d8",
  description: "Five units on British literary tradition, critical lenses, college-level writing, Shakespeare in depth, and capstone synthesis.",
  books: [
    {
      id: "e12-1", num: 1, title: "British Literature: Anglo-Saxon to Renaissance", subtitle: "Beowulf to Shakespeare",
      emoji: "⚔️", accent: "#1e40af", accent2: "#7a96d8",
      sections: [
        {
          title: "Anglo-Saxon & Medieval",
          lesson: "Early English literature includes **Beowulf** (epic poem of a hero battling monsters) and Chaucer's **Canterbury Tales** (pilgrims telling stories — a social cross-section). Language evolved from Old English to Middle English.",
          questions: [
            { type: "regular", q: "What is Beowulf?", answer: "An Anglo-Saxon epic poem about a heroic warrior.", solution: "Old English classic." },
            { type: "regular", q: "Who wrote the Canterbury Tales?", answer: "Geoffrey Chaucer.", solution: "Middle English poet." },
            { type: "regular", q: "What kind of journey do the Canterbury Tales pilgrims make?", answer: "A pilgrimage to Canterbury Cathedral.", solution: "Religious journey." },
            { type: "regular", q: "What epic convention does Beowulf use?", answer: "Epic hero, supernatural villains, elevated style.", solution: "Epic conventions." },
            { type: "word", q: "Name a theme from Beowulf.", answer: "Example: 'Heroism and the cost of glory.'", solution: "Any valid theme." }
          ]
        },
        {
          title: "Renaissance Drama & Poetry",
          lesson: "English Renaissance (1500-1660) produced **Shakespeare, Marlowe, Spenser, Donne**. Sonnets flourished. Plays explored power, ambition, love, and fate. English itself was being shaped by these writers.",
          questions: [
            { type: "regular", q: "Who wrote The Faerie Queene?", answer: "Edmund Spenser.", solution: "Renaissance epic." },
            { type: "regular", q: "Who was John Donne?", answer: "A metaphysical poet known for wit and conceits.", solution: "Renaissance poet." },
            { type: "regular", q: "What's a conceit?", answer: "An extended, elaborate metaphor.", solution: "Metaphysical device." },
            { type: "regular", q: "When was Shakespeare's career?", answer: "Late 1500s to early 1600s.", solution: "Renaissance peak." },
            { type: "word", q: "Name one theme common in Renaissance drama.", answer: "Example: 'Ambition's cost, order vs. chaos.'", solution: "Any valid." }
          ]
        },
        {
          title: "Early Modern English Language",
          lesson: "Shakespeare's English feels unfamiliar because of **thee/thou/ye** pronouns, inverted syntax, and obsolete words. Reading aloud and using footnotes helps you access meaning.",
          questions: [
            { type: "regular", q: "What does 'hath' mean?", answer: "Has.", solution: "Archaic form." },
            { type: "regular", q: "Difference between 'thou' and 'you' in Shakespeare's time?", answer: "Thou = informal/singular; you = formal/plural.", solution: "Social register." },
            { type: "regular", q: "What does 'anon' mean?", answer: "Soon / at once.", solution: "Archaic." },
            { type: "regular", q: "Why read Shakespeare aloud?", answer: "To hear the rhythm and follow the meaning.", solution: "Oral comprehension." },
            { type: "word", q: "Translate: 'Get thee to a nunnery.'", answer: "Go to a nunnery.", solution: "Thee = you (object); to a nunnery = a convent." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — British Literature: Origins",
        questions: [
          { type: "regular", q: "Language of Beowulf?", answer: "Old English.", solution: "Anglo-Saxon era." },
          { type: "regular", q: "Author of Canterbury Tales?", answer: "Chaucer.", solution: "Middle English." },
          { type: "regular", q: "What's a conceit?", answer: "An extended, elaborate metaphor.", solution: "Metaphysical device." },
          { type: "regular", q: "'Thou' meaning?", answer: "You (informal singular).", solution: "Archaic pronoun." },
          { type: "word", q: "Name a Renaissance dramatist besides Shakespeare.", answer: "Example: 'Christopher Marlowe, Ben Jonson.'", solution: "Any valid." },
          { type: "word", q: "Why is Beowulf considered an epic?", answer: "Heroic protagonist, supernatural foes, elevated style, and national significance.", solution: "Epic conventions." }
        ]
      }
    },
    {
      id: "e12-2", num: 2, title: "Romantic & Victorian Era", subtitle: "Revolution, emotion, industrial age",
      emoji: "🌹", accent: "#be123c", accent2: "#e884a0",
      sections: [
        {
          title: "British Romantic Poetry",
          lesson: "Early 1800s: **Wordsworth, Coleridge, Byron, Shelley, Keats**. Celebrated emotion, nature, imagination, the individual. Reacted against industrialism and Enlightenment rationalism.",
          questions: [
            { type: "regular", q: "Who wrote 'Tintern Abbey'?", answer: "William Wordsworth.", solution: "Romantic poet." },
            { type: "regular", q: "Who wrote 'Ode on a Grecian Urn'?", answer: "John Keats.", solution: "Beauty and truth." },
            { type: "regular", q: "Central themes of Romanticism?", answer: "Nature, emotion, imagination, individualism.", solution: "Core values." },
            { type: "regular", q: "Who wrote 'Ozymandias'?", answer: "Percy Shelley.", solution: "Famous sonnet." },
            { type: "word", q: "What is 'Ode on a Grecian Urn' about?", answer: "The relationship between beauty, art, and time.", solution: "Key theme." }
          ]
        },
        {
          title: "Victorian Novel",
          lesson: "Mid-to-late 1800s: **Dickens, Brontës, George Eliot, Hardy**. Industrial revolution, social class, moral reform. Large, realistic novels exploring how individuals navigate society.",
          questions: [
            { type: "regular", q: "Who wrote 'Jane Eyre'?", answer: "Charlotte Brontë.", solution: "Victorian novel." },
            { type: "regular", q: "Who wrote 'Great Expectations'?", answer: "Charles Dickens.", solution: "Victorian classic." },
            { type: "regular", q: "What's the 'Bildungsroman'?", answer: "A coming-of-age novel.", solution: "German term, common in Victorian era." },
            { type: "regular", q: "What social issues did Victorian novels explore?", answer: "Class, poverty, industrialization, marriage, morality.", solution: "Social critique." },
            { type: "word", q: "Name a theme in Jane Eyre.", answer: "Example: 'A woman's struggle for independence and selfhood.'", solution: "Valid theme." }
          ]
        },
        {
          title: "Gothic Tradition",
          lesson: "British Gothic (Shelley, Stoker, Stevenson) mixed horror, the supernatural, and psychological depth. **Frankenstein, Dracula, Dr. Jekyll and Mr. Hyde** remain influential.",
          questions: [
            { type: "regular", q: "Who wrote Frankenstein?", answer: "Mary Shelley.", solution: "Published 1818." },
            { type: "regular", q: "Who wrote Dracula?", answer: "Bram Stoker.", solution: "1897 Gothic novel." },
            { type: "regular", q: "Theme often in Gothic fiction?", answer: "The monstrous within humanity, fear of the unknown, doubles.", solution: "Psychological horror." },
            { type: "regular", q: "Who wrote Dr. Jekyll and Mr. Hyde?", answer: "Robert Louis Stevenson.", solution: "Double identity." },
            { type: "word", q: "Why does the Gothic endure?", answer: "It taps universal fears: death, the unknown, our shadow selves.", solution: "Psychological resonance." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Romantic & Victorian Era",
        questions: [
          { type: "regular", q: "Central Romantic themes?", answer: "Nature, emotion, imagination, individualism.", solution: "Four pillars." },
          { type: "regular", q: "Who wrote Frankenstein?", answer: "Mary Shelley.", solution: "Gothic classic." },
          { type: "regular", q: "Bildungsroman is?", answer: "A coming-of-age novel.", solution: "Common in Victorian era." },
          { type: "regular", q: "Percy Shelley wrote?", answer: "Example: Ozymandias.", solution: "Romantic." },
          { type: "word", q: "How did Romantics react to the Enlightenment?", answer: "By elevating emotion and imagination over pure reason.", solution: "Pushback." },
          { type: "word", q: "Name one Victorian social concern.", answer: "Example: 'Child labor, class inequality, industrial pollution.'", solution: "Any valid." }
        ]
      }
    },
    {
      id: "e12-3", num: 3, title: "Critical Theory & Lenses", subtitle: "Multiple ways to read",
      emoji: "🔬", accent: "#0f766e", accent2: "#7cc0b8",
      sections: [
        {
          title: "Formalist & New Criticism",
          lesson: "Focuses on the text itself: **diction, structure, imagery, irony**. Ignores biography or history. 'Close reading' comes from this tradition. Strength: deep textual attention. Weakness: ignores context.",
          questions: [
            { type: "regular", q: "What does Formalist criticism focus on?", answer: "The text itself — language, structure, devices.", solution: "Text-only focus." },
            { type: "regular", q: "What's 'close reading'?", answer: "Careful, detailed analysis of the text.", solution: "Formalist method." },
            { type: "regular", q: "What does Formalism ignore?", answer: "Author's biography, historical context.", solution: "Critical limitation." },
            { type: "regular", q: "Strength of Formalism?", answer: "Deep textual attention.", solution: "Careful reading." },
            { type: "word", q: "Name one element Formalists study.", answer: "Example: 'Imagery, metaphor, structure.'", solution: "Textual element." }
          ]
        },
        {
          title: "Feminist & Postcolonial",
          lesson: "**Feminist criticism** examines gender, power, and representation of women. **Postcolonial** examines how texts reflect colonial power, identity, and the voices of formerly colonized peoples.",
          questions: [
            { type: "regular", q: "What does feminist criticism examine?", answer: "Gender, power dynamics, women's representation.", solution: "Gender lens." },
            { type: "regular", q: "What does postcolonial criticism examine?", answer: "Colonial power, identity, voices of colonized peoples.", solution: "Colonial legacy." },
            { type: "regular", q: "Example of a postcolonial text?", answer: "Things Fall Apart (Achebe), Heart of Darkness (critical analysis).", solution: "Classic texts." },
            { type: "regular", q: "What's the 'male gaze'?", answer: "Looking at the world/women from a male perspective that shapes representation.", solution: "Feminist concept." },
            { type: "word", q: "Why are critical lenses useful?", answer: "They reveal different meanings and give us multiple ways to interpret a text.", solution: "Interpretive richness." }
          ]
        },
        {
          title: "Psychological & Historical",
          lesson: "**Psychological** (Freudian) criticism looks at unconscious motives, dreams, repressed desires. **Historical** criticism contextualizes texts in their time — politics, culture, class.",
          questions: [
            { type: "regular", q: "What does psychological criticism focus on?", answer: "Unconscious motives, desires, dreams in texts.", solution: "Freudian lens." },
            { type: "regular", q: "What does historical criticism add?", answer: "Context of the time — politics, culture, social conditions.", solution: "Context lens." },
            { type: "regular", q: "What's the 'Oedipus complex'?", answer: "Freudian idea of a child's unconscious feelings toward parents.", solution: "Psychoanalytic." },
            { type: "regular", q: "Why combine lenses?", answer: "A single lens misses much; combining gives richer analysis.", solution: "Integration." },
            { type: "word", q: "Apply historical lens to Animal Farm.", answer: "It allegorizes the Russian Revolution and Stalin's rise.", solution: "Historical context." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Critical Theory & Lenses",
        questions: [
          { type: "regular", q: "Formalist criticism focuses on?", answer: "The text itself — language and structure.", solution: "Text only." },
          { type: "regular", q: "Feminist criticism examines?", answer: "Gender, power, women's representation.", solution: "Gender lens." },
          { type: "regular", q: "Psychological criticism uses ideas from?", answer: "Freud / psychoanalysis.", solution: "Unconscious focus." },
          { type: "regular", q: "Postcolonial examines?", answer: "Colonial power and colonized voices.", solution: "Colonial legacy." },
          { type: "word", q: "Why use multiple lenses?", answer: "To uncover different layers of meaning.", solution: "Depth." },
          { type: "word", q: "Apply a feminist lens to Jane Eyre in one sentence.", answer: "Example: 'Jane resists patriarchal control to assert her autonomy and voice.'", solution: "Feminist reading." }
        ]
      }
    },
    {
      id: "e12-4", num: 4, title: "College-Level Writing", subtitle: "Voice, evidence, sophistication",
      emoji: "🎓", accent: "#a16207", accent2: "#d8b17a",
      sections: [
        {
          title: "The Intellectual Thesis",
          lesson: "A college thesis has **tension** (presents a problem or surprise), **specificity** (narrow focus), and **stakes** (why it matters). It does more than state — it intervenes in a conversation.",
          questions: [
            { type: "regular", q: "What gives a thesis 'tension'?", answer: "A problem, paradox, or surprising claim.", solution: "Not obvious." },
            { type: "regular", q: "What are 'stakes' in an essay?", answer: "Why the argument matters — consequences or implications.", solution: "Why care?" },
            { type: "regular", q: "Weak thesis: 'Hamlet is a complex character.' — why weak?", answer: "Too vague and uncontested.", solution: "No tension." },
            { type: "regular", q: "What does 'intervene in a conversation' mean?", answer: "Contribute something new to ongoing scholarly discussion.", solution: "Academic engagement." },
            { type: "word", q: "Rewrite a weak thesis: 'Technology affects society.'", answer: "Example: 'Smartphone design exploits reward circuits in ways that measurably weaken sustained attention.'", solution: "Specific, arguable, with stakes." }
          ]
        },
        {
          title: "Evidence and Analysis",
          lesson: "College writing weighs evidence carefully. **Don't cherry-pick.** Acknowledge counterexamples. **Analysis > assertion:** explain how your evidence supports your claim, not just present it.",
          questions: [
            { type: "regular", q: "What's cherry-picking?", answer: "Selecting only evidence that supports your claim.", solution: "Biased." },
            { type: "regular", q: "Analysis involves what?", answer: "Explaining how evidence supports the claim.", solution: "Show your reasoning." },
            { type: "regular", q: "Should you discuss counterevidence?", answer: "Yes — honesty strengthens the argument.", solution: "Intellectual integrity." },
            { type: "regular", q: "What's 'warrant' in argument?", answer: "The assumption linking evidence to claim.", solution: "Toulmin model." },
            { type: "word", q: "Why is analysis harder than finding evidence?", answer: "It requires thinking through how and why evidence supports the claim.", solution: "Mental labor." }
          ]
        },
        {
          title: "Voice and Style",
          lesson: "College voice is **confident but not arrogant**. Avoid clichés, vague phrases ('in today's society'), and hedging ('I think maybe'). Be precise. Read your sentences aloud.",
          questions: [
            { type: "regular", q: "What's wrong with 'in today's society'?", answer: "It's a vague cliché.", solution: "Generic opener." },
            { type: "regular", q: "Example of hedging?", answer: "Example: 'I think maybe it might be...'", solution: "Wishy-washy." },
            { type: "regular", q: "How does reading aloud help?", answer: "It reveals awkward rhythm and unclear phrasing.", solution: "Ear test." },
            { type: "regular", q: "Why avoid clichés?", answer: "They lose their force and signal lazy thinking.", solution: "Weak writing." },
            { type: "word", q: "Replace 'in today's society' with something specific.", answer: "Example: 'Since the 2008 financial crisis...'", solution: "Specific context." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — College-Level Writing",
        questions: [
          { type: "regular", q: "What gives a thesis tension?", answer: "A problem, paradox, or surprising claim.", solution: "Not obvious." },
          { type: "regular", q: "What's cherry-picking?", answer: "Choosing only supporting evidence.", solution: "Biased." },
          { type: "regular", q: "Why avoid hedging?", answer: "It weakens the claim and sounds uncertain.", solution: "Confidence matters." },
          { type: "regular", q: "Analysis = ___ evidence to claim.", answer: "Connecting / linking.", solution: "Show reasoning." },
          { type: "word", q: "Strengthen: 'I think smartphones are bad.'", answer: "Example: 'Smartphone notifications fragment attention by exploiting dopamine reward loops.'", solution: "Specific, confident." },
          { type: "word", q: "Why does reading aloud help writing?", answer: "Reveals awkward rhythm and errors.", solution: "Audio check." }
        ]
      }
    },
    {
      id: "e12-5", num: 5, title: "Capstone: Research & Synthesis", subtitle: "The senior project",
      emoji: "🏁", accent: "#6366f1", accent2: "#a5abf2",
      sections: [
        {
          title: "Scoping a Senior Research Project",
          lesson: "A senior project needs a **question worth months**, **accessible sources**, and a **realistic scope**. Narrow early and often. 'Climate change' is too broad; 'the rhetoric of climate denial in U.S. op-eds 2010–2020' is workable.",
          questions: [
            { type: "regular", q: "Three criteria for a strong senior project?", answer: "Interesting question, accessible sources, realistic scope.", solution: "All three." },
            { type: "regular", q: "Common mistake?", answer: "Picking too broad a topic.", solution: "Narrow early." },
            { type: "regular", q: "Why do source accessibility early?", answer: "So you don't pick a topic you can't actually research.", solution: "Feasibility check." },
            { type: "regular", q: "What's an annotated bibliography?", answer: "A list of sources with brief notes on each.", solution: "Research tool." },
            { type: "word", q: "Narrow 'social media' into a project question.", answer: "Example: 'How does Instagram algorithmic filtering shape political polarization among 18-22 year olds?'", solution: "Specific and investigable." }
          ]
        },
        {
          title: "Drafting a Long Paper",
          lesson: "Long papers benefit from **outlining**, writing in **sections** (not linearly), and revising in **passes**. Start anywhere; momentum matters more than perfection on the first draft.",
          questions: [
            { type: "regular", q: "Why write in sections?", answer: "Easier to focus and less overwhelming.", solution: "Manageable chunks." },
            { type: "regular", q: "Should you write linearly?", answer: "Not necessarily — write the easiest section first.", solution: "Momentum." },
            { type: "regular", q: "What's an outline for?", answer: "To plan structure before drafting.", solution: "Skeleton." },
            { type: "regular", q: "Why revise in passes?", answer: "One pass can't catch everything — big-picture vs. sentence-level.", solution: "Layered approach." },
            { type: "word", q: "Why do writers get stuck?", answer: "Often perfectionism on the first draft — which should be messy.", solution: "First drafts are rough." }
          ]
        },
        {
          title: "Final Revision & Presentation",
          lesson: "Final revision focuses on: **coherence** (does it hang together?), **transitions**, **citation accuracy**, and **formatting**. Presentations require a clear thesis, strong opening, evidence, and confident delivery.",
          questions: [
            { type: "regular", q: "What does coherence mean?", answer: "The paper flows logically from point to point.", solution: "Connected ideas." },
            { type: "regular", q: "Why check citations last?", answer: "So they match your final draft.", solution: "Match evidence to paper." },
            { type: "regular", q: "Key to a strong oral presentation?", answer: "Clear thesis, structured evidence, confident delivery.", solution: "Essentials." },
            { type: "regular", q: "What should a presentation's opening do?", answer: "Hook the audience and state the thesis.", solution: "Engage fast." },
            { type: "word", q: "Name two things that strengthen a presentation.", answer: "Example: 'Eye contact, pacing, vocal variety, clear structure.'", solution: "Delivery tips." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Capstone",
        questions: [
          { type: "regular", q: "Three criteria for a strong senior project?", answer: "Interesting question, accessible sources, realistic scope.", solution: "Standard list." },
          { type: "regular", q: "Why outline long papers?", answer: "To plan structure and avoid getting lost.", solution: "Skeleton helps." },
          { type: "regular", q: "What's coherence?", answer: "Logical flow across a paper.", solution: "Ideas connect." },
          { type: "regular", q: "First draft quality vs. speed?", answer: "Prioritize speed/momentum over perfection.", solution: "Revise later." },
          { type: "word", q: "Narrow: 'education in America.'", answer: "Example: 'How has the No Child Left Behind Act affected middle-school literacy outcomes in rural Oklahoma?'", solution: "Specific, investigable." },
          { type: "word", q: "Name one way to strengthen oral presentations.", answer: "Example: 'Practice aloud, time yourself, use pauses for emphasis.'", solution: "Presentation craft." }
        ]
      }
    }
  ]
};
