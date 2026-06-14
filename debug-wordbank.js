import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('🔍 Debugging ordbank...\n');

// Check lessons
const lessons = db.prepare('SELECT * FROM lessons').all();
console.log('📚 Leksjoner:');
lessons.forEach(l => {
  console.log(`  ID ${l.id}: "${l.title}" (user_id=${l.user_id}, date=${l.date})`);
});

// Check words in universal bank
console.log('\n📖 Ord i universell ordbank:');
const words = db.prepare('SELECT id, english, norwegian, word_class FROM words').all();
words.forEach(w => {
  console.log(`  ID ${w.id}: ${w.english} = ${w.norwegian} (${w.word_class})`);
});

// Check lesson_words connections
console.log('\n🔗 Leksjon-ord koblinger:');
const lessonWords = db.prepare(`
  SELECT lw.*, w.english, l.title as lesson_title
  FROM lesson_words lw
  JOIN words w ON lw.word_id = w.id
  JOIN lessons l ON lw.lesson_id = l.id
`).all();
lessonWords.forEach(lw => {
  console.log(`  Leksjon "${lw.lesson_title}" → ${lw.english} (is_weekly_word=${lw.is_weekly_word})`);
});

// Check user_words
console.log('\n👤 Bruker-ord status (user_words):');
const userWords = db.prepare('SELECT * FROM user_words').all();
console.log(`  Total: ${userWords.length}`);
if (userWords.length === 0) {
  console.log('  ⚠️  PROBLEMET: Ingen user_words entries!');
  console.log('  Dette betyr at selv om ord finnes i leksjoner, har ingen bruker');
  console.log('  personlig status for ordene ennå.');
}

// Check what /api/words/all?userId=1 would return
console.log('\n🔍 Hva /api/words/all?userId=1 ville returnert:');
const apiResult = db.prepare(`
  SELECT w.id, w.english, w.norwegian, w.word_class as wordClass,
         uw.mastery_level, uw.is_mastered, uw.times_practiced,
         uw.times_completed, uw.average_score, uw.next_practice_date
  FROM user_words uw
  JOIN words w ON uw.word_id = w.id
  WHERE uw.user_id = ?
  ORDER BY uw.next_practice_date ASC
`).all(1);
console.log(`  Resultat: ${apiResult.length} ord`);

db.close();
