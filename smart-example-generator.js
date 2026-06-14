/**
 * SMART EKSEMPELGENERATOR
 * Analyserer ord og lager intelligente, kontekstuelle eksempelsetninger
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// DATABASE MED HÅNDSKREVNE EKSEMPLER FOR VANLIGE ORD
const HANDCRAFTED_EXAMPLES = {
  // Articles
  'the': ['The dog is brown.', 'I like the car.', 'Where is the book?'],
  'a': ['I have a cat.', 'She is a teacher.', 'This is a pencil.'],
  'an': ['I want an apple.', 'She is an artist.', 'This is an elephant.'],

  // Pronouns
  'i': ['I am happy.', 'I like pizza.', 'I go to school.'],
  'you': ['You are my friend.', 'Do you like ice cream?', 'You can do it!'],
  'he': ['He is my brother.', 'He likes football.', 'He goes to school.'],
  'she': ['She is my sister.', 'She likes reading.', 'She is very kind.'],
  'it': ['It is raining.', 'It is a big dog.', 'I like it.'],
  'we': ['We are friends.', 'We go to school.', 'We like to play.'],
  'they': ['They are happy.', 'They like sports.', 'They go home.'],
  'my': ['This is my book.', 'My name is John.', 'I love my cat.'],
  'your': ['What is your name?', 'I like your hat.', 'Your dog is cute.'],
  'our': ['This is our house.', 'Our teacher is nice.', 'We love our school.'],
  'their': ['Their car is red.', 'I know their names.', 'Their house is big.'],

  // Be-verbs
  'be': ['I want to be happy.', 'You can be anything.', 'We should be kind.'],
  'am': ['I am a student.', 'I am happy today.', 'I am ten years old.'],
  'is': ['She is my friend.', 'It is raining.', 'This is my book.'],
  'are': ['You are very kind.', 'They are at school.', 'We are friends.'],
  'was': ['I was tired yesterday.', 'It was sunny.', 'She was happy.'],
  'were': ['We were at home.', 'They were playing.', 'You were right.'],
  'been': ['I have been there.', 'She has been sick.', 'We have been waiting.'],
  'being': ['I am being careful.', 'Stop being silly.', 'He is being nice.'],

  // Common verbs
  'have': ['I have a dog.', 'We have fun.', 'They have many toys.'],
  'has': ['She has a cat.', 'He has brown eyes.', 'It has four legs.'],
  'had': ['I had a dream.', 'We had pizza.', 'She had fun.'],
  'do': ['I do my homework.', 'Do you like it?', 'We do sports.'],
  'does': ['She does her best.', 'Does he like pizza?', 'It does not work.'],
  'did': ['I did my homework.', 'Did you see that?', 'We did it!'],
  'can': ['I can swim.', 'You can do it!', 'We can help.'],
  'could': ['I could see it.', 'Could you help me?', 'We could go.'],
  'will': ['I will help you.', 'She will come.', 'We will win.'],
  'would': ['I would like that.', 'Would you help me?', 'She would be happy.'],
  'should': ['You should rest.', 'We should go.', 'I should study.'],

  // Prepositions
  'in': ['The cat is in the box.', 'I live in Norway.', 'We swim in the lake.'],
  'on': ['The book is on the table.', 'I sit on a chair.', 'The picture is on the wall.'],
  'at': ['I am at school.', 'She is at home.', 'We meet at five.'],
  'to': ['I go to school.', 'She walks to the park.', 'We listen to music.'],
  'from': ['I am from Norway.', 'The letter is from mom.', 'We come from Oslo.'],
  'with': ['I play with my friends.', 'She comes with her dog.', 'We eat with a fork.'],
  'by': ['I go by bus.', 'The book is by the door.', 'She sits by the window.'],
  'for': ['This is for you.', 'I wait for the bus.', 'We study for the test.'],
  'of': ['A glass of water.', 'The color of the sky.', 'A piece of cake.'],
  'about': ['Tell me about it.', 'I think about you.', 'A book about animals.'],
  'under': ['The cat is under the table.', 'I hide under the bed.', 'We sit under a tree.'],
  'over': ['The bird flies over us.', 'I jump over the fence.', 'She looks over the wall.'],
  'between': ['I sit between my friends.', 'The ball is between the trees.', 'We choose between two.'],
  'through': ['We walk through the park.', 'I look through the window.', 'She runs through the door.'],

  // Conjunctions
  'and': ['I have a cat and a dog.', 'She is smart and kind.', 'We run and jump.'],
  'or': ['Do you want tea or coffee?', 'Is it red or blue?', 'We can walk or take the bus.'],
  'but': ['I like it, but it is expensive.', 'She is small but strong.', 'We tried, but we failed.'],
  'because': ['I am happy because it is sunny.', 'She stayed home because she was sick.', 'We study because we want to learn.'],
  'if': ['If it rains, we stay inside.', 'I will come if you want.', 'She asks if I can help.'],
  'when': ['When I am tired, I sleep.', 'She smiles when she is happy.', 'We eat when we are hungry.'],
  'while': ['I read while she sleeps.', 'We sing while we work.', 'He cooks while I clean.'],
  'although': ['Although it rains, we play.', 'She smiles although she is sad.', 'I go although I am tired.'],

  // Question words
  'what': ['What is your name?', 'What do you like?', 'What time is it?'],
  'where': ['Where are you from?', 'Where is the cat?', 'Where do you live?'],
  'when': ['When is your birthday?', 'When do we eat?', 'When can I come?'],
  'why': ['Why are you sad?', 'Why is the sky blue?', 'Why do we sleep?'],
  'who': ['Who is that?', 'Who are you?', 'Who wants ice cream?'],
  'how': ['How are you?', 'How old are you?', 'How do you know?'],
  'which': ['Which one do you want?', 'Which color do you like?', 'Which book is yours?'],
};

/**
 * Generer intelligente eksempelsetninger
 */
function generateSmartExamples(word, wordClass, norwegian) {
  const lowerWord = word.toLowerCase();

  // 1. HÅNDSKREVNE EKSEMPLER (prioritet #1)
  if (HANDCRAFTED_EXAMPLES[lowerWord]) {
    return HANDCRAFTED_EXAMPLES[lowerWord];
  }

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

// KJØR ANALYSEN OG OPPDATER DATABASEN
console.log('🧠 SMART EKSEMPELGENERATOR\n');

const allWords = db.prepare('SELECT id, english, norwegian, word_class FROM words').all();

console.log(`📚 Oppdaterer ${allWords.length} ord i databasen...\n`);

let updatedCount = 0;
let improvedCount = 0;

allWords.forEach(word => {
  const examples = generateSmartExamples(word.english, word.word_class, word.norwegian);
  const examplesJson = JSON.stringify(examples);

  // Sjekk om dette er en forbedring
  const currentExamples = db.prepare('SELECT example_sentences FROM words WHERE id = ?').get(word.id);
  const oldExamples = currentExamples?.example_sentences || '[]';

  db.prepare('UPDATE words SET example_sentences = ? WHERE id = ?').run(examplesJson, word.id);

  console.log(`✓ ${word.english} (${word.word_class})`);
  console.log(`    ${examples[0]}`);

  updatedCount++;
  if (examplesJson !== oldExamples) {
    improvedCount++;
  }
});

console.log(`\n🎉 Ferdig!`);
console.log(`   Oppdatert: ${updatedCount} ord`);
console.log(`   Forbedret: ${improvedCount} ord`);

db.close();
