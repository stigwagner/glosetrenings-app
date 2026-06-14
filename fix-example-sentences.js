/**
 * Fikser eksempelsetninger for eksisterende ord i databasen
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Samme funksjon som i server.js
function detectWordClass(word) {
  const lowerWord = word.toLowerCase();

  const articles = ['a', 'an', 'the'];
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  const prepositions = ['in', 'on', 'at', 'to', 'from', 'with', 'by', 'for', 'of', 'about', 'under', 'over', 'between', 'through'];
  const conjunctions = ['and', 'or', 'but', 'because', 'if', 'when', 'while', 'although'];
  const commonVerbs = [
    'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing',
    'go', 'goes', 'went', 'going', 'gone',
    'get', 'gets', 'got', 'getting', 'gotten',
    'make', 'makes', 'made', 'making',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'run', 'runs', 'ran', 'running',
    'walk', 'walks', 'walked', 'walking',
    'eat', 'eats', 'ate', 'eating', 'eaten',
    'drink', 'drinks', 'drank', 'drinking', 'drunk',
    'see', 'sees', 'saw', 'seeing', 'seen',
    'hear', 'hears', 'heard', 'hearing',
    'speak', 'speaks', 'spoke', 'speaking', 'spoken',
    'write', 'writes', 'wrote', 'writing', 'written',
    'read', 'reads', 'reading',
    'play', 'plays', 'played', 'playing',
    'want', 'wants', 'wanted', 'wanting',
    'like', 'likes', 'liked', 'liking',
    'love', 'loves', 'loved', 'loving',
    'help', 'helps', 'helped', 'helping',
    'work', 'works', 'worked', 'working',
    'use', 'uses', 'used', 'using',
    'find', 'finds', 'found', 'finding',
    'give', 'gives', 'gave', 'giving', 'given',
    'take', 'takes', 'took', 'taking', 'taken',
    'come', 'comes', 'came', 'coming',
    'know', 'knows', 'knew', 'knowing', 'known',
    'think', 'thinks', 'thought', 'thinking'
  ];
  const commonAdjectives = [
    'good', 'bad', 'big', 'small', 'large', 'little', 'long', 'short',
    'happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty',
    'hot', 'cold', 'warm', 'cool',
    'fast', 'slow', 'quick',
    'new', 'old', 'young',
    'nice', 'beautiful', 'ugly',
    'easy', 'hard', 'difficult',
    'important', 'interesting', 'boring'
  ];

  if (articles.includes(lowerWord)) return 'article';
  if (pronouns.includes(lowerWord)) return 'pronoun';
  if (prepositions.includes(lowerWord)) return 'preposition';
  if (conjunctions.includes(lowerWord)) return 'conjunction';
  if (commonVerbs.includes(lowerWord)) return 'verb';
  if (commonAdjectives.includes(lowerWord)) return 'adjective';

  if (lowerWord.endsWith('ing') || lowerWord.endsWith('ed') || lowerWord.endsWith('en')) {
    return 'verb';
  }
  if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') || lowerWord.endsWith('ous') ||
      lowerWord.endsWith('ive') || lowerWord.endsWith('able') || lowerWord.endsWith('ible') ||
      lowerWord.endsWith('al') || lowerWord.endsWith('ic')) {
    return 'adjective';
  }
  if (lowerWord.endsWith('ly')) {
    return 'adverb';
  }

  return 'noun';
}

function generateExampleSentences(word, wordClass) {
  const lowerWord = word.toLowerCase();

  switch(wordClass) {
    case 'noun':
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

    case 'preposition':
      if (lowerWord === 'in') {
        return [
          `The cat is in the box.`,
          `I live in Norway.`,
          `We swim in the lake.`
        ];
      }
      if (lowerWord === 'on') {
        return [
          `The book is on the table.`,
          `I sit on a chair.`,
          `The picture is on the wall.`
        ];
      }
      if (lowerWord === 'at') {
        return [
          `I am at school.`,
          `She is at home.`,
          `We meet at five.`
        ];
      }
      return [
        `I go ${word} the store.`,
        `She is ${word} her friend.`,
        `The ball is ${word} the box.`
      ];

    case 'pronoun':
      if (lowerWord === 'i') {
        return [
          `I am a student.`,
          `I like to play.`,
          `I have a dog.`
        ];
      }
      if (lowerWord === 'you') {
        return [
          `You are my friend.`,
          `You like pizza.`,
          `Can you help me?`
        ];
      }
      if (lowerWord === 'he' || lowerWord === 'she') {
        return [
          `${word.charAt(0).toUpperCase() + word.slice(1)} is happy.`,
          `${word.charAt(0).toUpperCase() + word.slice(1)} likes to read.`,
          `${word.charAt(0).toUpperCase() + word.slice(1)} has a bike.`
        ];
      }
      return [
        `I see ${word}.`,
        `${word.charAt(0).toUpperCase() + word.slice(1)} can help.`,
        `This is for ${word}.`
      ];

    case 'conjunction':
      if (lowerWord === 'and') {
        return [
          `I have a cat and a dog.`,
          `She is happy and kind.`,
          `We play and laugh.`
        ];
      }
      if (lowerWord === 'but') {
        return [
          `I like apples but not oranges.`,
          `She is small but strong.`,
          `It is cold but sunny.`
        ];
      }
      if (lowerWord === 'or') {
        return [
          `Do you want tea or coffee?`,
          `Is it big or small?`,
          `Red or blue?`
        ];
      }
      return [
        `I am happy ${word} I won.`,
        `She reads ${word} she likes books.`,
        `We wait ${word} he comes.`
      ];

    case 'article':
      if (lowerWord === 'a' || lowerWord === 'an') {
        return [
          `I have a cat.`,
          `She wants an apple.`,
          `This is a book.`
        ];
      }
      return [
        `The cat is cute.`,
        `I like the book.`,
        `The sun is bright.`
      ];

    default:
      return [
        `I like ${word}.`,
        `The ${word} is nice.`,
        `Can you see the ${word}?`
      ];
  }
}

console.log('🔧 Fikser eksempelsetninger i ordbanken...\n');

const words = db.prepare('SELECT id, english, word_class, example_sentences FROM words').all();

let fixedCount = 0;

for (const word of words) {
  const wordClass = word.word_class || detectWordClass(word.english);
  const newExamples = generateExampleSentences(word.english, wordClass);

  // Oppdater både example_sentences og word_class hvis nødvendig
  db.prepare('UPDATE words SET example_sentences = ?, word_class = ? WHERE id = ?')
    .run(JSON.stringify(newExamples), wordClass, word.id);

  console.log(`✅ ${word.english} (${wordClass})`);
  fixedCount++;
}

console.log(`\n🎉 Ferdig! Fikset ${fixedCount} ord.`);

db.close();
