/**
 * Grammar utilities for Cloudflare Workers
 * Genererer grammatiske former for verb, substantiv og adjektiv
 */

/**
 * Generer verbformer fra infinitiv
 */
export function generateVerbForms(infinitive) {
  const lower = infinitive.toLowerCase();

  // Irregulære verb
  const irregular = {
    'be': { past: 'was', pastParticiple: 'been', presentParticiple: 'being', thirdPerson: 'is' },
    'have': { past: 'had', pastParticiple: 'had', presentParticiple: 'having', thirdPerson: 'has' },
    'do': { past: 'did', pastParticiple: 'done', presentParticiple: 'doing', thirdPerson: 'does' },
    'go': { past: 'went', pastParticiple: 'gone', presentParticiple: 'going', thirdPerson: 'goes' },
    'get': { past: 'got', pastParticiple: 'gotten', presentParticiple: 'getting', thirdPerson: 'gets' },
    'make': { past: 'made', pastParticiple: 'made', presentParticiple: 'making', thirdPerson: 'makes' },
    'take': { past: 'took', pastParticiple: 'taken', presentParticiple: 'taking', thirdPerson: 'takes' },
    'come': { past: 'came', pastParticiple: 'come', presentParticiple: 'coming', thirdPerson: 'comes' },
    'see': { past: 'saw', pastParticiple: 'seen', presentParticiple: 'seeing', thirdPerson: 'sees' },
    'know': { past: 'knew', pastParticiple: 'known', presentParticiple: 'knowing', thirdPerson: 'knows' },
    'think': { past: 'thought', pastParticiple: 'thought', presentParticiple: 'thinking', thirdPerson: 'thinks' },
    'run': { past: 'ran', pastParticiple: 'run', presentParticiple: 'running', thirdPerson: 'runs' },
    'swim': { past: 'swam', pastParticiple: 'swum', presentParticiple: 'swimming', thirdPerson: 'swims' },
    'eat': { past: 'ate', pastParticiple: 'eaten', presentParticiple: 'eating', thirdPerson: 'eats' },
    'drink': { past: 'drank', pastParticiple: 'drunk', presentParticiple: 'drinking', thirdPerson: 'drinks' },
  };

  if (irregular[lower]) {
    return irregular[lower];
  }

  // Regulære verb
  let past, pastParticiple, presentParticiple, thirdPerson;

  // Present participle (-ing)
  if (lower.endsWith('e') && !lower.endsWith('ee') && !lower.endsWith('ye')) {
    presentParticiple = lower.slice(0, -1) + 'ing';
  } else if (lower.match(/[^aeiou][aeiou][^aeiouwxy]$/)) {
    presentParticiple = lower + lower.slice(-1) + 'ing';
  } else {
    presentParticiple = lower + 'ing';
  }

  // Past og past participle (-ed)
  if (lower.endsWith('e')) {
    past = pastParticiple = lower + 'd';
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    past = pastParticiple = lower.slice(0, -1) + 'ied';
  } else if (lower.match(/[^aeiou][aeiou][^aeiouwxy]$/)) {
    past = pastParticiple = lower + lower.slice(-1) + 'ed';
  } else {
    past = pastParticiple = lower + 'ed';
  }

  // Third person singular
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') ||
      lower.endsWith('x') || lower.endsWith('z')) {
    thirdPerson = lower + 'es';
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    thirdPerson = lower.slice(0, -1) + 'ies';
  } else if (lower.endsWith('o')) {
    thirdPerson = lower + 'es';
  } else {
    thirdPerson = lower + 's';
  }

  return { past, pastParticiple, presentParticiple, thirdPerson };
}

/**
 * Generer flertallsform av substantiv
 */
export function generatePluralForm(noun) {
  const lower = noun.toLowerCase();

  // Irregulære flertall
  const irregular = {
    'person': 'people',
    'child': 'children',
    'man': 'men',
    'woman': 'women',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'ox': 'oxen',
    'sheep': 'sheep',
    'deer': 'deer',
    'fish': 'fish',
  };

  if (irregular[lower]) {
    return irregular[lower];
  }

  // Regulære flertall
  if (lower.endsWith('s') || lower.endsWith('ss') || lower.endsWith('sh') ||
      lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return lower + 'es';
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    return lower.slice(0, -1) + 'ies';
  } else if (lower.endsWith('f')) {
    return lower.slice(0, -1) + 'ves';
  } else if (lower.endsWith('fe')) {
    return lower.slice(0, -2) + 'ves';
  } else if (lower.endsWith('o') && !'aeiou'.includes(lower[lower.length - 2])) {
    return lower + 'es';
  } else {
    return lower + 's';
  }
}

/**
 * Generer adjektiv-former (komparativ og superlativ)
 */
export function generateAdjectiveForms(adjective) {
  const lower = adjective.toLowerCase();

  // Irregulære adjektiv
  const irregular = {
    'good': { comparative: 'better', superlative: 'best' },
    'bad': { comparative: 'worse', superlative: 'worst' },
    'far': { comparative: 'farther', superlative: 'farthest' },
    'little': { comparative: 'less', superlative: 'least' },
    'much': { comparative: 'more', superlative: 'most' },
    'many': { comparative: 'more', superlative: 'most' },
  };

  if (irregular[lower]) {
    return irregular[lower];
  }

  // Korte adjektiv (1 stavelse) - bruk -er, -est
  const syllables = lower.split(/[aeiou]+/).length - 1;

  let comparative, superlative;

  if (syllables === 1 || (syllables === 2 && lower.endsWith('y'))) {
    // Korte adjektiv: fast → faster → fastest
    if (lower.endsWith('e')) {
      comparative = lower + 'r';
      superlative = lower + 'st';
    } else if (lower.endsWith('y')) {
      comparative = lower.slice(0, -1) + 'ier';
      superlative = lower.slice(0, -1) + 'iest';
    } else if (lower.match(/[^aeiou][aeiou][^aeiou]$/)) {
      // Doble siste konsonant: big → bigger
      comparative = lower + lower.slice(-1) + 'er';
      superlative = lower + lower.slice(-1) + 'est';
    } else {
      comparative = lower + 'er';
      superlative = lower + 'est';
    }
  } else {
    // Lange adjektiv: beautiful → more beautiful → most beautiful
    comparative = `more ${lower}`;
    superlative = `most ${lower}`;
  }

  return { comparative, superlative };
}
