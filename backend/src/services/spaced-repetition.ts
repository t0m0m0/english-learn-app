/**
 * Spaced Repetition Algorithm
 * Based on the Leitner system and SM-2 algorithm
 *
 * Levels: 0-5
 * - Level 0: New word, review in 1 minute
 * - Level 1: Learning, review in 10 minutes
 * - Level 2: Review in 1 day
 * - Level 3: Review in 3 days
 * - Level 4: Review in 1 week
 * - Level 5: Mastered, review in 2 weeks
 */

const INTERVALS = {
  0: 1 * 60 * 1000,           // 1 minute
  1: 10 * 60 * 1000,          // 10 minutes
  2: 24 * 60 * 60 * 1000,     // 1 day
  3: 3 * 24 * 60 * 60 * 1000, // 3 days
  4: 7 * 24 * 60 * 60 * 1000, // 1 week
  5: 14 * 24 * 60 * 60 * 1000 // 2 weeks
};

/**
 * Calculate the next review date based on the current level
 */
export function calculateNextReview(level: number): Date {
  const now = new Date();
  const interval = INTERVALS[level as keyof typeof INTERVALS] || INTERVALS[5];
  return new Date(now.getTime() + interval);
}

/**
 * Calculate new level based on response quality
 * quality: 0-5 (0 = complete failure, 5 = perfect)
 */
export function calculateNewLevel(currentLevel: number, quality: number): number {
  if (quality >= 3) {
    // Correct answer - move up
    return Math.min(currentLevel + 1, 5);
  } else if (quality >= 1) {
    // Partial correct - stay same
    return currentLevel;
  } else {
    // Wrong - move down
    return Math.max(currentLevel - 1, 0);
  }
}

/**
 * Get the description of a level
 */
export function getLevelDescription(level: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'New',
    1: 'Learning',
    2: 'Familiar',
    3: 'Good',
    4: 'Strong',
    5: 'Mastered'
  };
  return descriptions[level] || 'Unknown';
}

/**
 * Calculate review score based on time and accuracy
 */
export function calculateScore(
  responseTimeMs: number,
  isCorrect: boolean,
  currentLevel: number
): number {
  if (!isCorrect) return 0;

  // Base score for correct answer
  let score = 3;

  // Bonus for quick response (under 3 seconds)
  if (responseTimeMs < 3000) {
    score += 1;
  }

  // Bonus for very quick response (under 1.5 seconds)
  if (responseTimeMs < 1500) {
    score += 1;
  }

  return score;
}
