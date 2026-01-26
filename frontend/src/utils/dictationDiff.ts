/**
 * Dictation diff comparison utility
 * Compares user input against expected text at word level
 */

export interface DiffSegment {
  type: 'correct' | 'wrong' | 'missing' | 'extra';
  text: string;
  expected?: string; // Only for 'wrong' type
}

export interface DictationResult {
  isCorrect: boolean;
  accuracy: number; // 0-100%
  diff: DiffSegment[];
}

export interface DictationOptions {
  strictCase?: boolean;
  strictPunctuation?: boolean;
}

/**
 * Tokenize a string into words, optionally preserving punctuation
 */
function tokenize(text: string, preservePunctuation: boolean = false): string[] {
  if (!text || !text.trim()) return [];
  
  // Normalize whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  if (preservePunctuation) {
    return normalized.split(' ').filter(w => w.length > 0);
  }
  
  // Remove punctuation but keep apostrophes within words (for contractions)
  return normalized
    .replace(/[^\w\s']/g, '')
    .split(' ')
    .filter(w => w.length > 0);
}

/**
 * Compute the Longest Common Subsequence (LCS) for word-level diff
 */
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  return dp;
}

/**
 * Backtrack through LCS matrix to find the actual diff
 */
function backtrackDiff(
  userWords: string[],
  expectedWords: string[],
  originalUserWords: string[],
  originalExpectedWords: string[],
  dp: number[][]
): DiffSegment[] {
  const diff: DiffSegment[] = [];
  let i = userWords.length;
  let j = expectedWords.length;
  
  // Collect operations in reverse order
  const operations: { type: 'match' | 'delete' | 'insert'; userIdx?: number; expectedIdx?: number }[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && userWords[i - 1] === expectedWords[j - 1]) {
      operations.push({ type: 'match', userIdx: i - 1, expectedIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      operations.push({ type: 'insert', expectedIdx: j - 1 });
      j--;
    } else {
      operations.push({ type: 'delete', userIdx: i - 1 });
      i--;
    }
  }
  
  // Reverse to get forward order
  operations.reverse();
  
  // Build diff segments, merging consecutive deletes+inserts into wrong
  let opIdx = 0;
  while (opIdx < operations.length) {
    const op = operations[opIdx];
    
    if (op.type === 'match') {
      diff.push({
        type: 'correct',
        text: originalUserWords[op.userIdx!],
      });
      opIdx++;
    } else if (op.type === 'delete') {
      // Check if next operation is insert - if so, this is a "wrong" word
      if (opIdx + 1 < operations.length && operations[opIdx + 1].type === 'insert') {
        const insertOp = operations[opIdx + 1];
        diff.push({
          type: 'wrong',
          text: originalUserWords[op.userIdx!],
          expected: originalExpectedWords[insertOp.expectedIdx!],
        });
        opIdx += 2;
      } else {
        diff.push({
          type: 'extra',
          text: originalUserWords[op.userIdx!],
        });
        opIdx++;
      }
    } else if (op.type === 'insert') {
      diff.push({
        type: 'missing',
        text: originalExpectedWords[op.expectedIdx!],
      });
      opIdx++;
    }
  }
  
  return diff;
}

/**
 * Compare user input against expected text for dictation practice
 */
export function compareDictation(
  userInput: string,
  expected: string,
  options: DictationOptions = {}
): DictationResult {
  const { strictCase = false, strictPunctuation = false } = options;
  
  // Tokenize preserving original case for display
  const originalUserWords = tokenize(userInput, strictPunctuation);
  const originalExpectedWords = tokenize(expected, strictPunctuation);
  
  // Handle empty expected - everything is correct
  if (originalExpectedWords.length === 0) {
    return {
      isCorrect: true,
      accuracy: 100,
      diff: [],
    };
  }
  
  // Handle empty input - everything is missing
  if (originalUserWords.length === 0) {
    return {
      isCorrect: false,
      accuracy: 0,
      diff: originalExpectedWords.map(word => ({
        type: 'missing' as const,
        text: word,
      })),
    };
  }
  
  // Normalize for comparison
  const userWords = strictCase 
    ? originalUserWords 
    : originalUserWords.map(w => w.toLowerCase());
  const expectedWords = strictCase 
    ? originalExpectedWords 
    : originalExpectedWords.map(w => w.toLowerCase());
  
  // Compute LCS
  const dp = computeLCS(userWords, expectedWords);
  
  // Build diff using backtracking
  const diff = backtrackDiff(
    userWords, 
    expectedWords, 
    originalUserWords, 
    originalExpectedWords, 
    dp
  );
  
  // Calculate accuracy based on correct words vs expected words
  const correctCount = diff.filter(d => d.type === 'correct').length;
  const accuracy = Math.round((correctCount / originalExpectedWords.length) * 10000) / 100;
  
  // Check if all words are correct
  const isCorrect = diff.every(d => d.type === 'correct');
  
  return {
    isCorrect,
    accuracy,
    diff,
  };
}
