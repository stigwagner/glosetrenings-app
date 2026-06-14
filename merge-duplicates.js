/**
 * MERGE DUPLIKATER I ORDBANKEN
 * Finner duplikater (f.eks. "tourist" og "tourists") og merger dem til grunnformen
 */

import Database from 'better-sqlite3';
import { lemmatize, generateVerbForms, generatePluralForm } from './lemmatizer.js';

const db = new Database('glosetrenings.db');

console.log('🔍 Søker etter duplikater i ordbanken...\n');

// Hent alle ord
const allWords = db.prepare('SELECT * FROM words ORDER BY english').all();

console.log(`📚 Totalt ${allWords.length} ord i databasen\n`);

// Grupper ord etter lemma (grunnform)
const lemmaGroups = {};

allWords.forEach(word => {
  const lemma = lemmatize(word.english);

  if (!lemmaGroups[lemma]) {
    lemmaGroups[lemma] = [];
  }

  lemmaGroups[lemma].push(word);
});

// Finn grupper med duplikater
const duplicateGroups = Object.entries(lemmaGroups).filter(([lemma, words]) => words.length > 1);

console.log(`🔎 Fant ${duplicateGroups.length} grupper med duplikater:\n`);

duplicateGroups.forEach(([lemma, words]) => {
  console.log(`  ${lemma}:`);
  words.forEach(w => console.log(`    - ${w.english} (id: ${w.id})`));
  console.log('');
});

console.log(`\n🤔 Vil du merge disse duplikatene? Dette vil:`);
console.log(`  1. Beholde grunnformen (lemma) som hovedord`);
console.log(`  2. Fylle inn bøyningsformer automatisk`);
console.log(`  3. Slette duplikat-oppføringene`);
console.log(`  4. Oppdatere alle referanser (lesson_words, user_words, test_results)\n`);

// AUTO-MERGE (for testing)
console.log(`🚀 Starter auto-merge...\n`);

let mergedCount = 0;
let deletedCount = 0;

for (const [lemma, words] of duplicateGroups) {
  // Finn hvilken oppføring som skal være hovedoppføringen
  // Foretrekk grunnformen hvis den finnes, ellers den første
  let primaryWord = words.find(w => w.english.toLowerCase() === lemma) || words[0];

  console.log(`✓ Merger "${lemma}" (${words.length} oppføringer)`);

  // Generer bøyningsformer
  if (primaryWord.word_class === 'verb') {
    const forms = generateVerbForms(lemma);
    db.prepare(`
      UPDATE words
      SET verb_third_person = ?,
          verb_past = ?,
          verb_past_participle = ?,
          verb_present_participle = ?
      WHERE id = ?
    `).run(
      forms.thirdPerson,
      forms.past,
      forms.pastParticiple,
      forms.presentParticiple,
      primaryWord.id
    );
    console.log(`  Oppdatert verbformer: ${forms.thirdPerson}, ${forms.past}, etc.`);
  } else if (primaryWord.word_class === 'noun') {
    const plural = generatePluralForm(lemma);
    db.prepare('UPDATE words SET plural_form = ? WHERE id = ?').run(plural, primaryWord.id);
    console.log(`  Oppdatert flertall: ${plural}`);
  }

  // Oppdater grunnformen
  if (primaryWord.english !== lemma) {
    db.prepare('UPDATE words SET english = ? WHERE id = ?').run(lemma, primaryWord.id);
    console.log(`  Oppdatert grunnform: ${primaryWord.english} → ${lemma}`);
  }

  // Merger duplikatene
  for (const duplicateWord of words) {
    if (duplicateWord.id === primaryWord.id) continue; // Skip hovedoppføringen

    // Oppdater lesson_words - men skip hvis det allerede finnes en relasjon
    const lessonWords = db.prepare('SELECT lesson_id FROM lesson_words WHERE word_id = ?')
      .all(duplicateWord.id);

    for (const lw of lessonWords) {
      // Sjekk om primary word allerede er i denne leksjonen
      const exists = db.prepare('SELECT 1 FROM lesson_words WHERE lesson_id = ? AND word_id = ?')
        .get(lw.lesson_id, primaryWord.id);

      if (!exists) {
        // Oppdater til primary word
        db.prepare('UPDATE lesson_words SET word_id = ? WHERE lesson_id = ? AND word_id = ?')
          .run(primaryWord.id, lw.lesson_id, duplicateWord.id);
      } else {
        // Primary word finnes allerede, bare slett duplikatet
        db.prepare('DELETE FROM lesson_words WHERE lesson_id = ? AND word_id = ?')
          .run(lw.lesson_id, duplicateWord.id);
      }
    }

    // Oppdater user_words - samme logikk
    const userWords = db.prepare('SELECT user_id FROM user_words WHERE word_id = ?')
      .all(duplicateWord.id);

    for (const uw of userWords) {
      const exists = db.prepare('SELECT 1 FROM user_words WHERE user_id = ? AND word_id = ?')
        .get(uw.user_id, primaryWord.id);

      if (!exists) {
        db.prepare('UPDATE user_words SET word_id = ? WHERE user_id = ? AND word_id = ?')
          .run(primaryWord.id, uw.user_id, duplicateWord.id);
      } else {
        db.prepare('DELETE FROM user_words WHERE user_id = ? AND word_id = ?')
          .run(uw.user_id, duplicateWord.id);
      }
    }

    // Oppdater test_results - kan bare oppdateres direkte
    db.prepare('UPDATE test_results SET word_id = ? WHERE word_id = ?')
      .run(primaryWord.id, duplicateWord.id);

    // Slett duplikatet
    db.prepare('DELETE FROM words WHERE id = ?').run(duplicateWord.id);

    console.log(`  Slettet duplikat: ${duplicateWord.english} (id: ${duplicateWord.id})`);
    deletedCount++;
  }

  mergedCount++;
  console.log('');
}

console.log(`\n🎉 Ferdig!`);
console.log(`  Merged grupper: ${mergedCount}`);
console.log(`  Slettede duplikater: ${deletedCount}`);

// Vis statistikk
const finalCount = db.prepare('SELECT COUNT(*) as count FROM words').get().count;
console.log(`  Gjenstående ord: ${finalCount} (var ${allWords.length})`);

// Fylle inn manglende bøyningsformer for alle ord
console.log(`\n📝 Fyller inn manglende bøyningsformer...\n`);

const wordsWithoutForms = db.prepare('SELECT * FROM words').all();

let filledCount = 0;

wordsWithoutForms.forEach(word => {
  if (word.word_class === 'verb' && !word.verb_past) {
    const forms = generateVerbForms(word.english);
    db.prepare(`
      UPDATE words
      SET verb_third_person = ?,
          verb_past = ?,
          verb_past_participle = ?,
          verb_present_participle = ?
      WHERE id = ?
    `).run(
      forms.thirdPerson,
      forms.past,
      forms.pastParticiple,
      forms.presentParticiple,
      word.id
    );
    console.log(`  ✓ ${word.english}: ${forms.thirdPerson}, ${forms.past}, ${forms.presentParticiple}`);
    filledCount++;
  } else if (word.word_class === 'noun' && !word.plural_form) {
    const plural = generatePluralForm(word.english);
    db.prepare('UPDATE words SET plural_form = ? WHERE id = ?').run(plural, word.id);
    console.log(`  ✓ ${word.english} → ${plural}`);
    filledCount++;
  }
});

console.log(`\n✅ Fylt inn bøyningsformer for ${filledCount} ord`);

db.close();
