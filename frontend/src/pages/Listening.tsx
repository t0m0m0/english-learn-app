import { useState, useEffect } from 'react';
import { Word } from '../types';
import { wordsApi } from '../services/api';
import ListeningMode from '../components/ListeningMode';
import './Listening.css';

export function Listening() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(50);
  const [maxFrequency, setMaxFrequency] = useState(1000);
  const [sessionComplete, setSessionComplete] = useState(false);

  const fetchWords = async () => {
    setLoading(true);
    setSessionComplete(false);
    try {
      const { words: fetchedWords } = await wordsApi.getRandom(
        wordCount,
        maxFrequency
      );
      setWords(fetchedWords);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [wordCount, maxFrequency]);

  const handleComplete = () => {
    setSessionComplete(true);
  };

  const handleNewSession = () => {
    fetchWords();
  };

  if (loading) {
    return (
      <div className="listening-page">
        <div className="loading">Loading words...</div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="listening-page">
        <div className="session-complete">
          <h2>Listening Session Complete!</h2>
          <p>Great job immersing yourself in the language!</p>
          <div className="complete-stats">
            <div className="stat">
              <span className="value">{wordCount}</span>
              <span className="label">Words Heard</span>
            </div>
          </div>
          <button className="new-session-button" onClick={handleNewSession}>
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="listening-page">
      <div className="settings-bar">
        <div className="setting-group">
          <label>Word Count:</label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
          >
            <option value={25}>25 words</option>
            <option value={50}>50 words</option>
            <option value={100}>100 words</option>
            <option value={200}>200 words</option>
          </select>
        </div>
        <div className="setting-group">
          <label>Frequency Range:</label>
          <select
            value={maxFrequency}
            onChange={(e) => setMaxFrequency(Number(e.target.value))}
          >
            <option value={500}>Top 500</option>
            <option value={1000}>Top 1,000</option>
            <option value={2000}>Top 2,000</option>
            <option value={3000}>All 3,000</option>
          </select>
        </div>
        <button className="refresh-button" onClick={fetchWords}>
          New Words
        </button>
      </div>

      <ListeningMode words={words} onComplete={handleComplete} />
    </div>
  );
}

export default Listening;
