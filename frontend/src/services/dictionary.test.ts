import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDefinition, clearDefinitionCache } from "./dictionary";

describe("dictionary service", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearDefinitionCache();
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
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

      mockFetch.mockResolvedValueOnce({
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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchDefinition("asdfghjkl");
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchDefinition("test");
      await fetchDefinition("test");

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("caches null results for 404 and does not re-fetch", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      await fetchDefinition("nonexistent");
      await fetchDefinition("nonexistent");

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not cache transient errors (network failure)", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                word: "retry",
                phonetic: "/ˈriːtraɪ/",
                meanings: [
                  {
                    partOfSpeech: "verb",
                    definitions: [{ definition: "To try again." }],
                  },
                ],
              },
            ]),
        });

      const first = await fetchDefinition("retry");
      expect(first).toBeNull();

      const second = await fetchDefinition("retry");
      expect(second).not.toBeNull();
      expect(second?.word).toBe("retry");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not cache transient errors (server 500)", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                word: "server",
                meanings: [
                  {
                    partOfSpeech: "noun",
                    definitions: [{ definition: "A server definition." }],
                  },
                ],
              },
            ]),
        });

      const first = await fetchDefinition("server");
      expect(first).toBeNull();

      const second = await fetchDefinition("server");
      expect(second).not.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("returns null for empty array response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await fetchDefinition("empty");
      expect(result).toBeNull();
    });

    it("returns null for non-array response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: "unexpected" }),
      });

      const result = await fetchDefinition("malformed");
      expect(result).toBeNull();
    });

    it("returns null for response with missing word field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ phonetic: "/test/" }]),
      });

      const result = await fetchDefinition("noword");
      expect(result).toBeNull();
    });

    it("returns null for response with missing meanings array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ word: "test" }]),
      });

      const result = await fetchDefinition("nomeanings");
      expect(result).toBeNull();
    });

    it("encodes special characters in the word", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await fetchDefinition("ice cream");

      expect(mockFetch).toHaveBeenCalledWith(
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

      mockFetch
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

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
