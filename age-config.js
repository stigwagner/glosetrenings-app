// Aldersbasert konfigurasjon for glosetrenings-appen
// Basert på pedagogisk forskning og læreplaner

export const AGE_CONFIG = {
  // Klasse 2 (7-8 år, født 2018-2019)
  grade2: {
    gradeLevel: 2,
    ageRange: '7-8 år',

    // Læringsmål for ordforråd (engelsk fremmedspråk)
    vocabularyGoals: {
      endOfYear: {
        minimum: 100,     // Grunnleggende
        good: 200,        // God progresjon
        excellent: 300    // Utmerket
      },
      // Med 5-8 nye ord/uke × 40 uker = 200-320 nye ord/år
      weeklyRate: { min: 5, ideal: 8, max: 12 }
    },

    // Forventede volum (realistisk og pedagogisk forsvarlig)
    expectations: {
      newWordsPerWeek: {
        minimum: 3,      // Under dette er for lite
        good: 5,         // Solid innsats
        veryGood: 8,     // Veldig bra!
        excellent: 10,   // Fremragende
        maximum: 15      // Over dette kan være for mye press
      },
      totalPracticePerWeek: {
        minimum: 10,     // Nye ord + repetisjoner
        good: 20,
        excellent: 30
      }
    },

    // Ukentlig poengberegning med diminishing returns
    weeklyScoring: {
      newWords: {
        tier1: { range: [1, 10], pointsPerWord: 10 },   // 100% verdi
        tier2: { range: [11, 20], pointsPerWord: 5 },   // 50% verdi
        tier3: { range: [21, 999], pointsPerWord: 2 }   // 20% verdi
      },
      // Repetisjoner gir færre poeng, men er fortsatt viktige
      repetitions: {
        tier1: { range: [1, 10], pointsPerWord: 5 },
        tier2: { range: [11, 20], pointsPerWord: 3 },
        tier3: { range: [21, 999], pointsPerWord: 1 }
      }
    },

    // Badge-terskler justert for alder
    badges: {
      weeklyNewWords: {
        bronze: 3,    // Ordplanter 🌱
        silver: 6,    // Ordbokleser 📗
        gold: 10,     // Ordsamler 📘
        platinum: 13, // Ordmester 📕
        diamond: 16   // Ordgeni 📚
      },
      weeklyTotalPractice: {
        bronze: 10,   // Aktiv elev ⭐
        silver: 20,   // Dedikert 🌟
        gold: 35      // Superstjerne 💫
      },
      monthlyNewWords: {
        bronze: 15,   // Måneds-starter 🥉
        silver: 25,   // Måneds-mester 🥈
        gold: 40      // Måneds-legende 🥇
      }
    },

    // Referansegruppe (for fiktiv sammenligning)
    referenceGroup: {
      name: 'Typisk 2. klassing',
      averageNewWordsPerWeek: 6,
      distribution: {
        percentile10: 2,   // 10% lærer færre enn dette
        percentile25: 4,
        percentile50: 6,   // Median
        percentile75: 9,
        percentile90: 12   // 10% lærer mer enn dette
      }
    },

    // Fiktive klassekamerater (for motiverende sammenligning)
    virtualClassmates: [
      { name: 'Emma', weeklyAverage: 5, personality: 'Stabil og konsistent' },
      { name: 'Noah', weeklyAverage: 7, personality: 'Ivrig lærer' },
      { name: 'Sofia', weeklyAverage: 4, personality: 'Tar det rolig' },
      { name: 'Lucas', weeklyAverage: 9, personality: 'Super-motivert' },
      { name: 'Ella', weeklyAverage: 6, personality: 'Jevn innsats' }
    ]
  },

  // Klasse 4 (9-10 år, født 2016-2017)
  grade4: {
    gradeLevel: 4,
    ageRange: '9-10 år',

    // Læringsmål for ordforråd (engelsk fremmedspråk)
    vocabularyGoals: {
      endOfYear: {
        minimum: 400,     // Grunnleggende (200 fra før + 200 nye)
        good: 600,        // God progresjon (300 fra før + 300 nye)
        excellent: 800    // Utmerket (400 fra før + 400 nye)
      },
      // Med 8-12 nye ord/uke × 40 uker = 320-480 nye ord/år
      weeklyRate: { min: 8, ideal: 12, max: 18 }
    },

    expectations: {
      newWordsPerWeek: {
        minimum: 5,
        good: 8,
        veryGood: 12,
        excellent: 15,
        maximum: 20
      },
      totalPracticePerWeek: {
        minimum: 15,
        good: 30,
        excellent: 45
      }
    },

    // Samme diminishing returns system
    weeklyScoring: {
      newWords: {
        tier1: { range: [1, 10], pointsPerWord: 10 },
        tier2: { range: [11, 20], pointsPerWord: 5 },
        tier3: { range: [21, 999], pointsPerWord: 2 }
      },
      repetitions: {
        tier1: { range: [1, 10], pointsPerWord: 5 },
        tier2: { range: [11, 20], pointsPerWord: 3 },
        tier3: { range: [21, 999], pointsPerWord: 1 }
      }
    },

    badges: {
      weeklyNewWords: {
        bronze: 5,
        silver: 8,
        gold: 12,
        platinum: 16,
        diamond: 20
      },
      weeklyTotalPractice: {
        bronze: 15,
        silver: 30,
        gold: 45
      },
      monthlyNewWords: {
        bronze: 20,
        silver: 35,
        gold: 50
      }
    },

    referenceGroup: {
      name: 'Typisk 4. klassing',
      averageNewWordsPerWeek: 10,
      distribution: {
        percentile10: 4,
        percentile25: 7,
        percentile50: 10,
        percentile75: 14,
        percentile90: 18
      }
    },

    virtualClassmates: [
      { name: 'Maja', weeklyAverage: 8, personality: 'Flittig elev' },
      { name: 'Oliver', weeklyAverage: 12, personality: 'Språktalent' },
      { name: 'Leah', weeklyAverage: 6, personality: 'Stabil læring' },
      { name: 'Filip', weeklyAverage: 15, personality: 'Ambisiøs' },
      { name: 'Ada', weeklyAverage: 10, personality: 'Jevn innsats' }
    ]
  },

  // Klasse 6 (11-12 år, født 2014-2015)
  grade6: {
    gradeLevel: 6,
    ageRange: '11-12 år',

    // Læringsmål for ordforråd (engelsk fremmedspråk)
    vocabularyGoals: {
      endOfYear: {
        minimum: 800,      // Grunnleggende (600 fra før + 200 nye)
        good: 1200,        // God progresjon (800 fra før + 400 nye)
        excellent: 1500    // Utmerket (1000 fra før + 500 nye)
      },
      // Med 12-16 nye ord/uke × 40 uker = 480-640 nye ord/år
      weeklyRate: { min: 12, ideal: 16, max: 20 }
    },

    expectations: {
      newWordsPerWeek: {
        minimum: 7,
        good: 12,
        veryGood: 16,
        excellent: 20,
        maximum: 25
      },
      totalPracticePerWeek: {
        minimum: 20,
        good: 40,
        excellent: 60
      }
    },

    weeklyScoring: {
      newWords: {
        tier1: { range: [1, 10], pointsPerWord: 10 },
        tier2: { range: [11, 20], pointsPerWord: 5 },
        tier3: { range: [21, 999], pointsPerWord: 2 }
      },
      repetitions: {
        tier1: { range: [1, 10], pointsPerWord: 5 },
        tier2: { range: [11, 20], pointsPerWord: 3 },
        tier3: { range: [21, 999], pointsPerWord: 1 }
      }
    },

    badges: {
      weeklyNewWords: {
        bronze: 7,
        silver: 12,
        gold: 16,
        platinum: 20,
        diamond: 25
      },
      weeklyTotalPractice: {
        bronze: 20,
        silver: 40,
        gold: 60
      },
      monthlyNewWords: {
        bronze: 25,
        silver: 45,
        gold: 65
      }
    },

    referenceGroup: {
      name: 'Typisk 6. klassing',
      averageNewWordsPerWeek: 14,
      distribution: {
        percentile10: 6,
        percentile25: 10,
        percentile50: 14,
        percentile75: 19,
        percentile90: 24
      }
    },

    virtualClassmates: [
      { name: 'Nora', weeklyAverage: 12, personality: 'Stabil' },
      { name: 'Emil', weeklyAverage: 18, personality: 'Språksterk' },
      { name: 'Ingrid', weeklyAverage: 9, personality: 'Rolig tempo' },
      { name: 'Henrik', weeklyAverage: 20, personality: 'Toppytelse' },
      { name: 'Thea', weeklyAverage: 14, personality: 'Jevnt god' }
    ]
  }
};

