import React, { useState } from 'react';
import type { User } from '../types';
import './Login.css';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Innlogging feilet');
        setIsLoading(false);
        return;
      }

      onLogin(data.user);
    } catch (err) {
      setError('Kunne ikke koble til serveren');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">📚 Glosetrenings-app</h1>
        <p className="login-subtitle">Logg inn for å øve på gloser</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Brukernavn</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="hermann eller vilma"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ditt passord"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>

        <div className="quick-login">
          <p>Hurtigvalg:</p>
          <div className="quick-buttons">
            <button
              className="quick-button hermann"
              onClick={() => {
                setUsername('hermann');
                setPassword('');
              }}
            >
              Hermann 🎒
            </button>
            <button
              className="quick-button vilma"
              onClick={() => {
                setUsername('vilma');
                setPassword('');
              }}
            >
              Vilma 📖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
