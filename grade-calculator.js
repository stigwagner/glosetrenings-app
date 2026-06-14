/**
 * KLASSETRINN-KALKULATOR
 *
 * Beregner hvilket klassetrinn en elev er i basert på:
 * - school_start_year (året de startet 1. klasse)
 * - Dagens dato
 *
 * Norsk skoleår:
 * - Starter: ~15. august
 * - Slutter: ~15. juni
 *
 * Sommerregel (15. juni - 14. august):
 * - Eleven regnes som i NESTE klassetrinn
 * - Eks: Fullført 3. klasse i juni → regnes som 4. klasseelev i juli
 */

/**
 * Beregner hvilket klassetrinn eleven er i nå
 * @param {number} schoolStartYear - Året eleven startet 1. klasse
 * @param {Date} currentDate - Dagens dato (default: new Date())
 * @returns {number} Klassetrinn (1-7)
 */
export function calculateCurrentGrade(schoolStartYear, currentDate = new Date()) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1 = januar, 12 = desember
  const day = currentDate.getDate();

  // Finn hvilket SKOLEÅR vi er i
  // Skoleår starter ~15. august
  let currentSchoolYear;
  if (month > 8 || (month === 8 && day >= 15)) {
    // Etter 15. august: vi er i skoleåret year/year+1
    currentSchoolYear = year;
  } else {
    // Før 15. august: vi er i skoleåret year-1/year
    currentSchoolYear = year - 1;
  }

  // Beregn klassetrinn basert på skoleår
  let grade = (currentSchoolYear - schoolStartYear) + 1;

  // SOMMERREGEL (15. juni - 14. august):
  // Eleven regnes som i NESTE klassetrinn
  const isSummer = (month === 6 && day >= 15) ||
                   month === 7 ||
                   (month === 8 && day < 15);

  if (isSummer) {
    grade += 1;
  }

  // Sikre at klassetrinnet er mellom 1-7 (barneskole)
  return Math.max(1, Math.min(7, grade));
}

/**
 * Sjekker om det er sommerferie nå
 * @param {Date} currentDate - Dagens dato
 * @returns {boolean}
 */
export function isSummerVacation(currentDate = new Date()) {
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();

  return (month === 6 && day >= 15) ||
         month === 7 ||
         (month === 8 && day < 15);
}

/**
 * Henter skoleår (f.eks. "2025/2026")
 * @param {Date} currentDate
 * @returns {string}
 */
export function getSchoolYear(currentDate = new Date()) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  if (month >= 8) {
    // Høst: skoleåret er 2025/2026
    return `${year}/${year + 1}`;
  } else {
    // Vår: skoleåret er 2024/2025
    return `${year - 1}/${year}`;
  }
}

// Test-eksempler (kan kjøres med node grade-calculator.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing grade calculator...\n');

  const testCases = [
    { date: new Date('2026-06-10'), schoolStartYear: 2023, expected: 3, desc: 'Juni før sommerferie (slutt på 3. klasse)' },
    { date: new Date('2026-06-20'), schoolStartYear: 2023, expected: 4, desc: 'Juni i sommerferie (regnes som 4. klasse)' },
    { date: new Date('2026-07-15'), schoolStartYear: 2023, expected: 4, desc: 'Midt i sommeren (regnes som 4. klasse)' },
    { date: new Date('2026-08-10'), schoolStartYear: 2023, expected: 4, desc: 'August før skolestart (regnes som 4. klasse)' },
    { date: new Date('2026-08-20'), schoolStartYear: 2023, expected: 4, desc: 'August etter skolestart (4. klasse starter)' },
    { date: new Date('2026-09-01'), schoolStartYear: 2023, expected: 4, desc: 'September (4. klasse pågår)' },
    { date: new Date('2026-01-15'), schoolStartYear: 2023, expected: 3, desc: 'Januar (3. klasse pågår)' },
    { date: new Date('2027-01-15'), schoolStartYear: 2023, expected: 4, desc: 'Januar året etter (4. klasse pågår)' },
  ];

  testCases.forEach(({ date, schoolStartYear, expected, desc }) => {
    const result = calculateCurrentGrade(schoolStartYear, date);
    const isSummer = isSummerVacation(date);
    const schoolYear = getSchoolYear(date);
    const status = result === expected ? '✅' : '❌';

    console.log(`${status} ${desc}`);
    console.log(`   Dato: ${date.toLocaleDateString('no-NO')}`);
    console.log(`   Skolestart: ${schoolStartYear}`);
    console.log(`   Sommerferie: ${isSummer ? 'Ja' : 'Nei'}`);
    console.log(`   Skoleår: ${schoolYear}`);
    console.log(`   Klassetrinn: ${result} (forventet: ${expected})`);
    console.log('');
  });
}
