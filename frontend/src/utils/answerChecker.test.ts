import { describe, it, expect } from 'vitest';
import { checkAnswer, normalizeText, calculateSimilarity } from './answerChecker';

describe('normalizeText', () => {
  it('should convert to lowercase', () => {
    expect(normalizeText('Hello World')).toBe('hello world');
  });

  it('should remove punctuation', () => {
    expect(normalizeText('Hello, World!')).toBe('hello world');
    expect(normalizeText("It's a test.")).toBe('its a test');
  });

  it('should trim whitespace', () => {
    expect(normalizeText('  hello  world  ')).toBe('hello world');
  });

  it('should handle multiple spaces', () => {
    expect(normalizeText('hello    world')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('calculateSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return 0 for completely different strings', () => {
    expect(calculateSimilarity('abc', 'xyz')).toBe(0);
  });

  it('should return a value between 0 and 1 for similar strings', () => {
    const similarity = calculateSimilarity('hello', 'hallo');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it('should be case insensitive after normalization', () => {
    expect(calculateSimilarity('hello', 'HELLO')).toBe(1);
  });

  it('should handle empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(1);
    expect(calculateSimilarity('hello', '')).toBe(0);
    expect(calculateSimilarity('', 'hello')).toBe(0);
  });
});

describe('checkAnswer', () => {
  it('should return correct for exact match', () => {
    const result = checkAnswer('This is a pen', 'This is a pen');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should return correct for case-insensitive match', () => {
    const result = checkAnswer('this is a pen', 'This is a Pen');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should return correct for match with different punctuation', () => {
    const result = checkAnswer('This is a pen!', 'This is a pen.');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBe(1);
  });

  it('should return correct for similarity above threshold', () => {
    // "This is a pen" vs "This is a pen" with minor typo
    const result = checkAnswer('This is a pen', 'This is a pem');
    expect(result.isCorrect).toBe(true);
    expect(result.similarity).toBeGreaterThanOrEqual(0.8);
  });

  it('should return incorrect for low similarity', () => {
    const result = checkAnswer('completely different answer', 'This is a pen');
    expect(result.isCorrect).toBe(false);
    expect(result.similarity).toBeLessThan(0.8);
  });

  it('should accept custom threshold', () => {
    const result = checkAnswer('This is a pen', 'This is a pem', 0.95);
    expect(result.isCorrect).toBe(false);
  });

  it('should provide appropriate feedback for correct answers', () => {
    const result = checkAnswer('This is a pen', 'This is a pen');
    expect(result.feedback).toContain('Correct');
  });

  it('should provide appropriate feedback for almost correct answers', () => {
    const result = checkAnswer('This is a pen', 'This is a pem');
    expect(result.feedback).toBeDefined();
  });

  it('should provide appropriate feedback for incorrect answers', () => {
    const result = checkAnswer('wrong answer', 'This is a pen');
    expect(result.feedback).toBeDefined();
  });

  it('should handle contractions', () => {
    const result = checkAnswer("It's a book", "its a book");
    expect(result.isCorrect).toBe(true);
  });

  it('should handle articles with minor differences', () => {
    const result = checkAnswer('the book', 'a book');
    expect(result.similarity).toBeLessThan(1);
  });
});
