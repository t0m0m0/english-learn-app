import { useState, useEffect, useCallback, useRef } from 'react';
import useAudio from '../hooks/useAudio';
import { Button, Card } from './ui';

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

interface ListeningModeProps {
  words: Word[];
  onComplete?: () => void;
}

export function ListeningMode({ words, onComplete }: ListeningModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [delay, setDelay] = useState(2000);
  const { speak, stop, isSpeaking, isReady, error } = useAudio({ debug: true });
  const skipNextSpeak = useRef(false);

  const currentWord = words[currentIndex];

  const playNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < words.length - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        onComplete?.();
        return prev;
      }
    });
  }, [words.length, onComplete]);

  // currentIndexまたはisPlayingが変わったとき
  useEffect(() => {
    if (!isPlaying || !currentWord) return;

    // handlePlayPauseで既に再生した場合はスキップ
    if (skipNextSpeak.current) {
      skipNextSpeak.current = false;
    } else {
      speak(currentWord.word, speed);
    }

    const timeoutId = setTimeout(() => {
      playNext();
    }, delay + 1000 / speed);

    return () => clearTimeout(timeoutId);
  }, [currentIndex, isPlaying, currentWord, speak, speed, delay, playNext]);

  const handlePlayPause = () => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
    } else {
      // ユーザーインタラクション時に直接再生（ブラウザのautoplay制限対策）
      if (currentWord) {
        speak(currentWord.word, speed);
        skipNextSpeak.current = true;
      }
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    stop();
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSkip = () => {
    stop();
    playNext();
  };

  const handlePrevious = () => {
    stop();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleDelayChange = (newDelay: number) => {
    setDelay(newDelay);
  };

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Brain Soaking Mode</h2>
        <p className="text-text-secondary">
          Immerse yourself in the language. Listen to the rhythm and patterns.
        </p>
      </div>

      {/* Audio Status/Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-card text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {!isReady && !error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-card text-yellow-700 dark:text-yellow-300 text-sm">
          Loading audio voices...
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-sm text-text-muted mb-8">
        {currentIndex + 1} / {words.length}
      </p>

      {/* Current Word Display */}
      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-card mb-8">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          #{currentWord?.frequency || currentIndex + 1}
        </span>
        <h1
          className={`text-5xl font-bold mt-2 mb-3 transition-all duration-200 ${
            isSpeaking ? 'text-primary scale-105' : 'text-text-primary'
          }`}
        >
          {currentWord?.word || '...'}
        </h1>
        {currentWord?.partOfSpeech && (
          <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-primary px-3 py-1 rounded-full text-xs uppercase tracking-wide">
            {currentWord.partOfSpeech}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-8">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ⏮ Previous
        </Button>
        <Button
          variant={isPlaying ? 'error' : 'primary'}
          onClick={handlePlayPause}
          className="min-w-32"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleSkip}
          disabled={currentIndex === words.length - 1}
        >
          Next ⏭
        </Button>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm text-text-secondary mb-2">Speed</label>
          <div className="flex gap-2">
            {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                className={`flex-1 py-2 px-3 rounded-button text-sm transition-colors ${
                  speed === s
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Delay between words</label>
          <div className="flex gap-2">
            {[1000, 2000, 3000, 5000].map((d) => (
              <button
                key={d}
                type="button"
                className={`flex-1 py-2 px-3 rounded-button text-sm transition-colors ${
                  delay === d
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleDelayChange(d)}
              >
                {d / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button variant="ghost" onClick={handleRestart} fullWidth>
        ↺ Restart
      </Button>
    </Card>
  );
}

export default ListeningMode;
