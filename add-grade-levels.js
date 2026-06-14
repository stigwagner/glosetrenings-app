/**
 * Legger til nivåsystem for ordbanken
 * - recommended_grade i words (hvilket klassetrinn ordet passer for)
 * - source i user_words (lokal lekse vs universell ordbank)
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('🎓 Legger til nivåsystem...\n');

// 1. Legg til recommended_grade i words
try {
  db.exec('ALTER TABLE words ADD COLUMN recommended_grade INTEGER DEFAULT 2');
  console.log('✅ Lagt til: recommended_grade i words');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  recommended_grade finnes allerede');
  } else {
    throw e;
  }
}

// 2. Legg til source i user_words
try {
  db.exec("ALTER TABLE user_words ADD COLUMN source TEXT DEFAULT 'local'");
  console.log('✅ Lagt til: source i user_words');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  source finnes allerede');
  } else {
    throw e;
  }
}

console.log('\n📊 Tagger eksisterende ord med klassetrinn...\n');

// Grunnleggende ord - Klassetrinn 1-2
const grade1_2 = [
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'a', 'an', 'the',
  'is', 'am', 'are', 'be',
  'have', 'has',
  'do', 'does',
  'can',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'in', 'on', 'at', 'to', 'from', 'with',
  'and', 'or', 'but',
  'what', 'where', 'when', 'who', 'how',
  'big', 'small', 'good', 'bad', 'happy', 'sad',
  'cat', 'dog', 'house', 'tree', 'book', 'food', 'water',
  'like', 'go', 'come', 'see', 'eat', 'drink', 'play', 'run'
];

// Vanlige ord - Klassetrinn 3-4
const grade3_4 = [
  'mountain', 'valley', 'river', 'forest', 'lake',
  'weather', 'rain', 'snow', 'sun', 'wind',
  'animal', 'bird', 'fish',
  'school', 'teacher', 'student',
  'quick', 'slow', 'fast', 'wide', 'long', 'short',
  'bring', 'find', 'meet', 'help', 'work', 'study',
  'because', 'if', 'when', 'while',
  'important', 'interesting'
];

// Avanserte ord - Klassetrinn 5-7
const grade5_7 = [
  'glacier', 'volcano', 'canyon', 'peninsula',
  'altitude', 'landscape',
  'tourist', 'hiking',
  'challenge', 'imagine', 'explain',
  'rage', 'excitement', 'anxiety', 'courage', 'wisdom'
];

// Oppdater ord med klassetrinn
for (const word of grade1_2) {
  const result = db.prepare('UPDATE words SET recommended_grade = 2 WHERE LOWER(english) = ?').run(word.toLowerCase());
  if (result.changes > 0) {
    console.log(`  📘 Klassetrinn 2: ${word}`);
  }
}

for (const word of grade3_4) {
  const result = db.prepare('UPDATE words SET recommended_grade = 4 WHERE LOWER(english) = ?').run(word.toLowerCase());
  if (result.changes > 0) {
    console.log(`  📗 Klassetrinn 4: ${word}`);
  }
}

for (const word of grade5_7) {
  const result = db.prepare('UPDATE words SET recommended_grade = 6 WHERE LOWER(english) = ?').run(word.toLowerCase());
  if (result.changes > 0) {
    console.log(`  📕 Klassetrinn 6: ${word}`);
  }
}

// Statistikk
console.log('\n📊 Statistikk:\n');
const stats = db.prepare(`
  SELECT recommended_grade, COUNT(*) as count
  FROM words
  GROUP BY recommended_grade
  ORDER BY recommended_grade
`).all();

stats.forEach(s => {
  console.log(`  Klassetrinn ${s.recommended_grade}: ${s.count} ord`);
});

console.log('\n✅ Ferdig!');

db.close();
