/**
 * Migrasjonsskript: Konverterer database til v2-struktur
 * - Universell ordbank
 * - Mastery-system (5 ganger = lært)
 * - Ukens ord vs repetisjoner
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starter migrasjon til v2...\n');

// Backup gammel database
const backupPath = 'glosetrenings.db.backup';
if (fs.existsSync('glosetrenings.db')) {
  fs.copyFileSync('glosetrenings.db', backupPath);
  console.log(`✅ Backup lagret: ${backupPath}`);
}

const db = new Database('glosetrenings.db');

// Les gammel data før vi erstatter tabellene
console.log('\n📊 Leser eksisterende data...');

const oldUsers = db.prepare('SELECT * FROM users').all();
const oldLessons = db.prepare('SELECT * FROM lessons').all();
const oldWords = db.prepare('SELECT * FROM words').all();
const oldTestResults = db.prepare('SELECT * FROM test_results').all();

console.log(`  - ${oldUsers.length} brukere`);
console.log(`  - ${oldLessons.length} leksjoner`);
console.log(`  - ${oldWords.length} ord`);
console.log(`  - ${oldTestResults.length} testresultater`);

// Dropp gamle tabeller
console.log('\n🗑️  Sletter gamle tabeller...');
db.exec('DROP TABLE IF EXISTS lesson_words');
db.exec('DROP TABLE IF EXISTS user_words');
db.exec('DROP TABLE IF EXISTS test_results');
db.exec('DROP TABLE IF EXISTS words');
db.exec('DROP TABLE IF EXISTS lessons');

// Opprett nye tabeller
console.log('\n🏗️  Oppretter ny struktur...');
const schema = fs.readFileSync(path.join(__dirname, 'schema-v2.sql'), 'utf-8');
db.exec(schema);

console.log('\n📥 Migrerer data...\n');

// 1. Migrer ord til universell ordbank
console.log('1️⃣  Migrerer ord til universell ordbank...');
const wordMap = new Map(); // gammel id -> ny id

for (const oldWord of oldWords) {
  // Sjekk om ordet allerede finnes (basert på engelsk)
  const existing = db.prepare('SELECT id FROM words WHERE english = ?').get(oldWord.english);

  if (existing) {
    wordMap.set(oldWord.id, existing.id);
  } else {
    const result = db.prepare(`
      INSERT INTO words (english, norwegian, word_class, synonyms, antonyms, example_sentences, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      oldWord.english,
      oldWord.norwegian,
      oldWord.word_class,
      oldWord.synonyms,
      oldWord.antonyms,
      oldWord.example_sentences,
      oldWord.image_url,
      oldWord.created_at
    );
    wordMap.set(oldWord.id, result.lastInsertRowid);
  }
}

console.log(`   ✓ ${wordMap.size} unike ord i universell ordbank`);

// 2. Migrer leksjoner (uendret)
console.log('\n2️⃣  Migrerer leksjoner...');
const lessonMap = new Map();

for (const oldLesson of oldLessons) {
  const result = db.prepare(`
    INSERT INTO lessons (id, user_id, title, description, date, school_year, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    oldLesson.id,
    oldLesson.user_id,
    oldLesson.title,
    oldLesson.description,
    oldLesson.date,
    oldLesson.school_year,
    oldLesson.image_url,
    oldLesson.created_at
  );
  lessonMap.set(oldLesson.id, result.lastInsertRowid);
}

console.log(`   ✓ ${lessonMap.size} leksjoner migrert`);

// 3. Opprett lesson_words koblinger
console.log('\n3️⃣  Oppretter leksjon-ord koblinger...');
let lessonWordsCount = 0;

for (const oldWord of oldWords) {
  const newWordId = wordMap.get(oldWord.id);
  const lessonId = oldWord.lesson_id;

  if (newWordId && lessonId) {
    try {
      db.prepare(`
        INSERT INTO lesson_words (lesson_id, word_id, is_weekly_word)
        VALUES (?, ?, 1)
      `).run(lessonId, newWordId);
      lessonWordsCount++;
    } catch (e) {
      // Ignorer duplikater
    }
  }
}

console.log(`   ✓ ${lessonWordsCount} leksjon-ord koblinger`);

// 4. Opprett user_words med mastery-tracking
console.log('\n4️⃣  Oppretter bruker-ord status med mastery...');
const userWordStats = new Map();

// Samle statistikk fra testresultater
for (const testResult of oldTestResults) {
  const oldWordId = testResult.word_id;
  const newWordId = wordMap.get(oldWordId);
  const userId = testResult.user_id;

  if (!newWordId || !userId) continue;

  const key = `${userId}-${newWordId}`;

  if (!userWordStats.has(key)) {
    userWordStats.set(key, {
      userId,
      wordId: newWordId,
      timesPracticed: 0,
      timesCompleted: 0,
      totalScore: 0,
      scoreCount: 0,
      lastPracticed: testResult.completed_at,
    });
  }

  const stats = userWordStats.get(key);
  stats.timesPracticed++;

  // Telle som "completed" hvis score >= 6
  if (testResult.score >= 6) {
    stats.timesCompleted++;
  }

  stats.totalScore += testResult.score;
  stats.scoreCount++;

  if (testResult.completed_at > stats.lastPracticed) {
    stats.lastPracticed = testResult.completed_at;
  }
}

// Opprett user_words entries
for (const [key, stats] of userWordStats) {
  const averageScore = stats.scoreCount > 0 ? stats.totalScore / stats.scoreCount : 0;
  const masteryLevel = Math.min(stats.timesCompleted, 5);
  const isMastered = masteryLevel >= 5 ? 1 : 0;

  // Neste øvingsdato = siste dato + 7 dager hvis ikke mestret
  const lastDate = new Date(stats.lastPracticed);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + (isMastered ? 30 : 7));

  db.prepare(`
    INSERT INTO user_words (
      user_id, word_id, times_practiced, times_completed, mastery_level,
      average_score, last_practiced_date, next_practice_date, is_mastered
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    stats.userId,
    stats.wordId,
    stats.timesPracticed,
    stats.timesCompleted,
    masteryLevel,
    averageScore,
    stats.lastPracticed,
    nextDate.toISOString().split('T')[0],
    isMastered
  );
}

console.log(`   ✓ ${userWordStats.size} bruker-ord statusar med mastery`);

// 5. Migrer testresultater
console.log('\n5️⃣  Migrerer testresultater...');
let migratedTests = 0;

for (const oldTest of oldTestResults) {
  const newWordId = wordMap.get(oldTest.word_id);

  if (!newWordId) continue;

  db.prepare(`
    INSERT INTO test_results (
      user_id, word_id, lesson_id, test_type, score, attempts,
      hints_used, time_spent, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    oldTest.user_id,
    newWordId,
    oldTest.lesson_id || null,
    oldTest.test_type,
    oldTest.score,
    oldTest.attempts,
    oldTest.hints_used,
    oldTest.time_spent,
    oldTest.completed_at
  );
  migratedTests++;
}

console.log(`   ✓ ${migratedTests} testresultater migrert`);

console.log('\n✅ Migrasjon fullført!\n');
console.log('📊 Oppsummering:');
console.log(`   - ${wordMap.size} unike ord i universell ordbank`);
console.log(`   - ${lessonMap.size} leksjoner`);
console.log(`   - ${lessonWordsCount} leksjon-ord koblinger`);
console.log(`   - ${userWordStats.size} bruker-ord med mastery-tracking`);
console.log(`   - ${migratedTests} testresultater`);
console.log(`\n💾 Backup: ${backupPath}\n`);

db.close();
