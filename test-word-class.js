// Test word class detection function
function detectWordClass(word) {
  const lowerWord = word.toLowerCase();

  // Artikler
  const articles = ['a', 'an', 'the'];

  // Pronomen
  const pronouns = [
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those',
    'who', 'whom', 'whose', 'which', 'what',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves'
  ];

  // Preposisjoner
  const prepositions = [
    'in', 'on', 'at', 'to', 'from', 'with', 'about', 'under', 'over',
    'between', 'among', 'through', 'during', 'before', 'after', 'above',
    'below', 'by', 'for', 'of', 'off', 'up', 'down', 'out', 'into', 'onto'
  ];

  // Konjunksjoner
  const conjunctions = [
    'and', 'or', 'but', 'because', 'so', 'yet', 'nor',
    'although', 'though', 'unless', 'until', 'while', 'since', 'if'
  ];

  // Vanlige verb
  const commonVerbs = [
    'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing',
    'go', 'goes', 'went', 'going', 'gone',
    'get', 'gets', 'got', 'getting', 'gotten',
    'make', 'makes', 'made', 'making',
    'take', 'takes', 'took', 'taking', 'taken',
    'see', 'sees', 'saw', 'seeing', 'seen',
    'come', 'comes', 'came', 'coming',
    'want', 'wants', 'wanted', 'wanting',
    'use', 'uses', 'used', 'using',
    'find', 'finds', 'found', 'finding',
    'give', 'gives', 'gave', 'giving', 'given',
    'tell', 'tells', 'told', 'telling',
    'work', 'works', 'worked', 'working',
    'call', 'calls', 'called', 'calling',
    'try', 'tries', 'tried', 'trying',
    'ask', 'asks', 'asked', 'asking',
    'need', 'needs', 'needed', 'needing',
    'feel', 'feels', 'felt', 'feeling',
    'become', 'becomes', 'became', 'becoming',
    'leave', 'leaves', 'left', 'leaving',
    'put', 'puts', 'putting'
  ];

  // Vanlige adjektiv
  const commonAdjectives = [
    'good', 'bad', 'big', 'small', 'large', 'little', 'new', 'old',
    'great', 'high', 'low', 'long', 'short', 'young', 'early', 'late',
    'important', 'different', 'similar', 'same', 'other', 'another',
    'right', 'wrong', 'true', 'false', 'possible', 'impossible',
    'easy', 'hard', 'difficult', 'simple', 'clear', 'sure',
    'happy', 'sad', 'angry', 'afraid', 'sorry', 'glad'
  ];

  // Sjekk ordlister
  if (articles.includes(lowerWord)) return 'article';
  if (pronouns.includes(lowerWord)) return 'pronoun';
  if (prepositions.includes(lowerWord)) return 'preposition';
  if (conjunctions.includes(lowerWord)) return 'conjunction';
  if (commonVerbs.includes(lowerWord)) return 'verb';
  if (commonAdjectives.includes(lowerWord)) return 'adjective';

  // Sjekk suffiks
  if (lowerWord.endsWith('ly')) return 'adverb';
  if (lowerWord.endsWith('ing') || lowerWord.endsWith('ed')) return 'verb';
  if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion') ||
      lowerWord.endsWith('ment') || lowerWord.endsWith('ness') ||
      lowerWord.endsWith('ity') || lowerWord.endsWith('ence') ||
      lowerWord.endsWith('ance')) return 'noun';
  if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') ||
      lowerWord.endsWith('ous') || lowerWord.endsWith('ive') ||
      lowerWord.endsWith('able') || lowerWord.endsWith('ible')) return 'adjective';

  // Standard = substantiv
  return 'noun';
}

// Test words
const testWords = ['English', 'and', 'She', 'Setting', 'on', 'the', 'run', 'quickly', 'beautiful', 'happiness'];

console.log('Testing word class detection:\n');
testWords.forEach(word => {
  const wordClass = detectWordClass(word);
  console.log(`${word.padEnd(15)} → ${wordClass}`);
});
