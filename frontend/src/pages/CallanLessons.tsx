import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { lessonsApi } from '../services/api';
import { useUser } from '../context/UserContext';
import { Container, Card, Button } from '../components/ui';
import type { Lesson } from '../types';

export function CallanLessons() {
  const { user } = useUser();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { lessons: fetchedLessons } = await lessonsApi.getAll(user.id);
      setLessons(fetchedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    setDeletingId(id);
    try {
      await lessonsApi.delete(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert('Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Please log in to manage lessons
          </h2>
          <Link to="/login">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">Loading lessons...</div>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Callan Method Lessons
          </h1>
          <p className="text-text-secondary">
            Manage your Q&A practice lessons
          </p>
        </div>
        <Link to="/callan/lessons/new">
          <Button variant="primary">+ New Lesson</Button>
        </Link>
      </header>

      {error && (
        <Card className="bg-error/10 border-error mb-6">
          <p className="text-error">{error}</p>
        </Card>
      )}

      {lessons.length === 0 ? (
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            No lessons yet
          </h2>
          <p className="text-text-secondary mb-6">
            Create your first lesson to get started with Callan Method practice.
          </p>
          <Link to="/callan/lessons/new">
            <Button variant="primary">Create First Lesson</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary">
                  {lesson.title}
                </h3>
                {lesson.description && (
                  <p className="text-text-secondary text-sm mt-1">
                    {lesson.description}
                  </p>
                )}
                <p className="text-text-muted text-xs mt-2">
                  {lesson.qaItems.length} Q&A items
                </p>
              </div>
              <div className="flex gap-2">
                {lesson.qaItems.length > 0 && (
                  <Link to={`/callan/practice/${lesson.id}`}>
                    <Button variant="primary" size="sm">Practice</Button>
                  </Link>
                )}
                <Link to={`/callan/lessons/${lesson.id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(lesson.id)}
                  disabled={deletingId === lesson.id}
                  className="text-error hover:bg-error/10 disabled:opacity-50"
                >
                  {deletingId === lesson.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

export default CallanLessons;
