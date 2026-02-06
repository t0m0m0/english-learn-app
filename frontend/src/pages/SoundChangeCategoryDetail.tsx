import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { soundChangeApi } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import type { SoundChangeCategory, SoundChangeExercise } from "../types";

const difficultyColors: Record<string, string> = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-error/10 text-error",
};

export function SoundChangeCategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<
    (SoundChangeCategory & { exercises: (SoundChangeExercise & { items: { id: string }[] })[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const { category: data } = await soundChangeApi.getCategoryBySlug(slug);
      setCategory(data);
    } catch (err) {
      console.error("Error fetching category:", err);
      setError("Failed to load category. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  if (loading) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading category...
          </div>
        </Card>
      </Container>
    );
  }

  if (error || !category) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">
            {error || "Category not found"}
          </h2>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={fetchCategory}>
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

  return (
    <Container size="lg" className="py-10">
      <header className="mb-8">
        <Link
          to="/sound-changes"
          className="text-primary text-sm hover:underline mb-4 inline-block"
        >
          ← Back to Categories
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          {category.name}
        </h1>
        <p className="text-indigo-500 font-medium mb-3">{category.nameJa}</p>
        {category.description && (
          <p className="text-text-secondary max-w-2xl">{category.description}</p>
        )}
      </header>

      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Exercises
        </h2>

        {category.exercises.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-muted">
              No exercises available for this category yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.exercises.map((exercise) => (
              <Link
                key={exercise.id}
                to={`/sound-changes/practice/${exercise.id}`}
                className="block group"
              >
                <Card className="h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {exercise.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${difficultyColors[exercise.difficulty] || ""}`}
                    >
                      {exercise.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-4">
                    {exercise.items?.length ?? 0} item
                    {(exercise.items?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                  <span className="text-primary font-medium text-sm group-hover:underline">
                    Start Practice →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}

export default SoundChangeCategoryDetail;
