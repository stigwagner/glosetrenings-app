-- Ny database-struktur med universell ordbank

-- Users (uendret)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  school_start_year INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- UNIVERSELL ORDBANK (delt mellom alle brukere)
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT UNIQUE NOT NULL,
  norwegian TEXT,
  word_class TEXT,
  plural_form TEXT, -- For nouns: house -> houses
  verb_third_person TEXT, -- For verbs: go -> goes
  verb_past TEXT, -- For verbs: go -> went
  verb_past_participle TEXT, -- For verbs: go -> gone
  verb_present_participle TEXT, -- For verbs: go -> going
  synonyms TEXT, -- JSON array
  antonyms TEXT, -- JSON array
  example_sentences TEXT, -- JSON array
  image_url TEXT,
  difficulty_level INTEGER DEFAULT 1, -- 1-5, kan brukes for aldersfilter
  recommended_grade INTEGER DEFAULT 2, -- Anbefalt klassetrinn (1-7)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leksjoner (øvingssesjoner) - fortsatt brukerspesifikke
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  school_year TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Kobling mellom leksjoner og ord
CREATE TABLE IF NOT EXISTS lesson_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  is_weekly_word BOOLEAN DEFAULT 1, -- 1 = ukens ord (må øves), 0 = repetisjon
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(lesson_id, word_id)
);

-- BRUKERENS ORDSTATUS (personlig fremdrift)
CREATE TABLE IF NOT EXISTS user_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  source TEXT DEFAULT 'universal', -- 'local' (scanned lesson) or 'universal' (word bank)
  times_practiced INTEGER DEFAULT 0, -- Antall ganger øvd
  times_completed INTEGER DEFAULT 0, -- Antall ganger fullført (alle tester)
  mastery_level INTEGER DEFAULT 0, -- 0-5 (0=ny, 5=mestret)
  average_score REAL DEFAULT 0,
  last_practiced_date DATETIME,
  next_practice_date DATE, -- Neste øvingsdato
  is_mastered BOOLEAN DEFAULT 0, -- 1 etter 5 vellykkede øvelser
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(user_id, word_id)
);

-- Testresultater
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  lesson_id INTEGER,
  test_type TEXT NOT NULL, -- 'hangman', 'sentence', 'pronunciation', 'grammar'
  score INTEGER NOT NULL,
  attempts INTEGER DEFAULT 1,
  hints_used INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES words(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

-- Badges (uendret)
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  UNIQUE(user_id, badge_id)
);

-- Daily activity (uendret)
CREATE TABLE IF NOT EXISTS daily_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_date DATE NOT NULL,
  words_practiced INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, activity_date)
);

-- Pre-definerte badges
INSERT OR IGNORE INTO badges (id, name, description, icon, requirement_type, requirement_value) VALUES
(1, 'Første ord', 'Fullført første ord', '🌟', 'words_completed', 1),
(2, 'Ti ord', 'Fullført 10 ord', '⭐', 'words_completed', 10),
(3, 'Femti ord', 'Fullført 50 ord', '✨', 'words_completed', 50),
(4, 'Hundre ord', 'Fullført 100 ord', '🏆', 'words_completed', 100),
(5, 'Uke-streak', 'Øvd 7 dager på rad', '🔥', 'streak_days', 7),
(6, 'Måned-streak', 'Øvd 30 dager på rad', '🔥🔥', 'streak_days', 30),
(7, 'Perfekt score', 'Fikk 10 poeng på en test', '💯', 'perfect_score', 1),
(8, 'Grammatikk-mester', 'Fullført 20 grammatikk-øvelser', '📝', 'grammar_completed', 20);

-- Indekser for bedre ytelse
CREATE INDEX IF NOT EXISTS idx_user_words_user ON user_words(user_id);
CREATE INDEX IF NOT EXISTS idx_user_words_word ON user_words(word_id);
CREATE INDEX IF NOT EXISTS idx_user_words_mastered ON user_words(user_id, is_mastered);
CREATE INDEX IF NOT EXISTS idx_lesson_words_lesson ON lesson_words(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_words_word ON lesson_words(word_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_word ON test_results(word_id);
