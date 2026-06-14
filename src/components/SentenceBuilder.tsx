import React, { useState } from 'react';
import type { Word, SentenceValidation } from '../types';
import { apiUrl } from '../config/api';
import { speakEnglish } from '../utils/speech';
import './SentenceBuilder.css';

interface SentenceBuilderProps {
  word: Word;
  onComplete: (score: number, timeSpent: number) => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ word, onComplete }) => {
  const [sentence, setSentence] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<SentenceValidation | null>(null);
  const [startTime] = useState(Date.now());
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sentence.trim()) {
      alert('Skriv en setning først!');
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch(apiUrl('/api/ai/validate-sentence'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: sentence.trim(),
          word: word.english,
        }),
      });

      const data = await response.json();
      setValidation(data);

      if (data.isValid) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => {
          onComplete(data.score, timeSpent);
        }, 3000);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Kunne ikke validere setningen. Prøv igjen.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleTryAgain = () => {
    setValidation(null);
    setSentence('');
  };

  return (
    <div className="sentence-builder">
      <div className="builder-header">
        <h2>✍️ Lag en setning</h2>
        <p className="instruction">
          Bruk ordet{' '}
          <strong className="target-word">
            {word.english}
            <button
              className="audio-button-inline"
              onClick={() => speakEnglish(word.english)}
              title="Hør uttalen"
            >
              🔊
            </button>
          </strong>{' '}
          i en setning
        </p>
      </div>

      {word.imageUrl && (
        <div className="word-visual">
          <img src={word.imageUrl} alt={word.english} className="word-image-small" />
          <div className="word-info">
            <span className="english-word">{word.english}</span>
            <span className="norwegian-word">{word.norwegian}</span>
          </div>
        </div>
      )}

      {!validation ? (
        <form onSubmit={handleSubmit} className="sentence-form">
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder={`Skriv en setning som bruker ordet "${word.english}"...`}
            className="sentence-input"
            rows={4}
            disabled={isValidating}
          />

          <div className="form-actions">
            <button
              type="button"
              className="help-button"
              onClick={() => setShowExamples(!showExamples)}
            >
              💡 Vis eksempler
            </button>
            <button type="submit" className="submit-button" disabled={isValidating || !sentence.trim()}>
              {isValidating ? 'Sjekker...' : 'Send inn'}
            </button>
            <button
              type="button"
              className="skip-button"
              onClick={() => onComplete(5, Math.floor((Date.now() - startTime) / 1000))}
            >
              ⏭️ Hopp over
            </button>
          </div>
        </form>
      ) : (
        <div className={`validation-result ${validation.isValid ? 'success' : 'error'}`}>
          <div className="result-icon">{validation.isValid ? '✅' : '❌'}</div>
          <h3 className="result-title">
            {validation.isValid ? 'Flott jobbet!' : 'Nesten der!'}
          </h3>
          <div className="user-sentence">
            <strong>Din setning:</strong>
            <p>"{sentence}"</p>
          </div>
          <div className="feedback">
            <strong>Tilbakemelding:</strong>
            <p>{validation.feedback}</p>
          </div>

          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="suggestions">
              <strong>Forslag:</strong>
              <ul>
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.isValid ? (
            <div className="score-display-sentence">
              <span className="score-label">Du fikk:</span>
              <span className="score-value">{validation.score} poeng</span>
            </div>
          ) : (
            <button className="retry-button" onClick={handleTryAgain}>
              🔄 Prøv igjen
            </button>
          )}
        </div>
      )}

      {showExamples && word.exampleSentences && word.exampleSentences.length > 0 && (
        <div className="example-sentences">
          <h3>📖 Eksempelsetninger:</h3>
          <ul>
            {word.exampleSentences.map((example, index) => (
              <li key={index}>
                {example}
                <button
                  className="audio-button-inline"
                  onClick={() => speakEnglish(example)}
                  title="Hør setningen"
                >
                  🔊
                </button>
              </li>
            ))}
          </ul>
          <p className="example-hint">Bruk disse som inspirasjon, men lag din egen setning!</p>
        </div>
      )}

      <div className="tips-box">
        <h4>💡 Tips for en god setning:</h4>
        <ul>
          <li>Start med stor bokstav</li>
          <li>Husk punktum på slutten</li>
          <li>Sjekk at setningen gir mening</li>
          <li>Bruk ordet riktig (verb/substantiv osv.)</li>
        </ul>
      </div>
    </div>
  );
};