// Hjelpefunksjoner for å jobbe med konfigurasjon

/**
 * Finn riktig konfig basert på fødselsdato eller klassetrinn
 */
export function getConfigForUser(birthYear = null, gradeLevel = null) {
  if (gradeLevel) {
    const key = `grade${gradeLevel}`;
    return AGE_CONFIG[key] || AGE_CONFIG.grade4;
  }

  if (birthYear) {
    const age = new Date().getFullYear() - birthYear;
    if (age <= 8) return AGE_CONFIG.grade2;
    if (age <= 10) return AGE_CONFIG.grade4;
    return AGE_CONFIG.grade6;
  }

  // Default fallback
  return AGE_CONFIG.grade4;
}

/**
 * Beregn ukentlig poeng basert på nye ord og repetisjoner
 *
 * @param {number} newWords - Antall nye ord lært denne uken
 * @param {number} repetitions - Antall repetisjoner denne uken
 * @param {object} config - Alderskonfigurasjon
 * @returns {object} - { newWordsPoints, repetitionPoints, totalPoints, breakdown }
 */
export function calculateWeeklyPoints(newWords, repetitions, config) {
  const newWordsPoints = calculateTieredPoints(newWords, config.weeklyScoring.newWords);
  const repetitionPoints = calculateTieredPoints(repetitions, config.weeklyScoring.repetitions);

  return {
    newWordsPoints,
    repetitionPoints,
    totalPoints: newWordsPoints + repetitionPoints,
    breakdown: {
      newWords: {
        count: newWords,
        points: newWordsPoints,
        average: newWords > 0 ? (newWordsPoints / newWords).toFixed(1) : 0
      },
      repetitions: {
        count: repetitions,
        points: repetitionPoints,
        average: repetitions > 0 ? (repetitionPoints / repetitions).toFixed(1) : 0
      }
    }
  };
}

