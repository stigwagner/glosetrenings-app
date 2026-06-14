import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('=== DATABASE SCHEMA ===\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

tables.forEach(table => {
  console.log(`\n📊 Table: ${table.name}`);
  console.log('─'.repeat(60));

  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
  schema.forEach(col => {
    console.log(`  ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
});

console.log('\n\n=== SAMPLE DATA ===\n');

// Check user_words for a sample user
console.log('📝 Sample user_words (first 5):');
const sampleWords = db.prepare('SELECT * FROM user_words LIMIT 5').all();
console.log(sampleWords);

console.log('\n📅 Sample daily_activity (first 5):');
const sampleActivity = db.prepare('SELECT * FROM daily_activity LIMIT 5').all();
console.log(sampleActivity);

console.log('\n🎯 Sample test_results (first 5):');
const sampleTests = db.prepare('SELECT * FROM test_results LIMIT 5').all();
console.log(sampleTests);

db.close();
