/**
 * Glosetrenings-app backend v2
 * - Universell ordbank
 * - Mastery-system (5 ganger = lært)
 * - Ukens ord vs repetisjoner
 */

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lemmatize, generateVerbForms, generatePluralForm } from './lemmatizer.js';
import { calculateCurrentGrade } from './grade-calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database setup
const db = new Database('glosetrenings.db');

// Initialize database schema
const initDb = () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema-v2.sql'), 'utf8');
  db.exec(schema);

  // Migration: Add school_start_year column if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN school_start_year INTEGER NOT NULL DEFAULT 2024');
    console.log('✅ Migration: Added school_start_year column');
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.error('Migration error:', err);
    }
  }

  // Migration: Add word form columns if they don't exist
  const wordFormColumns = [
    'plural_form TEXT',
    'verb_third_person TEXT',
    'verb_past TEXT',
    'verb_past_participle TEXT',
    'verb_present_participle TEXT'
  ];

  for (const column of wordFormColumns) {
    try {
      db.exec(`ALTER TABLE words ADD COLUMN ${column}`);
      console.log(`✅ Migration: Added ${column.split(' ')[0]} column to words`);
    } catch (err) {
      // Column already exists, ignore error
      if (!err.message.includes('duplicate column name')) {
        console.error(`Migration error for ${column}:`, err);
      }
    }
  }

  // Migration: Add source column to user_words if it doesn't exist
  try {
    db.exec('ALTER TABLE user_words ADD COLUMN source TEXT DEFAULT "universal"');
    console.log('✅ Migration: Added source column to user_words');
  } catch (err) {
    // Column already exists, ignore error
    if (!err.message.includes('duplicate column name')) {
      console.error('Migration error for source column:', err);
    }
  }

  console.log('✅ Database initialized');
};

// Run initialization
initDb();

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to detect word class
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

// Initialize test users if not exists
function ensureTestUsers() {
  const hermann = db.prepare('SELECT id FROM users WHERE username = ?').get('hermann');
  const vilma = db.prepare('SELECT id FROM users WHERE username = ?').get('vilma');

  if (!hermann) {
    const passwordHash = hashPassword('pwpw67');
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, birth_year, school_start_year, grade) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('hermann', passwordHash, 'Hermann', 2018, 2024, 2);
    console.log('✅ Created user: hermann (password: pwpw67)');
  }

  if (!vilma) {
    const passwordHash = hashPassword('pwpw67');
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, birth_year, school_start_year, grade) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('vilma', passwordHash, 'Vilma', 2016, 2022, 4);
    console.log('✅ Created user: vilma (password: pwpw67)');
  }
}

ensureTestUsers();

// ============= AUTH ENDPOINTS =============

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const passwordHash = hashPassword(password);

  const user = db.prepare(
    'SELECT id, username, display_name, birth_year, school_start_year, grade FROM users WHERE username = ? AND password_hash = ?'
  ).get(username, passwordHash);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Beregn nåværende klassetrinn dynamisk basert på school_start_year og dagens dato
  const currentGrade = calculateCurrentGrade(user.school_start_year);

  // Oppdater last_login og grade i databasen
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, grade = ? WHERE id = ?')
    .run(currentGrade, user.id);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      birthYear: user.birth_year,
      grade: currentGrade  // Bruk dynamisk beregnet klassetrinn
    }
  });
});

// ============= LESSONS ENDPOINTS =============

app.get('/api/lessons', (req, res) => {
  const { userId } = req.query;
  const lessons = db.prepare('SELECT * FROM lessons WHERE user_id = ? ORDER BY date DESC').all(userId);
  res.json({ lessons });
});

