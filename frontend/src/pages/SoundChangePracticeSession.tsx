import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { soundChangeApi } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import {
  SoundChangePracticePlayer,
  type PracticeSummary,
} from "../components/SoundChangePracticePlayer";
import type { SoundChangeExercise, SoundChangeExerciseItem } from "../types";

type SessionState = "loading" | "ready" | "practicing" | "completed" | "error";

export function SoundChangePracticeSession() {
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const [exercise, setExercise] = useState<
    (SoundChangeExercise & { items: SoundChangeExerciseItem[] }) | null
  >(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);

  const fetchExercise = useCallback(async () => {
    if (!exerciseId) return;

    setSessionState("loading");
    setError(null);

    try {
      const { exercise: data } =
        await soundChangeApi.getExerciseById(exerciseId);
      setExercise(data);
      setSessionState("ready");
    } catch (err) {
      console.error("Error fetching exercise:", err);

      let errorMessage = "Failed to load exercise";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = "This exercise could not be found.";
        } else if (err.response?.status && err.response.status >= 500) {
          errorMessage = "Server error. Please try again.";
        } else if (err.code === "ERR_NETWORK" || !err.response) {
          errorMessage = "Network error. Please check your connection.";
        }
      }

      setError(errorMessage);
      setSessionState("error");
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);

  const handleStart = useCallback(() => {
    setSessionState("practicing");
  }, []);

  const handleComplete = useCallback((practiceSummary: PracticeSummary) => {
    setSummary(practiceSummary);
    setSessionState("completed");
  }, []);

  const handlePracticeAgain = useCallback(() => {
    setSummary(null);
    setSessionState("ready");
  }, []);

  if (sessionState === "loading") {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading exercise...
          </div>
        </Card>
      </Container>
    );
  }

  if (sessionState === "error" || !exercise) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">
            {error || "Exercise not found"}
          </h2>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={fetchExercise}>
              Try Again
            </Button>
            <Link to="/sound-changes">
              <Button variant="secondary">Back to Categories</Button>
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  if (exercise.items.length === 0) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            No items in this exercise
          </h2>
          <Link to="/sound-changes">
            <Button variant="secondary">Back to Categories</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  if (sessionState === "ready") {
    const categoryName = exercise.category?.name || "Sound Change";
    const categoryNameJa = exercise.category?.nameJa || "";
    const categorySlug = exercise.category?.slug || "";

    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {exercise.title}
          </h1>
          <p className="text-indigo-500 font-medium mb-6">
            {categoryName} ({categoryNameJa})
          </p>

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-text-secondary">Items:</span>
                <span className="text-text-primary font-medium">
                  {exercise.items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Difficulty:</span>
                <span className="text-text-primary font-medium capitalize">
                  {exercise.difficulty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Types:</span>
                <span className="text-text-primary font-medium">
                  Fill-blank & Dictation
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
              onClick={handleStart}
            >
              Start Practice
            </Button>

            <div>
              <Link to={categorySlug ? `/sound-changes/${categorySlug}` : "/sound-changes"}>
                <Button variant="secondary" size="sm">
                  Back to Exercises
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 text-text-muted text-sm">
            <p>Tips:</p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2 space-y-1">
              <li>Listen carefully to the audio</li>
              <li>Pay attention to how words connect and change</li>
              <li>For fill-blank: type the missing word(s)</li>
              <li>For dictation: type the entire sentence</li>
              <li>Use keyboard shortcuts for faster navigation</li>
            </ul>
          </div>
        </Card>
      </Container>
    );
  }

  if (sessionState === "completed" && summary) {
    const categorySlug = exercise.category?.slug || "";

    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Practice Complete!
          </h1>
          <p className="text-text-secondary mb-8">{exercise.title}</p>

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
                    summary.averageAccuracy >= 90
                      ? "text-success"
                      : summary.averageAccuracy >= 70
                        ? "text-warning"
                        : "text-error"
                  }`}
                >
                  {summary.averageAccuracy}%
                </span>
              </div>
            </div>
          </div>

          <p className="text-text-secondary mb-8">
            {summary.averageAccuracy >= 90
              ? "Excellent! You have a great ear for sound changes!"
              : summary.averageAccuracy >= 70
                ? "Good job! Keep practicing to sharpen your listening."
                : "Keep going! Practice makes perfect."}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" onClick={handlePracticeAgain}>
              Practice Again
            </Button>
            <Link to={categorySlug ? `/sound-changes/${categorySlug}` : "/sound-changes"}>
              <Button variant="secondary">Back to Exercises</Button>
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  // Practicing state
  const categorySlug = exercise.category?.slug || "";

  return (
    <Container size="lg" className="py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {exercise.title}
            </h1>
            <p className="text-text-secondary text-sm">
              {exercise.category?.name} ({exercise.category?.nameJa})
            </p>
          </div>
          <Link to={categorySlug ? `/sound-changes/${categorySlug}` : "/sound-changes"}>
            <Button variant="secondary" size="sm">
              Exit Practice
            </Button>
          </Link>
        </div>
      </header>

      <SoundChangePracticePlayer
        items={exercise.items}
        onComplete={handleComplete}
      />
    </Container>
  );
}

export default SoundChangePracticeSession;
