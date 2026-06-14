
  // 2. INTELLIGENTE REGLER BASERT PÅ ORDKLASSE OG FORM

  switch(wordClass) {
    case 'noun':
      // Sjekk om det egentlig er en verb-form feilklassifisert
      if (lowerWord.endsWith('ing')) {
        // Dette er sannsynligvis en gerund (verb brukt som substantiv)
        return [
          `I like ${word}.`,
          `${word.charAt(0).toUpperCase() + word.slice(1)} is fun.`,
          `We enjoy ${word}.`
        ];
      }
      return generateNounExamples(word, lowerWord, norwegian);

    case 'verb':
      return generateVerbExamples(word, lowerWord);

    case 'adjective':
      return generateAdjectiveExamples(word, lowerWord);

    case 'adverb':
      return generateAdverbExamples(word, lowerWord);

    case 'pronoun':
      // Fallback for pronouns not in handcrafted list
      return [
        `I see ${word}.`,
        `${word.charAt(0).toUpperCase() + word.slice(1)} can help.`,
        `This is for ${word}.`
      ];

    case 'preposition':
      // Fallback for prepositions not in handcrafted list
      return [
        `The ball is ${word} the box.`,
        `I go ${word} the store.`,
        `She is ${word} her friend.`
      ];

    case 'conjunction':
      // Fallback for conjunctions
      return [
        `I like cats ${word} dogs.`,
        `She is happy ${word} tired.`,
        `We play ${word} we work.`
      ];

    case 'article':
      // Fallback for articles
      return [
        `I have ${word} book.`,
        `This is ${word} example.`,
        `${word.charAt(0).toUpperCase() + word.slice(1)} cat is cute.`
      ];

    default:
      // Generic fallback
      return [
        `I know the word ${word}.`,
        `We use ${word} in sentences.`,
        `${word.charAt(0).toUpperCase() + word.slice(1)} is important.`
      ];
  }
}

function generateNounExamples(word, lowerWord, norwegian) {
  // Sjekk om det er flertall
  const isPlural = lowerWord.endsWith('s') || lowerWord.endsWith('es') ||
                  ['people', 'children', 'men', 'women'].includes(lowerWord) ||
                  norwegian?.toLowerCase().includes('flere') ||
                  norwegian?.toLowerCase().includes('mange');

  // Uncountable nouns (kan ikke bruke "a")
  const uncountableNouns = [
    'weather', 'water', 'rain', 'snow', 'ice', 'air', 'oxygen',
    'rice', 'bread', 'butter', 'cheese', 'meat', 'milk', 'coffee', 'tea',
    'music', 'art', 'literature', 'poetry', 'information', 'news',
    'furniture', 'equipment', 'luggage', 'baggage', 'homework', 'housework',
    'money', 'cash', 'gold', 'silver', 'sand', 'grass', 'hair',
    'advice', 'help', 'work', 'fun', 'luck'
  ];

  // Abstrakte substantiver (følelser, konsepter)
  const abstractNouns = [
    'anger', 'rage', 'happiness', 'sadness', 'joy', 'fear', 'love', 'hate',
    'peace', 'war', 'freedom', 'justice', 'truth', 'beauty', 'knowledge',
    'courage', 'patience', 'kindness', 'wisdom', 'hope', 'faith', 'trust',
    'pride', 'shame', 'guilt', 'envy', 'jealousy', 'surprise', 'confusion',
    'excitement', 'anxiety', 'stress', 'relief', 'disappointment', 'frustration',
    'loneliness', 'friendship', 'loyalty', 'honesty', 'respect', 'power',
    'strength', 'weakness', 'danger', 'safety', 'health', 'illness', 'pain',
    'pleasure', 'comfort', 'success', 'failure', 'luck', 'chance', 'time',
    'space', 'energy', 'effort', 'progress', 'change', 'growth', 'development'
  ];

  // Geografiske/naturlige fenomener
  const geographical = [
    'mountain', 'valley', 'river', 'lake', 'ocean', 'sea', 'forest', 'desert',
    'glacier', 'volcano', 'island', 'peninsula', 'canyon', 'waterfall', 'hill'
  ];

  // Følelser
  const emotions = ['anger', 'rage', 'happiness', 'sadness', 'joy', 'fear', 'love', 'hate',
                   'pride', 'shame', 'guilt', 'envy', 'jealousy', 'excitement', 'anxiety'];

  if (emotions.includes(lowerWord)) {
    return [
      `I feel ${word} sometimes.`,
      `He was full of ${word}.`,
      `${word.charAt(0).toUpperCase() + word.slice(1)} can be difficult.`
    ];
  }

  if (abstractNouns.includes(lowerWord)) {
    return [
      `${word.charAt(0).toUpperCase() + word.slice(1)} is important.`,
      `We need more ${word}.`,
      `I believe in ${word}.`
    ];
  }

  // Uncountable nouns
  if (uncountableNouns.includes(lowerWord)) {
    return [
      `The ${word} is nice today.`,
      `I like ${word}.`,
      `We need ${word}.`
    ];
  }

  // Geografiske fenomener
  if (geographical.includes(lowerWord)) {
    return [
      `I can see the ${word}.`,
      `The ${word} is beautiful.`,
      `We visit the ${word}.`
    ];
  }

  // Flertall
  if (isPlural) {
    return [
      `I see many ${word}.`,
      `The ${word} are beautiful.`,
      `We like ${word}.`
    ];
  }

  // Konkrete substantiver (standard)
  return [
    `I have a ${word}.`,
    `The ${word} is nice.`,
    `Can you see the ${word}?`
  ];
}

function generateVerbExamples(word, lowerWord) {
  // -ing form (gerund eller present participle)
  if (lowerWord.endsWith('ing')) {
    const base = lowerWord.replace(/ing$/, '').replace(/([^aeiou])\\1$/, '$1'); // hiking -> hike
    return [
      `I like ${word}.`,
      `${word.charAt(0).toUpperCase() + word.slice(1)} is fun.`,
      `We are ${word} now.`
    ];
  }

  // Past tense (-ed)
  if (lowerWord.endsWith('ed')) {
    return [
      `I ${word} yesterday.`,
      `She ${word} last week.`,
      `We ${word} together.`
    ];
  }

  // Third person singular (-s/-es)
  if ((lowerWord.endsWith('s') || lowerWord.endsWith('es')) &&
      !['is', 'was', 'has', 'does', 'goes'].includes(lowerWord)) {
    const base = lowerWord.replace(/es$/, '').replace(/s$/, '');
    return [
      `She ${word} every day.`,
      `He ${word} very well.`,
      `It ${word} a lot.`
    ];
  }

  // Infinitive / base form
  return [
    `I like to ${word}.`,
    `We ${word} together.`,
    `They ${word} every day.`
  ];
}

function generateAdjectiveExamples(word, lowerWord) {
  // Komparativ/superlativ
  if (lowerWord.endsWith('er')) {
    return [
      `This is ${word} than that.`,
      `She is ${word} now.`,
      `It gets ${word} every day.`
    ];
  }

  if (lowerWord.endsWith('est')) {
    return [
      `This is the ${word} one.`,
      `She is the ${word} in class.`,
      `It is the ${word} I have seen.`
    ];
  }

  // Standard adjektiv
  return [
    `The cat is ${word}.`,
    `I feel ${word} today.`,
    `This is a ${word} book.`
  ];
}

function generateAdverbExamples(word, lowerWord) {
  return [
    `She runs ${word}.`,
    `He speaks ${word}.`,
    `We work ${word}.`
  ];
}
