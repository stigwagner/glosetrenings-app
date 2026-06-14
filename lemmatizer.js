/**
 * LEMMATIZER - Finn grunnform av engelske ord
 * Brukes til å unngå duplikater i ordbanken
 */

import lemmatizer from 'wink-lemmatizer';

/**
 * Finn grunnform (lemma) av et engelsk ord
 * @param {string} word - Ordet å lemmatisere
 * @returns {string} - Grunnformen av ordet
 */
export function lemmatize(word) {
  const lowerWord = word.toLowerCase();

  // Prøv alle ordklasser og velg den korteste
  const noun = lemmatizer.noun(lowerWord);
  const verb = lemmatizer.verb(lowerWord);
  const adjective = lemmatizer.adjective(lowerWord);

  // Velg den korteste lemma (grunnformen)
  const candidates = [noun, verb, adjective].filter(w => w && w.length > 0);

  if (candidates.length === 0) {
    return word; // Ingen lemma funnet, returner originalt ord
  }

  // Returner korteste lemma (grunnform)
  const lemma = candidates.sort((a, b) => a.length - b.length)[0];

  // Behold original kapitalisering
  if (word[0] === word[0].toUpperCase()) {
    return lemma.charAt(0).toUpperCase() + lemma.slice(1);
  }

  return lemma;
}

/**
 * Generer verbformer fra infinitiv
 */
