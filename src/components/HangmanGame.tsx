import React, { useState, useEffect } from 'react';
import type { Word, HangmanState } from '../types';
import { speakEnglish } from '../utils/speech';
import './HangmanGame.css';

interface HangmanGameProps {
  word: Word;
  onComplete: (score: number, attempts: number, hintsUsed: number) => void;
}

const calculateScore = (attempts: number, hintsUsed: number): number => {
  if (attempts === 1 && hintsUsed === 0) return 10;
  if (hintsUsed === 1) return 6;
  if (hintsUsed === 2) return 4;
  if (hintsUsed === 3) return 2;
  if (hintsUsed === 4) return 1;
  return 0;
};

export const HangmanGame: React.FC<HangmanGameProps> = ({ word, onComplete }) => {
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const englishWord = word.english.toLowerCase();
  const uniqueLetters = Array.from(new Set(englishWord.replace(/\s/g, '')));

  // Check if word is complete
  useEffect(() => {
    const allLettersGuessed = uniqueLetters.every((letter) =>
      guessedLetters.includes(letter.toLowerCase())
    );

    if (allLettersGuessed && !isCompleted) {
      setIsCompleted(true);
      const score = calculateScore(attempts + 1, hintsUsed);
      setTimeout(() => {
        onComplete(score, attempts + 1, hintsUsed);
      }, 1500);
    }
  }, [guessedLetters, uniqueLetters, attempts, hintsUsed, isCompleted, onComplete]);

  const handleLetterClick = (letter: string) => {
    if (guessedLetters.includes(letter) || isCompleted) return;

    setGuessedLetters([...guessedLetters, letter]);
    setAttempts(attempts + 1);
  };

  const handleHint = () => {
    if (isCompleted) return;

    // Find a letter that hasn't been guessed yet
    const unguessedLetters = uniqueLetters.filter(
      (letter) => !guessedLetters.includes(letter.toLowerCase())
    );

    if (unguessedLetters.length > 0) {
      const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
      setGuessedLetters([...guessedLetters, randomLetter.toLowerCase()]);
      setHintsUsed(hintsUsed + 1);
    }
  };

  const renderWord = () => {
    return englishWord.split('').map((letter, index) => {
      if (letter === ' ') {
        return (
          <span key={index} className="word-space">
            {' '}
          </span>
        );
      }

      const isGuessed = guessedLetters.includes(letter.toLowerCase());

      return (
        <span key={index} className={`word-letter ${isGuessed ? 'revealed' : ''}`}>
          {isGuessed ? letter : '_'}
        </span>
      );
    });
  };

  const renderKeyboard = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    return alphabet.map((letter) => {
      const isGuessed = guessedLetters.includes(letter);
      const isInWord = englishWord.includes(letter);

      return (
        <button
          key={letter}
          className={`keyboard-key ${isGuessed ? (isInWord ? 'correct' : 'incorrect') : ''}`}
          onClick={() => handleLetterClick(letter)}
          disabled={isGuessed || isCompleted}
        >
          {letter.toUpperCase()}
        </button>
      );
    });
  };

  const currentScore = calculateScore(attempts, hintsUsed);

  return (
    <div className="hangman-game">
      <div className="game-header">
        <div className="score-display">
          <span className="score-label">Poeng:</span>
          <span className={`score-value ${isCompleted ? 'final' : ''}`}>{currentScore}</span>
        </div>
        <div className="hints-display">
          <span className="hints-label">Hint brukt:</span>
          <span className="hints-value">{hintsUsed}</span>
        </div>
      </div>

      {word.imageUrl && (
        <div className="word-image-container">
          <img src={word.imageUrl} alt={word.english} className="word-image" />
        </div>
      )}

      <div className="norwegian-hint">
        <span className="flag">🇳🇴</span>
        <span className="norwegian-word">{word.norwegian}</span>
      </div>

      <div className="word-display">{renderWord()}</div>

      <div className="keyboard">{renderKeyboard()}</div>

      <div className="game-controls">
        <button className="hint-button" onClick={handleHint} disabled={isCompleted || hintsUsed >= 5}>
          💡 Hint ({5 - hintsUsed} igjen)
        </button>
        <button className="audio-button-game" onClick={() => speakEnglish(word.english)} title="Hør uttalen">
          🔊 Hør uttalen
        </button>
      </div>

      {isCompleted && (
        <div className="completion-message">
          <h2 className="celebration">🎉 Riktig!</h2>
          <p className="final-score">Du fikk {currentScore} poeng!</p>
        </div>
      )}
    </div>
  );
};
