import { useState, useEffect } from 'react';
import { wordsApi, progressApi } from '../services/api';
import { useUser } from '../context/UserContext';
import WordCard from '../components/WordCard';
import ProgressBar from '../components/ProgressBar';
import './Learn.css';

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

export function Learn() {
  const { user } = useUser();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [maxFrequency, setMaxFrequency] = useState(1000);

  const currentWord = words[currentIndex];

  const fetchWords = async () => {
    setLoading(true);
    try {
      if (user) {
        // Get new words for the user
        const { words: newWords } = await progressApi.getNewWords(
          user.id,
          20,
          maxFrequency
        );
        setWords(newWords);
      } else {
        // Guest mode: just get random words
        const { words: randomWords } = await wordsApi.getRandom(20, maxFrequency);
        setWords(randomWords);
      }
      setCurrentIndex(0);
      setSessionStats({ correct: 0, incorrect: 0 });
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [user, maxFrequency]);

  const handleCorrect = async () => {
    if (user && currentWord) {
      try {
        await progressApi.updateProgress(user.id, currentWord.id, true);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
    setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    goToNext();
  };

  const handleIncorrect = async () => {
    if (user && currentWord) {
      try {
        await progressApi.updateProgress(user.id, currentWord.id, false);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
    setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFrequencyChange = (freq: number) => {
    setMaxFrequency(freq);
  };

  if (loading) {
    return (
      <div className="learn-page">
        <div className="loading">Loading words...</div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="learn-page">
        <div className="empty-state">
          <h2>No new words to learn!</h2>
          <p>You've learned all words in this frequency range.</p>
          <button onClick={fetchWords}>Refresh</button>
        </div>
      </div>
    );
  }

  const isComplete = currentIndex >= words.length - 1 &&
    (sessionStats.correct + sessionStats.incorrect) > 0 &&
    (sessionStats.correct + sessionStats.incorrect) >= words.length;

  return (
    <div className="learn-page">
      <div className="learn-header">
        <h1>Image Connect Mode</h1>
        <p className="learn-description">
          Connect the image directly to the English word. Don't translate!
        </p>
      </div>

      <div className="frequency-selector">
        <label>Focus on top:</label>
        <div className="frequency-buttons">
          {[500, 1000, 2000, 3000].map((freq) => (
            <button
              key={freq}
              className={maxFrequency === freq ? 'active' : ''}
              onClick={() => handleFrequencyChange(freq)}
            >
              {freq} words
            </button>
          ))}
        </div>
      </div>

      <ProgressBar
        current={currentIndex + 1}
        total={words.length}
        label="Session Progress"
      />

      <div className="session-stats">
        <span className="stat correct">✓ {sessionStats.correct}</span>
        <span className="stat incorrect">✗ {sessionStats.incorrect}</span>
      </div>

      {!isComplete ? (
        <>
          <WordCard
            word={currentWord}
            showImage={true}
            showWord={false}
            onCorrect={handleCorrect}
            onIncorrect={handleIncorrect}
            autoPlay={true}
          />

          <div className="navigation-buttons">
            <button
              className="nav-button"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <span className="word-counter">
              {currentIndex + 1} / {words.length}
            </span>
            <button
              className="nav-button"
              onClick={goToNext}
              disabled={currentIndex === words.length - 1}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div className="session-complete">
          <h2>Session Complete!</h2>
          <div className="complete-stats">
            <div className="complete-stat">
              <span className="stat-value">{sessionStats.correct}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="complete-stat">
              <span className="stat-value">{sessionStats.incorrect}</span>
              <span className="stat-label">To Review</span>
            </div>
            <div className="complete-stat">
              <span className="stat-value">
                {Math.round(
                  (sessionStats.correct /
                    (sessionStats.correct + sessionStats.incorrect)) *
                    100
                )}
                %
              </span>
              <span className="stat-label">Accuracy</span>
            </div>
          </div>
          <button className="new-session-button" onClick={fetchWords}>
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}

export default Learn;