export function generateVerbForms(infinitive) {
  const lower = infinitive.toLowerCase();

  // Irregulære verb (vanlige)
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
    'give': { past: 'gave', pastParticiple: 'given', presentParticiple: 'giving', thirdPerson: 'gives' },
    'find': { past: 'found', pastParticiple: 'found', presentParticiple: 'finding', thirdPerson: 'finds' },
    'think': { past: 'thought', pastParticiple: 'thought', presentParticiple: 'thinking', thirdPerson: 'thinks' },
    'tell': { past: 'told', pastParticiple: 'told', presentParticiple: 'telling', thirdPerson: 'tells' },
    'become': { past: 'became', pastParticiple: 'become', presentParticiple: 'becoming', thirdPerson: 'becomes' },
    'leave': { past: 'left', pastParticiple: 'left', presentParticiple: 'leaving', thirdPerson: 'leaves' },
    'feel': { past: 'felt', pastParticiple: 'felt', presentParticiple: 'feeling', thirdPerson: 'feels' },
    'bring': { past: 'brought', pastParticiple: 'brought', presentParticiple: 'bringing', thirdPerson: 'brings' },
    'begin': { past: 'began', pastParticiple: 'begun', presentParticiple: 'beginning', thirdPerson: 'begins' },
    'keep': { past: 'kept', pastParticiple: 'kept', presentParticiple: 'keeping', thirdPerson: 'keeps' },
    'hold': { past: 'held', pastParticiple: 'held', presentParticiple: 'holding', thirdPerson: 'holds' },
    'write': { past: 'wrote', pastParticiple: 'written', presentParticiple: 'writing', thirdPerson: 'writes' },
    'stand': { past: 'stood', pastParticiple: 'stood', presentParticiple: 'standing', thirdPerson: 'stands' },
    'hear': { past: 'heard', pastParticiple: 'heard', presentParticiple: 'hearing', thirdPerson: 'hears' },
    'let': { past: 'let', pastParticiple: 'let', presentParticiple: 'letting', thirdPerson: 'lets' },
    'mean': { past: 'meant', pastParticiple: 'meant', presentParticiple: 'meaning', thirdPerson: 'means' },
    'set': { past: 'set', pastParticiple: 'set', presentParticiple: 'setting', thirdPerson: 'sets' },
    'meet': { past: 'met', pastParticiple: 'met', presentParticiple: 'meeting', thirdPerson: 'meets' },
    'run': { past: 'ran', pastParticiple: 'run', presentParticiple: 'running', thirdPerson: 'runs' },
    'pay': { past: 'paid', pastParticiple: 'paid', presentParticiple: 'paying', thirdPerson: 'pays' },
    'sit': { past: 'sat', pastParticiple: 'sat', presentParticiple: 'sitting', thirdPerson: 'sits' },
    'speak': { past: 'spoke', pastParticiple: 'spoken', presentParticiple: 'speaking', thirdPerson: 'speaks' },
    'lie': { past: 'lay', pastParticiple: 'lain', presentParticiple: 'lying', thirdPerson: 'lies' },
    'lead': { past: 'led', pastParticiple: 'led', presentParticiple: 'leading', thirdPerson: 'leads' },
    'read': { past: 'read', pastParticiple: 'read', presentParticiple: 'reading', thirdPerson: 'reads' },
    'grow': { past: 'grew', pastParticiple: 'grown', presentParticiple: 'growing', thirdPerson: 'grows' },
    'lose': { past: 'lost', pastParticiple: 'lost', presentParticiple: 'losing', thirdPerson: 'loses' },
    'fall': { past: 'fell', pastParticiple: 'fallen', presentParticiple: 'falling', thirdPerson: 'falls' },
    'send': { past: 'sent', pastParticiple: 'sent', presentParticiple: 'sending', thirdPerson: 'sends' },
    'build': { past: 'built', pastParticiple: 'built', presentParticiple: 'building', thirdPerson: 'builds' },
    'understand': { past: 'understood', pastParticiple: 'understood', presentParticiple: 'understanding', thirdPerson: 'understands' },
    'draw': { past: 'drew', pastParticiple: 'drawn', presentParticiple: 'drawing', thirdPerson: 'draws' },
    'break': { past: 'broke', pastParticiple: 'broken', presentParticiple: 'breaking', thirdPerson: 'breaks' },
    'spend': { past: 'spent', pastParticiple: 'spent', presentParticiple: 'spending', thirdPerson: 'spends' },
    'cut': { past: 'cut', pastParticiple: 'cut', presentParticiple: 'cutting', thirdPerson: 'cuts' },
    'rise': { past: 'rose', pastParticiple: 'risen', presentParticiple: 'rising', thirdPerson: 'rises' },
    'drive': { past: 'drove', pastParticiple: 'driven', presentParticiple: 'driving', thirdPerson: 'drives' },
    'buy': { past: 'bought', pastParticiple: 'bought', presentParticiple: 'buying', thirdPerson: 'buys' },
    'wear': { past: 'wore', pastParticiple: 'worn', presentParticiple: 'wearing', thirdPerson: 'wears' },
    'choose': { past: 'chose', pastParticiple: 'chosen', presentParticiple: 'choosing', thirdPerson: 'chooses' },
    'seek': { past: 'sought', pastParticiple: 'sought', presentParticiple: 'seeking', thirdPerson: 'seeks' },
    'throw': { past: 'threw', pastParticiple: 'thrown', presentParticiple: 'throwing', thirdPerson: 'throws' },
    'catch': { past: 'caught', pastParticiple: 'caught', presentParticiple: 'catching', thirdPerson: 'catches' },
    'fight': { past: 'fought', pastParticiple: 'fought', presentParticiple: 'fighting', thirdPerson: 'fights' },
    'eat': { past: 'ate', pastParticiple: 'eaten', presentParticiple: 'eating', thirdPerson: 'eats' },
    'drink': { past: 'drank', pastParticiple: 'drunk', presentParticiple: 'drinking', thirdPerson: 'drinks' },
    'swim': { past: 'swam', pastParticiple: 'swum', presentParticiple: 'swimming', thirdPerson: 'swims' },
    'sing': { past: 'sang', pastParticiple: 'sung', presentParticiple: 'singing', thirdPerson: 'sings' },
    'fly': { past: 'flew', pastParticiple: 'flown', presentParticiple: 'flying', thirdPerson: 'flies' },
  };

  if (irregular[lower]) {
    return irregular[lower];
  }

  // Regulære verb
  let past, pastParticiple, presentParticiple, thirdPerson;

  // Present participle (-ing)
  if (lower.endsWith('e') && !lower.endsWith('ee') && !lower.endsWith('ye')) {
    presentParticiple = lower.slice(0, -1) + 'ing'; // make → making
  } else if (lower.match(/[^aeiou][aeiou][^aeiouwxy]$/)) {
    // Doble siste konsonant: run → running, sit → sitting
    presentParticiple = lower + lower.slice(-1) + 'ing';
  } else {
    presentParticiple = lower + 'ing';
  }

  // Past og past participle (-ed)
  if (lower.endsWith('e')) {
    past = pastParticiple = lower + 'd'; // like → liked
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    past = pastParticiple = lower.slice(0, -1) + 'ied'; // study → studied
  } else if (lower.match(/[^aeiou][aeiou][^aeiouwxy]$/)) {
    // Doble siste konsonant
    past = pastParticiple = lower + lower.slice(-1) + 'ed';
  } else {
    past = pastParticiple = lower + 'ed';
  }

  // Third person singular
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') ||
      lower.endsWith('x') || lower.endsWith('z')) {
    thirdPerson = lower + 'es';
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    thirdPerson = lower.slice(0, -1) + 'ies'; // study → studies
  } else if (lower.endsWith('o')) {
    thirdPerson = lower + 'es'; // go → goes
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
    'moose': 'moose'
  };

  if (irregular[lower]) {
    return irregular[lower];
  }

  // Regulære flertall
  if (lower.endsWith('s') || lower.endsWith('ss') || lower.endsWith('sh') ||
      lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return lower + 'es';
  } else if (lower.endsWith('y') && !'aeiou'.includes(lower[lower.length - 2])) {
    return lower.slice(0, -1) + 'ies'; // city → cities
  } else if (lower.endsWith('f')) {
    return lower.slice(0, -1) + 'ves'; // leaf → leaves
  } else if (lower.endsWith('fe')) {
    return lower.slice(0, -2) + 'ves'; // knife → knives
  } else if (lower.endsWith('o') && !'aeiou'.includes(lower[lower.length - 2])) {
    return lower + 'es'; // hero → heroes
  } else {
    return lower + 's';
  }
}

// TEST
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 LEMMATIZER TEST\n');

  const testWords = [
    'tourists', 'mountains', 'running', 'brought', 'likes', 'studies',
    'children', 'went', 'better', 'happiest', 'quickly'
  ];

  console.log('📝 Lemmatisering:\n');
  testWords.forEach(word => {
    const lemma = lemmatize(word);
    console.log(`  ${word} → ${lemma}`);
  });

  console.log('\n🔄 Verbformer:\n');
  const testVerbs = ['bring', 'run', 'study', 'like', 'go'];
  testVerbs.forEach(verb => {
    const forms = generateVerbForms(verb);
    console.log(`  ${verb}:`);
    console.log(`    3rd person: ${forms.thirdPerson}`);
    console.log(`    past: ${forms.past}`);
    console.log(`    past participle: ${forms.pastParticiple}`);
    console.log(`    present participle: ${forms.presentParticiple}`);
    console.log('');
  });

  console.log('📊 Flertall:\n');
  const testNouns = ['tourist', 'mountain', 'child', 'city', 'leaf'];
  testNouns.forEach(noun => {
    const plural = generatePluralForm(noun);
    console.log(`  ${noun} → ${plural}`);
  });
}
