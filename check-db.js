import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('📊 Database status:\n');

// Tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('✅ Tabeller:', tables.map(t => t.name).join(', '));

// Words in universal bank
const wordCount = db.prepare('SELECT COUNT(*) as count FROM words').get();
console.log(`\n📖 Ord i universell ordbank: ${wordCount.count}`);

if (wordCount.count > 0) {
  const words = db.prepare('SELECT id, english, norwegian, word_class FROM words LIMIT 5').all();
  console.log('\nEksempler:');
  words.forEach(w => {
    console.log(`  ${w.id}. ${w.english} = ${w.norwegian} (${w.word_class || 'ikke klassifisert'})`);
  });
}

// Lessons
const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get();
console.log(`\n📚 Leksjoner: ${lessonCount.count}`);

// Lesson-words
const lessonWordsCount = db.prepare('SELECT COUNT(*) as count FROM lesson_words').get();
console.log(`🔗 Leksjon-ord koblinger: ${lessonWordsCount.count}`);

// User words
const userWordsCount = db.prepare('SELECT COUNT(*) as count FROM user_words').get();
console.log(`👤 Bruker-ord status: ${userWordsCount.count}`);

if (userWordsCount.count > 0) {
  const userWords = db.prepare(`
    SELECT uw.*, w.english, w.norwegian
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    LIMIT 3
  `).all();
  console.log('\nEksempler på bruker-ord status:');
  userWords.forEach(uw => {
    console.log(`  ${uw.english}: mastery=${uw.mastery_level}/5, practiced=${uw.times_practiced}, next=${uw.next_practice_date}`);
  });
}

db.close();
