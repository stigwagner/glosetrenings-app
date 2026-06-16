import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { apiUrl } from '../config/api';
import { speakEnglish } from '../utils/speech';
import './WordList.css';

interface WordListProps {
  user: User;
}

interface WordWithDetails {
  id: number;
  english: string;
  norwegian: string;
  wordClass?: string;
  pluralForm?: string;
  verbThirdPerson?: string;
  verbPast?: string;
  verbPastParticiple?: string;
  verbPresentParticiple?: string;
  adjectiveComparative?: string;
  adjectiveSuperlative?: string;
  lessonTitle: string;
  lessonDate: string;
  nextPracticeDate: string;
  lastPracticed?: string;
  timesCompleted: number;
  averageScore: number;
}

export const WordList: React.FC<WordListProps> = ({ user }) => {
  const [words, setWords] = useState<WordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<'practice-date' | 'lesson-date' | 'word' | null>(null);
  const [newDate, setNewDate] = useState('');
  const [editEnglish, setEditEnglish] = useState('');
  const [editNorwegian, setEditNorwegian] = useState('');
  const [editWordClass, setEditWordClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'english' | 'norwegian' | 'date'>('date');
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState({ english: '', norwegian: '', wordClass: 'noun' });
  const [viewMode, setViewMode] = useState<'my-words' | 'universal'>('my-words');
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWords();
  }, [user, viewMode]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const endpoint = viewMode === 'universal'
        ? '/api/words/universal'
        : `/api/words/all?userId=${user.id}`;
      const response = await fetch(apiUrl(endpoint));
      const data = await response.json();
      setWords(data.words || []);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeDateUpdate = async (wordId: number) => {
    if (!newDate) {
      alert('Velg en dato først');
      return;
    }

    try {
      await fetch(apiUrl(`/api/words/${wordId}/update-practice-date`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, userId: user.id }),
      });

      setWords(words.map(w =>
        w.id === wordId ? { ...w, nextPracticeDate: newDate } : w
      ));

      setEditingId(null);
      setEditMode(null);
      setNewDate('');
    } catch (error) {
      console.error('Error updating practice date:', error);
      alert('Kunne ikke oppdatere øvingsdato');
    }
  };

  const handleLessonDateUpdate = async (wordId: number) => {
    if (!newDate) {
      alert('Velg en dato først');
      return;
    }

    try {
      await fetch(apiUrl(`/api/words/${wordId}/update-lesson-date`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, userId: user.id }),
      });

      setWords(words.map(w =>
        w.id === wordId ? { ...w, lessonDate: newDate } : w
      ));

      setEditingId(null);
      setEditMode(null);
      setNewDate('');
    } catch (error) {
      console.error('Error updating lesson date:', error);
      alert('Kunne ikke oppdatere leksjonsdato');
    }
  };

  const handleWordUpdate = async (wordId: number) => {
    if (!editEnglish || !editNorwegian) {
      alert('Fyll ut alle feltene');
      return;
    }

    try {
      await fetch(apiUrl(`/api/words/${wordId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          english: editEnglish,
          norwegian: editNorwegian,
          wordClass: editWordClass || 'noun',
        }),
      });

      setWords(words.map(w =>
        w.id === wordId
          ? { ...w, english: editEnglish, norwegian: editNorwegian, wordClass: editWordClass }
          : w
      ));

      setEditingId(null);
      setEditMode(null);
    } catch (error) {
      console.error('Error updating word:', error);
      alert('Kunne ikke oppdatere ordet');
    }
  };

  const handleDeleteWord = async (wordId: number, englishWord: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${englishWord}"?`)) {
      return;
    }

    try {
      await fetch(apiUrl(`/api/words/${wordId}`), {
        method: 'DELETE',
      });

      setWords(words.filter(w => w.id !== wordId));
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('Kunne ikke slette ordet');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWords.size === 0) {
      alert('Velg ord som skal slettes først');
      return;
    }

    if (!confirm(`Er du sikker på at du vil slette ${selectedWords.size} ord?`)) {
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/words/bulk-delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds: Array.from(selectedWords) }),
      });

      if (response.ok) {
        setWords(words.filter(w => !selectedWords.has(w.id)));
        setSelectedWords(new Set());
        alert(`${selectedWords.size} ord slettet`);
      } else {
        alert('Kunne ikke slette ordene');
      }
    } catch (error) {
      console.error('Error bulk deleting words:', error);
      alert('Kunne ikke slette ordene');
    }
  };

  const toggleSelectWord = (wordId: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWords(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedWords.size === filteredWords.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(filteredWords.map(w => w.id)));
    }
  };

  const handleAddWord = async () => {
    if (!newWord.english || !newWord.norwegian) {
      alert('Fyll ut engelsk og norsk');
      return;
    }

    try {
      await fetch(apiUrl('/api/words/manual'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          english: newWord.english,
          norwegian: newWord.norwegian,
          wordClass: newWord.wordClass,
        }),
      });

      await fetchWords();
      setShowAddWord(false);
      setNewWord({ english: '', norwegian: '', wordClass: 'noun' });
    } catch (error) {
      console.error('Error adding word:', error);
      alert('Kunne ikke legge til ordet');
    }
  };

  const startEditingPracticeDate = (wordId: number, currentDate: string) => {
    setEditingId(wordId);
    setEditMode('practice-date');
    setNewDate(currentDate.split('T')[0]);
  };

  const startEditingLessonDate = (wordId: number, currentDate: string) => {
    setEditingId(wordId);
    setEditMode('lesson-date');
    setNewDate(currentDate.split('T')[0]);
  };

  const startEditingWord = (word: WordWithDetails) => {
    setEditingId(word.id);
    setEditMode('word');
    setEditEnglish(word.english);
    setEditNorwegian(word.norwegian);
    setEditWordClass(word.wordClass || 'noun');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditMode(null);
    setNewDate('');
    setEditEnglish('');
    setEditNorwegian('');
    setEditWordClass('');
  };

  const filteredWords = words
    .filter(word =>
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.norwegian.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'english') {
        return a.english.localeCompare(b.english);
      } else if (sortBy === 'norwegian') {
        return a.norwegian.localeCompare(b.norwegian);
      } else {
        return new Date(b.nextPracticeDate).getTime() - new Date(a.nextPracticeDate).getTime();
      }
    });

  if (loading) {
    return (
      <div className="word-list">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Laster ordliste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="word-list">
      <div className="word-list-header">
        <h2>📖 {viewMode === 'my-words' ? 'Min ordbank' : 'Universell ordbank'}</h2>
        <div className="view-mode-toggle">
          <button
            className={`toggle-button ${viewMode === 'my-words' ? 'active' : ''}`}
            onClick={() => setViewMode('my-words')}
          >
            Mine ord
          </button>
          <button
            className={`toggle-button ${viewMode === 'universal' ? 'active' : ''}`}
            onClick={() => setViewMode('universal')}
          >
            Universell ordbank
          </button>
        </div>
        <p className="word-count">Totalt {words.length} ord</p>
        <div className="header-buttons">
          {viewMode === 'my-words' && (
            <button className="add-word-button" onClick={() => setShowAddWord(!showAddWord)}>
              ➕ Legg til ord manuelt
            </button>
          )}
          {selectedWords.size > 0 && (
            <button className="bulk-delete-button" onClick={handleBulkDelete}>
              🗑️ Slett valgte ({selectedWords.size})
            </button>
          )}
        </div>
      </div>

      {showAddWord && (
        <div className="add-word-form">
          <h3>Legg til nytt ord</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Engelsk ord"
              value={newWord.english}
              onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Norsk oversettelse"
              value={newWord.norwegian}
              onChange={(e) => setNewWord({ ...newWord, norwegian: e.target.value })}
              className="form-input"
            />
            <select
              value={newWord.wordClass}
              onChange={(e) => setNewWord({ ...newWord, wordClass: e.target.value })}
              className="form-select"
            >
              <option value="noun">Substantiv</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjektiv</option>
              <option value="adverb">Adverb</option>
              <option value="pronoun">Pronomen</option>
              <option value="preposition">Preposisjon</option>
              <option value="conjunction">Konjunksjon</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="save-button" onClick={handleAddWord}>Lagre</button>
            <button className="cancel-button" onClick={() => setShowAddWord(false)}>Avbryt</button>
          </div>
        </div>
      )}

      <div className="word-list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Søk etter ord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <label>Sorter:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
            <option value="date">Dato (nyeste først)</option>
            <option value="english">Engelsk A-Å</option>
            <option value="norwegian">Norsk A-Å</option>
          </select>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="no-words">
          <p>Ingen ord funnet</p>
          {searchTerm && <p>Prøv et annet søkeord</p>}
        </div>
      ) : (
        <div className="words-table-container">
          <table className="words-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedWords.size === filteredWords.length && filteredWords.length > 0}
                    onChange={toggleSelectAll}
                    title="Velg alle"
                  />
                </th>
                <th>Engelsk</th>
                <th>Norsk</th>
                <th>Ordklasse</th>
                <th>Grammatikk</th>
                {viewMode === 'my-words' && (
                  <>
                    <th>Leksjon</th>
                    <th>Leksjonsdato</th>
                    <th>Neste øving</th>
                    <th>Sist øvd</th>
                    <th>Fullført</th>
                    <th>Snittpoeng</th>
                    <th>Handlinger</th>
                  </>
                )}
                {viewMode === 'universal' && (
                  <>
                    <th>Lagt til</th>
                    <th>Handlinger</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word) => (
                <tr key={word.id} className="word-row">
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedWords.has(word.id)}
                      onChange={() => toggleSelectWord(word.id)}
                    />
                  </td>
                  <td className="word-english">
                    {editingId === word.id && editMode === 'word' ? (
                      <input
                        type="text"
                        value={editEnglish}
                        onChange={(e) => setEditEnglish(e.target.value)}
                        className="inline-input"
                      />
                    ) : (
                      <div className="word-with-audio">
                        <span>{word.english}</span>
                        <button
                          className="audio-button"
                          onClick={() => speakEnglish(word.english)}
                          title="Hør uttalen"
                        >
                          🔊
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="word-norwegian">
                    {editingId === word.id && editMode === 'word' ? (
                      <input
                        type="text"
                        value={editNorwegian}
                        onChange={(e) => setEditNorwegian(e.target.value)}
                        className="inline-input"
                      />
                    ) : (
                      word.norwegian
                    )}
                  </td>
                  <td className="word-class">
                    {editingId === word.id && editMode === 'word' ? (
                      <select
                        value={editWordClass}
                        onChange={(e) => setEditWordClass(e.target.value)}
                        className="inline-select"
                      >
                        <option value="noun">Substantiv</option>
                        <option value="verb">Verb</option>
                        <option value="adjective">Adjektiv</option>
                        <option value="adverb">Adverb</option>
                        <option value="pronoun">Pronomen</option>
                        <option value="preposition">Preposisjon</option>
                        <option value="conjunction">Konjunksjon</option>
                      </select>
                    ) : (
                      <span className="word-class-badge">{word.wordClass || '-'}</span>
                    )}
                  </td>
                  <td className="word-grammar">
                    {word.wordClass === 'noun' && word.pluralForm ? (
                      <div className="grammar-info">
                        <div><strong>Entall:</strong> {word.english}</div>
                        <div><strong>Flertall:</strong> {word.pluralForm}</div>
                      </div>
                    ) : word.wordClass === 'verb' ? (
                      <div className="grammar-info verb-conjugation">
                        <div><strong>Presens:</strong></div>
                        <div className="conjugation-grid">
                          <span>I {word.english}</span>
                          <span>you {word.english}</span>
                          <span>he/she/it {word.verbThirdPerson || word.english + 's'}</span>
                          <span>we {word.english}</span>
                          <span>you {word.english}</span>
                          <span>they {word.english}</span>
                        </div>
                        {word.verbPast && (
                          <div className="past-tense">
                            <strong>Preteritum:</strong> {word.verbPast}
                          </div>
                        )}
                        {word.verbPresentParticiple && (
                          <div className="present-participle">
                            <strong>-ing form:</strong> {word.verbPresentParticiple}
                          </div>
                        )}
                      </div>
                    ) : word.wordClass === 'adjective' && (word.adjectiveComparative || word.adjectiveSuperlative) ? (
                      <div className="grammar-info adjective-forms">
                        <div><strong>Positiv:</strong> {word.english}</div>
                        {word.adjectiveComparative && <div><strong>Komparativ:</strong> {word.adjectiveComparative}</div>}
                        {word.adjectiveSuperlative && <div><strong>Superlativ:</strong> {word.adjectiveSuperlative}</div>}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  {viewMode === 'my-words' && (
                    <>
                      <td className="word-lesson">{word.lessonTitle}</td>
                      <td className="word-lesson-date">
                        {editingId === word.id && editMode === 'lesson-date' ? (
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="date-input"
                          />
                        ) : (
                          <span>{word.lessonDate ? new Date(word.lessonDate).toLocaleDateString('no-NO') : '-'}</span>
                        )}
                      </td>
                      <td className="word-practice-date">
                        {editingId === word.id && editMode === 'practice-date' ? (
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="date-input"
                          />
                        ) : (
                          <span>{new Date(word.nextPracticeDate).toLocaleDateString('no-NO')}</span>
                        )}
                      </td>
                      <td className="word-last-practiced">
                        {word.lastPracticed
                          ? new Date(word.lastPracticed).toLocaleDateString('no-NO')
                          : '-'
                        }
                      </td>
                      <td className="word-completed">{word.timesCompleted}x</td>
                      <td className="word-score">
                        {word.averageScore > 0 ? `${word.averageScore.toFixed(1)}` : '-'}
                      </td>
                      <td className="word-actions">
                        {editingId === word.id ? (
                          <div className="action-buttons">
                            <button
                              className="save-button"
                              onClick={() => {
                                if (editMode === 'practice-date') handlePracticeDateUpdate(word.id);
                                else if (editMode === 'lesson-date') handleLessonDateUpdate(word.id);
                                else handleWordUpdate(word.id);
                              }}
                              title="Lagre"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-button"
                              onClick={cancelEditing}
                              title="Avbryt"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => startEditingWord(word)}
                              title="Rediger ord"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteWord(word.id, word.english)}
                              title="Slett ord"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                  {viewMode === 'universal' && (
                    <>
                      <td className="word-created">
                        {(word as any).createdAt ? new Date((word as any).createdAt).toLocaleDateString('no-NO') : '-'}
                      </td>
                      <td className="word-actions">
                        {editingId === word.id && editMode === 'word' ? (
                          <div className="action-buttons">
                            <button
                              className="save-button"
                              onClick={() => handleWordUpdate(word.id)}
                              title="Lagre"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-button"
                              onClick={cancelEditing}
                              title="Avbryt"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => startEditingWord(word)}
                              title="Rediger ord"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteWord(word.id, word.english)}
                              title="Slett ord"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
