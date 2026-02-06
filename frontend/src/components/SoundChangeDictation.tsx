import { useState, useCallback, useRef, useEffect } from "react";
import { compareDictation, type DictationResult } from "../utils/dictationDiff";
import { Button, Card } from "./ui";
import type { SoundChangeExerciseItem } from "../types";

interface SoundChangeDictationProps {
  item: SoundChangeExerciseItem;
  onPlay: () => void;
  isPlaying: boolean;
  onResult: (isCorrect: boolean, accuracy: number) => void;
  onNext: () => void;
  isLast: boolean;
}

type State = "input" | "checked";

export function SoundChangeDictation({
  item,
  onPlay,
  isPlaying,
  onResult,
  onNext,
  isLast,
}: SoundChangeDictationProps) {
  const [state, setState] = useState<State>("input");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount and item change
  useEffect(() => {
    inputRef.current?.focus();
  }, [item.id]);

  // Reset state when item changes
  useEffect(() => {
    setState("input");
    setUserInput("");
    setResult(null);
  }, [item.id]);

  const handleCheck = useCallback(() => {
    if (!userInput.trim() || state === "checked") return;

    const dictationResult = compareDictation(userInput, item.sentence);
    setResult(dictationResult);
    setState("checked");
    onResult(dictationResult.isCorrect, dictationResult.accuracy);
  }, [userInput, state, item.sentence, onResult]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Enter" && !e.shiftKey && state === "input") {
          e.preventDefault();
          handleCheck();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "p":
          onPlay();
          break;
        case "enter":
          if (state === "input") {
            handleCheck();
          } else if (state === "checked") {
            handleNext();
          }
          break;
        case "n":
          if (state === "checked") {
            handleNext();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, onPlay, handleCheck, handleNext]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
          Listen and type what you hear
        </p>

        {/* Play button */}
        <Button variant="primary" onClick={onPlay} disabled={isPlaying}>
          {isPlaying ? "Playing..." : "Play (P)"}
        </Button>
      </div>

      {/* Text input */}
      <div className="mb-4">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type what you hear..."
          disabled={state === "checked"}
          className="w-full p-4 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          rows={3}
        />
      </div>

      {/* Check button */}
      {state === "input" && (
        <Button
          variant="primary"
          onClick={handleCheck}
          disabled={!userInput.trim()}
          className="w-full"
        >
          Check Answer (Enter)
        </Button>
      )}

      {/* Result */}
      {state === "checked" && result && (
        <div className="space-y-4">
          {/* Accuracy */}
          <div className="flex items-center justify-between">
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
          <div className="p-4 bg-surface-elevated rounded-lg">
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
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Correct answer
            </p>
            <p className="text-lg font-medium text-text-primary">
              {item.sentence}
            </p>
          </div>

          {/* Explanation */}
          {item.explanation && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Sound Change
              </p>
              <p className="text-sm text-text-secondary">{item.explanation}</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
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

          <Button variant="primary" onClick={handleNext} className="w-full">
            {isLast ? "Finish" : "Next (N)"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default SoundChangeDictation;
