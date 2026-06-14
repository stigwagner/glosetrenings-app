/**
 * Analyserer alle ord i databasen og finner mønstre
 */

import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('🔍 Analyserer ordbanken...\n');

// Hent alle ord
const words = db.prepare('SELECT id, english, norwegian, word_class FROM words ORDER BY word_class, english').all();

console.log(`📚 Totalt ${words.length} ord i databasen\n`);

// Grupper etter ordklasse
const byClass = {};
words.forEach(word => {
  const wc = word.word_class || 'unknown';
  if (!byClass[wc]) byClass[wc] = [];
  byClass[wc].push(word);
});

// Vis statistikk
console.log('📊 ORDKLASSER:\n');
Object.entries(byClass).sort((a, b) => b[1].length - a[1].length).forEach(([wordClass, wordList]) => {
  console.log(`  ${wordClass}: ${wordList.length} ord`);
  console.log(`    Eksempler: ${wordList.slice(0, 5).map(w => w.english).join(', ')}`);
  console.log('');
});

// Finn problematiske ord
console.log('\n⚠️  POTENSIELT PROBLEMATISKE ORD:\n');

const problems = [];

words.forEach(word => {
  const w = word.english.toLowerCase();
  const wc = word.word_class;

  // Hjelpeverb klassifisert feil
  if (['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being'].includes(w) && wc === 'verb') {
    problems.push({ word: word.english, issue: 'Hjelpeverb - trenger spesielle eksempler', class: wc });
  }

  // Spørreord klassifisert som noun
  if (['what', 'where', 'when', 'why', 'who', 'which', 'how'].includes(w) && wc === 'noun') {
    problems.push({ word: word.english, issue: 'Spørreord klassifisert som noun', class: wc });
  }

  // Verb i 3. person/fortid klassifisert som noun
  if ((w.endsWith('s') || w.endsWith('ed') || w.endsWith('ing')) && wc === 'noun') {
    problems.push({ word: word.english, issue: 'Mulig verb klassifisert som noun', class: wc });
  }

  // Adjektiv klassifisert som noun
  if (['long', 'short', 'high', 'low', 'fast', 'slow', 'big', 'small'].includes(w) && wc === 'noun') {
    problems.push({ word: word.english, issue: 'Adjektiv klassifisert som noun', class: wc });
  }

  // Adverb klassifisert feil
  if (w.endsWith('ly') && wc !== 'adverb') {
    problems.push({ word: word.english, issue: 'Adverb klassifisert feil', class: wc });
  }
});

problems.forEach(p => {
  console.log(`  ❌ "${p.word}" (${p.class}): ${p.issue}`);
});

console.log(`\n📌 Funnet ${problems.length} problematiske ord\n`);

// Finn de mest vanlige ordene (bør ha håndskrevne eksempler)
console.log('🔝 VANLIGE ORD (bør ha spesifikke eksempler):\n');

const commonWords = [
  'the', 'a', 'an', 'and', 'or', 'but',
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had',
  'do', 'does', 'did',
  'can', 'could', 'will', 'would', 'should',
  'in', 'on', 'at', 'to', 'from', 'with',
  'what', 'where', 'when', 'why', 'who', 'how'
];

const foundCommon = words.filter(w => commonWords.includes(w.english.toLowerCase()));
foundCommon.forEach(w => {
  console.log(`  • ${w.english} (${w.word_class})`);
});

console.log(`\n✅ ${foundCommon.length} av ${commonWords.length} vanlige ord funnet i databasen`);

db.close();
