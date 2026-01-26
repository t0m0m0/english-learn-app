import { useState } from "react";
import MixingGame from "../components/MixingGame";
import { Container, Card, Button } from "../components/ui";

export function Mixing() {
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleGameComplete = (score: number) => {
    setFinalScore(score);
  };

  const handlePlayAgain = () => {
    setFinalScore(null);
    setGameKey((prev) => prev + 1);
  };

  if (finalScore !== null) {
    const maxScore = 30; // 10 rounds × 3 words
    const percentage = Math.round((finalScore / maxScore) * 100);

    let message = "";
    let emoji = "";

    if (percentage >= 90) {
      message = "Excellent! You're a word master!";
      emoji = "🏆";
    } else if (percentage >= 70) {
      message = "Great job! Keep practicing!";
      emoji = "🌟";
    } else if (percentage >= 50) {
      message = "Good effort! Try again to improve!";
      emoji = "💪";
    } else {
      message = "Keep learning! Practice makes perfect!";
      emoji = "📚";
    }

    return (
      <Container size="md" className="py-10">
        <Card className="text-center">
          <span className="block text-6xl mb-4">{emoji}</span>
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Game Complete!
          </h2>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-primary">
              {finalScore}
            </span>
            <span className="text-2xl text-text-muted">/ {maxScore}</span>
          </div>
          <div className="text-3xl font-semibold text-success mb-4">
            {percentage}%
          </div>
          <p className="text-text-secondary mb-8">{message}</p>
          <Button variant="primary" size="lg" onClick={handlePlayAgain}>
            Play Again
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      <MixingGame key={gameKey} onComplete={handleGameComplete} />
    </Container>
  );
}

export default Mixing;
