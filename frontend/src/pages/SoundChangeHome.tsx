import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { soundChangeApi } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import type { SoundChangeCategory } from "../types";

export function SoundChangeHome() {
  const [categories, setCategories] = useState<SoundChangeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { categories: data } = await soundChangeApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading categories...
          </div>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-error mb-4">{error}</h2>
          <Button variant="primary" onClick={fetchCategories}>
            Try Again
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Sound Changes
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Master natural English pronunciation by practicing 8 types of sound
          changes. Learn how words connect, change, and transform in real
          speech.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => {
          const exerciseCount = (category as unknown as { exercises?: { id: string }[] }).exercises?.length ?? 0;
          return (
            <Link
              key={category.id}
              to={`/sound-changes/${category.slug}`}
              className="block group"
            >
              <Card className="border-t-4 border-t-indigo-500 h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-indigo-500 font-medium mb-3">
                  {category.nameJa}
                </p>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed line-clamp-3">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-primary font-medium text-sm group-hover:underline">
                    Practice →
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link to="/">
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    </Container>
  );
}

export default SoundChangeHome;
