/**
 * TEST: Klassetrinn gjennom året
 * Viser hvordan Hermann og Vilma sitt klassetrinn endrer seg gjennom skoleåret
 */

import { calculateCurrentGrade, getSchoolYear, isSummerVacation } from './grade-calculator.js';

console.log('📅 HERMANN - Startet skolen 2024\n');
console.log('=' .repeat(80));

const hermannsTests = [
  new Date('2026-01-15'),  // Januar 2026
  new Date('2026-06-14'),  // Juni før sommerferie
  new Date('2026-06-20'),  // Juni i sommerferie
  new Date('2026-07-15'),  // Midt i sommeren
  new Date('2026-08-10'),  // August før skolestart
  new Date('2026-08-20'),  // August etter skolestart
  new Date('2026-09-15'),  // September
  new Date('2027-01-15'),  // Januar 2027
];

hermannsTests.forEach(date => {
  const grade = calculateCurrentGrade(2024, date);
  const summer = isSummerVacation(date);
  const schoolYear = getSchoolYear(date);

  console.log(`${date.toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}: ${grade}. klasse (${schoolYear}) ${summer ? '🏖️  SOMMERFERIE' : ''}`);
});

console.log('\n📅 VILMA - Startet skolen 2022\n');
console.log('='.repeat(80));

const vilmasTests = [
  new Date('2026-01-15'),  // Januar 2026
  new Date('2026-06-14'),  // Juni før sommerferie
  new Date('2026-06-20'),  // Juni i sommerferie
  new Date('2026-07-15'),  // Midt i sommeren
  new Date('2026-08-10'),  // August før skolestart
  new Date('2026-08-20'),  // August etter skolestart
  new Date('2026-09-15'),  // September
  new Date('2027-01-15'),  // Januar 2027
];

vilmasTests.forEach(date => {
  const grade = calculateCurrentGrade(2022, date);
  const summer = isSummerVacation(date);
  const schoolYear = getSchoolYear(date);

  console.log(`${date.toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}: ${grade}. klasse (${schoolYear}) ${summer ? '🏖️  SOMMERFERIE' : ''}`);
});

console.log('\n' + '='.repeat(80));
console.log('💡 MERK: Under sommerferien (15. juni - 14. august) regnes eleven som');
console.log('   i NESTE klassetrinn, slik at ordbanken kan tilpasses høstens nivå.');
console.log('='.repeat(80) + '\n');
