import { useState, useEffect } from "react";
import { wordsApi } from "../services/api";
import ListeningMode from "../components/ListeningMode";
import { Container, Card, Button } from "../components/ui";

interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
}

export function Listening() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(50);
  const [maxFrequency, setMaxFrequency] = useState(1000);
  const [sessionComplete, setSessionComplete] = useState(false);

  const fetchWords = async () => {
    setLoading(true);
    setSessionComplete(false);
    try {
      const { words: fetchedWords } = await wordsApi.getRandom(
        wordCount,
        maxFrequency,
      );
      setWords(fetchedWords);
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [wordCount, maxFrequency]);

  const handleComplete = () => {
    setSessionComplete(true);
  };

  const handleNewSession = () => {
    fetchWords();
  };

  if (loading) {
    return (
      <Container size="md" className="py-10">
        <div className="text-center py-16 text-text-muted">
          Loading words...
        </div>
      </Container>
    );
  }

  if (sessionComplete) {
    return (
      <Container size="md" className="py-10">
        <Card className="text-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Listening Session Complete!
          </h2>
          <p className="text-text-secondary mb-8">
            Great job immersing yourself in the language!
          </p>
          <div className="inline-block bg-surface rounded-card p-6 mb-8 shadow-card">
            <span className="block text-4xl font-bold text-success mb-1">
              {wordCount}
            </span>
            <span className="text-sm text-text-muted">Words Heard</span>
          </div>
          <Button variant="primary" onClick={handleNewSession} size="lg">
            Start New Session
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" className="py-10">
      {/* Settings Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Word Count:</label>
          <select
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-button bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={25}>25 words</option>
            <option value={50}>50 words</option>
            <option value={100}>100 words</option>
            <option value={200}>200 words</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">
            Frequency Range:
          </label>
          <select
            value={maxFrequency}
            onChange={(e) => setMaxFrequency(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-button bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={500}>Top 500</option>
            <option value={1000}>Top 1,000</option>
            <option value={2000}>Top 2,000</option>
            <option value={3000}>All 3,000</option>
          </select>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchWords}>
          New Words
        </Button>
      </div>

      <ListeningMode words={words} onComplete={handleComplete} />
    </Container>
  );
}

export default Listening;
