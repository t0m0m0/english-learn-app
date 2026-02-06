import { useState, useCallback, useRef, useEffect } from "react";
import { Button, Card } from "./ui";
import type { SoundChangeExerciseItem } from "../types";

interface SoundChangeFillBlankProps {
  item: SoundChangeExerciseItem;
  onPlay: () => void;
  isPlaying: boolean;
  onResult: (isCorrect: boolean, accuracy: number) => void;
  onNext: () => void;
  isLast: boolean;
}

type State = "input" | "checked";

export function SoundChangeFillBlank({
  item,
  onPlay,
  isPlaying,
  onResult,
  onNext,
  isLast,
}: SoundChangeFillBlankProps) {
  const [state, setState] = useState<State>("input");
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and item change
  useEffect(() => {
    inputRef.current?.focus();
  }, [item.id]);

  // Reset state when item changes
  useEffect(() => {
    setState("input");
    setUserAnswer("");
    setIsCorrect(false);
  }, [item.id]);

  const handleCheck = useCallback(() => {
    if (!userAnswer.trim() || state === "checked") return;

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const normalizedBlank = (item.blank || "").trim().toLowerCase();
    const correct = normalizedAnswer === normalizedBlank;

    setIsCorrect(correct);
    setState("checked");
    onResult(correct, correct ? 100 : 0);
  }, [userAnswer, state, item.blank, onResult]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === "Enter" && state === "input") {
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

  // Build sentence display with blank
  const words = item.sentence.split(" ");
  const blankIndex = item.blankIndex ?? 0;
  const blankWords = (item.blank || "").split(" ");
  const blankLength = blankWords.length;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
          Fill in the blank
        </p>

        {/* Play button */}
        <Button variant="primary" onClick={onPlay} disabled={isPlaying}>
          {isPlaying ? "Playing..." : "Play (P)"}
        </Button>
      </div>

      {/* Sentence with blank */}
      <div className="mb-6 p-4 bg-surface-elevated rounded-lg">
        <div className="text-lg leading-relaxed flex flex-wrap items-center gap-1">
          {words.map((word, idx) => {
            if (idx >= blankIndex && idx < blankIndex + blankLength) {
              // First blank word shows input
              if (idx === blankIndex) {
                return state === "checked" ? (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded font-medium ${
                      isCorrect
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {isCorrect ? userAnswer : item.blank}
                  </span>
                ) : (
                  <input
                    key={idx}
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="..."
                    className="px-2 py-1 border-b-2 border-primary bg-transparent text-text-primary font-medium focus:outline-none min-w-[100px] max-w-[200px]"
                  />
                );
              }
              // Other blank words are hidden
              return null;
            }
            return (
              <span key={idx} className="text-text-primary">
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Check button */}
      {state === "input" && (
        <Button
          variant="primary"
          onClick={handleCheck}
          disabled={!userAnswer.trim()}
          className="w-full"
        >
          Check Answer (Enter)
        </Button>
      )}

      {/* Result */}
      {state === "checked" && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              isCorrect
                ? "bg-success/10 border-success/20"
                : "bg-error/10 border-error/20"
            }`}
          >
            <p
              className={`font-semibold mb-1 ${isCorrect ? "text-success" : "text-error"}`}
            >
              {isCorrect ? "Correct!" : "Incorrect"}
            </p>
            {!isCorrect && (
              <p className="text-text-secondary text-sm">
                Correct answer:{" "}
                <span className="font-medium text-text-primary">
                  {item.blank}
                </span>
              </p>
            )}
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

          <Button variant="primary" onClick={handleNext} className="w-full">
            {isLast ? "Finish" : "Next (N)"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default SoundChangeFillBlank;
