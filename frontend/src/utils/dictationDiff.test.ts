import { describe, it, expect } from "vitest";
import {
  compareDictation,
  type DictationResult,
  type DiffSegment,
} from "./dictationDiff";

describe("compareDictation", () => {
  describe("exact matches", () => {
    it("should return correct result for exact match", () => {
      const result = compareDictation("Hello world", "Hello world");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
      expect(result.diff).toEqual([
        { type: "correct", text: "Hello" },
        { type: "correct", text: "world" },
      ]);
    });

    it("should return correct result for single word match", () => {
      const result = compareDictation("Hello", "Hello");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
      expect(result.diff).toEqual([{ type: "correct", text: "Hello" }]);
    });
  });

  describe("case sensitivity", () => {
    it("should ignore case by default", () => {
      const result = compareDictation("HELLO WORLD", "hello world");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });

    it("should respect case when strictCase is true", () => {
      const result = compareDictation("HELLO WORLD", "hello world", {
        strictCase: true,
      });

      expect(result.isCorrect).toBe(false);
      expect(result.accuracy).toBeLessThan(100);
    });
  });

  describe("punctuation handling", () => {
    it("should ignore punctuation by default", () => {
      const result = compareDictation("Hello world", "Hello, world!");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });

    it("should respect punctuation when strictPunctuation is true", () => {
      const result = compareDictation("Hello world", "Hello, world!", {
        strictPunctuation: true,
      });

      // With strict punctuation, "Hello" != "Hello," and "world" != "world!"
      expect(result.isCorrect).toBe(false);
      expect(result.accuracy).toBeLessThan(100);
    });
  });

  describe("wrong words", () => {
    it("should identify wrong words", () => {
      const result = compareDictation("Hello word", "Hello world");

      expect(result.isCorrect).toBe(false);
      expect(result.diff).toContainEqual({
        type: "wrong",
        text: "word",
        expected: "world",
      });
    });

    it("should calculate accuracy correctly for partial match", () => {
      const result = compareDictation("The cat runs", "The dog runs");

      expect(result.isCorrect).toBe(false);
      // 2 out of 3 words correct = ~66.67%
      expect(result.accuracy).toBeCloseTo(66.67, 0);
    });
  });

  describe("missing words", () => {
    it("should identify missing words at the end", () => {
      const result = compareDictation("Hello", "Hello world");

      expect(result.isCorrect).toBe(false);
      expect(result.diff).toContainEqual({
        type: "missing",
        text: "world",
      });
    });

    it("should identify missing words in the middle", () => {
      const result = compareDictation("The runs fast", "The cat runs fast");

      expect(result.isCorrect).toBe(false);
      expect(result.diff).toContainEqual({
        type: "missing",
        text: "cat",
      });
    });
  });

  describe("extra words", () => {
    it("should identify extra words", () => {
      const result = compareDictation("Hello big world", "Hello world");

      expect(result.isCorrect).toBe(false);
      expect(result.diff).toContainEqual({
        type: "extra",
        text: "big",
      });
    });

    it("should identify extra words at the end", () => {
      const result = compareDictation("Hello world today", "Hello world");

      expect(result.isCorrect).toBe(false);
      expect(result.diff).toContainEqual({
        type: "extra",
        text: "today",
      });
    });
  });

  describe("complex cases", () => {
    it("should handle completely wrong input", () => {
      const result = compareDictation("foo bar baz", "one two three");

      expect(result.isCorrect).toBe(false);
      expect(result.accuracy).toBe(0);
    });

    it("should handle empty input", () => {
      const result = compareDictation("", "Hello world");

      expect(result.isCorrect).toBe(false);
      expect(result.accuracy).toBe(0);
      expect(result.diff).toEqual([
        { type: "missing", text: "Hello" },
        { type: "missing", text: "world" },
      ]);
    });

    it("should handle empty expected", () => {
      const result = compareDictation("Hello world", "");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
      expect(result.diff).toEqual([]);
    });

    it("should handle multiple errors", () => {
      const result = compareDictation("I has a cats", "I have a cat");

      expect(result.isCorrect).toBe(false);
      expect(
        result.diff.filter((d) => d.type === "wrong").length,
      ).toBeGreaterThan(0);
    });

    it("should handle long sentences", () => {
      const userInput = "The quick brown fox jumps over the lazy dog";
      const expected = "The quick brown fox jumps over the lazy dog";

      const result = compareDictation(userInput, expected);

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });

    it("should handle contractions", () => {
      const result = compareDictation("I'm happy", "I'm happy");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });
  });

  describe("whitespace handling", () => {
    it("should handle extra whitespace", () => {
      const result = compareDictation("Hello   world", "Hello world");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });

    it("should handle leading/trailing whitespace", () => {
      const result = compareDictation("  Hello world  ", "Hello world");

      expect(result.isCorrect).toBe(true);
      expect(result.accuracy).toBe(100);
    });
  });
});
