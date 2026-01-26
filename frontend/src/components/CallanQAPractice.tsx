import { useState, useEffect, useCallback } from "react";
import { useAudio } from "../hooks/useAudio";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { checkAnswer } from "../utils/answerChecker";
import { callanProgressApi } from "../services/api";
import { Button, Card } from "./ui";
import type { QAItem } from "../types";

interface CallanQAPracticeProps {
  qaItems: QAItem[];
  userId: number;
  onComplete: (summary: PracticeSummary) => void;
}

export interface PracticeSummary {
  totalItems: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracy: number;
}

type InputMode = "voice" | "text";
type AnswerState =
  | "waiting"
  | "listening"
  | "checking"
  | "correct"
  | "incorrect";

export function CallanQAPractice({
  qaItems,
  userId,
  onComplete,
}: CallanQAPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [answerState, setAnswerState] = useState<AnswerState>("waiting");
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [similarity, setSimilarity] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isReady: audioReady,
  } = useAudio();
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({ continuous: false });

  const currentItem = qaItems[currentIndex];
  const isLastItem = currentIndex === qaItems.length - 1;
  const progress = ((currentIndex + 1) / qaItems.length) * 100;

  // Speak the question when item changes
  useEffect(() => {
    if (currentItem && audioReady && answerState === "waiting") {
      speak(currentItem.question);
    }
  }, [currentItem, audioReady, speak, answerState]);

  // Handle voice recognition result
  useEffect(() => {
    if (transcript && answerState === "listening") {
      handleAnswerCheck(transcript);
    }
  }, [transcript]);

  const handleAnswerCheck = useCallback(
    async (answer: string) => {
      if (!currentItem) return;

      setAnswerState("checking");
      const result = checkAnswer(answer, currentItem.answer);

      setSimilarity(result.similarity);
      setFeedback(result.feedback);
      setAnswerState(result.isCorrect ? "correct" : "incorrect");

      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
        // Speak the correct answer for incorrect responses
        setTimeout(() => {
          speak(currentItem.answer);
        }, 500);
      }

      // Record progress
      try {
        await callanProgressApi.recordProgress({
          userId,
          qaItemId: currentItem.id,
          mode: "qa",
          isCorrect: result.isCorrect,
        });
      } catch (err) {
        console.error("Failed to record progress:", err);
      }
    },
    [currentItem, userId, speak],
  );

  const handleStartListening = useCallback(() => {
    stopSpeaking();
    resetTranscript();
    setAnswerState("listening");
    startListening();
  }, [stopSpeaking, resetTranscript, startListening]);

  const handleStopListening = useCallback(() => {
    stopListening();
    if (transcript) {
      handleAnswerCheck(transcript);
    } else {
      setAnswerState("waiting");
    }
  }, [stopListening, transcript, handleAnswerCheck]);

  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (textAnswer.trim()) {
        handleAnswerCheck(textAnswer.trim());
      }
    },
    [textAnswer, handleAnswerCheck],
  );

  const handleNext = useCallback(() => {
    if (isLastItem) {
      const summary: PracticeSummary = {
        totalItems: qaItems.length,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracy: (correctCount / qaItems.length) * 100,
      };
      onComplete(summary);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswerState("waiting");
      setTextAnswer("");
      resetTranscript();
      setFeedback("");
      setSimilarity(0);
    }
  }, [
    isLastItem,
    qaItems.length,
    correctCount,
    incorrectCount,
    skippedCount,
    onComplete,
    resetTranscript,
  ]);

  const handleRetry = useCallback(() => {
    setAnswerState("waiting");
    setTextAnswer("");
    resetTranscript();
    setFeedback("");
    setSimilarity(0);
    speak(currentItem.question);
  }, [resetTranscript, speak, currentItem]);

  const handleSkip = useCallback(() => {
    setSkippedCount((prev) => prev + 1);
    handleNext();
  }, [handleNext]);

  const handleRepeatQuestion = useCallback(() => {
    speak(currentItem.question);
  }, [speak, currentItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (answerState === "correct" || answerState === "incorrect") {
            handleNext();
          } else if (inputMode === "voice" && !isListening) {
            handleStartListening();
          }
          break;
        case "r":
        case "R":
          if (answerState === "incorrect") {
            handleRetry();
          } else if (answerState === "waiting") {
            handleRepeatQuestion();
          }
          break;
        case "s":
        case "S":
          if (answerState === "waiting" || answerState === "listening") {
            handleSkip();
          }
          break;
        case "Escape":
          if (isListening) {
            stopListening();
            setAnswerState("waiting");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    answerState,
    inputMode,
    isListening,
    handleNext,
    handleRetry,
    handleRepeatQuestion,
    handleSkip,
    handleStartListening,
    stopListening,
  ]);

  if (!currentItem) {
    return null;
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

      {/* Question card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Question
            </p>
            <p className="text-xl font-medium text-text-primary">
              {currentItem.question}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRepeatQuestion}
            disabled={isSpeaking}
          >
            {isSpeaking ? "🔊 Speaking..." : "🔊 Repeat"}
          </Button>
        </div>

        {/* Input mode toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={inputMode === "voice" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInputMode("voice")}
            disabled={!speechSupported}
          >
            🎤 Voice
          </Button>
          <Button
            variant={inputMode === "text" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInputMode("text")}
          >
            ⌨️ Text
          </Button>
        </div>

        {/* Answer input area */}
        {inputMode === "voice" ? (
          <div className="space-y-4">
            {!speechSupported && (
              <p className="text-warning text-sm">
                Speech recognition is not supported in this browser. Please use
                text input.
              </p>
            )}

            {speechError && <p className="text-error text-sm">{speechError}</p>}

            {/* Voice input display */}
            <div className="bg-surface-elevated rounded-lg p-4 min-h-[80px]">
              {isListening ? (
                <div className="flex items-center gap-2">
                  <span className="animate-pulse text-primary">●</span>
                  <span className="text-text-secondary">
                    {interimTranscript || "Listening..."}
                  </span>
                </div>
              ) : transcript ? (
                <p className="text-text-primary">{transcript}</p>
              ) : (
                <p className="text-text-muted">
                  Press the microphone button or Space to start speaking
                </p>
              )}
            </div>

            {/* Voice control button */}
            {answerState === "waiting" || answerState === "listening" ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={
                  isListening ? handleStopListening : handleStartListening
                }
                disabled={!speechSupported || isSpeaking}
              >
                {isListening ? "⏹️ Stop Recording" : "🎤 Start Recording"}
              </Button>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={answerState !== "waiting"}
              autoFocus
            />
            {answerState === "waiting" && (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!textAnswer.trim()}
              >
                Submit Answer
              </Button>
            )}
          </form>
        )}
      </Card>

      {/* Feedback card */}
      {(answerState === "correct" || answerState === "incorrect") && (
        <Card
          className={`p-6 ${
            answerState === "correct"
              ? "border-success bg-success/10"
              : "border-error bg-error/10"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">
              {answerState === "correct" ? "✅" : "❌"}
            </span>
            <span
              className={`text-lg font-semibold ${
                answerState === "correct" ? "text-success" : "text-error"
              }`}
            >
              {answerState === "correct" ? "Correct!" : "Not quite..."}
            </span>
            <span className="text-text-muted text-sm ml-auto">
              {Math.round(similarity * 100)}% match
            </span>
          </div>

          <p className="text-text-secondary mb-4">{feedback}</p>

          {answerState === "incorrect" && (
            <div className="bg-surface rounded-lg p-4 mb-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Correct Answer
              </p>
              <p className="text-text-primary font-medium">
                {currentItem.answer}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {answerState === "incorrect" && (
              <Button variant="secondary" onClick={handleRetry}>
                Retry (R)
              </Button>
            )}
            <Button variant="primary" onClick={handleNext}>
              {isLastItem ? "Finish" : "Next"} (Space)
            </Button>
          </div>
        </Card>
      )}

      {/* Skip button */}
      {(answerState === "waiting" || answerState === "listening") && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={handleSkip}>
            Skip (S)
          </Button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-text-muted text-xs">
        <span>Shortcuts: </span>
        <span className="mx-1">Space = Record/Next</span>
        <span className="mx-1">R = Retry/Repeat</span>
        <span className="mx-1">S = Skip</span>
      </div>
    </div>
  );
}

export default CallanQAPractice;
