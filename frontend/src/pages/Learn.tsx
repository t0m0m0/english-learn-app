import { useState, useEffect, useCallback } from "react";
import { progressApi, DEFAULT_USER_ID } from "../services/api";
import WordCard from "../components/WordCard";
import ProgressBar from "../components/ProgressBar";
import { Container, Card, Button } from "../components/ui";

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

export function Learn() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
  });
  const [maxFrequency, setMaxFrequency] = useState(1000);

  const currentWord = words[currentIndex];

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const { words: newWords } = await progressApi.getNewWords(
        DEFAULT_USER_ID,
        20,
        maxFrequency,
      );
      setWords(newWords);
      setCurrentIndex(0);
      setSessionStats({ correct: 0, incorrect: 0 });
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  }, [maxFrequency]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleCorrect = async () => {
    if (currentWord) {
      try {
        await progressApi.updateProgress(DEFAULT_USER_ID, currentWord.id, true);
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    }
    setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    goToNext();
  };

  const handleIncorrect = async () => {
    if (currentWord) {
      try {
        await progressApi.updateProgress(
          DEFAULT_USER_ID,
          currentWord.id,
          false,
        );
      } catch (error) {
        console.error("Error updating progress:", error);
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
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">Loading words...</div>
        </Card>
      </Container>
    );
  }

  if (words.length === 0) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            No new words to learn!
          </h2>
          <p className="text-text-secondary mb-6">
            You've learned all words in this frequency range.
          </p>
          <Button variant="primary" onClick={fetchWords}>
            Refresh
          </Button>
        </Card>
      </Container>
    );
  }

  const isComplete =
    currentIndex >= words.length - 1 &&
    sessionStats.correct + sessionStats.incorrect > 0 &&
    sessionStats.correct + sessionStats.incorrect >= words.length;

  return (
    <Container size="lg" className="py-10">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Image Connect Mode
        </h1>
        <p className="text-text-secondary">
          Connect the image directly to the English word. Don't translate!
        </p>
      </header>

      {/* Frequency Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="text-sm text-text-secondary mr-2">Focus on top:</span>
        {[500, 1000, 2000, 3000].map((freq) => (
          <button
            key={freq}
            type="button"
            className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
              maxFrequency === freq
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleFrequencyChange(freq)}
          >
            {freq} words
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <ProgressBar
        current={currentIndex + 1}
        total={words.length}
        label="Session Progress"
      />

      {/* Session Stats */}
      <div className="flex justify-center gap-4 my-6">
        <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
          ✓ {sessionStats.correct}
        </span>
        <span className="px-4 py-2 bg-error/10 text-error rounded-full text-sm font-medium">
          ✗ {sessionStats.incorrect}
        </span>
      </div>

      {!isComplete ? (
        <>
          <WordCard
            word={currentWord}
            showImage={true}
            showWord={false}
            showDictionary={true}
            showDefinition={true}
            onCorrect={handleCorrect}
            onIncorrect={handleIncorrect}
            autoPlay={true}
          />

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="secondary"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </Button>
            <span className="text-text-secondary text-sm">
              {currentIndex + 1} / {words.length}
            </span>
            <Button
              variant="secondary"
              onClick={goToNext}
              disabled={currentIndex === words.length - 1}
            >
              Next →
            </Button>
          </div>
        </>
      ) : (
        <Card className="text-center py-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Session Complete!
          </h2>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <span className="block text-4xl font-bold text-success">
                {sessionStats.correct}
              </span>
              <span className="text-sm text-text-muted">Correct</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-bold text-error">
                {sessionStats.incorrect}
              </span>
              <span className="text-sm text-text-muted">To Review</span>
            </div>
            <div className="text-center">
              <span className="block text-4xl font-bold text-primary">
                {Math.round(
                  (sessionStats.correct /
                    (sessionStats.correct + sessionStats.incorrect)) *
                    100,
                )}
                %
              </span>
              <span className="text-sm text-text-muted">Accuracy</span>
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={fetchWords}>
            Start New Session
          </Button>
        </Card>
      )}
    </Container>
  );
}

export default Learn;
