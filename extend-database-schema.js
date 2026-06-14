/**
 * Utvider databaseskjema med verbformer
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('🔧 Utvider databaseskjema...\n');

// Vis gjeldende skjema
console.log('📋 Gjeldende kolonner i words-tabellen:');
const columns = db.prepare("PRAGMA table_info(words)").all();
columns.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\n🆕 Legger til nye kolonner...\n');

// Legg til kolonner for verbformer
const newColumns = [
  'verb_past TEXT',                    // fortid: brought, ran, studied
  'verb_past_participle TEXT',         // perfektum partisipp: brought, run, studied
  'verb_present_participle TEXT',      // presens partisipp: bringing, running, studying
  // verb_third_person finnes allerede fra tidligere
];

newColumns.forEach(colDef => {
  const colName = colDef.split(' ')[0];

  try {
    db.exec(`ALTER TABLE words ADD COLUMN ${colDef}`);
    console.log(`  ✅ Lagt til: ${colName}`);
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log(`  ℹ️  Finnes allerede: ${colName}`);
    } else {
      console.error(`  ❌ Feil: ${colName} - ${e.message}`);
    }
  }
});

console.log('\n📋 Oppdaterte kolonner:');
const updatedColumns = db.prepare("PRAGMA table_info(words)").all();
updatedColumns.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\n✅ Databaseskjema utvidet!');

db.close();
