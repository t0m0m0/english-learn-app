import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { lessonsApi, DEFAULT_USER_ID } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import {
  CallanDictation,
  type DictationSummary,
} from "../components/CallanDictation";
import type { Lesson } from "../types";

type PracticeState = "loading" | "ready" | "practicing" | "completed" | "error";

export function CallanDictationPage() {
  const { lessonId } = useParams<{ lessonId: string }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DictationSummary | null>(null);

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

      let errorMessage = "Failed to load lesson";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = "This lesson could not be found. It may have been deleted.";
        } else if (err.response?.status === 403) {
          errorMessage = "You don't have permission to access this lesson.";
        } else if (err.response?.status && err.response.status >= 500) {
          errorMessage = "Server error. Please try again in a few moments.";
        } else if (err.code === "ERR_NETWORK" || !err.response) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }

      setError(errorMessage);
      setPracticeState("error");
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleStartPractice = useCallback(() => {
    setPracticeState("practicing");
  }, []);

  const handleComplete = useCallback((practiceSummary: DictationSummary) => {
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
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={fetchLesson}>
              Try Again
            </Button>
            <Link to="/callan/lessons">
              <Button variant="secondary">Back to Lessons</Button>
            </Link>
          </div>
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
              Dictation Practice
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
                <span className="text-text-primary font-medium">Dictation</span>
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
              Start Dictation
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
              <li>Listen to the audio carefully</li>
              <li>Type exactly what you hear</li>
              <li>Use the hint button if you're stuck</li>
              <li>Adjust speed if needed (0.5x - 1.5x)</li>
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
            Dictation Complete!
          </h1>
          <p className="text-text-secondary mb-8">{lesson.title}</p>

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Your Results
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Items:</span>
                <span className="text-text-primary font-medium">
                  {summary.totalItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Perfect Answers:</span>
                <span className="text-success font-medium">
                  {summary.correctCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Average Accuracy:</span>
                <span
                  className={`font-medium ${
                    summary.totalAccuracy >= 90
                      ? "text-success"
                      : summary.totalAccuracy >= 70
                        ? "text-warning"
                        : "text-error"
                  }`}
                >
                  {summary.totalAccuracy}%
                </span>
              </div>
            </div>
          </div>

          {/* Encouragement message */}
          <p className="text-text-secondary mb-8">
            {summary.totalAccuracy >= 90
              ? "🎉 Excellent! Your listening skills are impressive!"
              : summary.totalAccuracy >= 70
                ? "👍 Good job! Keep practicing to improve your accuracy."
                : "💪 Keep going! Practice makes perfect."}
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
            <p className="text-text-secondary text-sm">Dictation Mode</p>
          </div>
          <Link to="/callan/lessons">
            <Button variant="secondary" size="sm">
              Exit Practice
            </Button>
          </Link>
        </div>
      </header>

      <CallanDictation
        qaItems={lesson.qaItems}
        userId={DEFAULT_USER_ID}
        onComplete={handleComplete}
      />
    </Container>
  );
}

export default CallanDictationPage;
