/**
 * Oppdaterer eksempelsetninger for abstrakte substantiver
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Samme funksjon som i server.js
function generateExampleSentences(word, wordClass) {
  const lowerWord = word.toLowerCase();

  switch(wordClass) {
    case 'noun':
      // Abstrakte substantiver (følelser, konsepter, tilstander) trenger andre setninger
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

      if (abstractNouns.includes(lowerWord)) {
        // Use "feel", "full of", "experience" for emotions/states
        if (['anger', 'rage', 'happiness', 'sadness', 'joy', 'fear', 'love', 'hate',
             'pride', 'shame', 'guilt', 'envy', 'jealousy', 'excitement', 'anxiety'].includes(lowerWord)) {
          return [
            `I feel ${word} sometimes.`,
            `He was full of ${word}.`,
            `${word.charAt(0).toUpperCase() + word.slice(1)} can be difficult.`
          ];
        }
        // Generic abstract noun patterns
        return [
          `${word.charAt(0).toUpperCase() + word.slice(1)} is important.`,
          `We need more ${word}.`,
          `I believe in ${word}.`
        ];
      }

      // Concrete nouns - use original patterns
      return [
        `I have a ${word}.`,
        `The ${word} is big.`,
        `Can you see the ${word}?`
      ];

    case 'verb':
      if (lowerWord === 'be') {
        return [
          `I am happy.`,
          `You are my friend.`,
          `They are here.`
        ];
      }
      return [
        `I ${word} every day.`,
        `She likes to ${word}.`,
        `They ${word} together.`
      ];

    case 'adjective':
      return [
        `The cat is ${word}.`,
        `I feel ${word} today.`,
        `This is a ${word} book.`
      ];

    case 'adverb':
      return [
        `She runs ${word}.`,
        `He speaks ${word}.`,
        `They work ${word}.`
      ];

    default:
      return [
        `This is an example with ${word}.`,
        `We use ${word} in sentences.`,
        `${word.charAt(0).toUpperCase() + word.slice(1)} is a word.`
      ];
  }
}

console.log('🔧 Oppdaterer eksempelsetninger for alle ord...\n');

// Hent alle ord fra databasen
const words = db.prepare('SELECT id, english, word_class FROM words').all();

console.log(`📚 Fant ${words.length} ord\n`);

let updatedCount = 0;

for (const word of words) {
  const newExamples = generateExampleSentences(word.english, word.word_class);
  const examplesJson = JSON.stringify(newExamples);

  db.prepare('UPDATE words SET example_sentences = ? WHERE id = ?').run(examplesJson, word.id);

  console.log(`  ✓ ${word.english} (${word.word_class})`);
  console.log(`    ${newExamples[0]}`);

  updatedCount++;
}

console.log(`\n🎉 Ferdig! Oppdatert ${updatedCount} ord med nye eksempelsetninger.`);

db.close();
