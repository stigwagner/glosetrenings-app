/**
 * LEGGER TIL SKOLEÅR-SPORING
 *
 * Endrer fra statisk 'grade' til dynamisk beregning basert på:
 * - school_start_year (året barnet startet 1. klasse)
 * - Automatisk beregning av klassetrinn basert på dagens dato
 *
 * Håndterer sommerferien:
 * - 15. juni - 14. august: Eleven er i "neste" klassetrinn (forberedelse til høsten)
 * - Resten av året: Beregner klassetrinn fra skolestart-år
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('📅 Legger til skoleår-sporing...\n');

// 1. Legg til school_start_year kolonne
try {
  db.exec('ALTER TABLE users ADD COLUMN school_start_year INTEGER');
  console.log('✅ Lagt til: school_start_year i users');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  school_start_year finnes allerede');
  } else {
    throw e;
  }
}

// 2. Beregn school_start_year for eksisterende brukere basert på nåværende grade
// Antar at vi er midt i skoleåret 2026 (juni)
const currentYear = 2026;
const currentMonth = 6; // Juni

const users = db.prepare('SELECT id, username, display_name, birth_year, grade FROM users').all();

console.log(`\n📊 Oppdaterer ${users.length} eksisterende brukere...\n`);

for (const user of users) {
  // Beregn når de startet 1. klasse
  // Hvis de er i 4. klasse nå (juni 2026), startet de i 2023
  let schoolStartYear;

  if (currentMonth >= 8) {
    // Etter august: skoleåret har startet
    schoolStartYear = currentYear - (user.grade - 1);
  } else {
    // Før august: forrige skoleår
    schoolStartYear = currentYear - user.grade;
  }

  db.prepare('UPDATE users SET school_start_year = ? WHERE id = ?')
    .run(schoolStartYear, user.id);

  console.log(`  ✓ ${user.display_name} (${user.username}): Startet skolen i ${schoolStartYear} (nå i ${user.grade}. klasse)`);
}

console.log('\n📝 Oppdatert users-tabell:');
console.log('  - birth_year: fødselsår');
console.log('  - school_start_year: året barnet startet 1. klasse');
console.log('  - grade: brukes fortsatt for raskt oppslag, men beregnes dynamisk ved pålogging\n');

console.log('✅ Ferdig!\n');

db.close();
