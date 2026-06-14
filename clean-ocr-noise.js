import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Liste over åpenbare OCR-støy ord
const ocrNoise = [
  'RO', 'SAL', 'oSts', 'aq', 'PY', 'g', 'ing', 'es', 'E', 'oy', 'mn', 'ein',
  'EI', 'Iit', 'er', 'OMT', 'SART', 'IEE', 'cary', 'gern', 'mek', 'Wis',
  'ek', 'Sal', 'lowers', 'lowess', 'rune', 'we', 'He', 'rind', 'eer',
  'FEE', 'Thue', 'SIRE', 'heh', 'nek', 'elo', 'BIS', 'fil', 'ang',
  'ofon', 'ghin', '-eaa', 'Nerg', 'Whig', 'ERE', 'pod', 'alttgg',
  'FFsise', 'SIRES', 'angey', 'fuscr', 'Ciwrs', 'ngrig', 'Gouin',
  'kirg', 'Ught', 'Ecol', 'Wadd', 'lowe', 'Trad', 'gram', 'Usa',
  'Boe', 'Fay', 'ountains', 'lteforps', 'stlandet', 'Dreught',
  'Lleiie', 'albide', 'Mimays', 'nomena', 'Glitt', 'Orvalleys',
  'Dstlandet', 'rindzer', 'leans'
];

console.log(`🗑️  Sletter ${ocrNoise.length} OCR-støy ord...\n`);

let deleted = 0;

for (const word of ocrNoise) {
  try {
    const result = db.prepare('DELETE FROM words WHERE english = ?').run(word);
    if (result.changes > 0) {
      console.log(`  ✅ Slettet: ${word}`);
      deleted++;
    }
  } catch (error) {
    console.error(`  ❌ Feil ved sletting av ${word}:`, error.message);
  }
}

console.log(`\n📊 Slettet totalt ${deleted} OCR-støy ord`);

db.close();
