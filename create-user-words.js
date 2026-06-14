import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('🔄 Oppretter user_words for alle leksjon-ord...\n');

// Finn alle leksjoner med tilhørende bruker
const lessonsWithWords = db.prepare(`
  SELECT
    l.user_id,
    lw.word_id,
    l.date as lesson_date,
    lw.is_weekly_word
  FROM lessons l
  JOIN lesson_words lw ON l.id = lw.lesson_id
`).all();

console.log(`Fant ${lessonsWithWords.length} leksjon-ord koblinger\n`);

let created = 0;
let existing = 0;

lessonsWithWords.forEach(({ user_id, word_id, lesson_date, is_weekly_word }) => {
  // Sjekk om user_word allerede finnes
  const existingUserWord = db.prepare(`
    SELECT id FROM user_words WHERE user_id = ? AND word_id = ?
  `).get(user_id, word_id);

  if (existingUserWord) {
    existing++;
    return;
  }

  // Opprett user_word entry med next_practice_date = lesson_date
  db.prepare(`
    INSERT INTO user_words (
      user_id, word_id, times_practiced, times_completed,
      mastery_level, average_score, next_practice_date, is_mastered
    ) VALUES (?, ?, 0, 0, 0, 0, ?, 0)
  `).run(user_id, word_id, lesson_date);

  created++;
});

console.log(`✅ Opprettet ${created} nye user_words entries`);
console.log(`ℹ️  ${existing} fantes allerede\n`);

// Vis resultat
const userWords = db.prepare(`
  SELECT uw.*, w.english, u.username
  FROM user_words uw
  JOIN words w ON uw.word_id = w.id
  JOIN users u ON uw.user_id = u.id
`).all();

console.log('📊 Resultat:');
userWords.forEach(uw => {
  console.log(`  ${uw.username}: ${uw.english} (next practice: ${uw.next_practice_date})`);
});

db.close();
