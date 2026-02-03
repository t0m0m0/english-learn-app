import { useState, useCallback } from "react";
import { Card, Button } from "./ui";
import { useAudio } from "../hooks/useAudio";
import type { ListeningQuestion } from "../types";

export interface PracticeSummary {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
}

interface ListeningPlayerProps {
  questions: ListeningQuestion[];
  passageText: string;
  onComplete: (summary: PracticeSummary) => void;
  onRecordProgress: (questionId: string, isCorrect: boolean) => Promise<void>;
  speechRate?: number;
}

type AnswerState = "waiting" | "correct" | "incorrect";

export function ListeningPlayer({
  questions,
  passageText,
  onComplete,
  onRecordProgress,
  speechRate = 1,
}: ListeningPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("waiting");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const { speak, stop, isSpeaking, error: audioError, isReady: audioReady } = useAudio({ rate: speechRate });

  if (questions.length === 0) {
    return (
      <Card>
        <p className="text-error">No questions available for this passage.</p>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const getOptions = (question: ListeningQuestion): string[] => {
    if (question.type === "multiple_choice" && question.options) {
      try {
        return JSON.parse(question.options);
      } catch (e) {
        console.error(`Failed to parse options for question ${question.id}:`, e);
        return [];
      }
    }
    if (question.type === "true_false") {
      return ["True", "False"];
    }
    return [];
  };

  const checkAnswer = useCallback(
    async (answer: string) => {
      if (answerState !== "waiting") return;

      const normalizedAnswer = answer.trim().toLowerCase();
      const correctAnswer = currentQuestion.answer.trim().toLowerCase();

      const isCorrect = normalizedAnswer === correctAnswer;

      setSelectedAnswer(answer);
      setAnswerState(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }

      await onRecordProgress(currentQuestion.id, isCorrect);
    },
    [answerState, currentQuestion, onRecordProgress],
  );

  const handleOptionClick = (option: string) => {
    checkAnswer(option).catch((err) => {
      console.error("Error checking answer:", err);
    });
  };

  const handleFillBlankSubmit = () => {
    if (!fillBlankInput.trim()) return;
    checkAnswer(fillBlankInput).catch((err) => {
      console.error("Error checking answer:", err);
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete({
        totalQuestions: questions.length,
        correctCount,
        accuracy: Math.round((correctCount / questions.length) * 100),
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswerState("waiting");
      setSelectedAnswer(null);
      setFillBlankInput("");
    }
  };

  const handlePlayPassage = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(passageText);
    }
  };

  return (
    <div className="space-y-6">
      {/* Audio Controls */}
      <Card>
        {audioError && (
          <div className="bg-error/10 text-error text-sm rounded-lg p-3 mb-4">
            {audioError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={isSpeaking ? "error" : "primary"}
              onClick={handlePlayPassage}
              disabled={!audioReady && !isSpeaking}
            >
              {isSpeaking ? "Stop" : audioReady ? "Play Passage" : "Loading..."}
            </Button>
            <span className="text-sm text-text-muted">
              {isSpeaking ? "Playing..." : "Click to listen"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            {showTranscript ? "Hide Transcript" : "Show Transcript"}
          </Button>
        </div>
        {showTranscript && (
          <div className="mt-4 p-4 bg-surface-elevated rounded-lg">
            <p className="text-text-secondary leading-relaxed">{passageText}</p>
          </div>
        )}
      </Card>

      {/* Question */}
      <Card>
        <div className="mb-4">
          <span className="text-sm text-text-muted">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-6">
          {currentQuestion.question}
        </h3>

        {/* Multiple Choice / True-False Options */}
        {(currentQuestion.type === "multiple_choice" ||
          currentQuestion.type === "true_false") && (
          <div className="space-y-3">
            {getOptions(currentQuestion).map((option) => {
              let optionStyle = "border-border hover:border-primary";

              if (answerState !== "waiting") {
                const normalizedOption = option.toLowerCase();
                const normalizedAnswer =
                  currentQuestion.answer.trim().toLowerCase();
                const isCorrectOption =
                  normalizedOption === normalizedAnswer;
                const isSelected =
                  selectedAnswer?.toLowerCase() === normalizedOption;

                if (isCorrectOption) {
                  optionStyle = "border-success bg-success/10";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "border-error bg-error/10";
                } else {
                  optionStyle = "border-border opacity-50";
                }
              }

              return (
                <button
                  key={option}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${optionStyle}`}
                  onClick={() => handleOptionClick(option)}
                  disabled={answerState !== "waiting"}
                >
                  <span className="text-text-primary">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Fill in the Blank */}
        {currentQuestion.type === "fill_blank" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={fillBlankInput}
                onChange={(e) => setFillBlankInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFillBlankSubmit();
                }}
                placeholder="Type your answer..."
                disabled={answerState !== "waiting"}
                className="flex-1 px-4 py-3 border-2 border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:outline-none disabled:opacity-50"
              />
              {answerState === "waiting" && (
                <Button variant="primary" onClick={handleFillBlankSubmit}>
                  Submit
                </Button>
              )}
            </div>
            {answerState !== "waiting" && (
              <p className="text-sm text-text-muted">
                Correct answer:{" "}
                <span className="font-semibold text-success">
                  {currentQuestion.answer}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Feedback */}
        {answerState !== "waiting" && (
          <div className="mt-6 flex items-center justify-between">
            <span
              className={`text-lg font-semibold ${
                answerState === "correct" ? "text-success" : "text-error"
              }`}
            >
              {answerState === "correct" ? "Correct!" : "Incorrect"}
            </span>
            <Button variant="primary" onClick={handleNext}>
              {isLastQuestion ? "Finish" : "Next"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ListeningPlayer;
