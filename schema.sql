-- Database schema for glosetrenings-app

-- Brukertabell (Hermann og Vilma)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Lekser (hver leksjon med dato)
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  school_year TEXT NOT NULL,
  image_url TEXT, -- OCR-skannet bilde
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Gloser (ord fra hver leksjon)
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  english TEXT NOT NULL,
  norwegian TEXT NOT NULL,
  word_class TEXT, -- noun, verb, adjective, etc
  synonyms TEXT, -- JSON array
  antonyms TEXT, -- JSON array
  image_url TEXT, -- Bilde fra Unsplash/Pexels
  example_sentences TEXT, -- JSON array med eksempelsetninger fra Claude
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

-- Fremgang/resultater for hver test
CREATE TABLE test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  test_type TEXT NOT NULL, -- 'hangman', 'sentence', 'pronunciation'
  score INTEGER NOT NULL, -- 0-10 poeng
  attempts INTEGER NOT NULL,
  hints_used INTEGER DEFAULT 0,
  time_spent INTEGER, -- sekunder
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES words(id)
);

-- Badges/achievements
CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'streak', 'total_score', 'perfect_days', etc
  requirement_value INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Brukerens opptjente badges
CREATE TABLE user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  UNIQUE(user_id, badge_id)
);

-- Daglig aktivitet (for streaks)
CREATE TABLE daily_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_date DATE NOT NULL,
  words_practiced INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, activity_date)
);

-- Indekser for rask søking
CREATE INDEX idx_lessons_user_date ON lessons(user_id, date);
CREATE INDEX idx_words_lesson ON words(lesson_id);
CREATE INDEX idx_test_results_user ON test_results(user_id, completed_at);
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date);

-- Insert standard badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Nybegynner', 'Fullfør din første test!', '🌱', 'tests_completed', 1),
  ('3-dagers streak', 'Øv 3 dager på rad', '🔥', 'streak_days', 3),
  ('7-dagers streak', 'Øv 7 dager på rad', '⭐', 'streak_days', 7),
  ('Perfeksjonist', 'Få 10 poeng på 10 ord', '💯', 'perfect_scores', 10),
  ('100 ord mester', 'Øv på 100 forskjellige ord', '📚', 'unique_words', 100),
  ('Uttale-mester', 'Få perfekt uttale 20 ganger', '🎤', 'perfect_pronunciation', 20),
  ('Uke-kriger', 'Øv hver dag i en uke', '👑', 'streak_days', 7),
  ('Månedlig helt', 'Øv hver dag i en måned', '🏆', 'streak_days', 30);
