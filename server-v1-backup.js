/**
 * Lokal Express server for glosetrenings-app
 * Erstatter Cloudflare Workers for lokal utvikling
 */

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database setup
const db = new Database('glosetrenings.db');

// Initialize database if needed
function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.exec(statement);
        } catch (error) {
          // Table might already exist
          console.log('Schema statement skipped (might already exist)');
        }
      }
    }
    console.log('✅ Database initialized');
  }
}

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const passwordHash = hashPassword(password);

  const user = db.prepare(
    'SELECT id, username, display_name, birth_year, grade FROM users WHERE username = ? AND password_hash = ?'
  ).get(username, passwordHash);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  res.json({ user: {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    birthYear: user.birth_year,
    grade: user.grade
  }});
});

// Lessons endpoints
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

// Words endpoints
app.get('/api/lessons/:lessonId/words', (req, res) => {
  const { lessonId } = req.params;
  const words = db.prepare('SELECT * FROM words WHERE lesson_id = ?').all(lessonId);

  // Parse JSON fields
  const parsedWords = words.map(word => ({
    ...word,
    synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
    antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
    exampleSentences: word.example_sentences ? JSON.parse(word.example_sentences) : []
  }));

  res.json({ words: parsedWords });
});

app.post('/api/lessons/:lessonId/words', (req, res) => {
  const { lessonId } = req.params;
  const { english, norwegian, wordClass, synonyms, antonyms, imageUrl, exampleSentences } = req.body;

  const result = db.prepare(
    `INSERT INTO words (lesson_id, english, norwegian, word_class, synonyms, antonyms, image_url, example_sentences)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    lessonId,
    english,
    norwegian,
    wordClass,
    JSON.stringify(synonyms || []),
    JSON.stringify(antonyms || []),
    imageUrl,
    JSON.stringify(exampleSentences || [])
  );

  res.json({ id: result.lastInsertRowid });
});

// Check for existing words
app.get('/api/words/check-existing', (req, res) => {
  const { userId, words } = req.query;
  const wordsList = JSON.parse(words);

  const query = `
    SELECT DISTINCT w.id, w.english, w.norwegian, w.word_class, l.id as lesson_id
    FROM words w
    JOIN lessons l ON w.lesson_id = l.id
    WHERE l.user_id = ?
  `;

  const existingWordsInDb = db.prepare(query).all(userId);
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

// Get all words for a user (for word list view)
app.get('/api/words/all', (req, res) => {
  const { userId } = req.query;

  const query = `
    SELECT
      w.id,
      w.english,
      w.norwegian,
      w.word_class as wordClass,
      l.title as lessonTitle,
      l.date as lessonDate,
      MAX(tr.completed_at) as lastPracticed,
      COUNT(DISTINCT tr.id) as timesCompleted,
      AVG(tr.score) as averageScore
    FROM words w
    JOIN lessons l ON w.lesson_id = l.id
    LEFT JOIN test_results tr ON w.id = tr.word_id
    WHERE l.user_id = ?
    GROUP BY w.id
    ORDER BY l.date DESC
  `;

  const words = db.prepare(query).all(userId);
  res.json({ words });
});

// Update lesson date for a word
app.put('/api/words/:wordId/update-date', (req, res) => {
  const { wordId } = req.params;
  const { date } = req.body;

  // Get the lesson_id for this word
  const word = db.prepare('SELECT lesson_id FROM words WHERE id = ?').get(wordId);

  if (!word) {
    return res.status(404).json({ error: 'Word not found' });
  }

  // Update the lesson date
  db.prepare('UPDATE lessons SET date = ? WHERE id = ?').run(date, word.lesson_id);

  res.json({ success: true });
});

// Update word details (english, norwegian, word class)
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

// Delete a word
app.delete('/api/words/:wordId', (req, res) => {
  const { wordId } = req.params;

  try {
    // Delete test results first (foreign key constraint)
    db.prepare('DELETE FROM test_results WHERE word_id = ?').run(wordId);

    // Delete the word
    db.prepare('DELETE FROM words WHERE id = ?').run(wordId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

// Add a new word manually
app.post('/api/words/manual', (req, res) => {
  const { userId, english, norwegian, wordClass } = req.body;

  try {
    // Create a lesson for today if it doesn't exist
    const today = new Date().toISOString().split('T')[0];
    const schoolYear = new Date().getFullYear();

    let lesson = db.prepare(
      'SELECT id FROM lessons WHERE user_id = ? AND date = ?'
    ).get(userId, today);

    if (!lesson) {
      const result = db.prepare(
        'INSERT INTO lessons (user_id, title, date, school_year) VALUES (?, ?, ?, ?)'
      ).run(userId, `Manuelt lagt til ${today}`, today, `${schoolYear}/${schoolYear + 1}`);
      lesson = { id: result.lastInsertRowid };
    }

    // Add the word
    const wordResult = db.prepare(
      'INSERT INTO words (lesson_id, english, norwegian, word_class) VALUES (?, ?, ?, ?)'
    ).run(lesson.id, english, norwegian, wordClass);

    res.json({ id: wordResult.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// Helper function to detect word class
function detectWordClass(word) {
  const lowerWord = word.toLowerCase();

  // Articles, pronouns, prepositions, conjunctions
  const articles = ['a', 'an', 'the'];
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  const prepositions = ['in', 'on', 'at', 'to', 'from', 'with', 'by', 'for', 'of', 'about', 'under', 'over', 'between', 'through'];
  const conjunctions = ['and', 'or', 'but', 'because', 'if', 'when', 'while', 'although'];

  // Common verbs
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

  // Adjectives
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

  // Check for verb endings
  if (lowerWord.endsWith('ing') || lowerWord.endsWith('ed') || lowerWord.endsWith('en')) {
    return 'verb';
  }

  // Check for adjective endings
  if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') || lowerWord.endsWith('ous') ||
      lowerWord.endsWith('ive') || lowerWord.endsWith('able') || lowerWord.endsWith('ible') ||
      lowerWord.endsWith('al') || lowerWord.endsWith('ic')) {
    return 'adjective';
  }

  // Check for adverb endings
  if (lowerWord.endsWith('ly')) {
    return 'adverb';
  }

  // Default to noun
  return 'noun';
}

// AI endpoints (mock for now - can be enhanced with actual API calls)
app.post('/api/ai/translate', (req, res) => {
  const { word } = req.body;
  const wordClass = detectWordClass(word);

  // For now, just return the word as-is with detected word class
  // You can enhance this with actual translation API later
  res.json({
    norwegian: word, // Placeholder - could integrate real translation API
    wordClass: wordClass
  });
});

app.post('/api/ai/validate-sentence', (req, res) => {
  const { sentence, word } = req.body;

  // Simple validation - check if word is in sentence
  const isValid = sentence.toLowerCase().includes(word.toLowerCase());

  res.json({
    isValid,
    feedback: isValid
      ? 'Great job! Your sentence is correct.'
      : `Make sure to use the word "${word}" in your sentence.`,
    suggestions: isValid ? [] : [`Try: "I like ${word}."`],
    score: isValid ? 8 : 3
  });
});

app.post('/api/ai/enrich-word', (req, res) => {
  const { word } = req.body;
  const wordClass = detectWordClass(word);

  res.json({
    synonyms: [],
    antonyms: [],
    exampleSentences: [
      `I like ${word}.`,
      `The ${word} is nice.`,
      `Can you see the ${word}?`
    ],
    wordClass: wordClass
  });
});

// Image search (mock)
app.get('/api/images/search', (req, res) => {
  const { query } = req.query;

  // Return a placeholder image
  res.json({
    imageUrl: `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(query)}`
  });
});

// Test results
app.post('/api/test-results', (req, res) => {
  const { userId, wordId, testType, score, attempts, hintsUsed, timeSpent } = req.body;

  const result = db.prepare(
    `INSERT INTO test_results (user_id, word_id, test_type, score, attempts, hints_used, time_spent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, wordId, testType, score, attempts, hintsUsed, timeSpent);

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];

  try {
    db.prepare(
      `INSERT INTO daily_activity (user_id, activity_date, words_practiced, total_score, tests_completed)
       VALUES (?, ?, 1, ?, 1)`
    ).run(userId, today, score);
  } catch (error) {
    // Update if exists
    db.prepare(
      `UPDATE daily_activity
       SET words_practiced = words_practiced + 1,
           total_score = total_score + ?,
           tests_completed = tests_completed + 1
       WHERE user_id = ? AND activity_date = ?`
    ).run(score, userId, today);
  }

  // Check and award badges
  checkBadges(userId);

  res.json({ id: result.lastInsertRowid });
});

