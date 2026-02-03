import { useState, useEffect, useCallback, useRef } from "react";
import { useAudio } from "../hooks/useAudio";
import { callanProgressApi } from "../services/api";
import { compareDictation, type DictationResult } from "../utils/dictationDiff";
import { Button, Card } from "./ui";
import type { QAItem } from "../types";

interface CallanDictationProps {
  qaItems: QAItem[];
  userId: number;
  onComplete: (summary: DictationSummary) => void;
}

export interface DictationSummary {
  totalItems: number;
  correctCount: number;
  totalAccuracy: number;
}

type PracticeState = "input" | "checked";

export function CallanDictation({
  qaItems,
  userId,
  onComplete,
}: CallanDictationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceState, setPracticeState] = useState<PracticeState>("input");
  const [speed, setSpeed] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [result, setResult] = useState<DictationResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [accuracySum, setAccuracySum] = useState(0);
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    error: audioError,
  } = useAudio();

  const currentItem = qaItems[currentIndex];
  const isLastItem = currentIndex === qaItems.length - 1;
  const progress = ((currentIndex + 1) / qaItems.length) * 100;

  // Play audio (TTS)
  const handlePlay = useCallback(() => {
    if (!currentItem || isSpeaking) return;
    speak(currentItem.answer, speed);
  }, [currentItem, isSpeaking, speak, speed]);

  // Check answer
  const handleCheck = useCallback(async () => {
    if (!currentItem || practiceState === "checked") return;

    const dictationResult = compareDictation(userInput, currentItem.answer);
    setResult(dictationResult);
    setPracticeState("checked");

    // Update statistics
    if (dictationResult.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setAccuracySum((prev) => prev + dictationResult.accuracy);

    // Clear previous progress save error
    setProgressSaveError(null);

    // Record progress
    try {
      await callanProgressApi.recordProgress({
        userId,
        qaItemId: currentItem.id,
        mode: "dictation",
        isCorrect: dictationResult.isCorrect,
      });
    } catch (err) {
      console.error("Failed to record progress:", err);
      setProgressSaveError(
        "Progress could not be saved. Your practice will continue but this item may not be recorded."
      );
    }

    // Play the correct answer
    speak(currentItem.answer, speed);
  }, [currentItem, practiceState, userInput, userId, speak, speed]);

  // Show hint
  const handleHint = useCallback(() => {
    if (!currentItem) return;

    const words = currentItem.answer.split(" ");
    // Show first 1-2 words as hint
    const hintWords = words.slice(0, Math.min(2, words.length)).join(" ");
    setHint(hintWords + "...");
  }, [currentItem]);

  // Go to next item - use functional update to get latest state values
  const handleNext = useCallback(() => {
    if (isLastItem) {
      // Use current result to include the last item's accuracy in the summary
      const finalAccuracySum = result ? accuracySum : accuracySum;
      const finalCorrectCount = result?.isCorrect ? correctCount : correctCount;
      const summary: DictationSummary = {
        totalItems: qaItems.length,
        correctCount: finalCorrectCount,
        totalAccuracy: qaItems.length > 0 ? Math.round(finalAccuracySum / qaItems.length) : 0,
      };
      onComplete(summary);
    } else {
      const nextItem = qaItems[currentIndex + 1];
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setHint(null);
      setResult(null);
      setPracticeState("input");
      // Focus on input and auto-play next item's audio after state update
      setTimeout(() => {
        inputRef.current?.focus();
        if (nextItem) {
          speak(nextItem.answer, speed);
        }
      }, 0);
    }
  }, [isLastItem, qaItems, currentIndex, correctCount, accuracySum, result, onComplete, speak, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in textarea (except specific ones)
      if (e.target instanceof HTMLTextAreaElement) {
        // Only handle Enter for check when not composing
        if (e.key === "Enter" && !e.shiftKey && practiceState === "input") {
          e.preventDefault();
          handleCheck();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "p":
          handlePlay();
          break;
        case "h":
          if (practiceState === "input") {
            handleHint();
          }
          break;
        case "enter":
          if (practiceState === "input") {
            handleCheck();
          } else if (practiceState === "checked") {
            handleNext();
          }
          break;
        case "n":
          if (practiceState === "checked") {
            handleNext();
          }
          break;
        case "escape":
          stopSpeaking();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    practiceState,
    handlePlay,
    handleCheck,
    handleHint,
    handleNext,
    stopSpeaking,
  ]);

  // Focus input and auto-play first item on mount
  useEffect(() => {
    inputRef.current?.focus();
    if (currentItem) {
      speak(currentItem.answer, speed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  if (!currentItem) {
    return (
      <Card className="p-6 text-center">
        <p className="text-error mb-4">
          Unable to load practice item. The practice data may be invalid.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-surface-elevated rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-text-secondary text-sm whitespace-nowrap">
          {currentIndex + 1} / {qaItems.length}
        </span>
      </div>

      {/* Main practice card */}
      <Card className="p-6">
        <div className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
            Listen and type what you hear
          </p>

          {/* Speed control */}
          <div className="flex items-center gap-4 mb-4">
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
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>

          {/* Control buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              variant="primary"
              onClick={handlePlay}
              disabled={isSpeaking}
            >
              {isSpeaking ? "🔊 Playing..." : "🔊 Play (P)"}
            </Button>

            {practiceState === "input" && (
              <Button variant="secondary" onClick={handleHint}>
                💡 Hint (H)
              </Button>
            )}
          </div>

          {/* Hint display */}
          {hint && practiceState === "input" && (
            <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-sm text-warning font-medium">Hint: {hint}</p>
            </div>
          )}
        </div>

        {/* Text input area */}
        <div className="mb-4">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type what you hear..."
            disabled={practiceState === "checked"}
            className="w-full p-4 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            rows={3}
          />
        </div>

        {/* Check button */}
        {practiceState === "input" && (
          <Button
            variant="primary"
            onClick={handleCheck}
            disabled={!userInput.trim()}
            className="w-full"
          >
            ✓ Check Answer (Enter)
          </Button>
        )}

        {/* Error messages */}
        {audioError && <p className="mt-4 text-error text-sm">{audioError}</p>}
        {progressSaveError && (
          <p className="mt-4 text-warning text-sm">{progressSaveError}</p>
        )}
      </Card>

      {/* Result card */}
      {practiceState === "checked" && result && (
        <Card className="p-6">
          {/* Accuracy display */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Result</h3>
            <span
              className={`text-2xl font-bold ${
                result.accuracy === 100
                  ? "text-success"
                  : result.accuracy >= 80
                    ? "text-warning"
                    : "text-error"
              }`}
            >
              {result.accuracy}%
            </span>
          </div>

          {/* Diff display */}
          <div className="mb-4 p-4 bg-surface-elevated rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Your answer
            </p>
            <div className="text-lg leading-relaxed flex flex-wrap gap-1">
              {result.diff.map((segment, idx) => (
                <span
                  key={idx}
                  className={
                    segment.type === "correct"
                      ? "text-success"
                      : segment.type === "wrong"
                        ? "text-error line-through"
                        : segment.type === "missing"
                          ? "text-warning bg-warning/10 px-1 rounded"
                          : "text-error/50 bg-error/10 px-1 rounded line-through"
                  }
                  title={
                    segment.type === "wrong"
                      ? `Expected: ${segment.expected}`
                      : segment.type === "missing"
                        ? "Missing word"
                        : segment.type === "extra"
                          ? "Extra word"
                          : undefined
                  }
                >
                  {segment.text}
                </span>
              ))}
            </div>
          </div>

          {/* Correct answer */}
          <div className="mb-6 p-4 bg-success/10 rounded-lg border border-success/20">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Correct answer
            </p>
            <p className="text-lg font-medium text-text-primary">
              {currentItem.answer}
            </p>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-success"></span>
              <span className="text-text-secondary">Correct</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-error"></span>
              <span className="text-text-secondary">Wrong</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-warning"></span>
              <span className="text-text-secondary">Missing</span>
            </span>
          </div>

          {/* Next button */}
          <Button variant="primary" onClick={handleNext} className="w-full">
            {isLastItem ? "🏁 Finish" : "➡️ Next (N)"}
          </Button>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-text-muted text-xs">
        <span>Shortcuts: </span>
        <span className="mx-1">P = Play</span>
        <span className="mx-1">H = Hint</span>
        <span className="mx-1">Enter = Check/Next</span>
        <span className="mx-1">Esc = Stop Audio</span>
      </div>
    </div>
  );
}

export default CallanDictation;
