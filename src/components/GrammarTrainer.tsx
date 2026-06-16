import React, { useState, useEffect } from 'react';
import type { Word } from '../types';
import { speakEnglish } from '../utils/speech';
import './GrammarTrainer.css';

interface GrammarTrainerProps {
  word: Word;
  onComplete: (score: number, attempts: number) => void;
}

interface GrammarExercise {
  type: 'verb-conjugation' | 'noun-plural' | 'verb-tense';
  question: string;
  correctAnswer: string;
  hint?: string;
}

export const GrammarTrainer: React.FC<GrammarTrainerProps> = ({ word, onComplete }) => {
  const [exercise, setExercise] = useState<GrammarExercise | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    generateExercise();
  }, [word]);

  const generateExercise = () => {
    if (word.wordClass === 'verb') {
      generateVerbExercise();
    } else if (word.wordClass === 'noun') {
      generateNounExercise();
    } else {
      // For other word classes, skip grammar exercise
      onComplete(10, 0);
    }
  };

  const generateVerbExercise = () => {
    const pronouns = [
      { pronoun: 'I', form: 'first-singular' },
      { pronoun: 'you', form: 'second-singular' },
      { pronoun: 'he/she/it', form: 'third-singular' },
      { pronoun: 'we', form: 'first-plural' },
      { pronoun: 'you', form: 'second-plural' },
      { pronoun: 'they', form: 'third-plural' },
    ];

    const selectedPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const correctAnswer = conjugateVerb(word.english, selectedPronoun.form);

    setExercise({
      type: 'verb-conjugation',
      question: `Fyll inn riktig form av "${word.english}" med pronomenet "${selectedPronoun.pronoun}"`,
      correctAnswer,
      hint: `Husk: ${selectedPronoun.pronoun} ${correctAnswer}`,
    });
  };

  const generateNounExercise = () => {
    const exercises = [
      {
        question: `Hva er flertallsformen av "${word.english}"?`,
        answer: getPluralForm(word.english),
        hint: 'Mange substantiv får -s eller -es i flertall',
      },
      {
        question: `Skriv "two ${word.english}" i flertall`,
        answer: `two ${getPluralForm(word.english)}`,
        hint: 'Bruk "two" og flertallsformen',
      },
    ];

    const selected = exercises[Math.floor(Math.random() * exercises.length)];
    setExercise({
      type: 'noun-plural',
      question: selected.question,
      correctAnswer: selected.answer,
      hint: selected.hint,
    });
  };

  const conjugateVerb = (verb: string, form: string): string => {
    // Simple present tense conjugation rules
    const irregular = {
      'be': { 'first-singular': 'am', 'second-singular': 'are', 'third-singular': 'is', 'first-plural': 'are', 'second-plural': 'are', 'third-plural': 'are' },
      'have': { 'first-singular': 'have', 'second-singular': 'have', 'third-singular': 'has', 'first-plural': 'have', 'second-plural': 'have', 'third-plural': 'have' },
      'do': { 'first-singular': 'do', 'second-singular': 'do', 'third-singular': 'does', 'first-plural': 'do', 'second-plural': 'do', 'third-plural': 'do' },
      'go': { 'first-singular': 'go', 'second-singular': 'go', 'third-singular': 'goes', 'first-plural': 'go', 'second-plural': 'go', 'third-plural': 'go' },
    };

    if (irregular[verb.toLowerCase()]) {
      return irregular[verb.toLowerCase()][form];
    }

    // Regular verbs
    if (form === 'third-singular') {
      // Add -s or -es for third person singular
      if (verb.endsWith('s') || verb.endsWith('sh') || verb.endsWith('ch') || verb.endsWith('x') || verb.endsWith('z')) {
        return verb + 'es';
      } else if (verb.endsWith('y') && !'aeiou'.includes(verb[verb.length - 2])) {
        return verb.slice(0, -1) + 'ies';
      } else {
        return verb + 's';
      }
    }

    return verb;
  };

  const getPluralForm = (noun: string): string => {
    const lowerNoun = noun.toLowerCase();

    // Ord som allerede er i flertall - returner som de er
    const alreadyPlural = [
      'people', 'children', 'men', 'women', 'teeth', 'feet', 'mice', 'geese',
      'sheep', 'deer', 'fish', 'species', 'series', 'news', 'pants', 'scissors',
      'glasses', 'clothes', 'tourists', 'animals', 'students', 'words', 'lessons',
      'books', 'days', 'years', 'friends', 'teachers', 'parents', 'kids', 'boys',
      'girls', 'cats', 'dogs', 'birds', 'cars', 'trees', 'flowers', 'houses',
      'mountains', 'valleys', 'rivers', 'glaciers', 'lifeforms', 'stones'
    ];

    if (alreadyPlural.includes(lowerNoun)) {
      return noun; // Allerede flertall, returner uendret
    }

    // Irregular plurals
    const irregular: { [key: string]: string } = {
      'man': 'men',
      'woman': 'women',
      'child': 'children',
      'tooth': 'teeth',
      'foot': 'feet',
      'mouse': 'mice',
      'goose': 'geese',
      'person': 'people',
      'leaf': 'leaves',
      'life': 'lives',
      'knife': 'knives',
      'wife': 'wives',
      'half': 'halves',
      'loaf': 'loaves',
      'potato': 'potatoes',
      'tomato': 'tomatoes',
      'cactus': 'cacti',
      'focus': 'foci',
      'fungus': 'fungi',
      'radius': 'radii',
      'ox': 'oxen',
    };

    if (irregular[lowerNoun]) {
      return irregular[lowerNoun];
    }

    // Regular plural rules
    if (noun.endsWith('ss') || noun.endsWith('sh') || noun.endsWith('ch') || noun.endsWith('x') || noun.endsWith('z')) {
      return noun + 'es';
    } else if (noun.endsWith('s')) {
      // Single 's' at end - likely already plural or proper noun
      return noun; // Return as-is to avoid "touristses"
    } else if (noun.endsWith('y') && !'aeiou'.includes(noun[noun.length - 2])) {
      return noun.slice(0, -1) + 'ies';
    } else if (noun.endsWith('f')) {
      return noun.slice(0, -1) + 'ves';
    } else if (noun.endsWith('fe')) {
      return noun.slice(0, -2) + 'ves';
    } else if (noun.endsWith('o') && !'aeiou'.includes(noun[noun.length - 2])) {
      return noun + 'es';
    } else {
      return noun + 's';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userAnswer.trim()) {
      alert('Skriv et svar først!');
      return;
    }

    const isCorrect = userAnswer.trim().toLowerCase() === exercise!.correctAnswer.toLowerCase();
    setAttempts(attempts + 1);

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        message: '✅ Riktig! Flott jobbet!',
      });

      setTimeout(() => {
        const score = attempts === 0 ? 10 : attempts === 1 ? 8 : attempts === 2 ? 6 : 4;
        onComplete(score, attempts + 1);
      }, 2000);
    } else {
      setFeedback({
        isCorrect: false,
        message: `❌ Ikke helt riktig. Prøv igjen!`,
      });

      if (attempts >= 2) {
        setShowHint(true);
      }
    }
  };

  const handleTryAgain = () => {
    setUserAnswer('');
    setFeedback(null);
  };

  if (!exercise) {
    return (
      <div className="grammar-trainer">
        <div className="loading">Lager oppgave...</div>
      </div>
    );
  }

  return (
    <div className="grammar-trainer">
      <div className="trainer-header">
        <h2>📝 Grammatikk-øvelse</h2>
        <p className="word-info">
          Ord:{' '}
          <strong>
            {word.english}
            <button
              className="audio-button-inline"
              onClick={() => speakEnglish(word.english)}
              title="Hør uttalen"
            >
              🔊
            </button>
          </strong>{' '}
          ({word.norwegian})
        </p>
      </div>

      {word.imageUrl && (
        <div className="word-visual">
          <img src={word.imageUrl} alt={word.english} className="word-image-small" />
        </div>
      )}

      <div className="exercise-card">
        <div className="exercise-type-badge">
          {exercise.type === 'verb-conjugation' ? '🔄 Verb-bøyning' : '📚 Flertall'}
        </div>

        <div className="question-box">
          <p className="question">{exercise.question}</p>
        </div>

        {!feedback ? (
          <form onSubmit={handleSubmit} className="answer-form">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Skriv ditt svar her..."
              className="answer-input"
              autoFocus
            />

            <button type="submit" className="submit-button">
              Send inn svar
            </button>
          </form>
        ) : (
          <div className={`feedback-box ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {feedback.isCorrect ? '✅' : '❌'}
            </div>
            <p className="feedback-message">{feedback.message}</p>

            {!feedback.isCorrect && (
              <>
                <p className="correct-answer">
                  Riktig svar: <strong>{exercise.correctAnswer}</strong>
                </p>
                <button className="retry-button" onClick={handleTryAgain}>
                  🔄 Prøv igjen
                </button>
              </>
            )}
          </div>
        )}

        {showHint && !feedback?.isCorrect && (
          <div className="hint-box">
            <strong>💡 Hint:</strong> {exercise.hint}
          </div>
        )}

        <div className="attempts-counter">
          Forsøk: {attempts}
        </div>

        <button
          className="skip-button-grammar"
          onClick={() => onComplete(5, Math.max(1, attempts))}
        >
          ⏭️ Hopp over
        </button>
      </div>

      <div className="grammar-tips">
        <h4>📖 Grammatikk-tips:</h4>
        {exercise.type === 'verb-conjugation' ? (
          <ul>
            <li><strong>I, you, we, they</strong> → bruker grunnformen av verbet</li>
            <li><strong>he, she, it</strong> → legg til -s eller -es</li>
            <li>Eksempel: I run, he run<strong>s</strong></li>
            <li>Uregelmessige verb: be → am/is/are, have → has</li>
          </ul>
        ) : (
          <ul>
            <li>Vanlig flertall: legg til <strong>-s</strong> (cat → cats)</li>
            <li>Ord som slutter på s, sh, ch, x, z: legg til <strong>-es</strong> (box → boxes)</li>
            <li>Ord på -y: bytt til <strong>-ies</strong> (baby → babies)</li>
            <li>Uregelmessige: man → men, child → children</li>
          </ul>
        )}
      </div>
    </div>
  );
};
