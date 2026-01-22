import { useState } from 'react';
import MixingGame from '../components/MixingGame';
import './Mixing.css';

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

    let message = '';
    let emoji = '';

    if (percentage >= 90) {
      message = 'Excellent! You\'re a word master!';
      emoji = '🏆';
    } else if (percentage >= 70) {
      message = 'Great job! Keep practicing!';
      emoji = '🌟';
    } else if (percentage >= 50) {
      message = 'Good effort! Try again to improve!';
      emoji = '💪';
    } else {
      message = 'Keep learning! Practice makes perfect!';
      emoji = '📚';
    }

    return (
      <div className="mixing-page">
        <div className="game-results">
          <span className="result-emoji">{emoji}</span>
          <h2>Game Complete!</h2>
          <div className="score-display">
            <span className="score-value">{finalScore}</span>
            <span className="score-max">/ {maxScore}</span>
          </div>
          <div className="score-percentage">{percentage}%</div>
          <p className="result-message">{message}</p>
          <button className="play-again-button" onClick={handlePlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mixing-page">
      <MixingGame key={gameKey} onComplete={handleGameComplete} />
    </div>
  );
}

export default Mixing;
