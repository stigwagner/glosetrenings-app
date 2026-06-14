/**
 * Legger til verb-bøyninger i ordbanken
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Samme funksjon som i GrammarTrainer
function conjugateVerb(verb) {
  const lowerVerb = verb.toLowerCase();

  // Irregular verbs - tredjepersonsform
  const irregular = {
    'be': 'is',
    'am': 'is',
    'are': 'is',
    'have': 'has',
    'do': 'does',
    'go': 'goes',
  };

  if (irregular[lowerVerb]) {
    return irregular[lowerVerb];
  }

  // Regular verbs - add -s eller -es for tredjeperson entall
  if (verb.endsWith('s') || verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('x') || verb.endsWith('z')) {
    return verb + 'es';
  } else if (verb.endsWith('y') && !'aeiou'.includes(verb[verb.length - 2])) {
    return verb.slice(0, -1) + 'ies';
  } else {
    return verb + 's';
  }
}

console.log('🔧 Legger til verb-bøyninger i ordbanken...\n');

// 1. Legg til kolonne hvis den ikke finnes
try {
  db.exec('ALTER TABLE words ADD COLUMN verb_third_person TEXT');
  console.log('✅ Lagt til kolonne: verb_third_person\n');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('ℹ️  Kolonnen verb_third_person finnes allerede\n');
  } else {
    throw e;
  }
}

// 2. Generer tredjepersonsform for alle verb
const verbs = db.prepare('SELECT id, english, word_class FROM words WHERE word_class = ?').all('verb');

console.log(`📚 Fant ${verbs.length} verb\n`);

let updatedCount = 0;

for (const verb of verbs) {
  const thirdPerson = conjugateVerb(verb.english);

  db.prepare('UPDATE words SET verb_third_person = ? WHERE id = ?').run(thirdPerson, verb.id);

  console.log(`  I/you/we/they ${verb.english} → he/she/it ${thirdPerson}`);
  updatedCount++;
}

console.log(`\n🎉 Ferdig! Oppdatert ${updatedCount} verb med tredjepersonsformer.`);

db.close();
