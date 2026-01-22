import { useState, useEffect, useCallback, useRef } from 'react';
import useAudio from '../hooks/useAudio';
import './ListeningMode.css';

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
  const { speak, stop, isSpeaking } = useAudio();
  const skipNextSpeak = useRef(false);

  const currentWord = words[currentIndex];

  const playNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentIndex, words.length, onComplete]);

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
  }, [currentIndex, isPlaying]);

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
    <div className="listening-mode">
      <div className="listening-header">
        <h2>Brain Soaking Mode</h2>
        <p className="listening-description">
          Immerse yourself in the language. Listen to the rhythm and patterns.
        </p>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-text">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      <div className="current-word-display">
        <span className="word-number">#{currentWord?.frequency || currentIndex + 1}</span>
        <h1 className={`listening-word ${isSpeaking ? 'speaking' : ''}`}>
          {currentWord?.word || '...'}
        </h1>
        {currentWord?.partOfSpeech && (
          <span className="word-pos">{currentWord.partOfSpeech}</span>
        )}
      </div>

      <div className="listening-controls">
        <button
          className="control-button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ⏮ Previous
        </button>
        <button
          className={`control-button play-button ${isPlaying ? 'pause' : 'play'}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="control-button"
          onClick={handleSkip}
          disabled={currentIndex === words.length - 1}
        >
          Next ⏭
        </button>
      </div>

      <div className="settings-panel">
        <div className="setting">
          <label>Speed</label>
          <div className="speed-buttons">
            {[0.5, 0.75, 1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                className={`speed-button ${speed === s ? 'active' : ''}`}
                onClick={() => handleSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="setting">
          <label>Delay between words</label>
          <div className="delay-buttons">
            {[1000, 2000, 3000, 5000].map((d) => (
              <button
                key={d}
                className={`delay-button ${delay === d ? 'active' : ''}`}
                onClick={() => handleDelayChange(d)}
              >
                {d / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="restart-button" onClick={handleRestart}>
        ↺ Restart
      </button>
    </div>
  );
}

export default ListeningMode;
