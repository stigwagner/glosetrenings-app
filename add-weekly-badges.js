import Database from 'better-sqlite3';

const db = new Database('glosetrenings.db');

console.log('📛 Legger til ukentlige og månedlige badges...\n');

// Nye pedagogisk kalibrerte badges
const newBadges = [
  // UKENTLIG - NYE ORD (siste 7 dager)
  {
    name: 'Ordplanter 🌱',
    description: 'Lært 3-5 nye ord denne uken',
    icon: '🌱',
    requirement_type: 'weekly_new_words',
    requirement_value: 3,
    badge_level: 'bronze'
  },
  {
    name: 'Ordbokleser 📗',
    description: 'Lært 6-10 nye ord denne uken',
    icon: '📗',
    requirement_type: 'weekly_new_words',
    requirement_value: 6,
    badge_level: 'silver'
  },
  {
    name: 'Ordsamler 📘',
    description: 'Lært 11-15 nye ord denne uken',
    icon: '📘',
    requirement_type: 'weekly_new_words',
    requirement_value: 11,
    badge_level: 'gold'
  },
  {
    name: 'Ordmester 📕',
    description: 'Lært 16-20 nye ord denne uken',
    icon: '📕',
    requirement_type: 'weekly_new_words',
    requirement_value: 16,
    badge_level: 'platinum'
  },
  {
    name: 'Ordgeni 📚',
    description: 'Lært 21+ nye ord denne uken - utrolig!',
    icon: '📚',
    requirement_type: 'weekly_new_words',
    requirement_value: 21,
    badge_level: 'diamond'
  },

  // UKENTLIG - TOTAL ØVING (nye + repetisjoner)
  {
    name: 'Aktiv elev ⭐',
    description: 'Øvd på 10-20 ord totalt denne uken',
    icon: '⭐',
    requirement_type: 'weekly_total_practice',
    requirement_value: 10,
    badge_level: 'bronze'
  },
  {
    name: 'Dedikert student 🌟',
    description: 'Øvd på 21-40 ord totalt denne uken',
    icon: '🌟',
    requirement_type: 'weekly_total_practice',
    requirement_value: 21,
    badge_level: 'silver'
  },
  {
    name: 'Superstjerne 💫',
    description: 'Øvd på 41+ ord totalt denne uken',
    icon: '💫',
    requirement_type: 'weekly_total_practice',
    requirement_value: 41,
    badge_level: 'gold'
  },

  // MÅNEDLIG - NYE ORD
  {
    name: 'Måneds-starter 🥉',
    description: 'Lært 20-40 nye ord denne måneden',
    icon: '🥉',
    requirement_type: 'monthly_new_words',
    requirement_value: 20,
    badge_level: 'bronze'
  },
  {
    name: 'Måneds-mester 🥈',
    description: 'Lært 41-60 nye ord denne måneden',
    icon: '🥈',
    requirement_type: 'monthly_new_words',
    requirement_value: 41,
    badge_level: 'silver'
  },
  {
    name: 'Måneds-legende 🥇',
    description: 'Lært 61+ nye ord denne måneden',
    icon: '🥇',
    requirement_type: 'monthly_new_words',
    requirement_value: 61,
    badge_level: 'gold'
  },

  // MOMENTUM (kun siste 7 dager)
  {
    name: 'God start 💪',
    description: 'Øvd 3+ dager på rad denne uken',
    icon: '💪',
    requirement_type: 'weekly_streak',
    requirement_value: 3,
    badge_level: 'bronze'
  },
  {
    name: 'På rullen 🚀',
    description: 'Øvd 5+ dager på rad denne uken',
    icon: '🚀',
    requirement_type: 'weekly_streak',
    requirement_value: 5,
    badge_level: 'silver'
  },
  {
    name: 'Perfekt uke 🏆',
    description: 'Øvd alle 7 dager denne uken!',
    icon: '🏆',
    requirement_type: 'weekly_streak',
    requirement_value: 7,
    badge_level: 'gold'
  }
];

// Sjekk om badge_level kolonne finnes
try {
  db.prepare("SELECT badge_level FROM badges LIMIT 1").get();
} catch (e) {
  console.log('Legger til badge_level kolonne...');
  db.prepare("ALTER TABLE badges ADD COLUMN badge_level TEXT DEFAULT 'bronze'").run();
}

let added = 0;
let skipped = 0;

for (const badge of newBadges) {
  // Sjekk om badge allerede finnes
  const existing = db.prepare(
    'SELECT * FROM badges WHERE name = ?'
  ).get(badge.name);

  if (existing) {
    console.log(`  ⏭️  Hopper over: ${badge.icon} ${badge.name}`);
    skipped++;
  } else {
    db.prepare(`
      INSERT INTO badges (name, description, icon, requirement_type, requirement_value, badge_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      badge.name,
      badge.description,
      badge.icon,
      badge.requirement_type,
      badge.requirement_value,
      badge.badge_level
    );

    console.log(`  ✅ Lagt til: ${badge.icon} ${badge.name} (${badge.badge_level})`);
    added++;
  }
}

console.log(`\n📊 Resultat:`);
console.log(`  ✅ Nye badges lagt til: ${added}`);
console.log(`  ⏭️  Hoppet over: ${skipped}`);

// Vis alle badges
console.log('\n📛 Alle badges nå:');
const allBadges = db.prepare('SELECT * FROM badges ORDER BY requirement_type, requirement_value').all();
console.log(`\nTotalt ${allBadges.length} badges i systemet:`);

// Grupper etter type
const byType = {};
allBadges.forEach(b => {
  if (!byType[b.requirement_type]) byType[b.requirement_type] = [];
  byType[b.requirement_type].push(b);
});

Object.keys(byType).forEach(type => {
  console.log(`\n${type}:`);
  byType[type].forEach(b => {
    console.log(`  ${b.icon} ${b.name} - ${b.description}`);
  });
});

db.close();
