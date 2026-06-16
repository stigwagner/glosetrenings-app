-- Konfigurasjonstabell for grammatikk-nivåer
CREATE TABLE IF NOT EXISTS grammar_level_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grammar_type TEXT UNIQUE NOT NULL,
  min_grade INTEGER NOT NULL,
  description TEXT
);

-- Standard konfigurasjon basert på norsk skole
INSERT OR IGNORE INTO grammar_level_config (grammar_type, min_grade, description) VALUES
('noun-plural', 4, 'Entall/flertall av substantiv (4. klasse)'),
('adjective-comparative', 5, 'Gradbøying av adjektiv - komparativ og superlativ (5. klasse)'),
('verb-conjugation', 6, 'Verb-bøyning med I, you, he/she/it, we, you, they (6. klasse)'),
('verb-past-tense', 6, 'Preteritum (6. klasse)'),
('verb-present-participle', 7, 'Present participle (-ing form) (7. klasse)');
