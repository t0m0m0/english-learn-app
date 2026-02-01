import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { listeningApi } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import type { ListeningPassage } from "../types";

type Difficulty = "beginner" | "intermediate" | "advanced";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-error/10 text-error",
};

export function ListeningPractice() {
  const [passages, setPassages] = useState<ListeningPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null,
  );

  const fetchPassages = useCallback(
    async (difficulty?: string) => {
      setLoading(true);
      setError(null);
      try {
        const { passages: data } = await listeningApi.getPassages(
          difficulty || undefined,
        );
        setPassages(data);
      } catch (err) {
        console.error("Failed to load passages:", err);
        setError("Failed to load passages");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPassages(selectedDifficulty || undefined);
  }, [fetchPassages, selectedDifficulty]);

  const handleFilterChange = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty);
  };

  return (
    <Container size="lg" className="py-10">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Listening Practice
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Listen to English passages and answer comprehension questions to
          improve your listening skills.
        </p>
      </header>

      {/* Difficulty Filter */}
      <div className="flex justify-center gap-3 mb-8">
        {([
          { label: "All", value: null },
          { label: "Beginner", value: "beginner" },
          { label: "Intermediate", value: "intermediate" },
          { label: "Advanced", value: "advanced" },
        ] as const).map(({ label, value }) => (
          <Button
            key={label}
            variant={selectedDifficulty === value ? "primary" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading passages...
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">{error}</h2>
          <Button variant="secondary" onClick={() => fetchPassages(selectedDifficulty || undefined)}>
            Retry
          </Button>
        </Card>
      )}

      {/* Passages List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passages.map((passage) => (
            <Link
              key={passage.id}
              to={`/listening-practice/${passage.id}`}
              className="block group"
            >
              <Card className="h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${DIFFICULTY_COLORS[passage.difficulty]}`}
                  >
                    {passage.difficulty}
                  </span>
                  {passage.topic && (
                    <span className="text-xs text-text-muted">
                      {passage.topic}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                  {passage.title}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                  {passage.text}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {passage.questions.length} questions
                  </span>
                  <span className="text-primary text-sm font-medium group-hover:underline">
                    Start →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && passages.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-text-secondary">
            No passages found for the selected difficulty.
          </p>
        </Card>
      )}
    </Container>
  );
}

export default ListeningPractice;
