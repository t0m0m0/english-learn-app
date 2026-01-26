import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { lessonsApi, DEFAULT_USER_ID } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import {
  CallanQAPractice,
  type PracticeSummary,
} from "../components/CallanQAPractice";
import type { Lesson } from "../types";

type PracticeState = "loading" | "ready" | "practicing" | "completed" | "error";

export function CallanPractice() {
  const { lessonId } = useParams<{ lessonId: string }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!lessonId) return;

    setPracticeState("loading");
    setError(null);

    try {
      const { lesson: fetchedLesson } = await lessonsApi.getById(lessonId);
      setLesson(fetchedLesson);
      setPracticeState("ready");
    } catch (err) {
      console.error("Error fetching lesson:", err);
      setError("Failed to load lesson");
      setPracticeState("error");
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleStartPractice = useCallback(() => {
    setPracticeState("practicing");
  }, []);

  const handleComplete = useCallback((practiceSummary: PracticeSummary) => {
    setSummary(practiceSummary);
    setPracticeState("completed");
  }, []);

  const handlePracticeAgain = useCallback(() => {
    setSummary(null);
    setPracticeState("ready");
  }, []);

  if (practiceState === "loading") {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">Loading lesson...</div>
        </Card>
      </Container>
    );
  }

  if (practiceState === "error" || !lesson) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">
            {error || "Lesson not found"}
          </h2>
          <Link to="/callan/lessons">
            <Button variant="secondary">Back to Lessons</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  if (lesson.qaItems.length === 0) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            No Q&A items in this lesson
          </h2>
          <p className="text-text-secondary mb-6">
            Add some Q&A items to start practicing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to={`/callan/lessons/${lesson.id}/edit`}>
              <Button variant="primary">Edit Lesson</Button>
            </Link>
            <Link to="/callan/lessons">
              <Button variant="secondary">Back to Lessons</Button>
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  if (practiceState === "ready") {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-text-secondary mb-6">{lesson.description}</p>
          )}

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Practice Info
            </h2>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">Q&A Items:</span>
                <span className="text-text-primary font-medium">
                  {lesson.qaItems.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Mode:</span>
                <span className="text-text-primary font-medium">
                  Q&A Practice
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
              onClick={handleStartPractice}
            >
              Start Practice
            </Button>

            <div>
              <Link to="/callan/lessons">
                <Button variant="secondary" size="sm">
                  Back to Lessons
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 text-text-muted text-sm">
            <p>Tips:</p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2 space-y-1">
              <li>Listen to the question carefully</li>
              <li>Speak your answer clearly</li>
              <li>You can also type if voice input doesn't work</li>
              <li>Use keyboard shortcuts for faster navigation</li>
            </ul>
          </div>
        </Card>
      </Container>
    );
  }

  if (practiceState === "completed" && summary) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Practice Complete!
          </h1>
          <p className="text-text-secondary mb-8">{lesson.title}</p>

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Your Results
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Accuracy:</span>
                <span
                  className={`text-2xl font-bold ${
                    summary.accuracy >= 80
                      ? "text-success"
                      : summary.accuracy >= 60
                        ? "text-warning"
                        : "text-error"
                  }`}
                >
                  {Math.round(summary.accuracy)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Items:</span>
                <span className="text-text-primary font-medium">
                  {summary.totalItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Correct:</span>
                <span className="text-success font-medium">
                  {summary.correctCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Incorrect:</span>
                <span className="text-error font-medium">
                  {summary.incorrectCount}
                </span>
              </div>
              {summary.skippedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Skipped:</span>
                  <span className="text-warning font-medium">
                    {summary.skippedCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Encouragement message */}
          <p className="text-text-secondary mb-8">
            {summary.accuracy >= 80
              ? "🎉 Excellent work! Keep it up!"
              : summary.accuracy >= 60
                ? "👍 Good effort! Practice makes perfect."
                : "💪 Keep practicing! You'll get better each time."}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" onClick={handlePracticeAgain}>
              Practice Again
            </Button>
            <Link to="/callan/lessons">
              <Button variant="secondary">Back to Lessons</Button>
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  // Practicing state
  return (
    <Container size="lg" className="py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {lesson.title}
            </h1>
            <p className="text-text-secondary text-sm">Q&A Practice Mode</p>
          </div>
          <Link to="/callan/lessons">
            <Button variant="secondary" size="sm">
              Exit Practice
            </Button>
          </Link>
        </div>
      </header>

      <CallanQAPractice
        qaItems={lesson.qaItems}
        userId={DEFAULT_USER_ID}
        onComplete={handleComplete}
      />
    </Container>
  );
}

export default CallanPractice;
