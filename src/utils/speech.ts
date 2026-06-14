/**
 * Høytlesing-utilities ved bruk av Web Speech API
 */

export const speak = (text: string, lang: string = 'en-US', rate: number = 0.85) => {
  // Sjekk om nettleseren støtter Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API støttes ikke i denne nettleseren');
    return;
  }

  // Stopp eventuell pågående høytlesing
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate; // Litt saktere for barn
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const speakEnglish = (text: string) => {
  speak(text, 'en-US', 0.85);
};

export const speakNorwegian = (text: string) => {
  speak(text, 'nb-NO', 0.85);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
