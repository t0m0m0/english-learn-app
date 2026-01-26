export interface CheckAnswerResult {
  isCorrect: boolean;
  similarity: number;
  feedback: string;
}

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Removing punctuation
 * - Trimming whitespace
 * - Collapsing multiple spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Calculates the Levenshtein distance between two strings.
 * This is the minimum number of single-character edits needed
 * to transform one string into another.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill the DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // deletion
            dp[i][j - 1], // insertion
            dp[i - 1][j - 1], // substitution
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculates the similarity between two strings as a value between 0 and 1.
 * Uses normalized Levenshtein distance.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  if (normalized1 === normalized2) {
    return 1;
  }

  if (normalized1.length === 0 && normalized2.length === 0) {
    return 1;
  }

  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0;
  }

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  return 1 - distance / maxLength;
}

/**
 * Checks a user's answer against the correct answer and provides feedback.
 *
 * @param userAnswer - The user's submitted answer
 * @param correctAnswer - The correct answer to compare against
 * @param threshold - Minimum similarity (0-1) to consider correct (default: 0.8)
 * @returns Object with isCorrect, similarity score, and feedback message
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  threshold = 0.8,
): CheckAnswerResult {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  const isCorrect = similarity >= threshold;

  let feedback: string;

  if (similarity === 1) {
    feedback = "Correct! Perfect answer!";
  } else if (similarity >= 0.95) {
    feedback = "Correct! Almost perfect!";
  } else if (similarity >= threshold) {
    feedback = "Correct! Good job, but watch for small errors.";
  } else if (similarity >= 0.6) {
    feedback = "Close! Try again. Check your pronunciation and word order.";
  } else if (similarity >= 0.3) {
    feedback = "Not quite. Listen to the question again and try once more.";
  } else {
    feedback = "Try again. Listen carefully to the correct answer.";
  }

  return {
    isCorrect,
    similarity,
    feedback,
  };
}

export default checkAnswer;
