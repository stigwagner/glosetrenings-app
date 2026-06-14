import Database from 'better-sqlite3';
import fetch from 'node-fetch';

const db = new Database('glosetrenings.db');

// Finn ord med dårlige oversettelser
const badTranslations = db.prepare(`
  SELECT id, english, norwegian, word_class
  FROM words
  WHERE LOWER(english) = LOWER(norwegian)
  AND LENGTH(english) >= 3
  ORDER BY LENGTH(english) DESC
`).all();

console.log(`🔍 Fant ${badTranslations.length} ord med dårlige oversettelser\n`);

let fixed = 0;
let skipped = 0;
let failed = 0;

async function translateWord(word) {
  try {
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|no`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      let norwegian = data.responseData.translatedText;

      // Sjekk at oversettelsen ikke er identisk med originalen
      if (norwegian.toLowerCase() === word.toLowerCase()) {
        return null;
      }

      return norwegian;
    }
  } catch (error) {
    console.error(`❌ Feil ved oversettelse av "${word}":`, error.message);
  }
  return null;
}

// Prosesser ord
for (const word of badTranslations) {
  console.log(`Oversetter: ${word.english}...`);

  const norwegian = await translateWord(word.english);

  if (norwegian) {
    db.prepare('UPDATE words SET norwegian = ? WHERE id = ?').run(norwegian, word.id);
    console.log(`  ✅ ${word.english} → ${norwegian}`);
    fixed++;
  } else {
    console.log(`  ⚠️  Ingen oversettelse funnet`);
    skipped++;
  }

  // Vent litt mellom kall for å ikke overbelaste API
  await new Promise(resolve => setTimeout(resolve, 200));
}

console.log(`\n📊 Resultat:`);
console.log(`  ✅ Fikset: ${fixed}`);
console.log(`  ⚠️  Hoppet over: ${skipped}`);
console.log(`  ❌ Feilet: ${failed}`);

db.close();
