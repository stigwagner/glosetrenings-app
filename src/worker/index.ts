/**
 * Cloudflare Worker - Backend for glosetrenings-app
 */

export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  UNSPLASH_ACCESS_KEY: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Auth endpoints
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      }
      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env);
      }

      // Lesson endpoints
      if (path === '/api/lessons' && request.method === 'GET') {
        return await getLessons(request, env);
      }
      if (path === '/api/lessons' && request.method === 'POST') {
        return await createLesson(request, env);
      }

      // Word endpoints
      if (path.startsWith('/api/lessons/') && path.endsWith('/words')) {
        const lessonId = path.split('/')[3];
        if (request.method === 'GET') {
          return await getWords(lessonId, env);
        }
        if (request.method === 'POST') {
          return await addWord(lessonId, request, env);
        }
      }

      // AI endpoints
      if (path === '/api/ai/translate' && request.method === 'POST') {
        return await translateWord(request, env);
      }
      if (path === '/api/ai/validate-sentence' && request.method === 'POST') {
        return await validateSentence(request, env);
      }
      if (path === '/api/ai/enrich-word' && request.method === 'POST') {
        return await enrichWord(request, env);
      }

      // Image search
      if (path === '/api/images/search' && request.method === 'GET') {
        return await searchImage(request, env);
      }

      // Test results
      if (path === '/api/test-results' && request.method === 'POST') {
        return await saveTestResult(request, env);
      }

      // User stats
      if (path.startsWith('/api/users/') && path.endsWith('/stats')) {
        const userId = path.split('/')[3];
        return await getUserStats(userId, env);
      }

      // Badges
      if (path.startsWith('/api/users/') && path.endsWith('/badges')) {
        const userId = path.split('/')[3];
        return await getUserBadges(userId, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

// Helper functions

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Auth handlers
async function handleLogin(request: Request, env: Env) {
  const { username, password } = await request.json();
  const passwordHash = await hashPassword(password);

  const user = await env.DB.prepare(
    'SELECT id, username, display_name, birth_year, grade FROM users WHERE username = ? AND password_hash = ?'
  )
    .bind(username, passwordHash)
    .first();

  if (!user) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  // Update last login
  await env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(user.id)
    .run();

  return jsonResponse({ user });
}

async function handleRegister(request: Request, env: Env) {
  const { username, password, displayName, birthYear, grade } = await request.json();
  const passwordHash = await hashPassword(password);

  try {
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password_hash, display_name, birth_year, grade) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(username, passwordHash, displayName, birthYear, grade)
      .run();

    return jsonResponse({ id: result.meta.last_row_id, username, displayName });
  } catch (error) {
    return jsonResponse({ error: 'Username already exists' }, 409);
  }
}

// Lesson handlers
async function getLessons(request: Request, env: Env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  const lessons = await env.DB.prepare(
    'SELECT * FROM lessons WHERE user_id = ? ORDER BY date DESC'
  )
    .bind(userId)
    .all();

  return jsonResponse({ lessons: lessons.results });
}

async function createLesson(request: Request, env: Env) {
  const { userId, title, description, date, schoolYear, imageUrl } = await request.json();

  const result = await env.DB.prepare(
    'INSERT INTO lessons (user_id, title, description, date, school_year, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(userId, title, description, date, schoolYear, imageUrl)
    .run();

  return jsonResponse({ id: result.meta.last_row_id });
}

// Word handlers
async function getWords(lessonId: string, env: Env) {
  const words = await env.DB.prepare('SELECT * FROM words WHERE lesson_id = ?')
    .bind(lessonId)
    .all();

  return jsonResponse({ words: words.results });
}

async function addWord(lessonId: string, request: Request, env: Env) {
  const { english, norwegian, wordClass, synonyms, antonyms, imageUrl, exampleSentences } =
    await request.json();

  const result = await env.DB.prepare(
    `INSERT INTO words (lesson_id, english, norwegian, word_class, synonyms, antonyms, image_url, example_sentences)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      lessonId,
      english,
      norwegian,
      wordClass,
      JSON.stringify(synonyms || []),
      JSON.stringify(antonyms || []),
      imageUrl,
      JSON.stringify(exampleSentences || [])
    )
    .run();

  return jsonResponse({ id: result.meta.last_row_id });
}

// AI handlers
async function translateWord(request: Request, env: Env) {
  const { word } = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate this English word to Norwegian and provide word class: "${word}".
          Respond in JSON format: {"norwegian": "...", "wordClass": "noun/verb/adjective/etc"}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const translation = JSON.parse(data.content[0].text);

  return jsonResponse(translation);
}

async function validateSentence(request: Request, env: Env) {
  const { sentence, word } = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `A child learning English wrote this sentence using the word "${word}": "${sentence}".
          Is it grammatically correct? Provide encouraging feedback.
          Respond in JSON: {"isValid": true/false, "feedback": "...", "suggestions": ["..."], "score": 0-10}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const validation = JSON.parse(data.content[0].text);

  return jsonResponse(validation);
}

async function enrichWord(request: Request, env: Env) {
  const { word } = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `For the English word "${word}", provide:
          1. Synonyms (2-3 simple words)
          2. Antonyms (2-3 simple words)
          3. Example sentences (3 sentences, appropriate for elementary school children)
          4. Word class (noun/verb/adjective/etc)

          Respond in JSON format: {
            "synonyms": ["...", "..."],
            "antonyms": ["...", "..."],
            "exampleSentences": ["...", "...", "..."],
            "wordClass": "..."
          }`,
        },
      ],
    }),
  });

  const data = await response.json();
  const enrichment = JSON.parse(data.content[0].text);

  return jsonResponse(enrichment);
}

