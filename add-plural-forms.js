/**
 * Legger til flertallsformer for substantiv i ordbanken
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Samme funksjon som i GrammarTrainer
function getPluralForm(noun) {
  const lowerNoun = noun.toLowerCase();

  // Ord som allerede er i flertall - returner som de er
  const alreadyPlural = [
    'people', 'children', 'men', 'women', 'teeth', 'feet', 'mice', 'geese',
    'sheep', 'deer', 'fish', 'species', 'series', 'news', 'pants', 'scissors',
    'glasses', 'clothes', 'tourists', 'animals', 'students', 'words', 'lessons',
    'books', 'days', 'years', 'friends', 'teachers', 'parents', 'kids', 'boys',
    'girls', 'cats', 'dogs', 'birds', 'cars', 'trees', 'flowers', 'houses',
    'mountains', 'valleys', 'rivers', 'glaciers', 'lifeforms', 'stones', 'answers',
    'sentences', 'glaciers'
  ];

  if (alreadyPlural.includes(lowerNoun)) {
    return noun; // Allerede flertall
  }

  // Irregular plurals
  const irregular = {
    'man': 'men',
    'woman': 'women',
    'child': 'children',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'person': 'people',
    'leaf': 'leaves',
    'life': 'lives',
    'knife': 'knives',
    'wife': 'wives',
    'half': 'halves',
    'loaf': 'loaves',
    'potato': 'potatoes',
    'tomato': 'tomatoes',
    'cactus': 'cacti',
    'focus': 'foci',
    'fungus': 'fungi',
    'radius': 'radii',
    'ox': 'oxen',
  };

  if (irregular[lowerNoun]) {
    return irregular[lowerNoun];
  }

  // Regular plural rules
  if (noun.endsWith('ss') || noun.endsWith('sh') || noun.endsWith('ch') || noun.endsWith('x') || noun.endsWith('z')) {
    return noun + 'es';
  } else if (noun.endsWith('s')) {
    return noun; // Likely already plural
  } else if (noun.endsWith('y') && !'aeiou'.includes(noun[noun.length - 2])) {
    return noun.slice(0, -1) + 'ies';
  } else if (noun.endsWith('f')) {
    return noun.slice(0, -1) + 'ves';
  } else if (noun.endsWith('fe')) {
    return noun.slice(0, -2) + 'ves';
  } else if (noun.endsWith('o') && !'aeiou'.includes(noun[noun.length - 2])) {
    return noun + 'es';
  } else {
    return noun + 's';
  }
}

console.log('🔧 Legger til flertallsformer i ordbanken...\n');

// 1. Legg til kolonne hvis den ikke finnes
try {
  db.exec('ALTER TABLE words ADD COLUMN plural_form TEXT');
  console.log('✅ Lagt til kolonne: plural_form\n');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('ℹ️  Kolonnen plural_form finnes allerede\n');
  } else {
    throw e;
  }
}

// 2. Generer flertallsformer for alle substantiv
const nouns = db.prepare('SELECT id, english, word_class FROM words WHERE word_class = ?').all('noun');

console.log(`📚 Fant ${nouns.length} substantiv\n`);

let updatedCount = 0;

for (const noun of nouns) {
  const plural = getPluralForm(noun.english);

  db.prepare('UPDATE words SET plural_form = ? WHERE id = ?').run(plural, noun.id);

  console.log(`  ${noun.english} → ${plural}`);
  updatedCount++;
}

console.log(`\n🎉 Ferdig! Oppdatert ${updatedCount} substantiv med flertallsformer.`);

db.close();
