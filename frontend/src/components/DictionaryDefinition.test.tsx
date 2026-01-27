import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DictionaryDefinition } from "./DictionaryDefinition";
import * as dictionaryService from "../services/dictionary";

vi.mock("../services/dictionary");

describe("DictionaryDefinition", () => {
  const mockDefinition: dictionaryService.DictionaryEntry = {
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
            definition: "Used as a greeting or to begin a phone conversation.",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(dictionaryService.fetchDefinition).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<DictionaryDefinition word="hello" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays definition when available", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce(
      mockDefinition,
    );

    render(<DictionaryDefinition word="hello" />);

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
    });

    expect(screen.getByText("noun")).toBeInTheDocument();
    expect(
      screen.getByText("An utterance of 'hello'; a greeting."),
    ).toBeInTheDocument();
    expect(screen.getByText("exclamation")).toBeInTheDocument();
  });

  it("displays example when available", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce(
      mockDefinition,
    );

    render(<DictionaryDefinition word="hello" />);

    await waitFor(() => {
      expect(
        screen.getByText(/"she was met with a chorus of hellos"/i),
      ).toBeInTheDocument();
    });
  });

  it("displays message when no definition found", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce(null);

    render(<DictionaryDefinition word="asdfghjkl" />);

    await waitFor(() => {
      expect(screen.getByText(/no definition found/i)).toBeInTheDocument();
    });
  });

  it("is collapsible when collapsed prop is true", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce(
      mockDefinition,
    );

    render(<DictionaryDefinition word="hello" collapsed />);
    const user = userEvent.setup();

    // Initially collapsed - definition not visible
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    expect(screen.queryByText("/həˈloʊ/")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
    });
  });

  it("can collapse back after expanding", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce(
      mockDefinition,
    );

    render(<DictionaryDefinition word="hello" collapsed />);
    const user = userEvent.setup();

    // Wait for load and expand
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /show definition/i }));

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
    });

    // Collapse back
    await user.click(
      screen.getByRole("button", { name: /hide definition/i }),
    );

    await waitFor(() => {
      expect(screen.queryByText("/həˈloʊ/")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /show definition/i }),
    ).toBeInTheDocument();
  });

  it("renders without phonetic field", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce({
      word: "test",
      meanings: [
        {
          partOfSpeech: "noun",
          definitions: [{ definition: "A test definition." }],
        },
      ],
    });

    render(<DictionaryDefinition word="test" />);

    await waitFor(() => {
      expect(screen.getByText("A test definition.")).toBeInTheDocument();
    });

    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });

  it("limits displayed definitions to 2 per meaning", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockResolvedValueOnce({
      word: "run",
      meanings: [
        {
          partOfSpeech: "verb",
          definitions: [
            { definition: "Definition one." },
            { definition: "Definition two." },
            { definition: "Definition three." },
            { definition: "Definition four." },
          ],
        },
      ],
    });

    render(<DictionaryDefinition word="run" />);

    await waitFor(() => {
      expect(screen.getByText("Definition one.")).toBeInTheDocument();
    });

    expect(screen.getByText("Definition two.")).toBeInTheDocument();
    expect(screen.queryByText("Definition three.")).not.toBeInTheDocument();
    expect(screen.queryByText("Definition four.")).not.toBeInTheDocument();
  });

  it("handles fetch rejection gracefully", async () => {
    vi.mocked(dictionaryService.fetchDefinition).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<DictionaryDefinition word="error" />);

    await waitFor(() => {
      expect(screen.getByText(/no definition found/i)).toBeInTheDocument();
    });
  });

  it("fetches new definition when word changes", async () => {
    vi.mocked(dictionaryService.fetchDefinition)
      .mockResolvedValueOnce(mockDefinition)
      .mockResolvedValueOnce({
        word: "world",
        phonetic: "/wɜːrld/",
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [{ definition: "The earth and all its people." }],
          },
        ],
      });

    const { rerender } = render(<DictionaryDefinition word="hello" />);

    await waitFor(() => {
      expect(screen.getByText("/həˈloʊ/")).toBeInTheDocument();
    });

    rerender(<DictionaryDefinition word="world" />);

    await waitFor(() => {
      expect(screen.getByText("/wɜːrld/")).toBeInTheDocument();
    });

    expect(dictionaryService.fetchDefinition).toHaveBeenCalledTimes(2);
  });
});