app.post('/api/lessons', (req, res) => {
  const { userId, title, description, date, schoolYear, imageUrl } = req.body;

  const result = db.prepare(
    'INSERT INTO lessons (user_id, title, description, date, school_year, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, title, description, date, schoolYear, imageUrl);

  res.json({ id: result.lastInsertRowid });
});

// Get words for a lesson (with user mastery status)
app.get('/api/lessons/:lessonId/words', (req, res) => {
  const { lessonId } = req.params;

  const query = `
    SELECT
      w.id,
      w.english,
      w.norwegian,
      w.word_class as wordClass,
      w.synonyms,
      w.antonyms,
      w.example_sentences as exampleSentences,
      w.image_url as imageUrl,
      lw.is_weekly_word as isWeeklyWord,
      uw.mastery_level as masteryLevel,
      uw.is_mastered as isMastered
    FROM lesson_words lw
    JOIN words w ON lw.word_id = w.id
    LEFT JOIN user_words uw ON w.id = uw.word_id AND uw.user_id = (SELECT user_id FROM lessons WHERE id = ?)
    WHERE lw.lesson_id = ?
  `;

  const words = db.prepare(query).all(lessonId, lessonId);

  const parsedWords = words.map(word => ({
    ...word,
    synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
    antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
    exampleSentences: word.exampleSentences ? JSON.parse(word.exampleSentences) : []
  }));

  res.json({ words: parsedWords });
});

// Add word to lesson (creates word in universal bank if not exists, adds to lesson_words, creates user_words)
app.post('/api/lessons/:lessonId/words', (req, res) => {
  const { lessonId } = req.params;
  const { english, norwegian, wordClass, synonyms, antonyms, imageUrl, exampleSentences } = req.body;

  // Get userId from lesson
  const lesson = db.prepare('SELECT user_id FROM lessons WHERE id = ?').get(lessonId);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  // LEMMATIZE - finn grunnform
  const lemma = lemmatize(english);

  // Check if word exists in universal bank (søk på grunnform)
  let word = db.prepare('SELECT id FROM words WHERE english = ?').get(lemma);

  if (!word) {
    // Generer bøyningsformer
    let pluralForm = null;
    let verbThirdPerson = null, verbPast = null, verbPastParticiple = null, verbPresentParticiple = null;

    if (wordClass === 'verb') {
      const forms = generateVerbForms(lemma);
      verbThirdPerson = forms.thirdPerson;
      verbPast = forms.past;
      verbPastParticiple = forms.pastParticiple;
      verbPresentParticiple = forms.presentParticiple;
    } else if (wordClass === 'noun') {
      pluralForm = generatePluralForm(lemma);
    }

    // Create new word in universal bank
    const result = db.prepare(`
      INSERT INTO words (
        english, norwegian, word_class, synonyms, antonyms, image_url, example_sentences,
        plural_form, verb_third_person, verb_past, verb_past_participle, verb_present_participle
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lemma,  // Lagre grunnformen
      norwegian,
      wordClass,
      JSON.stringify(synonyms || []),
      JSON.stringify(antonyms || []),
      imageUrl,
      JSON.stringify(exampleSentences || []),
      pluralForm,
      verbThirdPerson,
      verbPast,
      verbPastParticiple,
      verbPresentParticiple
    );
    word = { id: result.lastInsertRowid };
  }

  // Add to lesson_words (mark as weekly word)
  try {
    db.prepare('INSERT INTO lesson_words (lesson_id, word_id, is_weekly_word) VALUES (?, ?, 1)')
      .run(lessonId, word.id);
  } catch (e) {
    // Already exists in this lesson
  }

  // Create user_words entry for this user if not exists
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare(`
      INSERT INTO user_words (user_id, word_id, next_practice_date, source)
      VALUES (?, ?, ?, 'local')
    `).run(lesson.user_id, word.id, today);
  } catch (e) {
    // Already exists - update next practice date and mark as local if needed
    db.prepare(`UPDATE user_words
                SET next_practice_date = ?, source = 'local'
                WHERE user_id = ? AND word_id = ?`)
      .run(today, lesson.user_id, word.id);
  }

  res.json({ id: word.id });
});

// ============= WORDS ENDPOINTS =============

// Check for existing words in universal bank
app.get('/api/words/check-existing', (req, res) => {
  const { userId, words } = req.query;
  const wordsList = JSON.parse(words);

  // Check against universal word bank
  const existingWordsInDb = db.prepare('SELECT id, english, norwegian, word_class FROM words').all();
  const existingWordsMap = new Map(existingWordsInDb.map(w => [w.english.toLowerCase(), w]));

  const existingWords = [];
  const newWords = [];

  wordsList.forEach(word => {
    if (existingWordsMap.has(word.toLowerCase())) {
      existingWords.push(existingWordsMap.get(word.toLowerCase()));
    } else {
      newWords.push(word);
    }
  });

  res.json({ existingWords, newWords });
});

// Get all words for a user (with mastery status)
app.get('/api/words/all', (req, res) => {
  const { userId } = req.query;

  const query = `
    SELECT
      w.id,
      w.english,
      w.norwegian,
      w.word_class as wordClass,
      w.plural_form as pluralForm,
      w.verb_third_person as verbThirdPerson,
      w.verb_past as verbPast,
      w.verb_past_participle as verbPastParticiple,
      w.verb_present_participle as verbPresentParticiple,
      l.title as lessonTitle,
      l.date as lessonDate,
      uw.mastery_level as masteryLevel,
      uw.is_mastered as isMastered,
      uw.times_practiced as timesPracticed,
      uw.times_completed as timesCompleted,
      uw.average_score as averageScore,
      uw.last_practiced_date as lastPracticed,
      uw.next_practice_date as nextPracticeDate
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    LEFT JOIN lesson_words lw ON w.id = lw.word_id
    LEFT JOIN lessons l ON lw.lesson_id = l.id AND l.user_id = ?
    WHERE uw.user_id = ?
    GROUP BY w.id
    ORDER BY uw.next_practice_date DESC, w.english ASC
  `;

  const words = db.prepare(query).all(userId, userId);
  res.json({ words });
});

// Get universal word bank (all words in system)
app.get('/api/words/universal', (req, res) => {
  const query = `
    SELECT
      w.id,
      w.english,
      w.norwegian,
      w.word_class as wordClass,
      w.plural_form as pluralForm,
      w.verb_third_person as verbThirdPerson,
      w.verb_past as verbPast,
      w.verb_past_participle as verbPastParticiple,
      w.verb_present_participle as verbPresentParticiple,
      w.created_at as createdAt,
      COUNT(DISTINCT uw.user_id) as userCount
    FROM words w
    LEFT JOIN user_words uw ON w.id = uw.word_id
    GROUP BY w.id
    ORDER BY w.english ASC
  `;

  const words = db.prepare(query).all();
  res.json({ words });
});

// Update word in universal bank
app.put('/api/words/:wordId', (req, res) => {
  const { wordId } = req.params;
  const { english, norwegian, wordClass } = req.body;

  try {
    db.prepare(
      'UPDATE words SET english = ?, norwegian = ?, word_class = ? WHERE id = ?'
    ).run(english, norwegian, wordClass, wordId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// Update practice date for a user's word
app.put('/api/words/:wordId/update-practice-date', (req, res) => {
  const { wordId } = req.params;
  const { date, userId } = req.body;

  // Update in user_words
  try {
    db.prepare('UPDATE user_words SET next_practice_date = ? WHERE word_id = ? AND user_id = ?')
      .run(date, wordId, userId || 1);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update practice date' });
  }
});

// Update lesson date for a word
app.put('/api/words/:wordId/update-lesson-date', (req, res) => {
  const { wordId } = req.params;
  const { date, userId } = req.body;

  try {
    // Find the lesson that contains this word for this user
    const lessonWord = db.prepare(`
      SELECT lw.lesson_id
      FROM lesson_words lw
      JOIN lessons l ON lw.lesson_id = l.id
      WHERE lw.word_id = ? AND l.user_id = ?
      LIMIT 1
    `).get(wordId, userId);

    if (lessonWord) {
      // Update the lesson date
      db.prepare('UPDATE lessons SET date = ? WHERE id = ?')
        .run(date, lessonWord.lesson_id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Lesson not found for this word' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lesson date' });
  }
});

// Delete a word from universal bank (cascades to user_words and lesson_words)
app.delete('/api/words/:wordId', (req, res) => {
  const { wordId } = req.params;

  try {
    db.prepare('DELETE FROM words WHERE id = ?').run(wordId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

// Bulk delete words
app.post('/api/words/bulk-delete', (req, res) => {
  const { wordIds } = req.body;

  if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
    return res.status(400).json({ error: 'wordIds must be a non-empty array' });
  }

  try {
    const placeholders = wordIds.map(() => '?').join(',');
    const deleteStmt = db.prepare(`DELETE FROM words WHERE id IN (${placeholders})`);
    const result = deleteStmt.run(...wordIds);

    res.json({
      success: true,
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete words' });
  }
});

// Add word manually to universal bank and user's practice list
app.post('/api/words/manual', (req, res) => {
  const { userId, english, norwegian, wordClass } = req.body;

  try {
    // Check if word exists
    let word = db.prepare('SELECT id FROM words WHERE english = ?').get(english);

    if (!word) {
      // Create in universal bank
      const result = db.prepare(
        'INSERT INTO words (english, norwegian, word_class) VALUES (?, ?, ?)'
      ).run(english, norwegian, wordClass);
      word = { id: result.lastInsertRowid };
    }

    const today = new Date().toISOString().split('T')[0];

    // Find or create "Manuelt lagt til" lesson for today
    let lesson = db.prepare(`
      SELECT id FROM lessons
      WHERE user_id = ? AND title = ? AND date = ?
    `).get(userId, 'Manuelt lagt til', today);

    if (!lesson) {
      const year = new Date().getFullYear();
      const lessonResult = db.prepare(`
        INSERT INTO lessons (user_id, title, description, date, school_year)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 'Manuelt lagt til', 'Ord lagt til manuelt', today, `${year}/${year + 1}`);
      lesson = { id: lessonResult.lastInsertRowid };
    }

    // Add to lesson_words
    try {
      db.prepare(`
        INSERT INTO lesson_words (lesson_id, word_id, is_weekly_word)
        VALUES (?, ?, 1)
      `).run(lesson.id, word.id);
    } catch (e) {
      // Already in lesson
    }

    // Add to user's practice list
    try {
      db.prepare(`
        INSERT INTO user_words (user_id, word_id, next_practice_date)
        VALUES (?, ?, ?)
      `).run(userId, word.id, today);
    } catch (e) {
      // Already exists - update date instead
      db.prepare(`
        UPDATE user_words SET next_practice_date = ?
        WHERE user_id = ? AND word_id = ?
      `).run(today, userId, word.id);
    }

    res.json({ id: word.id, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// ============= TEST RESULTS =============

app.post('/api/test-results', (req, res) => {
  const { userId, wordId, testType, score, attempts, hintsUsed, timeSpent, lessonId } = req.body;

  // Save test result
  const result = db.prepare(`
    INSERT INTO test_results (user_id, word_id, lesson_id, test_type, score, attempts, hints_used, time_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, wordId, lessonId || null, testType, score, attempts, hintsUsed, timeSpent);

  // Update user_words mastery
  const userWord = db.prepare('SELECT * FROM user_words WHERE user_id = ? AND word_id = ?').get(userId, wordId);

  if (userWord) {
    const newTimesPracticed = userWord.times_practiced + 1;
    const newTimesCompleted = score >= 6 ? userWord.times_completed + 1 : userWord.times_completed;
    const newMasteryLevel = Math.min(newTimesCompleted, 5);
    const newIsMastered = newMasteryLevel >= 5 ? 1 : 0;

    // Calculate new average score
    const oldTotal = userWord.average_score * userWord.times_practiced;
    const newAverage = (oldTotal + score) / newTimesPracticed;

    // Set next practice date based on mastery
    const nextDate = new Date();
    if (newIsMastered) {
      nextDate.setDate(nextDate.getDate() + 30); // Mestret: 30 dager
    } else if (newMasteryLevel >= 3) {
      nextDate.setDate(nextDate.getDate() + 14); // God fremgang: 14 dager
    } else {
      nextDate.setDate(nextDate.getDate() + 7); // Standard: 7 dager
    }

    db.prepare(`
      UPDATE user_words
      SET times_practiced = ?,
          times_completed = ?,
          mastery_level = ?,
          is_mastered = ?,
          average_score = ?,
          last_practiced_date = CURRENT_TIMESTAMP,
          next_practice_date = ?
      WHERE user_id = ? AND word_id = ?
    `).run(
      newTimesPracticed,
      newTimesCompleted,
      newMasteryLevel,
      newIsMastered,
      newAverage,
      nextDate.toISOString().split('T')[0],
      userId,
      wordId
    );
  }

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare(`
      INSERT INTO daily_activity (user_id, activity_date, words_practiced, total_score, tests_completed)
      VALUES (?, ?, 1, ?, 1)
    `).run(userId, today, score);
  } catch (error) {
    db.prepare(`
      UPDATE daily_activity
      SET words_practiced = words_practiced + 1,
          total_score = total_score + ?,
          tests_completed = tests_completed + 1
      WHERE user_id = ? AND activity_date = ?
    `).run(score, userId, today);
  }

  // Check and award badges
  checkBadges(userId);

  res.json({ id: result.lastInsertRowid });
});

// ============= STATS & BADGES =============

function checkBadges(userId) {
  // Samle alle relevante statistikker
  const totalTests = db.prepare('SELECT COUNT(*) as count FROM test_results WHERE user_id = ?').get(userId).count;
  const totalWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ?').get(userId).count;
  const masteredWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ? AND is_mastered = 1').get(userId).count;
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM test_results WHERE user_id = ?').get(userId).avg || 0;

  // Hent aktivitetsdata for streak-beregning
  const recentActivity = db.prepare(`
    SELECT * FROM daily_activity
    WHERE user_id = ?
    ORDER BY activity_date DESC
    LIMIT 30
  `).all(userId);

  const currentStreak = calculateCurrentStreak(recentActivity);

  // NYE BADGES: Ukentlige og månedlige statistikker

  // Nye ord siste 7 dager (basert på når de ble lagt til)
  const weeklyNewWords = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_words
    WHERE user_id = ?
    AND date(created_at) >= date('now', '-7 days')
  `).get(userId).count;

  // Total øving siste 7 dager (alle test_results)
  const weeklyTotalPractice = db.prepare(`
    SELECT COUNT(*) as count
    FROM test_results
    WHERE user_id = ?
    AND date(completed_at) >= date('now', '-7 days')
  `).get(userId).count;

  // Nye ord siste 30 dager
  const monthlyNewWords = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_words
    WHERE user_id = ?
    AND date(created_at) >= date('now', '-30 days')
  `).get(userId).count;

  // Weekly streak (antall dager med aktivitet siste 7 dager)
  const weeklyStreak = db.prepare(`
    SELECT COUNT(DISTINCT date(activity_date)) as count
    FROM daily_activity
    WHERE user_id = ?
    AND date(activity_date) >= date('now', '-7 days')
  `).get(userId).count;

  // Andre statistikker (fra tidligere)
  const testStats = db.prepare(`
    SELECT
      COUNT(DISTINCT word_id) as words_completed,
      SUM(CASE WHEN score = 10 THEN 1 ELSE 0 END) as perfect_scores,
      SUM(CASE WHEN test_type = 'grammar' THEN 1 ELSE 0 END) as grammar_completed,
      SUM(CASE WHEN test_type = 'pronunciation' THEN 1 ELSE 0 END) as pronunciation_completed
    FROM test_results
    WHERE user_id = ?
  `).get(userId);

  const badges = db.prepare('SELECT id, requirement_type, requirement_value FROM badges').all();

  badges.forEach(badge => {
    const hasEarned = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?')
      .get(userId, badge.id);

    if (!hasEarned) {
      let shouldAward = false;

      // Sjekk alle requirement types
      switch (badge.requirement_type) {
        case 'total_tests':
        case 'tests_completed':
          shouldAward = totalTests >= badge.requirement_value;
          break;

        case 'total_words':
        case 'unique_words':
          shouldAward = totalWords >= badge.requirement_value;
          break;

        case 'mastered_words':
          shouldAward = masteredWords >= badge.requirement_value;
          break;

        case 'average_score':
          shouldAward = avgScore >= badge.requirement_value;
          break;

        case 'current_streak':
        case 'streak_days':
          shouldAward = currentStreak >= badge.requirement_value;
          break;

        case 'words_completed':
          shouldAward = testStats.words_completed >= badge.requirement_value;
          break;

        case 'perfect_scores':
        case 'perfect_score':
          shouldAward = testStats.perfect_scores >= badge.requirement_value;
          break;

        case 'grammar_completed':
          shouldAward = testStats.grammar_completed >= badge.requirement_value;
          break;

        case 'perfect_pronunciation':
          shouldAward = testStats.pronunciation_completed >= badge.requirement_value;
          break;

        // NYE BADGE TYPES
        case 'weekly_new_words':
          shouldAward = weeklyNewWords >= badge.requirement_value;
          break;

        case 'weekly_total_practice':
          shouldAward = weeklyTotalPractice >= badge.requirement_value;
          break;

        case 'monthly_new_words':
          shouldAward = monthlyNewWords >= badge.requirement_value;
          break;

        case 'weekly_streak':
          shouldAward = weeklyStreak >= badge.requirement_value;
          break;
      }

      if (shouldAward) {
        try {
          db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
        } catch (e) {
          // Badge already awarded
        }
      }
    }
  });
}

// Streak calculation helper functions
function calculateCurrentStreak(activities) {
  if (!activities || activities.length === 0) return 0;

  const sortedActivities = [...activities].sort((a, b) =>
    new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].activityDate);
    activityDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (activityDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(activities) {
  if (!activities || activities.length === 0) return 0;

  const sortedActivities = [...activities].sort((a, b) =>
    new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime()
  );

  let longestStreak = 0;
  let currentStreakCount = 1;

  for (let i = 1; i < sortedActivities.length; i++) {
    const prevDate = new Date(sortedActivities[i - 1].activityDate);
    prevDate.setHours(0, 0, 0, 0);

    const currDate = new Date(sortedActivities[i].activityDate);
    currDate.setHours(0, 0, 0, 0);

    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreakCount++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreakCount);
      currentStreakCount = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreakCount);
  return longestStreak;
}

app.get('/api/users/:userId/stats', (req, res) => {
  const { userId } = req.params;

  const totalWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ?').get(userId).count;
  const masteredWords = db.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ? AND is_mastered = 1').get(userId).count;
  const totalTests = db.prepare('SELECT COUNT(*) as count FROM test_results WHERE user_id = ?').get(userId).count;
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM test_results WHERE user_id = ?').get(userId).avg || 0;

  // Ord klare for øving i dag
  const wordsReadyToday = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_words
    WHERE user_id = ? AND date(next_practice_date) <= date('now')
  `).get(userId).count;

  // Ord nær mestring (times_completed 3 eller 4)
  const wordsNearMastery = db.prepare(`
    SELECT w.english, w.norwegian, uw.times_completed
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = ? AND uw.times_completed IN (3, 4) AND uw.is_mastered = 0
    ORDER BY uw.times_completed DESC
    LIMIT 10
  `).all(userId);

  const badges = db.prepare(`
    SELECT b.*, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
  `).all(userId);

  const recentActivity = db.prepare(`
    SELECT * FROM daily_activity
    WHERE user_id = ?
    ORDER BY activity_date DESC
    LIMIT 30
  `).all(userId);

  // Beregn streaks
  const currentStreak = calculateCurrentStreak(recentActivity);
  const longestStreak = calculateLongestStreak(recentActivity);

  res.json({
    totalWords,
    masteredWords,
    totalTests,
    averageScore: avgScore,
    wordsReadyToday,
    wordsNearMastery,
    currentStreak,
    longestStreak,
    badges,
    recentActivity
  });
});

// POST /api/practice/start-session - Start daily practice with unique words
// PRIORITET: 1) Lokale ord (lekser), 2) Repetisjon, 3) Nye universelle ord (klassetrinn)
app.post('/api/practice/start-session', (req, res) => {
  const { userId, wordCount = 10 } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId er påkrevd' });
  }

  // Hent brukerens klassetrinn
  const user = db.prepare('SELECT grade FROM users WHERE id = ?').get(userId);
  const userGrade = user?.grade || 2;

  const selectedWords = [];
  const usedWordIds = new Set();

  // PRIORITET 1: LOKALE ORD (fra skannede lekser)
  const localWords = db.prepare(`
    SELECT
      w.id,
      w.english,
      w.norwegian,
      w.word_class as wordClass,
      w.synonyms,
      w.antonyms,
      w.example_sentences as exampleSentences,
      w.image_url as imageUrl,
      uw.times_completed as timesCompleted,
      uw.source
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = ?
      AND uw.source = 'local'
      AND date(uw.next_practice_date) <= date('now')
      AND uw.is_mastered = 0
    ORDER BY uw.times_completed ASC, uw.next_practice_date ASC
    LIMIT ?
  `).all(userId, wordCount);

  for (const word of localWords) {
    if (selectedWords.length < wordCount) {
      selectedWords.push({
        ...word,
        synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
        antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
        exampleSentences: word.exampleSentences ? JSON.parse(word.exampleSentences) : []
      });
      usedWordIds.add(word.id);
    }
  }

  // PRIORITET 2: REPETISJON av universelle ord (allerede i user_words)
  if (selectedWords.length < wordCount) {
    const repetitionWords = db.prepare(`
      SELECT
        w.id,
        w.english,
        w.norwegian,
        w.word_class as wordClass,
        w.synonyms,
        w.antonyms,
        w.example_sentences as exampleSentences,
        w.image_url as imageUrl,
        uw.times_completed as timesCompleted,
        uw.source
      FROM user_words uw
      JOIN words w ON uw.word_id = w.id
      WHERE uw.user_id = ?
        AND uw.source = 'universal'
        AND date(uw.next_practice_date) <= date('now')
        AND uw.is_mastered = 0
      ORDER BY uw.times_completed ASC, uw.next_practice_date ASC
      LIMIT ?
    `).all(userId, wordCount - selectedWords.length);

    for (const word of repetitionWords) {
      if (!usedWordIds.has(word.id) && selectedWords.length < wordCount) {
        selectedWords.push({
          ...word,
          synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
          antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
          exampleSentences: word.exampleSentences ? JSON.parse(word.exampleSentences) : []
        });
        usedWordIds.add(word.id);
      }
    }
  }

  // PRIORITET 3: NYE UNIVERSELLE ORD (filtrert på klassetrinn)
  if (selectedWords.length < wordCount) {
    const newWords = db.prepare(`
      SELECT
        w.id,
        w.english,
        w.norwegian,
        w.word_class as wordClass,
        w.synonyms,
        w.antonyms,
        w.example_sentences as exampleSentences,
        w.image_url as imageUrl,
        w.recommended_grade as recommendedGrade
      FROM words w
      WHERE w.id NOT IN (
        SELECT word_id FROM user_words WHERE user_id = ?
      )
      AND w.recommended_grade <= ?
      ORDER BY w.recommended_grade ASC, RANDOM()
      LIMIT ?
    `).all(userId, userGrade, wordCount - selectedWords.length);

    const today = new Date().toISOString().split('T')[0];

    for (const word of newWords) {
      if (!usedWordIds.has(word.id) && selectedWords.length < wordCount) {
        // Legg til i user_words som universelt ord
        db.prepare(`
          INSERT INTO user_words (user_id, word_id, next_practice_date, source)
          VALUES (?, ?, ?, 'universal')
        `).run(userId, word.id, today);

        selectedWords.push({
          ...word,
          synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
          antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
          exampleSentences: word.exampleSentences ? JSON.parse(word.exampleSentences) : [],
          timesCompleted: 0,
          source: 'universal'
        });
        usedWordIds.add(word.id);
      }
    }
  }

  res.json({ words: selectedWords });
});

// Export user data endpoint
app.get('/api/users/:userId/export', (req, res) => {
  const { userId } = req.params;

  try {
    // Hent brukerinfo
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Bruker ikke funnet' });
    }

    // Hent alle brukerens leksjoner
    const lessons = db.prepare('SELECT * FROM lessons WHERE user_id = ? ORDER BY date DESC').all(userId);

    // Hent alle brukerens ord (med leksjoner)
    const userWords = db.prepare(`
      SELECT uw.*, w.english, w.norwegian, w.word_class, w.image_url
      FROM user_words uw
      JOIN words w ON uw.word_id = w.id
      WHERE uw.user_id = ?
      ORDER BY uw.created_at DESC
    `).all(userId);

    // Hent testresultater
    const testResults = db.prepare(`
      SELECT tr.*, w.english, w.norwegian
      FROM test_results tr
      JOIN words w ON tr.word_id = w.id
      WHERE tr.user_id = ?
      ORDER BY tr.completed_at DESC
    `).all(userId);

    // Hent badges
    const badges = db.prepare(`
      SELECT ub.earned_at, b.name, b.description, b.icon
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).all(userId);

    // Hent daglig aktivitet
    const dailyActivity = db.prepare(`
      SELECT * FROM daily_activity
      WHERE user_id = ?
      ORDER BY activity_date DESC
    `).all(userId);

    // Statistikk
    const stats = {
      totalWords: userWords.length,
      masteredWords: userWords.filter(w => w.is_mastered).length,
      totalTests: testResults.length,
      totalLessons: lessons.length,
      totalBadges: badges.length
    };

    // Bygg eksportdata
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      user: {
        username: user.username,
        displayName: user.display_name,
        birthYear: user.birth_year,
        grade: user.grade,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      stats,
      lessons: lessons.map(l => ({
        title: l.title,
        description: l.description,
        date: l.date,
        schoolYear: l.school_year,
        imageUrl: l.image_url,
        createdAt: l.created_at
      })),
      words: userWords.map(w => ({
        english: w.english,
        norwegian: w.norwegian,
        wordClass: w.word_class,
        imageUrl: w.image_url,
        timesCompleted: w.times_completed,
        lastPracticed: w.last_practiced,
        nextPracticeDate: w.next_practice_date,
        isMastered: w.is_mastered,
        createdAt: w.created_at
      })),
      testResults: testResults.map(tr => ({
        word: `${tr.english} → ${tr.norwegian}`,
        testType: tr.test_type,
        score: tr.score,
        attempts: tr.attempts,
        hintsUsed: tr.hints_used,
        timeSpent: tr.time_spent,
        completedAt: tr.completed_at
      })),
      badges: badges.map(b => ({
        name: b.name,
        description: b.description,
        icon: b.icon,
        earnedAt: b.earned_at
      })),
      dailyActivity: dailyActivity.map(da => ({
        date: da.activity_date,
        wordsPracticed: da.words_practiced,
        totalScore: da.total_score,
        testsCompleted: da.tests_completed
      }))
    };

    // Sett headers for filnedlasting
    const filename = `glosetrenings-backup-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Feil ved eksport av data' });
  }
});

// Weekly statistics endpoint
app.get('/api/users/:userId/weekly-stats', (req, res) => {
  const { userId } = req.params;

  // This week's stats (last 7 days)
  const thisWeekStats = db.prepare(`
    SELECT
      COALESCE(SUM(words_practiced), 0) as wordsPracticed,
      COALESCE(SUM(total_score), 0) as totalScore,
      COALESCE(SUM(tests_completed), 0) as testsCompleted,
      COUNT(*) as activeDays
    FROM daily_activity
    WHERE user_id = ?
    AND date(activity_date) >= date('now', '-7 days')
  `).get(userId);

  // Previous week's stats (8-14 days ago)
  const lastWeekStats = db.prepare(`
    SELECT
      COALESCE(SUM(words_practiced), 0) as wordsPracticed,
      COALESCE(SUM(total_score), 0) as totalScore,
      COALESCE(SUM(tests_completed), 0) as testsCompleted,
      COUNT(*) as activeDays
    FROM daily_activity
    WHERE user_id = ?
    AND date(activity_date) >= date('now', '-14 days')
    AND date(activity_date) < date('now', '-7 days')
  `).get(userId);

  // Calculate improvements
  const improvements = {
    wordsPracticed: thisWeekStats.wordsPracticed - lastWeekStats.wordsPracticed,
    totalScore: thisWeekStats.totalScore - lastWeekStats.totalScore,
    testsCompleted: thisWeekStats.testsCompleted - lastWeekStats.testsCompleted,
    activeDays: thisWeekStats.activeDays - lastWeekStats.activeDays
  };

  res.json({
    thisWeek: thisWeekStats,
    lastWeek: lastWeekStats,
    improvements
  });
});

// NYT ENDEPUNKT: Detaljert ukentlig statistikk med nye ord vs repetisjoner
app.get('/api/users/:userId/weekly-detailed', (req, res) => {
  const { userId } = req.params;

  // Nye ord siste 7 dager
  const newWordsThisWeek = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_words
    WHERE user_id = ?
    AND date(created_at) >= date('now', '-7 days')
  `).get(userId).count;

  // Total øvelser siste 7 dager
  const totalPracticeThisWeek = db.prepare(`
    SELECT COUNT(*) as count
    FROM test_results
    WHERE user_id = ?
    AND date(completed_at) >= date('now', '-7 days')
  `).get(userId).count;

  // Repetisjoner = Total practice - nye ord
  const repetitionsThisWeek = Math.max(0, totalPracticeThisWeek - newWordsThisWeek);

  // Ukentlig streak (dager med aktivitet)
  const daysActiveThisWeek = db.prepare(`
    SELECT COUNT(DISTINCT date(activity_date)) as count
    FROM daily_activity
    WHERE user_id = ?
    AND date(activity_date) >= date('now', '-7 days')
  `).get(userId).count;

  // Forrige uke (for sammenligning)
  const newWordsLastWeek = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_words
    WHERE user_id = ?
    AND date(created_at) >= date('now', '-14 days')
    AND date(created_at) < date('now', '-7 days')
  `).get(userId).count;

  const totalPracticeLastWeek = db.prepare(`
    SELECT COUNT(*) as count
    FROM test_results
    WHERE user_id = ?
    AND date(completed_at) >= date('now', '-14 days')
    AND date(completed_at) < date('now', '-7 days')
  `).get(userId).count;

  // Beregn poeng med diminishing returns (nye ord)
  let newWordsPoints = 0;
  if (newWordsThisWeek <= 10) {
    newWordsPoints = newWordsThisWeek * 10;
  } else if (newWordsThisWeek <= 20) {
    newWordsPoints = 100 + (newWordsThisWeek - 10) * 5;
  } else {
    newWordsPoints = 100 + 50 + (newWordsThisWeek - 20) * 2;
  }

  // Beregn poeng for repetisjoner
  let repetitionPoints = 0;
  if (repetitionsThisWeek <= 10) {
    repetitionPoints = repetitionsThisWeek * 5;
  } else if (repetitionsThisWeek <= 20) {
    repetitionPoints = 50 + (repetitionsThisWeek - 10) * 3;
  } else {
    repetitionPoints = 50 + 30 + (repetitionsThisWeek - 20) * 1;
  }

  const totalPoints = newWordsPoints + repetitionPoints;

  res.json({
    thisWeek: {
      newWords: newWordsThisWeek,
      repetitions: repetitionsThisWeek,
      totalPractice: totalPracticeThisWeek,
      daysActive: daysActiveThisWeek,
      points: {
        newWords: newWordsPoints,
        repetitions: repetitionPoints,
        total: totalPoints
      }
    },
    lastWeek: {
      newWords: newWordsLastWeek,
      totalPractice: totalPracticeLastWeek
    },
    improvements: {
      newWords: newWordsThisWeek - newWordsLastWeek,
      totalPractice: totalPracticeThisWeek - totalPracticeLastWeek
    }
  });
});

// ============= AI ENDPOINTS (MOCK) =============

// Simple translation dictionary (can be extended)
const translationDict = {
  // Common words
  'the': 'den/det', 'a': 'en/et', 'an': 'en/et',
  'and': 'og', 'or': 'eller', 'but': 'men',
  'in': 'i', 'on': 'på', 'at': 'på/ved', 'to': 'til', 'from': 'fra',
  'with': 'med', 'for': 'for', 'of': 'av',
  'is': 'er', 'are': 'er', 'was': 'var', 'were': 'var', 'be': 'være',
  'have': 'ha', 'has': 'har', 'had': 'hadde',
  'do': 'gjøre', 'does': 'gjør', 'did': 'gjorde',
  'will': 'vil', 'would': 'ville', 'can': 'kan', 'could': 'kunne',
  'should': 'skulle', 'may': 'kan', 'might': 'kan',

  // Pronouns
  'i': 'jeg', 'you': 'du/dere', 'he': 'han', 'she': 'hun', 'it': 'den/det',
  'we': 'vi', 'they': 'de',
  'me': 'meg', 'him': 'ham', 'her': 'henne', 'us': 'oss', 'them': 'dem',
  'my': 'min/mitt', 'your': 'din/ditt', 'his': 'hans', 'its': 'dens/dets',
  'our': 'vår', 'their': 'deres',

  // Common verbs
  'go': 'gå', 'come': 'komme', 'see': 'se', 'look': 'se/kikke',
  'make': 'lage', 'take': 'ta', 'get': 'få', 'give': 'gi',
  'find': 'finne', 'think': 'tenke', 'know': 'vite', 'want': 'ville',
  'use': 'bruke', 'work': 'jobbe', 'call': 'ringe', 'try': 'prøve',
  'ask': 'spørre', 'need': 'trenge', 'feel': 'føle', 'become': 'bli',
  'leave': 'forlate', 'put': 'sette', 'mean': 'bety', 'keep': 'holde',
  'let': 'la', 'begin': 'begynne', 'seem': 'synes', 'help': 'hjelpe',
  'talk': 'snakke', 'turn': 'snu', 'start': 'starte', 'show': 'vise',
  'hear': 'høre', 'play': 'spille/leke', 'run': 'løpe', 'move': 'bevege',
  'like': 'like', 'live': 'bo/leve', 'believe': 'tro', 'hold': 'holde',
  'bring': 'bringe', 'happen': 'skje', 'write': 'skrive', 'sit': 'sitte',
  'stand': 'stå', 'lose': 'miste', 'pay': 'betale', 'meet': 'møte',
  'include': 'inkludere', 'continue': 'fortsette', 'set': 'sette',
  'learn': 'lære', 'change': 'forandre', 'lead': 'lede', 'understand': 'forstå',
  'watch': 'se på', 'follow': 'følge', 'stop': 'stoppe', 'create': 'skape',
  'speak': 'snakke', 'read': 'lese', 'spend': 'bruke/tilbringe', 'grow': 'vokse',
  'open': 'åpne', 'walk': 'gå', 'win': 'vinne', 'offer': 'tilby',
  'remember': 'huske', 'love': 'elske', 'consider': 'vurdere',

  // Common adjectives
  'good': 'god', 'bad': 'dårlig', 'big': 'stor', 'small': 'liten',
  'new': 'ny', 'old': 'gammel', 'great': 'fantastisk', 'little': 'liten',
  'long': 'lang', 'short': 'kort', 'high': 'høy', 'low': 'lav',
  'young': 'ung', 'early': 'tidlig', 'late': 'sen', 'important': 'viktig',
  'different': 'forskjellig', 'similar': 'lik', 'large': 'stor',
  'right': 'riktig/høyre', 'wrong': 'feil', 'true': 'sann', 'false': 'usann',
  'possible': 'mulig', 'easy': 'lett', 'hard': 'vanskelig', 'simple': 'enkel',
  'clear': 'klar', 'happy': 'glad', 'sad': 'trist', 'angry': 'sint',
  'cold': 'kald', 'hot': 'varm', 'beautiful': 'vakker', 'ugly': 'stygg',
  'strong': 'sterk', 'weak': 'svak', 'fast': 'rask', 'slow': 'langsom',

  // Common nouns
  'time': 'tid', 'year': 'år', 'day': 'dag', 'week': 'uke', 'month': 'måned',
  'man': 'mann', 'woman': 'kvinne', 'child': 'barn', 'people': 'folk',
  'way': 'vei', 'thing': 'ting', 'life': 'liv', 'world': 'verden',
  'hand': 'hånd', 'part': 'del', 'place': 'sted', 'case': 'tilfelle',
  'work': 'arbeid', 'number': 'nummer', 'point': 'punkt', 'problem': 'problem',
  'fact': 'faktum', 'water': 'vann', 'food': 'mat', 'house': 'hus',
  'book': 'bok', 'eye': 'øye', 'head': 'hode', 'school': 'skole',
  'city': 'by', 'country': 'land', 'area': 'område', 'family': 'familie',
  'name': 'navn', 'word': 'ord', 'room': 'rom', 'friend': 'venn',
  'father': 'far', 'mother': 'mor', 'brother': 'bror', 'sister': 'søster',
  'home': 'hjem', 'car': 'bil', 'tree': 'tre', 'dog': 'hund', 'cat': 'katt',
  'door': 'dør', 'window': 'vindu', 'table': 'bord', 'chair': 'stol',
  'mountain': 'fjell', 'river': 'elv', 'sea': 'hav', 'forest': 'skog',
  'animal': 'dyr', 'bird': 'fugl', 'fish': 'fisk', 'flower': 'blomst',
  'sun': 'sol', 'moon': 'måne', 'star': 'stjerne', 'rain': 'regn', 'snow': 'snø',
  'ice': 'is', 'fire': 'brann/ild', 'air': 'luft', 'wind': 'vind',
  'stone': 'stein', 'rock': 'stein/klippe', 'sand': 'sand', 'ground': 'bakken',
  'lake': 'innsjø', 'island': 'øy', 'beach': 'strand', 'valley': 'dal',
  'hill': 'ås/bakke', 'glacier': 'isbre', 'waterfall': 'foss',
  'park': 'park', 'garden': 'hage', 'path': 'sti', 'road': 'vei',

  // Nature and outdoors
  'nature': 'natur', 'landscape': 'landskap', 'view': 'utsikt',
  'altitude': 'høyde over havet', 'height': 'høyde', 'depth': 'dybde',
  'distance': 'avstand', 'direction': 'retning',

  // Common phrases
  'national park': 'nasjonalpark', 'mountain range': 'fjellkjede',
  'sea level': 'havnivå', 'high altitude': 'stor høyde',
};

app.post('/api/ai/translate', async (req, res) => {
  const { word } = req.body;
  const wordClass = detectWordClass(word);
  const lowerWord = word.toLowerCase().trim();

  // Check local dictionary first (faster)
  let norwegian = translationDict[lowerWord];
  let hasTranslation = !!norwegian;

  // If not in dictionary, try MyMemory Translation API
  if (!norwegian) {
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|no`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        norwegian = data.responseData.translatedText;
        hasTranslation = true;

        // Don't use translation if it's identical to the original (likely no translation found)
        if (norwegian.toLowerCase() === word.toLowerCase()) {
          norwegian = null;
          hasTranslation = false;
        }
      }
    } catch (error) {
      console.error('Translation API error:', error);
      // Fall through to return null
    }
  }

  res.json({
    norwegian: norwegian,
    wordClass: wordClass,
    hasTranslation: hasTranslation
  });
});

app.post('/api/ai/validate-sentence', (req, res) => {
  const { sentence, word } = req.body;

  // Validate sentence
  const trimmed = sentence.trim();
  const words = trimmed.split(/\s+/);
  const hasWord = trimmed.toLowerCase().includes(word.toLowerCase());
  const hasPunctuation = /[.!?]$/.test(trimmed);
  const hasEnoughWords = words.length >= 3;

  // Check for incomplete sentences with "a" or "an" at the end
  const endsWithArticle = /\b(a|an)\s*[.!?]?$/i.test(trimmed);
  const endsWithIs = /\bis\s+(a|an)?\s*[.!?]?$/i.test(trimmed);

  let isValid = false;
  let feedback = '';
  let suggestions = [];
  let score = 3;

  if (!hasWord) {
    feedback = `Make sure to use the word "${word}" in your sentence.`;
    suggestions = [`Try: "I like ${word}."`];
  } else if (!hasPunctuation) {
    feedback = 'Don\'t forget to end your sentence with a period (.), exclamation mark (!), or question mark (?).';
    suggestions = [`${trimmed}.`];
  } else if (!hasEnoughWords) {
    feedback = 'Try to write a longer, more complete sentence.';
    suggestions = [`I like ${word}.`, `The ${word} is nice.`];
  } else if (endsWithArticle || endsWithIs) {
    feedback = 'Your sentence seems incomplete. Make sure to finish your thought!';
    suggestions = [`She is a teacher.`, `She is a good friend.`, `She is nice.`];
  } else {
    isValid = true;
    feedback = 'Great job! Your sentence is correct.';
    score = 8;
  }

  res.json({
    isValid,
    feedback,
    suggestions,
    score
  });
});

app.post('/api/ai/enrich-word', (req, res) => {
  const { word } = req.body;
  const wordClass = detectWordClass(word);

  res.json({
    synonyms: [],
    antonyms: [],
    exampleSentences: generateExampleSentences(word, wordClass),
    wordClass: wordClass
  });
});

// Generer fornuftige eksempelsetninger basert på ordklasse
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

app.get('/api/images/search', (req, res) => {
  const { query } = req.query;
  res.json({
    imageUrl: `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(query)}`
  });
});

// ============= SERVE FRONTEND (PRODUCTION) =============

// ============= START SERVER =============
// Note: Frontend is served by Cloudflare Pages, not by this backend

app.listen(PORT, () => {
  console.log('\n🚀 Glosetrenings-app backend v2 kjører!');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log('👤 Brukere: hermann / vilma');
  console.log('🔑 Passord: pwpw67\n');
  console.log('✨ Ny funksjonalitet:');
  console.log('   - Universell ordbank');
  console.log('   - Mastery-system (5 ganger = lært)');
  console.log('   - Ukens ord vs repetisjoner\n');
});
