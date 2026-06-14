import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { User, Word, Lesson, TestType } from './types';
import { apiUrl } from './config/api';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { FlashCard } from './components/FlashCard';
import { SentenceBuilder } from './components/SentenceBuilder';
import { PronunciationTrainer } from './components/PronunciationTrainer';
import { GrammarTrainer } from './components/GrammarTrainer';
import { OCRScanner } from './components/OCRScanner';
import { WordList } from './components/WordList';
import './App.css';

type ViewType = 'dashboard' | 'lessons' | 'test' | 'scanner' | 'wordlist';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentTestType, setCurrentTestType] = useState<TestType>('flashcard');

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/lessons?userId=${user?.id}`);
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchWords = async (lessonId: number) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/words`);
      const data = await response.json();
      setWords(data.words || []);
    } catch (error) {
      console.error('Error fetching words:', error);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setCurrentLesson(null);
    setWords([]);
  };

  const handleStartLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    await fetchWords(lesson.id);
    setCurrentWordIndex(0);
    setCurrentTestType('flashcard');
    setCurrentView('test');
  };

  const handleStartDailyPractice = async () => {
    try {
      const response = await fetch(apiUrl('/api/practice/start-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          wordCount: 10,
        }),
      });

      const data = await response.json();

      if (data.words && data.words.length > 0) {
        setCurrentLesson(null); // Ikke en leksjon, men daglig øving
        setWords(data.words);
        setCurrentWordIndex(0);
        setCurrentTestType('flashcard');
        setCurrentView('test');
      } else {
        alert('Ingen ord klare for øving i dag! Fortsett å øve for å bygge opp ordbanken din.');
      }
    } catch (error) {
      console.error('Error starting daily practice:', error);
      alert('Kunne ikke starte daglig øving. Prøv igjen.');
    }
  };

  const moveToNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setCurrentTestType('flashcard');
    } else {
      // All words completed
      alert('🎉 Gratulerer! Du har fullført alle ordene!');
      setCurrentView('dashboard');
    }
  };

  const handleTestComplete = async (score: number, attempts: number, hintsUsed?: number, timeSpent?: number) => {
    const currentWord = words[currentWordIndex];

    // Save test result
    try {
      await fetch(apiUrl('/api/test-results'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          wordId: currentWord.id,
          testType: currentTestType,
          score,
          attempts,
          hintsUsed: hintsUsed || 0,
          timeSpent: timeSpent || 0,
        }),
      });

      // Trigger confetti for high scores
      if (score >= 8) {
        triggerConfetti();
      }

      // Move to next test type or next word
      if (currentTestType === 'flashcard') {
        setCurrentTestType('sentence');
      } else if (currentTestType === 'sentence') {
        setCurrentTestType('pronunciation');
      } else if (currentTestType === 'pronunciation') {
        // Check if word has grammar exercises (verb or noun)
        if (currentWord.wordClass === 'verb' || currentWord.wordClass === 'noun') {
          setCurrentTestType('grammar');
        } else {
          // Skip grammar and move to next word
          moveToNextWord();
        }
      } else {
        // After grammar, move to next word
        moveToNextWord();
      }
    } catch (error) {
      console.error('Error saving test result:', error);
    }
  };

  const handleWordsDetected = async (detectedWords: string[], imageUrls: string[], ocrSentences: string[]) => {
    if (!user) return;

    // Create new lesson
    const today = new Date().toISOString().split('T')[0];
    const schoolYear = new Date().getFullYear();

    try {
      // Check existing words in database
      const existingWordsResponse = await fetch(`/api/words/check-existing?userId=${user.id}&words=${encodeURIComponent(JSON.stringify(detectedWords))}`);
      const { existingWords, newWords } = await existingWordsResponse.json();

      // Show summary to user
      let message = `Fant ${detectedWords.length} ord totalt:\n`;
      message += `- ${newWords.length} nye ord\n`;
      message += `- ${existingWords.length} ord finnes allerede i ordbanken\n\n`;

      if (existingWords.length > 0) {
        message += `Eksisterende ord får oppdatert øvingsdato til ${today}.\n`;
        message += `Nye ord legges til i ordbanken.\n\n`;
        message += `Vil du fortsette?`;

        if (!confirm(message)) {
          return;
        }
      }

      const lessonResponse = await fetch(apiUrl('/api/lessons'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: `Leksjon ${today}`,
          date: today,
          schoolYear: `${schoolYear}/${schoolYear + 1}`,
          imageUrl: imageUrls[0] || '',
        }),
      });

      const lessonData = await lessonResponse.json();

      // Update existing words with new date
      for (const existingWord of existingWords) {
        try {
          await fetch(`/api/words/${existingWord.id}/update-date`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today }),
          });
        } catch (error) {
          console.error(`Error updating word ${existingWord.english}:`, error);
        }
      }

      // Add only NEW words that have translations
      let addedCount = 0;
      let skippedWords: string[] = [];

      for (const word of newWords) {
        try {
          // Get translation from AI
          const translateResponse = await fetch(apiUrl('/api/ai/translate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word }),
          });
          const translation = await translateResponse.json();

          // Skip words without translation
          if (!translation.hasTranslation || !translation.norwegian) {
            skippedWords.push(word);
            continue;
          }

          // Get enrichment (synonyms, examples, etc.)
          const enrichResponse = await fetch(apiUrl('/api/ai/enrich-word'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word }),
          });
          const enrichment = await enrichResponse.json();

          // Find sentences from OCR that contain this word
          const wordLower = word.toLowerCase();
          const sentencesWithWord = ocrSentences.filter(sentence => {
            const sentenceLower = sentence.toLowerCase();
            // Match whole word only (not part of another word)
            const wordPattern = new RegExp(`\\b${wordLower}\\b`, 'i');
            return wordPattern.test(sentenceLower);
          });

          // Combine OCR sentences with AI-generated examples
          // Prioritize OCR sentences (real examples from worksheets)
          const combinedExamples = [
            ...sentencesWithWord.slice(0, 3), // Up to 3 real sentences
            ...enrichment.exampleSentences.slice(0, 3 - sentencesWithWord.length) // Fill remaining with AI
          ].slice(0, 3); // Max 3 total

          // Get image
          const imageResponse = await fetch(`/api/images/search?query=${word}`);
          const imageData = await imageResponse.json();

          // Save word
          await fetch(`/api/lessons/${lessonData.id}/words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              english: word,
              norwegian: translation.norwegian,
              wordClass: enrichment.wordClass,
              synonyms: enrichment.synonyms,
              antonyms: enrichment.antonyms,
              exampleSentences: combinedExamples,
              imageUrl: imageData.imageUrl,
            }),
          });
          addedCount++;
        } catch (error) {
          console.error(`Error adding word ${word}:`, error);
        }
      }

      let resultMessage = `✅ Fullført!\n${addedCount} nye ord lagt til.\n${existingWords.length} eksisterende ord oppdatert.`;

      if (skippedWords.length > 0) {
        resultMessage += `\n\n⚠️ ${skippedWords.length} ord ble hoppet over (ingen oversettelse):\n${skippedWords.slice(0, 10).join(', ')}${skippedWords.length > 10 ? '...' : ''}`;
        resultMessage += '\n\nDu kan legge disse til manuelt i ordbanken hvis nødvendig.';
      }

      alert(resultMessage);
      setCurrentView('dashboard');
      fetchLessons();
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Kunne ikke opprette leksjon. Prøv igjen.');
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">📚 Glosetrenings-app</div>
        <div className="nav-user">
          <span className="user-name">{user.displayName}</span>
          <button className="nav-button" onClick={() => setCurrentView('dashboard')}>
            🏠 Hjem
          </button>
          <button className="nav-button" onClick={() => setCurrentView('wordlist')}>
            📖 Ordbank
          </button>
          <button className="nav-button" onClick={() => setCurrentView('scanner')}>
            📸 Skann
          </button>
          <button className="nav-button logout" onClick={handleLogout}>
            Logg ut
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard
            user={user}
            onStartDailyPractice={handleStartDailyPractice}
            lessons={lessons}
            onStartLesson={handleStartLesson}
            onCreateLesson={() => setCurrentView('scanner')}
          />
        )}

        {currentView === 'scanner' && (
          <OCRScanner onWordsDetected={handleWordsDetected} onCancel={() => setCurrentView('dashboard')} />
        )}

        {currentView === 'wordlist' && (
          <WordList user={user} />
        )}

        {currentView === 'test' && currentWord && (
          <div className="test-container">
            <div className="test-progress">
              <span>
                Ord {currentWordIndex + 1} av {words.length}
              </span>
              <span>
                Test:{' '}
                {currentTestType === 'flashcard'
                  ? '🎯 Gjett ordet'
                  : currentTestType === 'sentence'
                  ? '✍️ Lag setning'
                  : currentTestType === 'pronunciation'
                  ? '🎤 Uttale'
                  : '📝 Grammatikk'}
              </span>
            </div>

            {currentTestType === 'flashcard' && (
              <FlashCard
                word={currentWord}
                onComplete={(score, hintsUsed) => handleTestComplete(score, 1, hintsUsed)}
              />
            )}

            {currentTestType === 'sentence' && (
              <SentenceBuilder
                word={currentWord}
                onComplete={(score, timeSpent) => handleTestComplete(score, 1, 0, timeSpent)}
              />
            )}

            {currentTestType === 'pronunciation' && (
              <PronunciationTrainer
                word={currentWord}
                onComplete={(score, attempts) => handleTestComplete(score, attempts, 0)}
              />
            )}

            {currentTestType === 'grammar' && (
              <GrammarTrainer
                word={currentWord}
                onComplete={(score, attempts) => handleTestComplete(score, attempts, 0)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
