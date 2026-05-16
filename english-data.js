// English courses — Grade 6, 7, 8 ELA.
const ENGLISH_G6_COURSE = {
  id: "eng6", subject: "english",
  title: "6th Grade English",
  subtitle: "Grammar, writing, and reading foundations",
  emoji: "📚", accent: "#d97706", accent2: "#f2b976",
  description: "Five units covering sentence structure, punctuation, writing forms, poetry, and vocabulary.",
  books: [
    {
      id: "e6-1", num: 1, title: "Parts of Speech & Sentences", subtitle: "Building blocks of writing",
      emoji: "🧱", accent: "#d97706", accent2: "#f2b976",
      sections: [
        {
          title: "Nouns, Verbs, and Adjectives",
          lesson: "A **noun** names a person, place, thing, or idea (e.g., *teacher, park, hope*). A **verb** shows action or state of being (*run, is*). An **adjective** describes a noun (*blue, happy, tall*). Together they form the core of every sentence.",
          questions: [
            { type: "regular", q: "Is 'happiness' a noun, verb, or adjective?", answer: "Noun.", solution: "It names an idea." },
            { type: "regular", q: "Identify the verb: *The dog barks loudly.*", answer: "barks.", solution: "Shows the action." },
            { type: "regular", q: "Pick the adjective: *The old book fell.*", answer: "old.", solution: "Describes 'book'." },
            { type: "regular", q: "Is 'quickly' an adjective or adverb?", answer: "Adverb.", solution: "It describes the verb 'ran' → tells how." },
            { type: "word", q: "Write a sentence using at least one noun, one verb, and one adjective.", answer: "Example: 'The tall tree swayed.' ('tree' noun, 'swayed' verb, 'tall' adjective).", solution: "Any valid sentence with all three works." }
          ]
        },
        {
          title: "Subjects and Predicates",
          lesson: "Every complete sentence has two parts: the **subject** (who or what the sentence is about) and the **predicate** (what the subject does or is). Example: *The cat | slept on the couch.*",
          questions: [
            { type: "regular", q: "Identify the subject: *The curious cat climbed the tree.*", answer: "The curious cat.", solution: "Who the sentence is about." },
            { type: "regular", q: "Identify the predicate: *Maya sings beautifully.*", answer: "sings beautifully.", solution: "What Maya does." },
            { type: "regular", q: "Is this a complete sentence? *Running through the field.*", answer: "No — it's a fragment.", solution: "Missing a subject." },
            { type: "regular", q: "Turn this fragment into a sentence: *Under the bed.*", answer: "Example: 'The cat hid under the bed.'", solution: "Add a subject and predicate." },
            { type: "word", q: "Write a sentence and underline the subject and predicate in your head.", answer: "Example: 'The children | played outside.'", solution: "Split where subject ends, predicate begins." }
          ]
        },
        {
          title: "Sentence Types",
          lesson: "Four sentence types: **declarative** (states — ends with .), **interrogative** (asks — ?), **imperative** (commands), **exclamatory** (strong feeling — !).",
          questions: [
            { type: "regular", q: "What kind of sentence: *Close the door.*", answer: "Imperative.", solution: "It gives a command." },
            { type: "regular", q: "What kind: *Are you coming?*", answer: "Interrogative.", solution: "It asks a question." },
            { type: "regular", q: "What kind: *Wow, that's amazing!*", answer: "Exclamatory.", solution: "Expresses strong feeling." },
            { type: "regular", q: "What kind: *The sun is shining today.*", answer: "Declarative.", solution: "Makes a statement." },
            { type: "word", q: "Write one interrogative sentence.", answer: "Example: 'What time is it?'", solution: "Any question works." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Parts of Speech & Sentences",
        questions: [
          { type: "regular", q: "Part of speech of 'beautiful'?", answer: "Adjective.", solution: "Describes a noun." },
          { type: "regular", q: "Find the verb: *She wrote a poem.*", answer: "wrote.", solution: "Action verb." },
          { type: "regular", q: "Sentence type: *Don't forget your lunch.*", answer: "Imperative.", solution: "Gives a command." },
          { type: "regular", q: "Subject of: *The stars twinkled above.*", answer: "The stars.", solution: "What the sentence is about." },
          { type: "word", q: "Rewrite as interrogative: *The train leaves at 3.*", answer: "Does the train leave at 3?", solution: "Rephrase as a question." },
          { type: "word", q: "Identify all parts of speech in 'The red balloon floated quickly.'", answer: "'The' article, 'red' adjective, 'balloon' noun, 'floated' verb, 'quickly' adverb.", solution: "Label each word." }
        ]
      }
    },
    {
      id: "e6-2", num: 2, title: "Punctuation & Capitalization", subtitle: "Making writing clear",
      emoji: "✒️", accent: "#a16207", accent2: "#d8b17a",
      sections: [
        {
          title: "End Punctuation and Commas",
          lesson: "**Periods** end statements. **Question marks** end questions. **Exclamation points** show excitement. **Commas** separate items in a list, set off introductory phrases, and separate independent clauses joined by conjunctions like *and* or *but*.",
          questions: [
            { type: "regular", q: "Fix: *I bought apples oranges and pears.*", answer: "I bought apples, oranges, and pears.", solution: "Commas separate list items." },
            { type: "regular", q: "Fix: *Before dinner we played outside.*", answer: "Before dinner, we played outside.", solution: "Comma after intro phrase." },
            { type: "regular", q: "What goes at the end of *What time is it*?", answer: "A question mark.", solution: "It's a question." },
            { type: "regular", q: "Fix: *I was tired but I kept going.*", answer: "I was tired, but I kept going.", solution: "Comma before 'but' joins two clauses." },
            { type: "word", q: "Punctuate: *After school Maya Ian and Sam went to the park*", answer: "After school, Maya, Ian, and Sam went to the park.", solution: "Intro comma and list commas." }
          ]
        },
        {
          title: "Capitalization Rules",
          lesson: "Capitalize **proper nouns** (names, places, days, months), the word **I**, the first word of a sentence, and the important words in titles.",
          questions: [
            { type: "regular", q: "Fix: *i went to paris in june.*", answer: "I went to Paris in June.", solution: "I is always capitalized; Paris is a city; June is a month." },
            { type: "regular", q: "Should 'Monday' be capitalized?", answer: "Yes.", solution: "Day names are proper nouns." },
            { type: "regular", q: "Should 'spring' be capitalized?", answer: "No.", solution: "Seasons are common nouns." },
            { type: "regular", q: "Fix: *my favorite book is 'the giver'.*", answer: "My favorite book is 'The Giver'.", solution: "Capitalize the start of a sentence and important words in titles." },
            { type: "word", q: "Capitalize correctly: *dr. smith teaches at lincoln middle school.*", answer: "Dr. Smith teaches at Lincoln Middle School.", solution: "Titles and names of schools are proper nouns." }
          ]
        },
        {
          title: "Quotations",
          lesson: "Use **quotation marks** around someone's exact words. Example: *Maya said, \"Let's go!\"* Note how commas and periods go inside the quotation marks.",
          questions: [
            { type: "regular", q: "Punctuate: *Sam said hello.*", answer: "Sam said, \"Hello.\"", solution: "Use quotes around spoken words." },
            { type: "regular", q: "Which is an indirect quotation? (A) *He said, \"I'm going.\"* (B) *He said that he was going.*", answer: "B.", solution: "Indirect quotations don't use quote marks." },
            { type: "regular", q: "Fix: *she shouted watch out!*", answer: "She shouted, \"Watch out!\"", solution: "Capitalize and quote the exact words." },
            { type: "regular", q: "Where does the period go: *Lisa said, \"I'm coming\"*?", answer: "Inside the quotes: *Lisa said, \"I'm coming.\"*", solution: "Periods go inside quote marks." },
            { type: "word", q: "Write one direct quotation about a character.", answer: "Example: Maya whispered, \"I found something.\"", solution: "Any quotation with quote marks works." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Punctuation & Capitalization",
        questions: [
          { type: "regular", q: "Fix: *on monday we ate pizza pasta and salad.*", answer: "On Monday, we ate pizza, pasta, and salad.", solution: "Capitalize Monday; add commas." },
          { type: "regular", q: "Should 'friday' be capitalized?", answer: "Yes.", solution: "Proper noun." },
          { type: "regular", q: "Fix: *tom said i love math.*", answer: "Tom said, \"I love math.\"", solution: "Quotation and capitals." },
          { type: "regular", q: "Fix: *before lunch i read.*", answer: "Before lunch, I read.", solution: "Intro comma, capitalize I." },
          { type: "word", q: "Fix all errors: *after school john went to the mall he bought shoes pants and a shirt.*", answer: "After school, John went to the mall. He bought shoes, pants, and a shirt.", solution: "Capitalize, add commas, split into two sentences." },
          { type: "word", q: "Punctuate: *my favorite movie is the lion king*", answer: "My favorite movie is The Lion King.", solution: "Capitalize title and start of sentence." }
        ]
      }
    },
    {
      id: "e6-3", num: 3, title: "Writing: Paragraphs & Essays", subtitle: "From sentence to structured writing",
      emoji: "📝", accent: "#4d7c0f", accent2: "#a1c872",
      sections: [
        {
          title: "Building a Paragraph",
          lesson: "A strong paragraph starts with a **topic sentence** stating the main idea, followed by **supporting details** (examples, facts, reasons), and ends with a **concluding sentence**.",
          questions: [
            { type: "regular", q: "What is a topic sentence?", answer: "A sentence that states the paragraph's main idea.", solution: "Usually the first sentence." },
            { type: "regular", q: "Name two types of supporting detail.", answer: "Examples and facts (or reasons, descriptions).", solution: "Anything that supports the topic sentence." },
            { type: "regular", q: "Should every paragraph have a concluding sentence?", answer: "Usually yes — it wraps up the idea.", solution: "Gives the paragraph closure." },
            { type: "regular", q: "What's the purpose of a supporting detail?", answer: "To explain or back up the topic sentence.", solution: "Details give evidence." },
            { type: "word", q: "Write a topic sentence about your favorite hobby.", answer: "Example: 'Reading mystery novels is my favorite way to relax.'", solution: "A clear statement of the main idea." }
          ]
        },
        {
          title: "Expository & Persuasive Essays",
          lesson: "An **expository essay** informs or explains (e.g., how photosynthesis works). A **persuasive essay** tries to convince the reader of an opinion (e.g., schools should start later). Both have an intro, body paragraphs, and a conclusion.",
          questions: [
            { type: "regular", q: "What's the purpose of an expository essay?", answer: "To explain or inform.", solution: "It teaches something." },
            { type: "regular", q: "What's the purpose of a persuasive essay?", answer: "To convince the reader of an opinion.", solution: "Argues a point." },
            { type: "regular", q: "What goes in an essay intro?", answer: "A hook, background, and thesis statement.", solution: "Standard introduction structure." },
            { type: "regular", q: "What is a thesis statement?", answer: "One sentence stating the main argument or focus of the essay.", solution: "Usually at the end of the intro." },
            { type: "word", q: "Write a thesis statement for an essay on why recycling matters.", answer: "Example: 'Recycling matters because it conserves resources, reduces pollution, and saves energy.'", solution: "Answer the topic with three reasons." }
          ]
        },
        {
          title: "The Writing Process",
          lesson: "The writing process: **prewriting** (brainstorm, outline), **drafting** (write your first version), **revising** (improve content), **editing** (fix grammar/spelling), and **publishing** (share).",
          questions: [
            { type: "regular", q: "First step of the writing process?", answer: "Prewriting (brainstorming).", solution: "Planning before writing." },
            { type: "regular", q: "What's the difference between revising and editing?", answer: "Revising = big changes to content; editing = fixing grammar/spelling.", solution: "Revision is content; editing is surface." },
            { type: "regular", q: "What's a rough draft?", answer: "The first version of your writing, not yet polished.", solution: "Focus is getting ideas down." },
            { type: "regular", q: "True/False: editing comes before drafting.", answer: "False.", solution: "Drafting comes first." },
            { type: "word", q: "List two prewriting techniques.", answer: "Brainstorming and outlining (or mind-mapping, freewriting).", solution: "Any valid planning activity." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Writing",
        questions: [
          { type: "regular", q: "What sentence typically starts a paragraph?", answer: "The topic sentence.", solution: "States the main idea." },
          { type: "regular", q: "Purpose of a persuasive essay?", answer: "To convince the reader.", solution: "Argumentative." },
          { type: "regular", q: "Which process step comes right after prewriting?", answer: "Drafting.", solution: "Standard process order." },
          { type: "regular", q: "Where is the thesis usually placed?", answer: "At the end of the introduction.", solution: "Signals the main argument." },
          { type: "word", q: "Write a topic sentence about the benefits of exercise.", answer: "Example: 'Regular exercise improves both physical health and mental well-being.'", solution: "Clear statement with main idea." },
          { type: "word", q: "Name the five stages of the writing process in order.", answer: "Prewriting, drafting, revising, editing, publishing.", solution: "Standard process." }
        ]
      }
    },
    {
      id: "e6-4", num: 4, title: "Poetry & Literary Devices", subtitle: "Rhythm, sound, imagery",
      emoji: "🎭", accent: "#7c3aed", accent2: "#b295ec",
      sections: [
        {
          title: "Figurative Language",
          lesson: "**Similes** compare with *like* or *as* (*brave as a lion*). **Metaphors** compare directly (*time is a thief*). **Personification** gives human qualities to non-human things (*the wind whispered*). **Hyperbole** is exaggeration (*I could eat a horse*).",
          questions: [
            { type: "regular", q: "Is 'She was as brave as a lion' a simile or metaphor?", answer: "Simile.", solution: "Uses 'as'." },
            { type: "regular", q: "Is 'He is a night owl' a simile or metaphor?", answer: "Metaphor.", solution: "Direct comparison without 'like' or 'as'." },
            { type: "regular", q: "What device: *The trees danced in the wind.*", answer: "Personification.", solution: "Trees can't dance — human quality given to them." },
            { type: "regular", q: "What device: *I've told you a million times!*", answer: "Hyperbole.", solution: "Exaggeration." },
            { type: "word", q: "Write a simile about sleep.", answer: "Example: 'Sleep came over me like a warm blanket.'", solution: "Use 'like' or 'as'." }
          ]
        },
        {
          title: "Rhyme, Rhythm, and Sound",
          lesson: "Poetry uses **rhyme** (matching end sounds), **rhythm** (pattern of stressed syllables), **alliteration** (repeating starting sounds), and **onomatopoeia** (words that sound like their meaning: *buzz, hiss*).",
          questions: [
            { type: "regular", q: "What's alliteration?", answer: "Repetition of the same starting sound in nearby words.", solution: "Example: 'silly snakes slither'." },
            { type: "regular", q: "Which is onomatopoeia: 'buzz' or 'silence'?", answer: "'Buzz'.", solution: "Sounds like what it means." },
            { type: "regular", q: "Do 'sky' and 'high' rhyme?", answer: "Yes.", solution: "Same ending sound." },
            { type: "regular", q: "What is rhythm in poetry?", answer: "The pattern of stressed and unstressed syllables.", solution: "Creates the beat." },
            { type: "word", q: "Write a short alliterative phrase.", answer: "Example: 'Peter picked peppers.'", solution: "Repeat the same starting sound." }
          ]
        },
        {
          title: "Forms of Poetry",
          lesson: "Common forms: **haiku** (3 lines, 5-7-5 syllables), **limerick** (5 lines, AABBA rhyme, humorous), **sonnet** (14 lines), and **free verse** (no strict rules).",
          questions: [
            { type: "regular", q: "Syllable count of a haiku?", answer: "5-7-5.", solution: "Three-line Japanese form." },
            { type: "regular", q: "How many lines in a sonnet?", answer: "14.", solution: "Standard sonnet length." },
            { type: "regular", q: "What is free verse?", answer: "Poetry without a strict rhyme or meter.", solution: "No set form." },
            { type: "regular", q: "Are limericks usually serious or humorous?", answer: "Humorous.", solution: "Playful tradition." },
            { type: "word", q: "Write a line that could start a haiku (5 syllables).", answer: "Example: 'The rain falls softly' (5 syllables).", solution: "Count syllables." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Poetry & Literary Devices",
        questions: [
          { type: "regular", q: "What device: *Life is a journey.*", answer: "Metaphor.", solution: "Direct comparison." },
          { type: "regular", q: "Simile or metaphor: *Fast as lightning.*", answer: "Simile.", solution: "'As'." },
          { type: "regular", q: "A haiku's structure?", answer: "5-7-5 syllables across 3 lines.", solution: "Japanese form." },
          { type: "regular", q: "Which is personification: 'The book was thick' or 'The book whispered secrets'?", answer: "'The book whispered secrets'.", solution: "Books can't whisper — human quality." },
          { type: "word", q: "Identify the device: *I'm so hungry I could eat a horse.*", answer: "Hyperbole.", solution: "Exaggeration." },
          { type: "word", q: "Write a line with alliteration.", answer: "Example: 'Silly Sally sat and sang.'", solution: "Repeat starting sounds." }
        ]
      }
    },
    {
      id: "e6-5", num: 5, title: "Vocabulary & Word Roots", subtitle: "Prefixes, suffixes, roots",
      emoji: "🔤", accent: "#0369a1", accent2: "#75b7d7",
      sections: [
        {
          title: "Prefixes",
          lesson: "A **prefix** is added to the beginning of a word to change its meaning. Examples: *un-* (not: unhappy), *re-* (again: rewrite), *pre-* (before: preview), *dis-* (opposite: dislike).",
          questions: [
            { type: "regular", q: "What does the prefix 'un-' mean?", answer: "Not.", solution: "Negation prefix." },
            { type: "regular", q: "What does 'rebuild' mean?", answer: "To build again.", solution: "Re- means 'again'." },
            { type: "regular", q: "Prefix of 'preview'?", answer: "pre-.", solution: "Means 'before'." },
            { type: "regular", q: "What does 'dislike' mean?", answer: "To not like / the opposite of like.", solution: "Dis- is a negation." },
            { type: "word", q: "Use a word starting with 'mis-' (meaning 'wrongly') in a sentence.", answer: "Example: 'She misunderstood the question.'", solution: "Any valid use." }
          ]
        },
        {
          title: "Suffixes",
          lesson: "A **suffix** is added to the end of a word. *-ful* (full of: joyful), *-less* (without: hopeless), *-able* (able to: readable), *-ly* (adverb maker: quickly), *-tion* (noun maker: creation).",
          questions: [
            { type: "regular", q: "What does the suffix '-less' mean?", answer: "Without.", solution: "Like 'hopeless' = without hope." },
            { type: "regular", q: "Meaning of 'cheerful'?", answer: "Full of cheer.", solution: "-ful = full of." },
            { type: "regular", q: "Does '-ly' usually make a word into an adjective or adverb?", answer: "Adverb.", solution: "Examples: quickly, happily." },
            { type: "regular", q: "What part of speech does '-tion' make?", answer: "Noun.", solution: "Like 'action', 'creation'." },
            { type: "word", q: "Add '-able' to 'read' and use in a sentence.", answer: "Example: 'The book is readable.'", solution: "-able means able to be." }
          ]
        },
        {
          title: "Base Words & Roots",
          lesson: "A **base word** is the main part to which prefixes or suffixes attach. Many English words come from Latin or Greek **roots**: *bio* (life), *geo* (earth), *graph* (write), *aud* (hear).",
          questions: [
            { type: "regular", q: "Base word of 'unhelpful'?", answer: "help.", solution: "Remove prefix and suffix." },
            { type: "regular", q: "What does the root 'bio' mean?", answer: "Life.", solution: "As in 'biology'." },
            { type: "regular", q: "What does 'geo' mean?", answer: "Earth.", solution: "As in 'geography'." },
            { type: "regular", q: "What does 'graph' mean (as a root)?", answer: "Write / draw.", solution: "As in 'autograph', 'biography'." },
            { type: "word", q: "What might 'audible' mean, based on its root?", answer: "Able to be heard.", solution: "'Aud' = hear." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Vocabulary & Word Roots",
        questions: [
          { type: "regular", q: "Meaning of 'misread'?", answer: "To read wrongly.", solution: "Mis- = wrongly." },
          { type: "regular", q: "What does 'hopeless' mean?", answer: "Without hope.", solution: "-less = without." },
          { type: "regular", q: "Root of 'biology'?", answer: "bio.", solution: "Means 'life'." },
          { type: "regular", q: "What does '-ful' mean?", answer: "Full of.", solution: "Example: joyful." },
          { type: "word", q: "Define 'autograph' using its roots.", answer: "A self-written signature ('auto' = self, 'graph' = write).", solution: "Combine root meanings." },
          { type: "word", q: "Use 'pre-' and 'view' to form a word, and define it.", answer: "Preview — to view beforehand.", solution: "Pre- = before." }
        ]
      }
    }
  ]
};

const ENGLISH_G7_COURSE = {
  id: "eng7", subject: "english",
  title: "7th Grade English",
  subtitle: "Clauses, literary analysis, and crafted writing",
  emoji: "📖", accent: "#059669", accent2: "#7ed0b2",
  description: "Five units on clauses, literary analysis, figurative language, essays, and poetry.",
  books: [
    {
      id: "e7-1", num: 1, title: "Clauses & Sentence Structure", subtitle: "Independent, dependent, and complex sentences",
      emoji: "🧩", accent: "#059669", accent2: "#7ed0b2",
      sections: [
        {
          title: "Independent and Dependent Clauses",
          lesson: "An **independent clause** is a complete thought and can stand alone as a sentence. A **dependent (subordinate) clause** cannot — it needs an independent clause to complete its meaning. Example: *Although it rained* (dependent) *we still played.* (independent)",
          questions: [
            { type: "regular", q: "Is 'she laughed' an independent or dependent clause?", answer: "Independent.", solution: "Complete thought." },
            { type: "regular", q: "Is 'when the sun rose' independent or dependent?", answer: "Dependent.", solution: "Can't stand alone." },
            { type: "regular", q: "What word often starts a dependent clause?", answer: "Subordinating conjunctions like 'because', 'although', 'when', 'if'.", solution: "Signal dependence." },
            { type: "regular", q: "Can two independent clauses join with a comma alone?", answer: "No (that's a comma splice) — need a semicolon or conjunction.", solution: "Comma splice is an error." },
            { type: "word", q: "Combine: 'I was tired. I kept studying.' using a dependent clause.", answer: "Example: 'Although I was tired, I kept studying.'", solution: "Use a subordinating conjunction." }
          ]
        },
        {
          title: "Sentence Types by Structure",
          lesson: "**Simple** = one independent clause. **Compound** = two independent clauses joined (comma + FANBOYS, or semicolon). **Complex** = one independent + one or more dependent. **Compound-complex** = two+ independent + one+ dependent.",
          questions: [
            { type: "regular", q: "What type: *She ran, and he followed.*", answer: "Compound.", solution: "Two independent clauses." },
            { type: "regular", q: "What type: *Although she was tired, she finished.*", answer: "Complex.", solution: "Dependent + independent." },
            { type: "regular", q: "What type: *The sun is shining.*", answer: "Simple.", solution: "One independent clause." },
            { type: "regular", q: "FANBOYS stands for?", answer: "For, And, Nor, But, Or, Yet, So.", solution: "Coordinating conjunctions." },
            { type: "word", q: "Write a complex sentence.", answer: "Example: 'When the bell rang, the students cheered.'", solution: "Dependent + independent." }
          ]
        },
        {
          title: "Fragments and Run-Ons",
          lesson: "A **fragment** is an incomplete sentence. A **run-on** is two complete sentences joined incorrectly. Fix fragments by adding missing parts; fix run-ons by splitting, using a conjunction, or a semicolon.",
          questions: [
            { type: "regular", q: "Is 'Running through the park' a fragment?", answer: "Yes.", solution: "No subject." },
            { type: "regular", q: "Fix: 'I was late I missed the bus.'", answer: "Example: 'I was late because I missed the bus.' or 'I was late; I missed the bus.'", solution: "Add conjunction or semicolon." },
            { type: "regular", q: "Is this a complete sentence: 'Whenever you are ready.'?", answer: "No — fragment.", solution: "Dependent clause alone." },
            { type: "regular", q: "What's a comma splice?", answer: "Joining two independent clauses with only a comma.", solution: "Needs a conjunction or semicolon." },
            { type: "word", q: "Fix: 'The storm was loud it kept me awake.'", answer: "Example: 'The storm was loud, so it kept me awake.'", solution: "Add conjunction." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Clauses & Sentence Structure",
        questions: [
          { type: "regular", q: "Identify: *Because he practiced, he improved.*", answer: "Complex.", solution: "Dependent + independent." },
          { type: "regular", q: "Is 'after the rain stopped' independent?", answer: "No, dependent.", solution: "Starts with 'after'." },
          { type: "regular", q: "Fragment or sentence: 'The dog under the porch.'?", answer: "Fragment.", solution: "No verb." },
          { type: "regular", q: "Name three FANBOYS conjunctions.", answer: "Any 3 of: for, and, nor, but, or, yet, so.", solution: "Coordinating conjunctions." },
          { type: "word", q: "Combine: 'She studied hard.' + 'She passed the test.' into a compound sentence.", answer: "Example: 'She studied hard, so she passed the test.'", solution: "Comma + FANBOYS." },
          { type: "word", q: "Fix run-on: 'I was hungry I ate.'", answer: "Example: 'I was hungry, so I ate.' or 'Because I was hungry, I ate.'", solution: "Add conjunction." }
        ]
      }
    },
    {
      id: "e7-2", num: 2, title: "Literary Analysis", subtitle: "Themes, characters, plot",
      emoji: "🎭", accent: "#0891b2", accent2: "#67d2e2",
      sections: [
        {
          title: "Theme",
          lesson: "A **theme** is the central message or idea of a story — what the author wants you to take away. Themes are usually universal (friendship, courage, loss). They're stated in full sentences: *Friendship requires honesty*, not just *friendship*.",
          questions: [
            { type: "regular", q: "Is 'love' a theme?", answer: "Not fully — it's a topic. A theme would be a statement about love.", solution: "Themes are complete ideas." },
            { type: "regular", q: "Convert the topic 'courage' into a theme.", answer: "Example: 'True courage means standing up even when afraid.'", solution: "Make it a statement." },
            { type: "regular", q: "Where do you find evidence for a theme?", answer: "In characters' choices, dialogue, and events.", solution: "Story support." },
            { type: "regular", q: "Can a story have multiple themes?", answer: "Yes.", solution: "Complex stories often do." },
            { type: "word", q: "Name a theme from a book you've read.", answer: "Example: 'Friendship helps us overcome fear.'", solution: "Statement about a universal idea." }
          ]
        },
        {
          title: "Characters",
          lesson: "Main characters are **protagonists**; those who oppose them are **antagonists**. Characters can be **round** (complex, changing) or **flat** (simple, static). Character development is shown through dialogue, actions, and thoughts.",
          questions: [
            { type: "regular", q: "Who is the protagonist?", answer: "The main character.", solution: "Story centers on them." },
            { type: "regular", q: "Who is the antagonist?", answer: "The character opposing the protagonist.", solution: "Creates conflict." },
            { type: "regular", q: "What's a round character?", answer: "A complex, multi-dimensional character who changes.", solution: "As opposed to flat characters." },
            { type: "regular", q: "How do we learn about characters?", answer: "Through their actions, dialogue, and thoughts.", solution: "Characterization." },
            { type: "word", q: "Describe a protagonist you like in one sentence.", answer: "Example: 'Harry Potter is brave but unsure of himself.'", solution: "Describe traits." }
          ]
        },
        {
          title: "Plot Structure",
          lesson: "Plot has five parts: **exposition** (setup), **rising action** (events build tension), **climax** (turning point), **falling action** (consequences), **resolution** (ending).",
          questions: [
            { type: "regular", q: "What is the climax?", answer: "The turning point of the story with highest tension.", solution: "Peak moment." },
            { type: "regular", q: "What happens in the exposition?", answer: "Setting, characters, and initial situation are introduced.", solution: "Story setup." },
            { type: "regular", q: "Resolution does what?", answer: "Concludes the story and ties up loose ends.", solution: "Ending." },
            { type: "regular", q: "Between exposition and climax is the...?", answer: "Rising action.", solution: "Tension builds." },
            { type: "word", q: "Summarize a story you know using all five plot parts.", answer: "Example: Student summarizes with exposition, rising action, climax, falling action, resolution.", solution: "Apply the structure." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Literary Analysis",
        questions: [
          { type: "regular", q: "Who creates the main conflict for the protagonist?", answer: "The antagonist.", solution: "Opposing force." },
          { type: "regular", q: "Is 'friendship' a topic or theme?", answer: "Topic.", solution: "Themes are statements." },
          { type: "regular", q: "Plot part with highest tension?", answer: "Climax.", solution: "Turning point." },
          { type: "regular", q: "Flat character vs. round?", answer: "Flat = simple/static, round = complex/changing.", solution: "Characterization depth." },
          { type: "word", q: "State a possible theme of 'Charlotte's Web'.", answer: "Example: 'True friendship gives meaning to life.'", solution: "Statement about the story's message." },
          { type: "word", q: "Identify the resolution of a story you've read.", answer: "Example: In Charlotte's Web, the resolution is Wilbur caring for Charlotte's babies.", solution: "The ending phase." }
        ]
      }
    },
    {
      id: "e7-3", num: 3, title: "Figurative Language", subtitle: "Analogy, metaphor, simile, and more",
      emoji: "✨", accent: "#7c3aed", accent2: "#b295ec",
      sections: [
        {
          title: "Similes, Metaphors, and Analogies",
          lesson: "A **simile** uses *like* or *as*. A **metaphor** compares directly. An **analogy** explains an idea by comparing two similar relationships (e.g., *finding a bug in code is like finding a needle in a haystack*).",
          questions: [
            { type: "regular", q: "Simile or metaphor: *Her eyes are stars.*", answer: "Metaphor.", solution: "Direct comparison." },
            { type: "regular", q: "Simile or metaphor: *She eats like a bird.*", answer: "Simile.", solution: "Uses 'like'." },
            { type: "regular", q: "What makes an analogy different from a simile?", answer: "Analogies typically explain a relationship, not just a comparison.", solution: "Analogies teach via parallel." },
            { type: "regular", q: "Is *brave as a lion* a simile?", answer: "Yes.", solution: "Uses 'as'." },
            { type: "word", q: "Write a metaphor about winter.", answer: "Example: 'Winter is a silent painter.'", solution: "Direct comparison." }
          ]
        },
        {
          title: "Imagery, Personification, Symbolism",
          lesson: "**Imagery** uses vivid sensory language. **Personification** gives human traits to non-human things. **Symbolism** uses an object to represent an idea (e.g., a dove = peace).",
          questions: [
            { type: "regular", q: "What device: *The sky wept tears of rain.*", answer: "Personification.", solution: "Sky can't weep." },
            { type: "regular", q: "What does a dove typically symbolize?", answer: "Peace.", solution: "Traditional symbol." },
            { type: "regular", q: "What is imagery?", answer: "Descriptive language that appeals to the senses.", solution: "Sight, sound, smell, etc." },
            { type: "regular", q: "Is 'the wind whispered' an example of imagery or personification?", answer: "Both — imagery that uses personification.", solution: "Can overlap." },
            { type: "word", q: "Describe a forest using imagery (one sentence).", answer: "Example: 'Cool mist drifted between pines that creaked softly overhead.'", solution: "Sensory details." }
          ]
        },
        {
          title: "Idioms and Expressions",
          lesson: "An **idiom** is a phrase whose meaning isn't literal — it's culturally understood (e.g., *raining cats and dogs* means raining hard).",
          questions: [
            { type: "regular", q: "What does 'kick the bucket' mean?", answer: "To die.", solution: "English idiom." },
            { type: "regular", q: "What does 'break a leg' mean?", answer: "Good luck (especially in theater).", solution: "Theater idiom." },
            { type: "regular", q: "Is 'bite the bullet' literal?", answer: "No — it means to endure something difficult.", solution: "Idiom." },
            { type: "regular", q: "Meaning of 'let the cat out of the bag'?", answer: "To reveal a secret.", solution: "Idiom." },
            { type: "word", q: "Use an idiom in a sentence.", answer: "Example: 'She spilled the beans about the surprise party.'", solution: "Any valid idiom usage." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Figurative Language",
        questions: [
          { type: "regular", q: "Device: *His voice is thunder.*", answer: "Metaphor.", solution: "Direct comparison." },
          { type: "regular", q: "Device: *Hungry as a wolf.*", answer: "Simile.", solution: "'As'." },
          { type: "regular", q: "Symbol of a red rose?", answer: "Love.", solution: "Classic symbol." },
          { type: "regular", q: "Idiom meaning to procrastinate?", answer: "To drag one's feet.", solution: "Common idiom." },
          { type: "word", q: "Write a sentence using imagery and personification.", answer: "Example: 'The autumn leaves danced playfully on the cold pavement.'", solution: "Combine sensory + human traits." },
          { type: "word", q: "Meaning of 'piece of cake'?", answer: "Very easy.", solution: "Idiom." }
        ]
      }
    },
    {
      id: "e7-4", num: 4, title: "Writing: Essays & Research", subtitle: "From thesis to evidence",
      emoji: "🔍", accent: "#be185d", accent2: "#e69abc",
      sections: [
        {
          title: "Thesis and Evidence",
          lesson: "A **thesis** is your main claim. **Evidence** supports it — facts, quotations, examples. Each body paragraph in an essay typically uses the **PEE** pattern: **Point**, **Evidence**, **Explanation**.",
          questions: [
            { type: "regular", q: "What is a thesis?", answer: "The main claim or argument of the essay.", solution: "Anchors the essay." },
            { type: "regular", q: "What does PEE stand for?", answer: "Point, Evidence, Explanation.", solution: "Body paragraph structure." },
            { type: "regular", q: "Good evidence types?", answer: "Facts, direct quotations, examples, statistics.", solution: "Supportive material." },
            { type: "regular", q: "What's the 'explanation' part of PEE?", answer: "How the evidence proves the point.", solution: "Analysis." },
            { type: "word", q: "Write a thesis arguing that exercise improves focus.", answer: "Example: 'Regular exercise sharpens focus by improving blood flow and reducing stress.'", solution: "Arguable statement with reasons." }
          ]
        },
        {
          title: "Citing Sources",
          lesson: "When you use someone else's ideas or words, you must cite them. **Plagiarism** is presenting others' work as your own. Common styles: **MLA** (author page number), **APA** (author year).",
          questions: [
            { type: "regular", q: "What is plagiarism?", answer: "Using another's work or ideas without credit.", solution: "Academic offense." },
            { type: "regular", q: "How do you avoid plagiarism when paraphrasing?", answer: "Cite the source.", solution: "Credit the original." },
            { type: "regular", q: "Common citation style in English class?", answer: "MLA.", solution: "Modern Language Association." },
            { type: "regular", q: "What goes in a Works Cited page?", answer: "A list of every source you cited in your paper.", solution: "End of essay." },
            { type: "word", q: "Why does citing sources matter?", answer: "It gives credit, builds credibility, and lets readers find the original.", solution: "Any thoughtful reason." }
          ]
        },
        {
          title: "Prewriting and Revision",
          lesson: "**Prewriting** techniques include brainstorming, freewriting, mind-mapping, and outlining. **Revision** looks at big picture: thesis clarity, argument strength, organization. **Editing** is a separate step for grammar/spelling.",
          questions: [
            { type: "regular", q: "Goal of prewriting?", answer: "To generate and organize ideas before drafting.", solution: "Planning stage." },
            { type: "regular", q: "Is revision the same as editing?", answer: "No.", solution: "Revision = content; editing = surface." },
            { type: "regular", q: "Name two prewriting strategies.", answer: "Brainstorming and outlining (or freewriting, mind-mapping).", solution: "Common methods." },
            { type: "regular", q: "What should you check first when revising an essay?", answer: "The thesis and main argument.", solution: "Big-picture first." },
            { type: "word", q: "List three things to check during editing.", answer: "Grammar, spelling, and punctuation.", solution: "Surface-level fixes." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Writing: Essays & Research",
        questions: [
          { type: "regular", q: "A thesis is typically placed...?", answer: "At the end of the introduction.", solution: "Standard position." },
          { type: "regular", q: "PEE structure stands for?", answer: "Point, Evidence, Explanation.", solution: "Body paragraph pattern." },
          { type: "regular", q: "Avoiding plagiarism requires...?", answer: "Citing sources properly.", solution: "Credit others' work." },
          { type: "regular", q: "Which comes first: revision or editing?", answer: "Revision.", solution: "Big-picture before surface." },
          { type: "word", q: "Write a sample thesis for: 'Schools should start later.'", answer: "Example: 'Schools should start later because teens need more sleep, perform better academically, and have improved mental health.'", solution: "Arguable + reasons." },
          { type: "word", q: "Name one prewriting technique and briefly explain it.", answer: "Example: 'Brainstorming — listing all ideas without judgment.'", solution: "Valid technique + description." }
        ]
      }
    },
    {
      id: "e7-5", num: 5, title: "Poetry", subtitle: "Reading and writing verse",
      emoji: "🎵", accent: "#eab308", accent2: "#f3d56f",
      sections: [
        {
          title: "Reading Poetry",
          lesson: "When reading a poem, look at its **speaker** (who's talking), **tone** (emotion), **imagery**, and **form**. Poems are often layered — re-read and look for patterns.",
          questions: [
            { type: "regular", q: "Who is the speaker of a poem?", answer: "The voice narrating the poem (not always the poet).", solution: "Like a narrator." },
            { type: "regular", q: "What is tone?", answer: "The speaker's attitude or emotion.", solution: "Can be joyful, solemn, angry, etc." },
            { type: "regular", q: "Why re-read poetry?", answer: "Multiple meanings, patterns, and imagery become clearer.", solution: "Poetry is layered." },
            { type: "regular", q: "What is a stanza?", answer: "A group of lines in a poem, like a paragraph.", solution: "Poetry's paragraph." },
            { type: "word", q: "How would you describe the tone of the line 'The world is too much with us'?", answer: "Example: 'Weary' or 'disillusioned'.", solution: "Identify emotional attitude." }
          ]
        },
        {
          title: "Poetic Devices",
          lesson: "Common devices: **alliteration** (repeated consonants), **assonance** (repeated vowels), **consonance** (repeated consonants, not at start), **rhyme**, **meter** (rhythm pattern), and **enjambment** (a sentence continuing past line break).",
          questions: [
            { type: "regular", q: "What is enjambment?", answer: "When a sentence continues past a line break.", solution: "Without punctuation stop." },
            { type: "regular", q: "What's the difference between alliteration and assonance?", answer: "Alliteration = repeated consonants at word starts; assonance = repeated vowel sounds.", solution: "Different sound types." },
            { type: "regular", q: "What's meter?", answer: "The pattern of stressed and unstressed syllables.", solution: "Rhythm." },
            { type: "regular", q: "Define rhyme scheme.", answer: "The pattern of end rhymes, labeled with letters (e.g., ABAB).", solution: "Rhyme pattern notation." },
            { type: "word", q: "Example of alliteration.", answer: "Example: 'Whispering willow leaves.'", solution: "Repeated starting sound." }
          ]
        },
        {
          title: "Writing Poetry",
          lesson: "When writing poetry, start by choosing a form (haiku, free verse, etc.), then focus on concrete images and fresh word choices. Read each line aloud to check rhythm.",
          questions: [
            { type: "regular", q: "First step in writing a poem?", answer: "Choose a topic and/or form.", solution: "Planning." },
            { type: "regular", q: "Why read poems aloud?", answer: "To hear rhythm, sound patterns, and flow.", solution: "Poetry is auditory." },
            { type: "regular", q: "Concrete vs. abstract imagery: which is stronger?", answer: "Concrete — sensory details are vivid.", solution: "Show, don't tell." },
            { type: "regular", q: "Is rhyme required in all poetry?", answer: "No — free verse doesn't use it.", solution: "Many modern poems don't rhyme." },
            { type: "word", q: "Write a two-line poem about night.", answer: "Example: 'Stars stitch the dark / moon keeps the count.'", solution: "Any original lines." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Poetry",
        questions: [
          { type: "regular", q: "Who voices a poem?", answer: "The speaker.", solution: "Narrator figure." },
          { type: "regular", q: "A group of lines in a poem is a?", answer: "Stanza.", solution: "Terminology." },
          { type: "regular", q: "ABAB is a...?", answer: "Rhyme scheme.", solution: "Pattern of end rhymes." },
          { type: "regular", q: "Repeated vowel sounds within words?", answer: "Assonance.", solution: "Vowel echo." },
          { type: "word", q: "Describe the tone of 'Stopping by Woods on a Snowy Evening'.", answer: "Example: 'Quiet, reflective, slightly melancholy.'", solution: "Emotional atmosphere." },
          { type: "word", q: "Name one reason free verse has flexibility.", answer: "Example: 'It has no required rhyme or meter, allowing natural speech rhythm.'", solution: "Valid characteristic." }
        ]
      }
    }
  ]
};

const ENGLISH_G8_COURSE = {
  id: "eng8", subject: "english",
  title: "8th Grade English",
  subtitle: "Advanced grammar, mechanics, and composition",
  emoji: "📓", accent: "#1d4ed8", accent2: "#7594de",
  description: "Five units on parts of speech, sentence structure, mechanics, vocabulary, and composition.",
  books: [
    {
      id: "e8-1", num: 1, title: "Parts of Speech (Advanced)", subtitle: "Every word does a job",
      emoji: "🔖", accent: "#1d4ed8", accent2: "#7594de",
      sections: [
        {
          title: "Nouns and Pronouns",
          lesson: "Nouns are people, places, things, or ideas. **Collective nouns** (*team, flock*) name groups. **Abstract nouns** (*love, justice*) name ideas. Pronouns replace nouns. **Personal** (*I, you, she*), **possessive** (*mine, yours*), **reflexive** (*himself*), and **indefinite** (*everyone, someone*) are common types.",
          questions: [
            { type: "regular", q: "Is 'team' a collective or abstract noun?", answer: "Collective.", solution: "Names a group." },
            { type: "regular", q: "Is 'courage' abstract or concrete?", answer: "Abstract.", solution: "Names an idea." },
            { type: "regular", q: "What kind of pronoun is 'herself'?", answer: "Reflexive.", solution: "Refers back to the subject." },
            { type: "regular", q: "Is 'everyone' singular or plural?", answer: "Singular.", solution: "Indefinite pronouns like 'everyone' take singular verbs." },
            { type: "word", q: "Write a sentence using a possessive pronoun.", answer: "Example: 'That book is mine.'", solution: "Shows ownership." }
          ]
        },
        {
          title: "Verbs and Tenses",
          lesson: "**Action verbs** show what the subject does. **Linking verbs** (*is, am, was, seems*) connect subjects to descriptions. Tenses: past, present, future — plus perfect tenses (*has eaten*) showing completed action.",
          questions: [
            { type: "regular", q: "Is 'seems' action or linking?", answer: "Linking.", solution: "Connects subject to a description." },
            { type: "regular", q: "Tense of 'will run'?", answer: "Future.", solution: "'Will' signals future." },
            { type: "regular", q: "Tense of 'has eaten'?", answer: "Present perfect.", solution: "Completed action with present effect." },
            { type: "regular", q: "Subject-verb agreement: *The team (is / are) winning.*", answer: "'is' (American English).", solution: "Collective noun treated as singular." },
            { type: "word", q: "Change 'She writes' to past perfect tense.", answer: "She had written.", solution: "Past perfect = 'had' + past participle." }
          ]
        },
        {
          title: "Modifiers: Adjectives and Adverbs",
          lesson: "**Adjectives** modify nouns (*red car*). **Adverbs** modify verbs, adjectives, and other adverbs (*ran quickly*, *very tall*). Watch for **dangling** and **misplaced** modifiers — keep modifiers close to what they describe.",
          questions: [
            { type: "regular", q: "Adjective or adverb: 'extremely'?", answer: "Adverb.", solution: "Modifies adjectives/adverbs." },
            { type: "regular", q: "What does 'beautifully' modify in 'She sang beautifully'?", answer: "The verb 'sang'.", solution: "Describes how she sang." },
            { type: "regular", q: "Fix: *Running through the park, the flowers were lovely.*", answer: "Example: 'Running through the park, I saw lovely flowers.'", solution: "Dangling modifier — flowers weren't running." },
            { type: "regular", q: "Comparative form of 'good'?", answer: "Better.", solution: "Irregular." },
            { type: "word", q: "Use a superlative adjective in a sentence.", answer: "Example: 'This is the best cake I've ever had.'", solution: "-est or 'most ___'." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Parts of Speech (Advanced)",
        questions: [
          { type: "regular", q: "Abstract noun in 'Her kindness helped me'?", answer: "kindness.", solution: "Names a quality/idea." },
          { type: "regular", q: "Reflexive form of 'they'?", answer: "themselves.", solution: "Reflexive." },
          { type: "regular", q: "Tense of 'had finished'?", answer: "Past perfect.", solution: "Completed before another past action." },
          { type: "regular", q: "Is 'quickly' an adjective?", answer: "No, adverb.", solution: "Ends in -ly, modifies verb." },
          { type: "word", q: "Subject-verb agreement: *Neither of the boys (is/are) here.*", answer: "'is'.", solution: "'Neither' is singular." },
          { type: "word", q: "Identify the misplaced modifier: *I almost drove five hours.*", answer: "'almost' — should be 'I drove almost five hours.'", solution: "Modifier placement." }
        ]
      }
    },
    {
      id: "e8-2", num: 2, title: "Sentence Structure", subtitle: "Phrases, clauses, and combinations",
      emoji: "🧩", accent: "#2563eb", accent2: "#7e9de5",
      sections: [
        {
          title: "Phrases",
          lesson: "A **phrase** is a group of words acting as one part of speech but lacking a subject-verb pair. **Prepositional** (*in the park*), **participial** (*running fast, she*), **infinitive** (*to win the game*), and **gerund** (*Swimming is fun*) phrases are common.",
          questions: [
            { type: "regular", q: "Is 'under the table' a phrase or clause?", answer: "Phrase (prepositional).", solution: "No subject-verb." },
            { type: "regular", q: "What kind: 'to learn quickly'?", answer: "Infinitive phrase.", solution: "Starts with 'to' + verb." },
            { type: "regular", q: "What kind: 'Swimming daily keeps me fit.'?", answer: "Gerund phrase — 'Swimming daily'.", solution: "Gerund acts as a noun." },
            { type: "regular", q: "What kind: 'Exhausted from the hike, she rested.'?", answer: "Participial phrase — 'Exhausted from the hike'.", solution: "Acts as an adjective." },
            { type: "word", q: "Write a sentence using a prepositional phrase.", answer: "Example: 'The cat sat on the windowsill.'", solution: "Preposition + noun." }
          ]
        },
        {
          title: "Complex Sentences",
          lesson: "Complex sentences use at least one **subordinate clause**. These are introduced by words like *because, although, when, if, since, while*.",
          questions: [
            { type: "regular", q: "Identify the subordinate clause: *Although she was tired, she kept reading.*", answer: "'Although she was tired'.", solution: "Starts with 'although'." },
            { type: "regular", q: "Does a complex sentence always need a comma?", answer: "Only when the dependent clause comes first.", solution: "Stylistic rule." },
            { type: "regular", q: "Identify the type: *I studied while she worked.*", answer: "Complex.", solution: "Dependent + independent." },
            { type: "regular", q: "What's a subordinating conjunction?", answer: "A word linking a dependent clause to an independent one (e.g., because, although).", solution: "Introduces dependence." },
            { type: "word", q: "Combine: 'It was raining. I brought an umbrella.' into a complex sentence.", answer: "Example: 'Because it was raining, I brought an umbrella.'", solution: "Use subordinator." }
          ]
        },
        {
          title: "Parallel Structure",
          lesson: "**Parallel structure** means using the same grammatical form for items in a list or series. Example: *I like hiking, biking, and swimming* (all -ing), not *I like hiking, to bike, and swimming*.",
          questions: [
            { type: "regular", q: "Is this parallel: *She likes running, jumping, and to swim*?", answer: "No.", solution: "Forms don't match." },
            { type: "regular", q: "Fix: *He wanted to learn, to grow, and being successful.*", answer: "Example: 'He wanted to learn, to grow, and to be successful.'", solution: "All infinitives." },
            { type: "regular", q: "Why use parallel structure?", answer: "Clarity and smooth rhythm in writing.", solution: "Style." },
            { type: "regular", q: "Is *We ate quickly and with care* parallel?", answer: "No — mixes adverb and prepositional phrase.", solution: "Parallel would be 'quickly and carefully'." },
            { type: "word", q: "Fix: *She is talented, hardworking, and shows dedication.*", answer: "Example: 'She is talented, hardworking, and dedicated.'", solution: "All adjectives." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Sentence Structure",
        questions: [
          { type: "regular", q: "What kind of phrase: 'to finish the task'?", answer: "Infinitive.", solution: "'To' + verb." },
          { type: "regular", q: "Is 'when it rains' a clause or phrase?", answer: "Clause.", solution: "Has subject and verb." },
          { type: "regular", q: "Fix parallel: *Reading, to swim, and running.*", answer: "Example: 'Reading, swimming, and running.'", solution: "All gerunds." },
          { type: "regular", q: "Type: *She left before the storm.*", answer: "Complex (with prepositional phrase).", solution: "'Before the storm' is prepositional." },
          { type: "word", q: "Combine: 'She was nervous.' + 'She gave the speech.' into a complex sentence.", answer: "Example: 'Although she was nervous, she gave the speech.'", solution: "Subordinator." },
          { type: "word", q: "Fix parallel: *He enjoys to cook, painting, and to hike.*", answer: "Example: 'He enjoys cooking, painting, and hiking.'", solution: "All gerunds." }
        ]
      }
    },
    {
      id: "e8-3", num: 3, title: "Mechanics", subtitle: "Punctuation and spelling",
      emoji: "⚙️", accent: "#6366f1", accent2: "#a5abf2",
      sections: [
        {
          title: "Punctuation (Beyond Basics)",
          lesson: "The **semicolon** joins two closely related independent clauses. The **colon** introduces a list, quotation, or explanation. **Dashes** set off emphasis or interruption. **Apostrophes** show possession or contraction.",
          questions: [
            { type: "regular", q: "Punctuate: *I was tired I went to bed.*", answer: "I was tired; I went to bed. (or: I was tired, so I went to bed.)", solution: "Semicolon joins related clauses." },
            { type: "regular", q: "Where does a colon fit: *She bought three things books pens paper.*", answer: "She bought three things: books, pens, paper.", solution: "Colon introduces a list." },
            { type: "regular", q: "Apostrophe in 'The dogs tail'? (singular dog)", answer: "The dog's tail.", solution: "Possessive apostrophe before the s." },
            { type: "regular", q: "What does the contraction 'they're' mean?", answer: "they are.", solution: "Contraction." },
            { type: "word", q: "Use a semicolon to join: 'It was late. I kept studying.'", answer: "It was late; I kept studying.", solution: "Semicolon between related independent clauses." }
          ]
        },
        {
          title: "Commonly Confused Words",
          lesson: "Watch for **their/there/they're**, **its/it's**, **your/you're**, **affect/effect**, **than/then**, **accept/except**. Each has distinct meaning and usage.",
          questions: [
            { type: "regular", q: "Fix: *Their going to the store.*", answer: "They're going to the store.", solution: "Contraction for 'they are'." },
            { type: "regular", q: "Its vs. It's: The dog wagged (its/it's) tail.", answer: "its (possessive).", solution: "No apostrophe for possessive." },
            { type: "regular", q: "Affect vs. effect: *How will this ___ your grade?*", answer: "affect (verb).", solution: "Affect is a verb; effect is usually a noun." },
            { type: "regular", q: "Than vs. then: *She is taller ___ me.*", answer: "than.", solution: "'Than' = comparison." },
            { type: "word", q: "Use 'accept' and 'except' in one sentence.", answer: "Example: 'Everyone accepted the gift except Sam.'", solution: "Accept = receive; except = not including." }
          ]
        },
        {
          title: "Spelling Rules",
          lesson: "Common rules: **i before e except after c** (*piece, receive*). Double consonants before *-ing* when the vowel is short (*sitting, running*). **Drop silent e** before vowel suffix (*hope → hoping*).",
          questions: [
            { type: "regular", q: "Spell: *rec_ive*.", answer: "receive.", solution: "After 'c', use 'ei'." },
            { type: "regular", q: "Spell 'run' + '-ing'.", answer: "running.", solution: "Double the 'n'." },
            { type: "regular", q: "Spell 'hope' + '-ing'.", answer: "hoping.", solution: "Drop silent 'e'." },
            { type: "regular", q: "Which is correct: 'definite' or 'definate'?", answer: "definite.", solution: "Common spelling error." },
            { type: "word", q: "Spell: 'believe' or 'beleive'?", answer: "believe.", solution: "I before E." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Mechanics",
        questions: [
          { type: "regular", q: "Fix: *Its raining.*", answer: "It's raining.", solution: "Contraction 'it is'." },
          { type: "regular", q: "Correct punctuation: 'Three colors red blue green'?", answer: "Three colors: red, blue, green.", solution: "Colon introduces list." },
          { type: "regular", q: "Spell: *occasion* or *ocassion*?", answer: "occasion.", solution: "Common error." },
          { type: "regular", q: "Then vs than: *If you're tired, ___ rest.*", answer: "then.", solution: "'Then' = time/sequence." },
          { type: "word", q: "Fix: *The boys bike is blue.* (one boy owns it)", answer: "The boy's bike is blue.", solution: "Singular possessive." },
          { type: "word", q: "Spell 'embarrass'.", answer: "embarrass.", solution: "Two r's, two s's." }
        ]
      }
    },
    {
      id: "e8-4", num: 4, title: "Vocabulary", subtitle: "Roots, context, and usage",
      emoji: "🗣️", accent: "#0891b2", accent2: "#67d2e2",
      sections: [
        {
          title: "Greek and Latin Roots",
          lesson: "Many English words come from Greek or Latin roots. Knowing them helps you decode unfamiliar words. Examples: *chron* (time), *phon* (sound), *vis* (see), *scrib* (write), *port* (carry).",
          questions: [
            { type: "regular", q: "'Chronology' relates to?", answer: "Time.", solution: "'Chron' = time." },
            { type: "regular", q: "What does 'phon' mean in 'telephone'?", answer: "Sound.", solution: "'Phon' = sound." },
            { type: "regular", q: "What's the root of 'transport'?", answer: "port (to carry).", solution: "Trans- = across; -port = carry." },
            { type: "regular", q: "What does 'scrib' mean?", answer: "Write.", solution: "As in 'scribble', 'inscription'." },
            { type: "word", q: "Guess the meaning of 'visible' based on root 'vis'.", answer: "Able to be seen.", solution: "Vis = see." }
          ]
        },
        {
          title: "Context Clues",
          lesson: "When you meet a new word, use **context clues** — surrounding words — to guess its meaning. Look for: definitions, synonyms, antonyms, and examples nearby.",
          questions: [
            { type: "regular", q: "In 'She was ebullient—cheerful, bouncy, full of joy,' what does 'ebullient' likely mean?", answer: "Very cheerful / joyful.", solution: "Surrounding synonyms." },
            { type: "regular", q: "In 'The boy was lethargic, unlike his energetic sister,' what does 'lethargic' mean?", answer: "Lacking energy.", solution: "Antonym clue." },
            { type: "regular", q: "What type of clue: 'A pedometer, a device for counting steps, helps runners.'?", answer: "Definition.", solution: "Explains the word directly." },
            { type: "regular", q: "Why use context clues?", answer: "To figure out unknown word meanings without a dictionary.", solution: "Reading strategy." },
            { type: "word", q: "Use context to guess: 'The movie was so soporific that three people fell asleep.'", answer: "Sleep-inducing / boring.", solution: "People fell asleep = sleep-inducing." }
          ]
        },
        {
          title: "Denotation and Connotation",
          lesson: "**Denotation** is a word's dictionary definition. **Connotation** is the emotional or cultural feeling attached. *Cheap* and *inexpensive* have the same denotation but different connotations.",
          questions: [
            { type: "regular", q: "Which has a more negative connotation: 'thrifty' or 'cheap'?", answer: "Cheap.", solution: "Thrifty implies wise saving; cheap sounds stingy." },
            { type: "regular", q: "Which is more positive: 'slender' or 'skinny'?", answer: "Slender.", solution: "Skinny is often negative." },
            { type: "regular", q: "What is denotation?", answer: "A word's dictionary meaning.", solution: "Literal definition." },
            { type: "regular", q: "Do 'home' and 'house' have the same connotation?", answer: "No — 'home' feels warmer.", solution: "Same denotation, different connotation." },
            { type: "word", q: "Give a word with strong positive connotation for 'surprised'.", answer: "Example: 'amazed' or 'delighted'.", solution: "Any positive synonym." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Vocabulary",
        questions: [
          { type: "regular", q: "Root of 'biography'?", answer: "bio (life) + graph (write).", solution: "Combined roots." },
          { type: "regular", q: "What kind of clue: 'She was frugal—always saving money'?", answer: "Definition/example clue.", solution: "Explanation after the word." },
          { type: "regular", q: "Negative connotation of 'confident'?", answer: "Arrogant (or cocky).", solution: "Similar meaning, negative feel." },
          { type: "regular", q: "What does 'aud' mean?", answer: "Hear.", solution: "As in audible, auditorium." },
          { type: "word", q: "Guess meaning of 'benevolent' based on 'bene' (good) + 'vol' (wish).", answer: "Kind, well-wishing.", solution: "Combine roots." },
          { type: "word", q: "Which has a more positive connotation: 'stubborn' or 'determined'?", answer: "Determined.", solution: "Stubborn is negative." }
        ]
      }
    },
    {
      id: "e8-5", num: 5, title: "Composition & Style", subtitle: "Writing with voice",
      emoji: "✍️", accent: "#9333ea", accent2: "#c49ce8",
      sections: [
        {
          title: "Voice and Tone",
          lesson: "**Voice** is the writer's distinct personality on the page. **Tone** is the attitude toward the subject or audience. Both come through in word choice and sentence rhythm.",
          questions: [
            { type: "regular", q: "What's the difference between voice and tone?", answer: "Voice is the writer's personality; tone is attitude toward the subject.", solution: "Voice is personal; tone is situational." },
            { type: "regular", q: "What tone fits a formal business letter?", answer: "Professional / respectful.", solution: "Match context." },
            { type: "regular", q: "What tone fits a personal diary?", answer: "Casual / intimate.", solution: "Match purpose." },
            { type: "regular", q: "Word choice affects voice — true or false?", answer: "True.", solution: "Words shape voice." },
            { type: "word", q: "Rewrite in a formal tone: *The whole thing kinda blew up.*", answer: "Example: 'The situation escalated significantly.'", solution: "Elevate word choice." }
          ]
        },
        {
          title: "Showing vs. Telling",
          lesson: "**Telling** states emotions or facts outright. **Showing** uses sensory details and actions. *She was sad* (telling) vs. *Her shoulders sagged as she stared at the empty chair* (showing). Showing makes writing vivid.",
          questions: [
            { type: "regular", q: "Which shows: 'He was angry' or 'His fists tightened as he glared'?", answer: "The second.", solution: "Shows through action." },
            { type: "regular", q: "Rewrite 'She was nervous' using showing.", answer: "Example: 'Her hands trembled as she reached for the door.'", solution: "Show with sensory detail." },
            { type: "regular", q: "Why is showing better than telling?", answer: "It engages the reader's senses and imagination.", solution: "Vivid > abstract." },
            { type: "regular", q: "Is showing always better?", answer: "Not always — sometimes telling is more efficient.", solution: "Balance both." },
            { type: "word", q: "Rewrite 'The house was old' by showing.", answer: "Example: 'The front step sagged, and paint peeled from every shutter.'", solution: "Show via specific details." }
          ]
        },
        {
          title: "Revising for Style",
          lesson: "When revising, look for: **word choice** (replace vague words), **sentence variety** (mix lengths), **active voice** (prefer over passive), and **concise phrasing** (cut wordiness).",
          questions: [
            { type: "regular", q: "Passive or active: *The cake was eaten by Maya.*", answer: "Passive.", solution: "Subject receives action." },
            { type: "regular", q: "Convert to active: *The cake was eaten by Maya.*", answer: "Maya ate the cake.", solution: "Subject performs action." },
            { type: "regular", q: "Which is more concise: 'due to the fact that' or 'because'?", answer: "'because'.", solution: "Fewer words, same meaning." },
            { type: "regular", q: "What is wordiness?", answer: "Using more words than needed.", solution: "Cut unnecessary words." },
            { type: "word", q: "Make concise: 'In spite of the fact that it was raining, we went outside.'", answer: "Example: 'Although it was raining, we went outside.'", solution: "Cut wordiness." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Composition & Style",
        questions: [
          { type: "regular", q: "Voice is the writer's ___ on the page.", answer: "Personality (or distinct sound).", solution: "Personality/style." },
          { type: "regular", q: "Showing uses _____ .", answer: "Sensory details and actions.", solution: "Concrete descriptions." },
          { type: "regular", q: "Convert to active: *The window was broken by the ball.*", answer: "The ball broke the window.", solution: "Active voice." },
          { type: "regular", q: "More concise: 'in the event that' → ?", answer: "if.", solution: "One word replaces four." },
          { type: "word", q: "Show instead of tell: 'He was tired.'", answer: "Example: 'His eyelids drooped as he stumbled into bed.'", solution: "Use body language + action." },
          { type: "word", q: "Rewrite in casual tone: *We hereby request your attendance.*", answer: "Example: 'We'd love for you to come.'", solution: "Lower formality." }
        ]
      }
    }
  ]
};
