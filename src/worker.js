/**
 * Glosetrenings-app Cloudflare Worker
 * Backend kjører på Cloudflare Workers med D1 database
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import crypto from 'node:crypto';
import { generateVerbForms, generatePluralForm, generateAdjectiveForms } from './grammar-utils.js';

const app = new Hono();

// CORS middleware
app.use('/*', cors());

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Word class detection (samme som server.js)
function detectWordClass(word) {
  const lowerWord = word.toLowerCase();
  const articles = ['a', 'an', 'the'];
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  const prepositions = ['in', 'on', 'at', 'to', 'from', 'with', 'by', 'for', 'of', 'about', 'under', 'over', 'between', 'through'];
  const conjunctions = ['and', 'or', 'but', 'because', 'if', 'when', 'while', 'although'];
  const commonVerbs = ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'go', 'goes', 'went', 'going', 'gone', 'get', 'gets', 'got', 'getting', 'gotten', 'make', 'makes', 'made', 'making'];
  const commonAdjectives = ['good', 'bad', 'big', 'small', 'large', 'little', 'long', 'short', 'happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty', 'hot', 'cold', 'warm', 'cool', 'fast', 'slow', 'quick', 'new', 'old', 'young', 'nice', 'beautiful', 'ugly', 'easy', 'hard', 'difficult', 'important', 'interesting', 'boring'];

  if (articles.includes(lowerWord)) return 'article';
  if (pronouns.includes(lowerWord)) return 'pronoun';
  if (prepositions.includes(lowerWord)) return 'preposition';
  if (conjunctions.includes(lowerWord)) return 'conjunction';
  if (commonVerbs.includes(lowerWord)) return 'verb';
  if (commonAdjectives.includes(lowerWord)) return 'adjective';
  if (lowerWord.endsWith('ing') || lowerWord.endsWith('ed') || lowerWord.endsWith('en')) return 'verb';
  if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') || lowerWord.endsWith('ous') || lowerWord.endsWith('ive') || lowerWord.endsWith('able') || lowerWord.endsWith('ible') || lowerWord.endsWith('al') || lowerWord.endsWith('ic')) return 'adjective';
  if (lowerWord.endsWith('ly')) return 'adverb';
  return 'noun';
}

// Calculate current grade based on school start year
function calculateCurrentGrade(schoolStartYear) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearsSinceStart = currentYear - schoolStartYear;
  const grade = currentMonth >= 8 ? yearsSinceStart + 1 : yearsSinceStart;
  return Math.max(1, Math.min(7, grade));
}

// Streak calculation
function calculateCurrentStreak(activities) {
  if (!activities || activities.length === 0) return 0;
  const sortedActivities = [...activities].sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].activity_date);
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

// ============= AUTH ENDPOINTS =============

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const passwordHash = hashPassword(password);

  const user = await c.env.DB.prepare(
    'SELECT id, username, display_name, birth_year, school_start_year, grade FROM users WHERE username = ? AND password_hash = ?'
  ).bind(username, passwordHash).first();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const currentGrade = calculateCurrentGrade(user.school_start_year);
  await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, grade = ? WHERE id = ?')
    .bind(currentGrade, user.id).run();

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      birthYear: user.birth_year,
      grade: currentGrade
    }
  });
});

// ============= LESSONS ENDPOINTS =============

app.get('/api/lessons', async (c) => {
  const userId = c.req.query('userId');
  const lessons = await c.env.DB.prepare('SELECT * FROM lessons WHERE user_id = ? ORDER BY date DESC')
    .bind(userId).all();
  return c.json({ lessons: lessons.results || [] });
});

app.post('/api/lessons', async (c) => {
  const { userId, title, description, date, schoolYear, imageUrl } = await c.req.json();
  const result = await c.env.DB.prepare(
    'INSERT INTO lessons (user_id, title, description, date, school_year, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, title, description, date, schoolYear, imageUrl).run();
  return c.json({ id: result.meta.last_row_id });
});

app.get('/api/lessons/:lessonId/words', async (c) => {
  const lessonId = c.req.param('lessonId');
  const query = `
    SELECT
      w.id, w.english, w.norwegian, w.word_class as wordClass,
      w.synonyms, w.antonyms, w.example_sentences as exampleSentences,
      w.image_url as imageUrl, lw.is_weekly_word as isWeeklyWord,
      uw.mastery_level as masteryLevel, uw.is_mastered as isMastered
    FROM lesson_words lw
    JOIN words w ON lw.word_id = w.id
    LEFT JOIN user_words uw ON w.id = uw.word_id AND uw.user_id = (SELECT user_id FROM lessons WHERE id = ?)
    WHERE lw.lesson_id = ?
  `;
  const words = await c.env.DB.prepare(query).bind(lessonId, lessonId).all();
  const parsedWords = (words.results || []).map(word => ({
    ...word,
    synonyms: word.synonyms ? JSON.parse(word.synonyms) : [],
    antonyms: word.antonyms ? JSON.parse(word.antonyms) : [],
    exampleSentences: word.exampleSentences ? JSON.parse(word.exampleSentences) : []
  }));
  return c.json({ words: parsedWords });
});

// ============= PRACTICE SESSION =============

app.post('/api/practice/start-session', async (c) => {
  const { userId, wordCount = 10 } = await c.req.json();
  if (!userId) {
    return c.json({ error: 'userId er påkrevd' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT grade FROM users WHERE id = ?').bind(userId).first();
  const userGrade = user?.grade || 2;
  const selectedWords = [];
  const usedWordIds = new Set();

  // PRIORITET 1: LOKALE ORD
  const localWords = await c.env.DB.prepare(`
    SELECT
      w.id, w.english, w.norwegian, w.word_class as wordClass,
      w.synonyms, w.antonyms, w.example_sentences as exampleSentences,
      w.image_url as imageUrl, uw.times_completed as timesCompleted, uw.source
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = ? AND uw.source = 'local' AND uw.is_mastered = 0
    ORDER BY
      CASE WHEN date(uw.next_practice_date) <= date('now') THEN 0 ELSE 1 END,
      uw.times_completed ASC, uw.next_practice_date ASC
    LIMIT ?
  `).bind(userId, wordCount).all();

  for (const word of (localWords.results || [])) {
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

  // PRIORITET 2: REPETISJON
  if (selectedWords.length < wordCount) {
    const repetitionWords = await c.env.DB.prepare(`
      SELECT
        w.id, w.english, w.norwegian, w.word_class as wordClass,
        w.synonyms, w.antonyms, w.example_sentences as exampleSentences,
        w.image_url as imageUrl, uw.times_completed as timesCompleted, uw.source
      FROM user_words uw
      JOIN words w ON uw.word_id = w.id
      WHERE uw.user_id = ? AND uw.source = 'universal' AND uw.is_mastered = 0
      ORDER BY
        CASE WHEN date(uw.next_practice_date) <= date('now') THEN 0 ELSE 1 END,
        uw.times_completed ASC, uw.next_practice_date ASC
      LIMIT ?
    `).bind(userId, wordCount - selectedWords.length).all();

    for (const word of (repetitionWords.results || [])) {
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

  // PRIORITET 3: NYE ORD
  if (selectedWords.length < wordCount) {
    const newWords = await c.env.DB.prepare(`
      SELECT
        w.id, w.english, w.norwegian, w.word_class as wordClass,
        w.synonyms, w.antonyms, w.example_sentences as exampleSentences,
        w.image_url as imageUrl, w.recommended_grade as recommendedGrade
      FROM words w
      WHERE w.id NOT IN (SELECT word_id FROM user_words WHERE user_id = ?)
        AND w.recommended_grade <= ?
      ORDER BY w.recommended_grade ASC, RANDOM()
      LIMIT ?
    `).bind(userId, userGrade, wordCount - selectedWords.length).all();

    const today = new Date().toISOString().split('T')[0];
    for (const word of (newWords.results || [])) {
      if (!usedWordIds.has(word.id) && selectedWords.length < wordCount) {
        await c.env.DB.prepare(`
          INSERT INTO user_words (user_id, word_id, next_practice_date, source)
          VALUES (?, ?, ?, 'universal')
        `).bind(userId, word.id, today).run();

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

  return c.json({ words: selectedWords });
});

// ============= TEST RESULTS =============

app.post('/api/test-results', async (c) => {
  const { userId, wordId, testType, score, attempts, hintsUsed, timeSpent, lessonId } = await c.req.json();

  // Save test result
  const result = await c.env.DB.prepare(`
    INSERT INTO test_results (user_id, word_id, lesson_id, test_type, score, attempts, hints_used, time_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, wordId, lessonId || null, testType, score, attempts, hintsUsed, timeSpent).run();

  // Update user_words mastery
  const userWord = await c.env.DB.prepare('SELECT * FROM user_words WHERE user_id = ? AND word_id = ?')
    .bind(userId, wordId).first();

  if (userWord) {
    const newTimesPracticed = userWord.times_practiced + 1;
    const newTimesCompleted = score >= 6 ? userWord.times_completed + 1 : userWord.times_completed;
    const newMasteryLevel = Math.min(newTimesCompleted, 5);
    const newIsMastered = newMasteryLevel >= 5 ? 1 : 0;
    const oldTotal = userWord.average_score * userWord.times_practiced;
    const newAverage = (oldTotal + score) / newTimesPracticed;

    const nextDate = new Date();
    if (newIsMastered) {
      nextDate.setDate(nextDate.getDate() + 30);
    } else if (newMasteryLevel >= 3) {
      nextDate.setDate(nextDate.getDate() + 14);
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    await c.env.DB.prepare(`
      UPDATE user_words
      SET times_practiced = ?, times_completed = ?, mastery_level = ?, is_mastered = ?,
          average_score = ?, last_practiced_date = CURRENT_TIMESTAMP, next_practice_date = ?
      WHERE user_id = ? AND word_id = ?
    `).bind(newTimesPracticed, newTimesCompleted, newMasteryLevel, newIsMastered, newAverage, nextDate.toISOString().split('T')[0], userId, wordId).run();
  }

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  const existing = await c.env.DB.prepare('SELECT id FROM daily_activity WHERE user_id = ? AND activity_date = ?')
    .bind(userId, today).first();

  if (!existing) {
    await c.env.DB.prepare(`
      INSERT INTO daily_activity (user_id, activity_date, words_practiced, total_score, tests_completed)
      VALUES (?, ?, 1, ?, 1)
    `).bind(userId, today, score).run();
  } else {
    await c.env.DB.prepare(`
      UPDATE daily_activity
      SET words_practiced = words_practiced + 1, total_score = total_score + ?, tests_completed = tests_completed + 1
      WHERE user_id = ? AND activity_date = ?
    `).bind(score, userId, today).run();
  }

  return c.json({ id: result.meta.last_row_id });
});

// ============= STATS =============

app.get('/api/users/:userId/stats', async (c) => {
  const userId = c.req.param('userId');

  const totalWords = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ?').bind(userId).first())?.count || 0;
  const masteredWords = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM user_words WHERE user_id = ? AND is_mastered = 1').bind(userId).first())?.count || 0;
  const totalTests = (await c.env.DB.prepare('SELECT COUNT(*) as count FROM test_results WHERE user_id = ?').bind(userId).first())?.count || 0;
  const avgScore = (await c.env.DB.prepare('SELECT AVG(score) as avg FROM test_results WHERE user_id = ?').bind(userId).first())?.avg || 0;
  const wordsReadyToday = (await c.env.DB.prepare(`SELECT COUNT(*) as count FROM user_words WHERE user_id = ? AND date(next_practice_date) <= date('now')`).bind(userId).first())?.count || 0;

  const wordsNearMastery = await c.env.DB.prepare(`
    SELECT w.english, w.norwegian, uw.times_completed
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = ? AND uw.times_completed IN (3, 4) AND uw.is_mastered = 0
    ORDER BY uw.times_completed DESC
    LIMIT 10
  `).bind(userId).all();

  const badges = await c.env.DB.prepare(`
    SELECT b.id, b.name, b.description, b.icon, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
  `).bind(userId).all();

  const recentActivity = await c.env.DB.prepare(`
    SELECT * FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30
  `).bind(userId).all();

  const currentStreak = calculateCurrentStreak(recentActivity.results || []);

  return c.json({
    totalWords,
    masteredWords,
    totalTests,
    averageScore: avgScore,
    wordsReadyToday,
    wordsNearMastery: wordsNearMastery.results || [],
    currentStreak,
    badges: (badges.results || []).map(b => ({ ...b, badge: { icon: b.icon, name: b.name, description: b.description } })),
    recentActivity: recentActivity.results || []
  });
});

// ============= WORDS ENDPOINTS =============

app.get('/api/words/all', async (c) => {
  const userId = c.req.query('userId');
  const query = `
    SELECT
      w.id, w.english, w.norwegian, w.word_class as wordClass,
      w.plural_form as pluralForm, w.verb_third_person as verbThirdPerson,
      w.verb_past as verbPast, w.verb_past_participle as verbPastParticiple,
      w.verb_present_participle as verbPresentParticiple,
      w.adjective_comparative as adjectiveComparative,
      w.adjective_superlative as adjectiveSuperlative,
      l.title as lessonTitle, l.date as lessonDate,
      uw.mastery_level as masteryLevel, uw.is_mastered as isMastered,
      uw.times_practiced as timesPracticed, uw.times_completed as timesCompleted,
      uw.average_score as averageScore, uw.last_practiced_date as lastPracticed,
      uw.next_practice_date as nextPracticeDate
    FROM user_words uw
    JOIN words w ON uw.word_id = w.id
    LEFT JOIN lesson_words lw ON w.id = lw.word_id
    LEFT JOIN lessons l ON lw.lesson_id = l.id AND l.user_id = ?
    WHERE uw.user_id = ?
    GROUP BY w.id
    ORDER BY uw.next_practice_date DESC, w.english ASC
  `;
  const words = await c.env.DB.prepare(query).bind(userId, userId).all();
  return c.json({ words: words.results || [] });
});

app.get('/api/words/universal', async (c) => {
  try {
    const query = `
      SELECT
        w.id, w.english, w.norwegian, w.word_class as wordClass,
        w.plural_form as pluralForm, w.verb_third_person as verbThirdPerson,
        w.verb_past as verbPast, w.verb_past_participle as verbPastParticiple,
        w.verb_present_participle as verbPresentParticiple,
        w.adjective_comparative as adjectiveComparative,
        w.adjective_superlative as adjectiveSuperlative,
        w.difficulty_level as difficultyLevel,
        w.recommended_grade as recommendedGrade,
        w.created_at as createdAt
      FROM words
      ORDER BY w.english ASC
    `;
    const words = await c.env.DB.prepare(query).all();
    return c.json({ words: words.results || [] });
  } catch (error) {
    console.error('Error fetching universal words:', error);
    return c.json({ words: [] });
  }
});

app.post('/api/lessons/:lessonId/words', async (c) => {
  const lessonId = c.req.param('lessonId');
  const { english, norwegian, wordClass, synonyms, antonyms, imageUrl, exampleSentences } = await c.req.json();

  const lesson = await c.env.DB.prepare('SELECT user_id FROM lessons WHERE id = ?').bind(lessonId).first();
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404);
  }

  let word = await c.env.DB.prepare('SELECT id FROM words WHERE english = ?').bind(english).first();
  if (!word) {
    // Generer grammatikk-former basert på ordklasse
    let grammarData = {
      pluralForm: null,
      verbThirdPerson: null,
      verbPast: null,
      verbPastParticiple: null,
      verbPresentParticiple: null,
      adjectiveComparative: null,
      adjectiveSuperlative: null,
    };

    if (wordClass === 'noun') {
      grammarData.pluralForm = generatePluralForm(english);
    } else if (wordClass === 'verb') {
      const verbForms = generateVerbForms(english);
      grammarData.verbThirdPerson = verbForms.thirdPerson;
      grammarData.verbPast = verbForms.past;
      grammarData.verbPastParticiple = verbForms.pastParticiple;
      grammarData.verbPresentParticiple = verbForms.presentParticiple;
    } else if (wordClass === 'adjective') {
      const adjectiveForms = generateAdjectiveForms(english);
      grammarData.adjectiveComparative = adjectiveForms.comparative;
      grammarData.adjectiveSuperlative = adjectiveForms.superlative;
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO words (
        english, norwegian, word_class, synonyms, antonyms, image_url, example_sentences,
        plural_form, verb_third_person, verb_past, verb_past_participle, verb_present_participle,
        adjective_comparative, adjective_superlative
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      english, norwegian, wordClass,
      JSON.stringify(synonyms || []),
      JSON.stringify(antonyms || []),
      imageUrl,
      JSON.stringify(exampleSentences || []),
      grammarData.pluralForm,
      grammarData.verbThirdPerson,
      grammarData.verbPast,
      grammarData.verbPastParticiple,
      grammarData.verbPresentParticiple,
      grammarData.adjectiveComparative,
      grammarData.adjectiveSuperlative
    ).run();
    word = { id: result.meta.last_row_id };
  }

  try {
    await c.env.DB.prepare('INSERT INTO lesson_words (lesson_id, word_id, is_weekly_word) VALUES (?, ?, 1)')
      .bind(lessonId, word.id).run();
  } catch (e) {
    // Already exists
  }

  const today = new Date().toISOString().split('T')[0];
  try {
    await c.env.DB.prepare(`INSERT INTO user_words (user_id, word_id, next_practice_date, source) VALUES (?, ?, ?, 'local')`)
      .bind(lesson.user_id, word.id, today).run();
  } catch (e) {
    await c.env.DB.prepare(`UPDATE user_words SET next_practice_date = ?, source = 'local' WHERE user_id = ? AND word_id = ?`)
      .bind(today, lesson.user_id, word.id).run();
  }

  return c.json({ id: word.id });
});

app.get('/api/words/check-existing', async (c) => {
  const words = JSON.parse(c.req.query('words'));
  const existingWordsInDb = await c.env.DB.prepare('SELECT id, english, norwegian, word_class FROM words').all();
  const existingWordsMap = new Map((existingWordsInDb.results || []).map(w => [w.english.toLowerCase(), w]));
  const existingWords = [];
  const newWords = [];
  words.forEach(word => {
    if (existingWordsMap.has(word.toLowerCase())) {
      existingWords.push(existingWordsMap.get(word.toLowerCase()));
    } else {
      newWords.push(word);
    }
  });
  return c.json({ existingWords, newWords });
});

app.put('/api/words/:wordId/update-date', async (c) => {
  const wordId = c.req.param('wordId');
  const { date, userId } = await c.req.json();
  if (!userId) {
    return c.json({ error: 'userId er påkrevd' }, 400);
  }
  await c.env.DB.prepare('UPDATE user_words SET next_practice_date = ? WHERE word_id = ? AND user_id = ?')
    .bind(date, wordId, userId).run();
  return c.json({ success: true });
});

// ============= WEEKLY STATS =============

app.get('/api/users/:userId/weekly-stats', async (c) => {
  const userId = c.req.param('userId');

  const thisWeekStats = await c.env.DB.prepare(`
    SELECT
      COALESCE(SUM(words_practiced), 0) as wordsPracticed,
      COALESCE(SUM(total_score), 0) as totalScore,
      COALESCE(SUM(tests_completed), 0) as testsCompleted,
      COUNT(*) as activeDays
    FROM daily_activity
    WHERE user_id = ? AND date(activity_date) >= date('now', '-7 days')
  `).bind(userId).first();

  const lastWeekStats = await c.env.DB.prepare(`
    SELECT
      COALESCE(SUM(words_practiced), 0) as wordsPracticed,
      COALESCE(SUM(total_score), 0) as totalScore,
      COALESCE(SUM(tests_completed), 0) as testsCompleted,
      COUNT(*) as activeDays
    FROM daily_activity
    WHERE user_id = ? AND date(activity_date) >= date('now', '-14 days') AND date(activity_date) < date('now', '-7 days')
  `).bind(userId).first();

  return c.json({
    thisWeek: thisWeekStats || { wordsPracticed: 0, totalScore: 0, testsCompleted: 0, activeDays: 0 },
    lastWeek: lastWeekStats || { wordsPracticed: 0, totalScore: 0, testsCompleted: 0, activeDays: 0 },
    improvements: {
      wordsPracticed: (thisWeekStats?.wordsPracticed || 0) - (lastWeekStats?.wordsPracticed || 0),
      totalScore: (thisWeekStats?.totalScore || 0) - (lastWeekStats?.totalScore || 0),
      testsCompleted: (thisWeekStats?.testsCompleted || 0) - (lastWeekStats?.testsCompleted || 0),
      activeDays: (thisWeekStats?.activeDays || 0) - (lastWeekStats?.activeDays || 0)
    }
  });
});

// ============= AI ENDPOINTS =============

const translationDict = {
  'the': 'den/det', 'a': 'en/et', 'an': 'en/et', 'and': 'og', 'or': 'eller', 'but': 'men',
  'in': 'i', 'on': 'på', 'at': 'på/ved', 'to': 'til', 'from': 'fra', 'with': 'med', 'for': 'for', 'of': 'av',
  'i': 'jeg', 'you': 'du/dere', 'he': 'han', 'she': 'hun', 'it': 'den/det', 'we': 'vi', 'they': 'de',
  'go': 'gå', 'come': 'komme', 'see': 'se', 'make': 'lage', 'have': 'ha', 'be': 'være',
  'good': 'god', 'bad': 'dårlig', 'big': 'stor', 'small': 'liten', 'new': 'ny', 'old': 'gammel',
  'house': 'hus', 'book': 'bok', 'dog': 'hund', 'cat': 'katt', 'water': 'vann', 'food': 'mat'
};

app.post('/api/ai/translate', async (c) => {
  const { word } = await c.req.json();
  const wordClass = detectWordClass(word);
  const lowerWord = word.toLowerCase().trim();
  let norwegian = translationDict[lowerWord];
  let hasTranslation = !!norwegian;

  if (!norwegian) {
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|no`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        norwegian = data.responseData.translatedText;
        hasTranslation = norwegian.toLowerCase() !== word.toLowerCase();
      }
    } catch (error) {
      // Fall through
    }
  }

  return c.json({ norwegian: norwegian || null, wordClass, hasTranslation });
});

app.post('/api/ai/validate-sentence', async (c) => {
  const { sentence, word } = await c.req.json();
  const trimmed = sentence.trim();
  const words = trimmed.split(/\s+/);
  const hasWord = trimmed.toLowerCase().includes(word.toLowerCase());
  const hasPunctuation = /[.!?]$/.test(trimmed);
  const hasEnoughWords = words.length >= 3;
  let isValid = false;
  let feedback = '';
  let score = 3;

  if (!hasWord) {
    feedback = `Make sure to use the word "${word}" in your sentence.`;
  } else if (!hasPunctuation) {
    feedback = 'Don\'t forget to end your sentence with a period (.), exclamation mark (!), or question mark (?).';
  } else if (!hasEnoughWords) {
    feedback = 'Try to write a longer, more complete sentence.';
  } else {
    isValid = true;
    feedback = 'Great job! Your sentence is correct.';
    score = 8;
  }

  return c.json({ isValid, feedback, score, suggestions: [] });
});

app.post('/api/ai/enrich-word', async (c) => {
  const { word } = await c.req.json();
  const wordClass = detectWordClass(word);
  const exampleSentences = [
    `I like ${word}.`,
    `The ${word} is nice.`,
    `Can you see the ${word}?`
  ];
  return c.json({ synonyms: [], antonyms: [], exampleSentences, wordClass });
});

app.get('/api/images/search', async (c) => {
  const query = c.req.query('query');
  return c.json({ imageUrl: `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(query)}` });
});

// ============= EXPORT =============

app.get('/api/users/:userId/export', async (c) => {
  const userId = c.req.param('userId');
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) {
    return c.json({ error: 'Bruker ikke funnet' }, 404);
  }

  const lessons = await c.env.DB.prepare('SELECT * FROM lessons WHERE user_id = ? ORDER BY date DESC').bind(userId).all();
  const userWords = await c.env.DB.prepare(`
    SELECT uw.*, w.english, w.norwegian, w.word_class, w.image_url
    FROM user_words uw JOIN words w ON uw.word_id = w.id
    WHERE uw.user_id = ? ORDER BY uw.created_at DESC
  `).bind(userId).all();

  const exportData = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    user: { username: user.username, displayName: user.display_name, grade: user.grade },
    stats: { totalWords: userWords.results?.length || 0 },
    lessons: lessons.results || [],
    words: userWords.results || []
  };

  return c.json(exportData);
});

// ============= GRAMMAR LEVEL CONFIG =============

app.get('/api/grammar-levels', async (c) => {
  const levels = await c.env.DB.prepare('SELECT * FROM grammar_level_config ORDER BY min_grade ASC').all();
  return c.json({ levels: levels.results || [] });
});

app.put('/api/grammar-levels/:grammarType', async (c) => {
  const grammarType = c.req.param('grammarType');
  const { minGrade } = await c.req.json();

  await c.env.DB.prepare('UPDATE grammar_level_config SET min_grade = ? WHERE grammar_type = ?')
    .bind(minGrade, grammarType).run();

  return c.json({ success: true });
});

// Export default
export default {
  fetch: app.fetch,
};
