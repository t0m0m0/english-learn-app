import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lessonsApi, qaItemsApi } from "../services/api";
import { Container, Card, Button } from "../components/ui";
import type { QAItem } from "../types";

export function CallanLessonForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New QA item form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const fetchLesson = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { lesson } = await lessonsApi.getById(id);
      setTitle(lesson.title);
      setDescription(lesson.description || "");
      setOrder(lesson.order);
      setQaItems(lesson.qaItems);
    } catch (err) {
      console.error("Error fetching lesson:", err);
      alert("Failed to load lesson");
      navigate("/callan/lessons");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchLesson();
    }
  }, [isEditing, fetchLesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      if (isEditing && id) {
        await lessonsApi.update(id, { title, description, order });
      } else {
        const { lesson } = await lessonsApi.create({
          title,
          description,
          order,
        });
        navigate(`/callan/lessons/${lesson.id}/edit`);
        return;
      }
      alert("Lesson saved successfully");
    } catch (err) {
      console.error("Error saving lesson:", err);
      alert("Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQAItem = async () => {
    if (!id || !newQuestion.trim() || !newAnswer.trim()) return;

    try {
      const { qaItem } = await qaItemsApi.create(id, {
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        order: qaItems.length + 1,
      });
      setQaItems((prev) => [...prev, qaItem]);
      setNewQuestion("");
      setNewAnswer("");
    } catch (err) {
      console.error("Error adding QA item:", err);
      alert("Failed to add Q&A item");
    }
  };

  const handleDeleteQAItem = async (qaItemId: string) => {
    if (!confirm("Are you sure you want to delete this Q&A item?")) return;

    try {
      await qaItemsApi.delete(qaItemId);
      setQaItems((prev) => prev.filter((q) => q.id !== qaItemId));
    } catch (err) {
      console.error("Error deleting QA item:", err);
      alert("Failed to delete Q&A item");
    }
  };

  const handleMoveQAItem = async (index: number, direction: "up" | "down") => {
    if (!id) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= qaItems.length) return;

    const newQaItems = [...qaItems];
    const temp = newQaItems[index];
    newQaItems[index] = newQaItems[newIndex];
    newQaItems[newIndex] = temp;

    // Update orders
    const reorderedItems = newQaItems.map((item, i) => ({
      id: item.id,
      order: i + 1,
    }));

    try {
      await qaItemsApi.reorder(id, reorderedItems);
      setQaItems(newQaItems.map((item, i) => ({ ...item, order: i + 1 })));
    } catch (err) {
      console.error("Error reordering QA items:", err);
      alert("Failed to reorder Q&A items");
    }
  };

  if (loading) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">Loading...</div>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {isEditing ? "Edit Lesson" : "Create New Lesson"}
        </h1>
        <p className="text-text-secondary">
          {isEditing
            ? "Update lesson details and manage Q&A items"
            : "Create a new lesson for Callan Method practice"}
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Lesson Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Stage 1 - Lesson 1"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional description of the lesson"
              />
            </div>
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Order *
              </label>
              <input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                required
                min={1}
                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Lesson"
                  : "Create Lesson"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/callan/lessons")}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </form>

      {isEditing && (
        <Card>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Q&A Items ({qaItems.length})
          </h2>

          {/* Add new QA item form */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Add New Q&A Item
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="newQuestion"
                  className="block text-xs text-text-muted mb-1"
                >
                  Question
                </label>
                <input
                  id="newQuestion"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What is this?"
                />
              </div>
              <div>
                <label
                  htmlFor="newAnswer"
                  className="block text-xs text-text-muted mb-1"
                >
                  Answer
                </label>
                <input
                  id="newAnswer"
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="This is a pen."
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddQAItem}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
              >
                Add Q&A Item
              </Button>
            </div>
          </div>

          {/* QA items list */}
          {qaItems.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No Q&A items yet. Add your first one above.
            </p>
          ) : (
            <div className="space-y-3">
              {qaItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveQAItem(index, "up")}
                      disabled={index === 0}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQAItem(index, "down")}
                      disabled={index === qaItems.length - 1}
                      className="text-text-muted hover:text-text-primary disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      Q: {item.question}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      A: {item.answer}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQAItem(item.id)}
                    className="text-error hover:text-error/80 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </Container>
  );
}

export default CallanLessonForm;
