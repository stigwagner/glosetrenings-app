import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

// Sjekk eksisterende badges
console.log('📛 Eksisterende badges:');
const existingBadges = db.prepare('SELECT * FROM badges ORDER BY id').all();
existingBadges.forEach(badge => {
  console.log(`  ${badge.icon} ${badge.name} - ${badge.description} (${badge.requirement_type}: ${badge.requirement_value})`);
});

console.log(`\nTotalt: ${existingBadges.length} badges\n`);

// Nye badges å legge til
const newBadges = [
  {
    name: 'Første skritt',
    description: 'Fullført din første test!',
    icon: '🎯',
    requirement_type: 'total_tests',
    requirement_value: 1
  },
  {
    name: 'Dedikert student',
    description: 'Fullført 50 tester!',
    icon: '📖',
    requirement_type: 'total_tests',
    requirement_value: 50
  },
  {
    name: 'Test-mester',
    description: 'Fullført 100 tester!',
    icon: '🏅',
    requirement_type: 'total_tests',
    requirement_value: 100
  },
  {
    name: 'Ordbank-bygger',
    description: 'Øvd på 50 forskjellige ord!',
    icon: '📚',
    requirement_type: 'total_words',
    requirement_value: 50
  },
  {
    name: 'Ordbank-ekspert',
    description: 'Øvd på 100 forskjellige ord!',
    icon: '📕',
    requirement_type: 'total_words',
    requirement_value: 100
  },
  {
    name: 'Ordbank-mester',
    description: 'Øvd på 200 forskjellige ord!',
    icon: '📗',
    requirement_type: 'total_words',
    requirement_value: 200
  },
  {
    name: 'Perfeksjonist',
    description: 'Oppnådd gjennomsnittscore på 9.0!',
    icon: '💯',
    requirement_type: 'average_score',
    requirement_value: 9.0
  },
  {
    name: 'Strålende student',
    description: 'Oppnådd gjennomsnittscore på 8.0!',
    icon: '⭐',
    requirement_type: 'average_score',
    requirement_value: 8.0
  },
  {
    name: 'Varm streak',
    description: 'Øvd 3 dager på rad!',
    icon: '🔥',
    requirement_type: 'current_streak',
    requirement_value: 3
  },
  {
    name: 'Uke-kriger',
    description: 'Øvd 7 dager på rad!',
    icon: '⚡',
    requirement_type: 'current_streak',
    requirement_value: 7
  },
  {
    name: 'Ustoppelig',
    description: 'Øvd 14 dager på rad!',
    icon: '💪',
    requirement_type: 'current_streak',
    requirement_value: 14
  },
  {
    name: 'Måneds-mester',
    description: 'Øvd 30 dager på rad!',
    icon: '👑',
    requirement_type: 'current_streak',
    requirement_value: 30
  },
  {
    name: 'Første mestring',
    description: 'Mestret ditt første ord!',
    icon: '🌟',
    requirement_type: 'mastered_words',
    requirement_value: 1
  },
  {
    name: 'Mestrings-samler',
    description: 'Mestret 10 ord!',
    icon: '🎓',
    requirement_type: 'mastered_words',
    requirement_value: 10
  },
  {
    name: 'Mestrings-ekspert',
    description: 'Mestret 25 ord!',
    icon: '🏆',
    requirement_type: 'mastered_words',
    requirement_value: 25
  },
  {
    name: 'Mestrings-legende',
    description: 'Mestret 50 ord!',
    icon: '🥇',
    requirement_type: 'mastered_words',
    requirement_value: 50
  }
];

console.log('➕ Legger til nye badges...\n');

let added = 0;
let skipped = 0;

for (const badge of newBadges) {
  // Sjekk om badge allerede finnes
  const existing = db.prepare(
    'SELECT * FROM badges WHERE name = ? OR (requirement_type = ? AND requirement_value = ?)'
  ).get(badge.name, badge.requirement_type, badge.requirement_value);

  if (existing) {
    console.log(`  ⏭️  Hopper over: ${badge.icon} ${badge.name} (finnes allerede)`);
    skipped++;
  } else {
    db.prepare(`
      INSERT INTO badges (name, description, icon, requirement_type, requirement_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(badge.name, badge.description, badge.icon, badge.requirement_type, badge.requirement_value);

    console.log(`  ✅ Lagt til: ${badge.icon} ${badge.name}`);
    added++;
  }
}

console.log(`\n📊 Resultat:`);
console.log(`  ✅ Nye badges lagt til: ${added}`);
console.log(`  ⏭️  Hoppet over: ${skipped}`);

// Vis alle badges nå
console.log('\n📛 Alle badges nå:');
const allBadges = db.prepare('SELECT * FROM badges ORDER BY requirement_type, requirement_value').all();
allBadges.forEach(badge => {
  console.log(`  ${badge.icon} ${badge.name} - ${badge.description}`);
});

console.log(`\n✨ Totalt ${allBadges.length} badges i systemet!`);

db.close();
