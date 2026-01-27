import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordCard } from "./WordCard";
import * as dictionaryService from "../services/dictionary";

// Mock all external dependencies
vi.mock("../services/unsplash", () => ({
  searchImages: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../hooks/useAudio", () => ({
  default: () => ({
    speak: vi.fn(),
    isSpeaking: false,
  }),
}));

vi.mock("../services/dictionary");

describe("WordCard", () => {
  const mockWord = {
    id: 1,
    word: "hello",
    frequency: 100,
    partOfSpeech: "noun",
  };

  const mockDefinition: dictionaryService.DictionaryEntry = {
    word: "hello",
    phonetic: "/həˈloʊ/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "An utterance of 'hello'; a greeting.",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValue(
      mockDefinition,
    );
  });

  describe("dictionary features", () => {
    it("displays dictionary links when showDictionary is true", () => {
      render(<WordCard word={mockWord} showDictionary />);

      expect(
        screen.getByRole("link", { name: /cambridge/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /merriam-webster/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /oxford/i })).toBeInTheDocument();
    });

    it("does not display dictionary links when showDictionary is false", () => {
      render(<WordCard word={mockWord} showDictionary={false} />);

      expect(
        screen.queryByRole("link", { name: /cambridge/i }),
      ).not.toBeInTheDocument();
    });

    it("does not display dictionary links by default", () => {
      render(<WordCard word={mockWord} />);

      expect(
        screen.queryByRole("link", { name: /cambridge/i }),
      ).not.toBeInTheDocument();
    });

    it("displays definition when showDefinition is true", async () => {
      render(<WordCard word={mockWord} showDefinition />);

      await waitFor(() => {
        expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
      });

      expect(
        screen.getByText("An utterance of 'hello'; a greeting."),
      ).toBeInTheDocument();
    });

    it("does not display definition when showDefinition is false", () => {
      render(<WordCard word={mockWord} showDefinition={false} />);

      expect(screen.queryByText("/həˈloʊ/")).not.toBeInTheDocument();
    });

    it("displays collapsible definition when collapsed prop is true", async () => {
      render(<WordCard word={mockWord} showDefinition collapsed />);
      const user = userEvent.setup();

      // Initially collapsed
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /show definition/i }),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText("/həˈloʊ/")).not.toBeInTheDocument();

      // Click to expand
      await user.click(
        screen.getByRole("button", { name: /show definition/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
      });
    });

    it("links have correct href for the word", () => {
      render(<WordCard word={mockWord} showDictionary />);

      const cambridgeLink = screen.getByRole("link", { name: /cambridge/i });
      expect(cambridgeLink).toHaveAttribute(
        "href",
        "https://dictionary.cambridge.org/dictionary/english/hello",
      );
    });
  });

  describe("basic functionality", () => {
    it("renders the word", () => {
      render(<WordCard word={mockWord} showWord />);

      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("renders part of speech", () => {
      render(<WordCard word={mockWord} />);

      expect(screen.getByText("noun")).toBeInTheDocument();
    });

    it("renders Listen button", () => {
      render(<WordCard word={mockWord} />);

      expect(
        screen.getByRole("button", { name: /listen/i }),
      ).toBeInTheDocument();
    });
  });
});
