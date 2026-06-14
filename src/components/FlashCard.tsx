import React, { useState } from 'react';
import type { Word } from '../types';
import { speakEnglish } from '../utils/speech';
import './FlashCard.css';

interface FlashCardProps {
  word: Word;
  onComplete: (score: number, hintsUsed: number) => void;
  reversed?: boolean; // true = vis engelsk, skjul norsk
}

export const FlashCard: React.FC<FlashCardProps> = ({ word, onComplete, reversed = false }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);

  const sourceWord = reversed ? word.english : word.norwegian;
  const targetWord = reversed ? word.norwegian : word.english;
  const sourceFlag = reversed ? '🇬🇧' : '🇳🇴';
  const targetFlag = reversed ? '🇳🇴' : '🇬🇧';
  const sourceLanguage = reversed ? 'engelske' : 'norske';
  const targetLanguage = reversed ? 'norske' : 'engelske';

  const handleReveal = () => {
    setIsRevealed(true);
    speakEnglish(word.english);
  };

  const handleKnew = () => {
    setCompleted(true);
    setTimeout(() => {
      onComplete(10, 0); // Full poeng hvis du visste det
    }, 1000);
  };

  const handleDidntKnow = () => {
    setCompleted(true);
    setTimeout(() => {
      onComplete(5, 1); // Halvparten av poeng hvis du måtte se svaret
    }, 1000);
  };

  return (
    <div className="flashcard">
      <div className="flashcard-header">
        <h2>🎴 Husker du ordet?</h2>
        <p className="instruction">
          Se på det {sourceLanguage} ordet og tenk på det {targetLanguage}
        </p>
      </div>

      {word.imageUrl && (
        <div className="flashcard-image-container">
          <img src={word.imageUrl} alt={sourceWord} className="flashcard-image" />
        </div>
      )}

      <div className="source-display">
        <span className="flag">{sourceFlag}</span>
        <span className="source-word-large">{sourceWord}</span>
        {!reversed && (
          <button
            className="audio-button-card"
            onClick={() => speakEnglish(word.english)}
            title="Hør uttalen"
          >
            🔊
          </button>
        )}
      </div>

      {!isRevealed ? (
        <div className="reveal-section">
          <div className="hidden-word">
            <div className="question-mark">?</div>
            <p className="hint-text">Klikk for å se det {targetLanguage} ordet</p>
          </div>
          <button className="reveal-button" onClick={handleReveal}>
            👁️ Vis ordet
          </button>
        </div>
      ) : (
        <div className="revealed-section">
          <div className="target-display">
            <span className="flag">{targetFlag}</span>
            <span className="target-word-large">{targetWord}</span>
            {reversed && (
              <button
                className="audio-button-card"
                onClick={() => speakEnglish(word.english)}
                title="Hør uttalen"
              >
                🔊
              </button>
            )}
          </div>

          {!completed ? (
            <div className="feedback-buttons">
              <p className="feedback-question">Visste du svaret før du klikket?</p>
              <div className="button-group">
                <button className="knew-button" onClick={handleKnew}>
                  ✅ Ja, jeg visste det!
                </button>
                <button className="didnt-know-button" onClick={handleDidntKnow}>
                  ❌ Nei, jeg måtte se
                </button>
              </div>
            </div>
          ) : (
            <div className="completion-message">
              <h3>🎉 Bra jobbet!</h3>
              <p>Går videre til neste ord...</p>
            </div>
          )}
        </div>
      )}

      <div className="tips-box-flashcard">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Prøv å si ordet høyt før du klikker</li>
          <li>Se på bildet for å hjelpe deg huske</li>
          <li>Vær ærlig når du svarer - det hjelper deg lære!</li>
        </ul>
      </div>
    </div>
  );
};
