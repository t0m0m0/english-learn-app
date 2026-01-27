import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDefinition, clearDefinitionCache } from "./dictionary";

describe("dictionary service", () => {
  beforeEach(() => {
    clearDefinitionCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchDefinition", () => {
    it("returns definition for a valid word", async () => {
      const mockResponse = [
        {
          word: "hello",
          phonetic: "/həˈloʊ/",
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [
                {
                  definition: "An utterance of 'hello'; a greeting.",
                  example: "she was met with a chorus of hellos",
                },
              ],
            },
            {
              partOfSpeech: "exclamation",
              definitions: [
                {
                  definition:
                    "Used as a greeting or to begin a phone conversation.",
                },
              ],
            },
          ],
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchDefinition("hello");

      expect(result).not.toBeNull();
      expect(result?.word).toBe("hello");
      expect(result?.phonetic).toBe("/həˈloʊ/");
      expect(result?.meanings).toHaveLength(2);
      expect(result?.meanings[0].partOfSpeech).toBe("noun");
      expect(result?.meanings[0].definitions[0].definition).toBe(
        "An utterance of 'hello'; a greeting.",
      );
    });

    it("returns null for non-existent word", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchDefinition("asdfghjkl");
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchDefinition("test");
      expect(result).toBeNull();
    });

    it("caches results for subsequent calls", async () => {
      const mockResponse = [
        {
          word: "test",
          phonetic: "/test/",
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [{ definition: "A test definition" }],
            },
          ],
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDefinition("test");
      await fetchDefinition("test");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("encodes special characters in the word", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await fetchDefinition("ice cream");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.dictionaryapi.dev/api/v2/entries/en/ice%20cream",
      );
    });
  });

  describe("clearDefinitionCache", () => {
    it("clears the cache", async () => {
      const mockResponse = [
        {
          word: "cache",
          phonetic: "/kæʃ/",
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [{ definition: "A cache definition" }],
            },
          ],
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      await fetchDefinition("cache");
      clearDefinitionCache();
      await fetchDefinition("cache");

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