// User stats
app.get('/api/users/:userId/stats', (req, res) => {
  const { userId } = req.params;

  const stats = db.prepare(
    `SELECT
      COUNT(DISTINCT word_id) as totalWords,
      COUNT(*) as totalTests,
      AVG(score) as averageScore
     FROM test_results WHERE user_id = ?`
  ).get(userId);

  const badges = db.prepare(
    `SELECT ub.*, b.name, b.description, b.icon, b.requirement_type, b.requirement_value
     FROM user_badges ub
     JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = ?`
  ).all(userId);

  const recentActivity = db.prepare(
    'SELECT * FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30'
  ).all(userId);

  res.json({
    totalWords: stats.totalWords || 0,
    totalTests: stats.totalTests || 0,
    averageScore: stats.averageScore || 0,
    badges: badges.map(b => ({ ...b, badge: { name: b.name, description: b.description, icon: b.icon } })),
    recentActivity
  });
});

// Badges
app.get('/api/users/:userId/badges', (req, res) => {
  const { userId } = req.params;

  const badges = db.prepare(
    `SELECT ub.*, b.name, b.description, b.icon
     FROM user_badges ub
     JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = ?
     ORDER BY ub.earned_at DESC`
  ).all(userId);

  res.json({ badges });
});

// Helper: Check and award badges
function checkBadges(userId) {
  const testCount = db.prepare('SELECT COUNT(*) as count FROM test_results WHERE user_id = ?').get(userId);

  // Award "Nybegynner" badge after first test
  if (testCount.count === 1) {
    awardBadge(userId, 1);
  }

  // Check streak badges
  const activities = db.prepare(
    'SELECT activity_date FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30'
  ).all(userId);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of activities) {
    const activityDate = new Date(activity.activity_date);
    activityDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }

    currentDate = new Date(activityDate);
  }

  if (streak >= 3) awardBadge(userId, 2); // 3-day streak
  if (streak >= 7) awardBadge(userId, 3); // 7-day streak
  if (streak >= 30) awardBadge(userId, 8); // 30-day streak
}