/**
 * Intern hjelpefunksjon: Beregn poeng med tier-system
 */
function calculateTieredPoints(count, tiers) {
  let points = 0;
  let remaining = count;

  const tierArray = [tiers.tier1, tiers.tier2, tiers.tier3];

  for (const tier of tierArray) {
    if (remaining <= 0) break;

    const tierMin = tier.range[0];
    const tierMax = tier.range[1];
    const tierSize = tierMax - tierMin + 1;

    const wordsInThisTier = Math.min(remaining, tierSize);
    points += wordsInThisTier * tier.pointsPerWord;
    remaining -= wordsInThisTier;
  }

  return points;
}

/**
 * Finn brukerens persentil i forhold til referansegruppen
 */
export function getPercentile(userWeeklyAverage, config) {
  const dist = config.referenceGroup.distribution;

  if (userWeeklyAverage >= dist.percentile90) return { percentile: 90, message: 'Du er i topp 10%!' };
  if (userWeeklyAverage >= dist.percentile75) return { percentile: 75, message: 'Du er bedre enn 3 av 4 elever!' };
  if (userWeeklyAverage >= dist.percentile50) return { percentile: 50, message: 'Du ligger over gjennomsnittet!' };
  if (userWeeklyAverage >= dist.percentile25) return { percentile: 25, message: 'Du er godt i gang!' };
  return { percentile: 10, message: 'Fortsett den gode jobben!' };
}

/**
 * Finn 2-3 passende virtuelle klassekamerater å sammenligne med
 */
export function getRelevantClassmates(userWeeklyAverage, config) {
  const classmates = config.virtualClassmates;

  // Finn nærmeste over og under, pluss en på samme nivå
  const sorted = [...classmates].sort((a, b) => a.weeklyAverage - b.weeklyAverage);

  const closeMatches = sorted.filter(c =>
    Math.abs(c.weeklyAverage - userWeeklyAverage) <= 3
  );

  return closeMatches.slice(0, 3);
}

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AGE_CONFIG,
    getConfigForUser,
    calculateWeeklyPoints,
    getPercentile,
    getRelevantClassmates
  };
}
