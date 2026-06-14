import React, { useState, useEffect } from 'react';
import type { Word, PronunciationResult } from '../types';
import './PronunciationTrainer.css';

interface PronunciationTrainerProps {
  word: Word;
  onComplete: (score: number, attempts: number) => void;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const PronunciationTrainer: React.FC<PronunciationTrainerProps> = ({ word, onComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<PronunciationResult[]>([]);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsBrowserSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Din nettleser støtter ikke stemmegjenkjenning. Prøv Chrome eller Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    setTranscript('');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0];
      const spokenText = result.transcript.toLowerCase().trim();
      const confidence = result.confidence;

      setTranscript(spokenText);
      setAttempts(attempts + 1);

      // Check if the word matches
      const targetWord = word.english.toLowerCase();
      const isCorrect = spokenText === targetWord || spokenText.includes(targetWord);

      const feedback = isCorrect
        ? confidence > 0.9
          ? 'Perfekt uttale! 🌟'
          : confidence > 0.7
          ? 'Veldig bra! 👍'
          : 'Bra jobbet! 😊'
        : `Du sa "${spokenText}", prøv igjen med "${word.english}"`;

      const score = isCorrect ? Math.round(confidence * 10) : 0;

      const pronunciationResult: PronunciationResult = {
        transcript: spokenText,
        confidence: confidence,
        isCorrect: isCorrect,
        feedback: feedback,
      };

      setResults([...results, pronunciationResult]);

      // If perfect pronunciation, complete after delay
      if (isCorrect && confidence > 0.8) {
        setTimeout(() => {
          onComplete(10, attempts + 1);
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        alert('Ingen tale oppdaget. Prøv igjen og snakk tydelig.');
      } else if (event.error === 'not-allowed') {
        alert('Mikrofon-tilgang er blokkert. Aktiver mikrofon i nettleserinnstillinger.');
      } else {
        alert('Noe gikk galt. Prøv igjen.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const playWordAudio = () => {
    const utterance = new SpeechSynthesisUtterance(word.english);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // Slower for learning
    window.speechSynthesis.speak(utterance);
  };

  if (!isBrowserSupported) {
    return (
      <div className="pronunciation-trainer">
        <div className="error-message-box">
          <h2>⚠️ Stemmegjenkjenning ikke støttet</h2>
          <p>Din nettleser støtter dessverre ikke stemmegjenkjenning.</p>
          <p>Prøv med Chrome, Edge eller Safari.</p>
        </div>
      </div>
    );
  }

  const latestResult = results[results.length - 1];

  return (
    <div className="pronunciation-trainer">
      <div className="trainer-header">
        <h2>🎤 Uttale-trening</h2>
        <p className="instruction">Si ordet høyt når du er klar</p>
      </div>

      {word.imageUrl && (
        <div className="pronunciation-visual">
          <img src={word.imageUrl} alt={word.english} className="pronunciation-image" />
        </div>
      )}

      <div className="target-word-display">
        <div className="word-box">
          <span className="word-english">{word.english}</span>
          <span className="word-norwegian">({word.norwegian})</span>
        </div>
        <button className="audio-button" onClick={playWordAudio} title="Hør uttalen">
          🔊 Hør ordet
        </button>
      </div>

      <div className="microphone-area">
        {isListening ? (
          <div className="listening-indicator">
            <div className="mic-icon pulsing">🎤</div>
            <p className="listening-text">Lytter... Snakk nå!</p>
            <div className="sound-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          </div>
        ) : (
          <button className="record-button" onClick={startListening}>
            <div className="mic-icon">🎤</div>
            <span>Trykk og si ordet</span>
          </button>
        )}
      </div>

      {latestResult && (
        <div className={`result-card ${latestResult.isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="result-icon">
            {latestResult.isCorrect ? '✅' : '❌'}
          </div>
          <div className="result-content">
            <p className="transcript">
              Du sa: <strong>"{latestResult.transcript}"</strong>
            </p>
            <p className="feedback">{latestResult.feedback}</p>
            {latestResult.isCorrect && (
              <div className="confidence-bar">
                <div className="confidence-label">Selvtillit: {Math.round(latestResult.confidence * 100)}%</div>
                <div className="confidence-track">
                  <div
                    className="confidence-fill"
                    style={{ width: `${latestResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="attempts-counter">
        <span>Forsøk: {attempts}</span>
      </div>

      <button
        className="skip-button-pron"
        onClick={() => onComplete(5, Math.max(1, attempts))}
      >
        ⏭️ Hopp over
      </button>

      {results.length > 0 && (
        <div className="history">
          <h3>📜 Historikk</h3>
          <div className="history-list">
            {results.slice().reverse().map((result, index) => (
              <div key={index} className={`history-item ${result.isCorrect ? 'success' : 'fail'}`}>
                <span className="history-icon">{result.isCorrect ? '✅' : '❌'}</span>
                <span className="history-text">"{result.transcript}"</span>
                <span className="history-confidence">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tips-section">
        <h4>💡 Tips for best uttale:</h4>
        <ul>
          <li>Snakk tydelig og ikke for raskt</li>
          <li>Hold mikrofonen nær munnen</li>
          <li>Lytt til ordet først (🔊)</li>
          <li>Prøv å etterligne lyden du hører</li>
        </ul>
      </div>
    </div>
  );
};
