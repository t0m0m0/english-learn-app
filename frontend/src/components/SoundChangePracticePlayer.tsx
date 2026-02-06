import { useState, useCallback, useEffect, useRef } from "react";
import { usePrerecordedAudio } from "../hooks/usePrerecordedAudio";
import { soundChangeApi, DEFAULT_USER_ID } from "../services/api";
import { SoundChangeFillBlank } from "./SoundChangeFillBlank";
import { SoundChangeDictation } from "./SoundChangeDictation";
import type { SoundChangeExerciseItem } from "../types";

export interface PracticeSummary {
  totalItems: number;
  correctCount: number;
  averageAccuracy: number;
}

interface SoundChangePracticePlayerProps {
  items: SoundChangeExerciseItem[];
  onComplete: (summary: PracticeSummary) => void;
}

export function SoundChangePracticePlayer({
  items,
  onComplete,
}: SoundChangePracticePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [accuracySum, setAccuracySum] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [progressSaveError, setProgressSaveError] = useState<string | null>(
    null,
  );

  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { load, play, stop, setPlaybackRate, isPlaying, isLoading, error } =
    usePrerecordedAudio();

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Load and auto-play first item
  useEffect(() => {
    if (currentItem) {
      load(currentItem.audioPath);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play after load on mount
  useEffect(() => {
    if (!isLoading && currentIndex === 0 && currentItem) {
      autoPlayTimeoutRef.current = setTimeout(() => {
        play();
      }, 300);
    }
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      stop();
    };
  }, [stop]);

  const handlePlay = useCallback(() => {
    play();
  }, [play]);

  const handleResult = useCallback(
    async (isCorrect: boolean, accuracy: number) => {
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      setAccuracySum((prev) => prev + accuracy);
      setProgressSaveError(null);

      try {
        await soundChangeApi.recordProgress({
          userId: DEFAULT_USER_ID,
          itemId: currentItem.id,
          accuracy: Math.round(accuracy),
          isCorrect,
        });
      } catch (err) {
        console.error("Failed to record progress:", err);
        setProgressSaveError(
          "Progress could not be saved. Your practice will continue.",
        );
      }
    },
    [currentItem],
  );

  const handleNext = useCallback(() => {
    if (isLastItem) {
      const summary: PracticeSummary = {
        totalItems: items.length,
        correctCount,
        averageAccuracy:
          items.length > 0 ? Math.round(accuracySum / items.length) : 0,
      };
      onComplete(summary);
    } else {
      const nextItem = items[currentIndex + 1];
      setCurrentIndex((prev) => prev + 1);
      stop();
      load(nextItem.audioPath);
      setPlaybackRate(speed);
      autoPlayTimeoutRef.current = setTimeout(() => {
        play();
      }, 300);
    }
  }, [
    isLastItem,
    items,
    currentIndex,
    correctCount,
    accuracySum,
    onComplete,
    stop,
    load,
    play,
    setPlaybackRate,
    speed,
  ]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      setPlaybackRate(newSpeed);
    },
    [setPlaybackRate],
  );

  if (!currentItem) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-surface-elevated rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-text-secondary text-sm whitespace-nowrap">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-4">
        <label htmlFor="speed" className="text-text-secondary text-sm">
          Speed: {speed.toFixed(2)}x
        </label>
        <input
          id="speed"
          type="range"
          min="0.5"
          max="1.5"
          step="0.25"
          value={speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="flex-1"
        />
      </div>

      {/* Exercise item */}
      {currentItem.type === "fill_blank" ? (
        <SoundChangeFillBlank
          item={currentItem}
          onPlay={handlePlay}
          isPlaying={isPlaying || isLoading}
          onResult={handleResult}
          onNext={handleNext}
          isLast={isLastItem}
        />
      ) : (
        <SoundChangeDictation
          item={currentItem}
          onPlay={handlePlay}
          isPlaying={isPlaying || isLoading}
          onResult={handleResult}
          onNext={handleNext}
          isLast={isLastItem}
        />
      )}

      {/* Error messages */}
      {error && <p className="text-error text-sm">{error}</p>}
      {progressSaveError && (
        <p className="text-warning text-sm">{progressSaveError}</p>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-text-muted text-xs">
        <span>Shortcuts: </span>
        <span className="mx-1">P = Play</span>
        <span className="mx-1">Enter = Check/Next</span>
      </div>
    </div>
  );
}

export default SoundChangePracticePlayer;
