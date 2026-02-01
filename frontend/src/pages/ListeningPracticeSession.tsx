import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { listeningApi, DEFAULT_USER_ID } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import {
  ListeningPlayer,
  type PracticeSummary,
} from "../components/ListeningPlayer";
import { useAudio } from "../hooks/useAudio";
import type { ListeningPassage } from "../types";

type SessionState = "loading" | "ready" | "practicing" | "completed" | "error";
type Difficulty = "beginner" | "intermediate" | "advanced";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "text-success";
  if (accuracy >= 60) return "text-warning";
  return "text-error";
}

function getAccuracyMessage(accuracy: number): string {
  if (accuracy >= 80) return "Excellent work! Your listening skills are strong!";
  if (accuracy >= 60) return "Good effort! Keep practicing to improve.";
  return "Keep going! Regular practice makes a difference.";
}

export function ListeningPracticeSession() {
  const { passageId } = useParams<{ passageId: string }>();

  const [passage, setPassage] = useState<ListeningPassage | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [speechRate, setSpeechRate] = useState(1);
  const hasFetched = useRef(false);

  const { speak, stop, error: audioError, isReady: audioReady } = useAudio({ rate: speechRate });

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!passageId || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    async function load() {
      try {
        const { passage: fetched } = await listeningApi.getPassageById(passageId!);
        if (!cancelled) {
          setPassage(fetched);
          setSessionState("ready");
        }
      } catch (err) {
        console.error("Failed to load passage:", err);
        if (!cancelled) {
          setError("Failed to load passage");
          setSessionState("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  const handleStart = useCallback(() => {
    setSessionState("practicing");
    if (passage) {
      speak(passage.text);
    }
  }, [passage, speak]);

  const handleComplete = useCallback((practiceSummary: PracticeSummary) => {
    stop();
    setSummary(practiceSummary);
    setSessionState("completed");
  }, [stop]);

  const handleRecordProgress = useCallback(
    async (questionId: string, isCorrect: boolean) => {
      try {
        await listeningApi.recordProgress({
          userId: DEFAULT_USER_ID,
          questionId,
          isCorrect,
        });
      } catch (err) {
        console.error("Failed to record progress:", err);
      }
    },
    [],
  );

  const handlePracticeAgain = useCallback(() => {
    setSummary(null);
    setSessionState("ready");
  }, []);

  if (sessionState === "loading") {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading passage...
          </div>
        </Card>
      </Container>
    );
  }

  if (sessionState === "error" || !passage) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">
            {error || "Passage not found"}
          </h2>
          <Link to="/listening-practice">
            <Button variant="secondary">Back to Passages</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  if (sessionState === "ready") {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {passage.title}
          </h1>
          <p className="text-text-muted mb-6">
            {DIFFICULTY_LABELS[passage.difficulty] || passage.difficulty} ·{" "}
            {passage.questions.length} questions
            {passage.topic && ` · ${passage.topic}`}
          </p>

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              How it works
            </h2>
            <ol className="text-left text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Listen to the passage</li>
              <li>Answer comprehension questions</li>
              <li>Check your results</li>
            </ol>
          </div>

          {/* Speed Control */}
          <div className="mb-8">
            <label className="text-sm text-text-secondary block mb-2">
              Playback Speed
            </label>
            <div className="flex justify-center gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                <Button
                  key={rate}
                  variant={speechRate === rate ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSpeechRate(rate)}
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>

          {audioError && (
            <div className="bg-error/10 text-error text-sm rounded-lg p-3 mb-4 max-w-md mx-auto">
              {audioError}
            </div>
          )}

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full max-w-xs"
              onClick={handleStart}
              disabled={!audioReady}
            >
              {audioReady ? "Start Listening" : "Loading Audio..."}
            </Button>

            <div>
              <Link to="/listening-practice">
                <Button variant="secondary" size="sm">
                  Back to Passages
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    );
  }

  if (sessionState === "completed" && summary) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Practice Complete!
          </h1>
          <p className="text-text-secondary mb-8">{passage.title}</p>

          <div className="bg-surface-elevated rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Your Results
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Accuracy:</span>
                <span
                  className={`text-2xl font-bold ${getAccuracyColor(summary.accuracy)}`}
                >
                  {summary.accuracy}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Questions:</span>
                <span className="text-text-primary font-medium">
                  {summary.totalQuestions}
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
                  {summary.totalQuestions - summary.correctCount}
                </span>
              </div>
            </div>
          </div>

          <p className="text-text-secondary mb-8">
            {getAccuracyMessage(summary.accuracy)}
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" onClick={handlePracticeAgain}>
              Practice Again
            </Button>
            <Link to="/listening-practice">
              <Button variant="secondary">Back to Passages</Button>
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
              {passage.title}
            </h1>
            <p className="text-text-secondary text-sm">
              {DIFFICULTY_LABELS[passage.difficulty]} · Listening Practice
            </p>
          </div>
          <Link to="/listening-practice">
            <Button variant="secondary" size="sm">
              Exit Practice
            </Button>
          </Link>
        </div>
      </header>

      <ListeningPlayer
        questions={passage.questions}
        passageText={passage.text}
        speechRate={speechRate}
        onComplete={handleComplete}
        onRecordProgress={handleRecordProgress}
      />
    </Container>
  );
}

export default ListeningPracticeSession;