// Image search
async function searchImage(request: Request, env: Env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
    {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      },
    }
  );

  const data = await response.json();
  const imageUrl = data.results[0]?.urls?.regular;

  return jsonResponse({ imageUrl });
}

// Test result handler
async function saveTestResult(request: Request, env: Env) {
  const { userId, wordId, testType, score, attempts, hintsUsed, timeSpent } = await request.json();

  const result = await env.DB.prepare(
    `INSERT INTO test_results (user_id, word_id, test_type, score, attempts, hints_used, time_spent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(userId, wordId, testType, score, attempts, hintsUsed, timeSpent)
    .run();

  // Update daily activity
  await updateDailyActivity(userId, score, env);

  // Check and award badges
  await checkBadges(userId, env);

  return jsonResponse({ id: result.meta.last_row_id });
}

async function updateDailyActivity(userId: number, score: number, env: Env) {
  const today = new Date().toISOString().split('T')[0];

  await env.DB.prepare(
    `INSERT INTO daily_activity (user_id, activity_date, words_practiced, total_score, tests_completed)
     VALUES (?, ?, 1, ?, 1)
     ON CONFLICT(user_id, activity_date) DO UPDATE SET
       words_practiced = words_practiced + 1,
       total_score = total_score + ?,
       tests_completed = tests_completed + 1`
  )
    .bind(userId, today, score, score)
    .run();
}

async function checkBadges(userId: number, env: Env) {
  // Get user's test count
  const testCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM test_results WHERE user_id = ?'
  )
    .bind(userId)
    .first();

  // Award "Nybegynner" badge after first test
  if (testCount.count === 1) {
    await awardBadge(userId, 1, env); // Badge ID 1 = "Nybegynner"
  }

  // Check streak badges
  await checkStreakBadges(userId, env);
}

async function awardBadge(userId: number, badgeId: number, env: Env) {
  try {
    await env.DB.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)')
      .bind(userId, badgeId)
      .run();
  } catch (error) {
    // Badge already awarded
  }
}

async function checkStreakBadges(userId: number, env: Env) {
  // Calculate current streak
  const activities = await env.DB.prepare(
    'SELECT activity_date FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30'
  )
    .bind(userId)
    .all();

  let streak = 0;
  let currentDate = new Date();

  for (const activity of activities.results) {
    const activityDate = new Date(activity.activity_date);
    const diffDays = Math.floor(
      (currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }

    currentDate = activityDate;
  }

  // Award streak badges
  if (streak >= 3) await awardBadge(userId, 2, env); // 3-day streak
  if (streak >= 7) await awardBadge(userId, 3, env); // 7-day streak
  if (streak >= 30) await awardBadge(userId, 8, env); // 30-day streak
}

// Stats handler
async function getUserStats(userId: string, env: Env) {
  const stats = await env.DB.prepare(
    `SELECT
      COUNT(DISTINCT word_id) as totalWords,
      COUNT(*) as totalTests,
      AVG(score) as averageScore
     FROM test_results WHERE user_id = ?`
  )
    .bind(userId)
    .first();

  const badges = await env.DB.prepare(
    `SELECT ub.*, b.name, b.description, b.icon, b.requirement_type, b.requirement_value
     FROM user_badges ub
     JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = ?`
  )
    .bind(userId)
    .all();

  const recentActivity = await env.DB.prepare(
    'SELECT * FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30'
  )
    .bind(userId)
    .all();

  return jsonResponse({
    totalWords: stats.totalWords || 0,
    totalTests: stats.totalTests || 0,
    averageScore: stats.averageScore || 0,
    badges: badges.results,
    recentActivity: recentActivity.results,
  });
}

async function getUserBadges(userId: string, env: Env) {
  const badges = await env.DB.prepare(
    `SELECT ub.*, b.name, b.description, b.icon
     FROM user_badges ub
     JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = ?
     ORDER BY ub.earned_at DESC`
  )
    .bind(userId)
    .all();

  return jsonResponse({ badges: badges.results });
}