function awardBadge(userId, badgeId) {
  try {
    db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badgeId);
    console.log(`✅ Badge ${badgeId} awarded to user ${userId}`);
  } catch (error) {
    // Badge already awarded
  }
}

// Initialize and start server
initDatabase();

// Create test users if they don't exist
try {
  const hermanExists = db.prepare('SELECT id FROM users WHERE username = ?').get('hermann');
  if (!hermanExists) {
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, birth_year, grade) VALUES (?, ?, ?, ?, ?)'
    ).run('hermann', hashPassword('password'), 'Hermann', 2018, 2);
    console.log('✅ Created user: hermann (password: password)');
  }

  const vilmaExists = db.prepare('SELECT id FROM users WHERE username = ?').get('vilma');
  if (!vilmaExists) {
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, birth_year, grade) VALUES (?, ?, ?, ?, ?)'
    ).run('vilma', hashPassword('password'), 'Vilma', 2016, 4);
    console.log('✅ Created user: vilma (password: password)');
  }
} catch (error) {
  console.error('Error creating test users:', error);
}

app.listen(PORT, () => {
  console.log(`
🚀 Glosetrenings-app backend kjører!
📍 Server: http://localhost:${PORT}
👤 Brukere: hermann / vilma
🔑 Passord: password
  `);
});
