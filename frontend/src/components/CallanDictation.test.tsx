import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CallanDictation } from "./CallanDictation";
import type { QAItem } from "../types";

// Mock useAudio hook
const mockSpeak = vi.fn();
const mockStop = vi.fn();
vi.mock("../hooks/useAudio", () => ({
  useAudio: () => ({
    speak: mockSpeak,
    stop: mockStop,
    isSpeaking: false,
    isReady: true,
    error: null,
  }),
}));

// Mock API
vi.mock("../services/api", () => ({
  callanProgressApi: {
    recordProgress: vi.fn().mockResolvedValue({ progress: {} }),
  },
}));

const mockQAItems: QAItem[] = [
  {
    id: "1",
    question: "What is your name?",
    answer: "My name is John.",
    order: 1,
    lessonId: "lesson-1",
  },
  {
    id: "2",
    question: "Where do you live?",
    answer: "I live in Tokyo.",
    order: 2,
    lessonId: "lesson-1",
  },
];

describe("CallanDictation", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render progress indicator", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("should not render answer text initially (text should be hidden)", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Answer text should NOT be visible initially
      expect(screen.queryByText("My name is John.")).not.toBeInTheDocument();
    });

    it("should render play audio button", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    });

    it("should render text input area", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render check answer button", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /check/i }),
      ).toBeInTheDocument();
    });

    it("should render speed slider", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
  });

  describe("TTS playback", () => {
    it("should call speak when play button is clicked", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /play/i }));

      expect(mockSpeak).toHaveBeenCalledWith(
        "My name is John.",
        expect.any(Number),
      );
    });

    it("should use speed value when playing", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Change speed
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "0.75" } });

      fireEvent.click(screen.getByRole("button", { name: /play/i }));

      expect(mockSpeak).toHaveBeenCalledWith("My name is John.", 0.75);
    });
  });

  describe("input handling", () => {
    it("should update text input value", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });

      expect(input).toHaveValue("My name is John.");
    });
  });

  describe("answer checking", () => {
    it("should show diff results when check button is clicked", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });

      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Should show the result after checking
      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument(); // accuracy
      });
    });

    it("should show correct answer after checking", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });

      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Answer should be visible in the "Correct answer" section after checking
      await waitFor(() => {
        expect(screen.getByText("Correct answer")).toBeInTheDocument();
      });
    });

    it("should show next button after checking", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });

      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /next/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("hint functionality", () => {
    it("should render hint button", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("button", { name: /hint/i })).toBeInTheDocument();
    });

    it("should show first word(s) when hint button is clicked", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /hint/i }));

      // Should show hint with first word(s)
      expect(screen.getByText(/My/)).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should go to next item when next button is clicked", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check first answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Click next
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      });

      // Should show 2/2
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    it("should call onComplete when finishing last item", async () => {
      render(
        <CallanDictation
          qaItems={[mockQAItems[0]]}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Click finish
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /finish/i }));
      });

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe("keyboard shortcuts", () => {
    it("should trigger play on P key", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.keyDown(window, { key: "p" });

      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should trigger check on Enter key", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.keyDown(window, { key: "Enter" });

      // Should transition to checked state - show the result card with "Correct answer" section
      await waitFor(() => {
        expect(screen.getByText("Correct answer")).toBeInTheDocument();
      });
    });
  });

  describe("empty state", () => {
    it("should show fallback UI when no qaItems", () => {
      render(
        <CallanDictation qaItems={[]} userId={1} onComplete={mockOnComplete} />,
      );

      expect(
        screen.getByText(/unable to load practice item/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go back/i }),
      ).toBeInTheDocument();
    });
  });

  describe("API error handling", () => {
    it("should continue to show results even when progress recording fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { callanProgressApi } = await import("../services/api");
      vi.mocked(callanProgressApi.recordProgress).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Should still show result despite API failure
      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument();
      });

      // Should show progress save error
      await waitFor(() => {
        expect(
          screen.getByText(/progress could not be saved/i),
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to record progress:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("summary calculation", () => {
    it("should calculate correct summary with single item", async () => {
      render(
        <CallanDictation
          qaItems={[mockQAItems[0]]}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John" } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /finish/i }));
      });

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          totalItems: 1,
          correctCount: 1,
          totalAccuracy: 100,
        }),
      );
    });

    it("should calculate correct summary with multiple items", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // First item - 100% correct
      let input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John" } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      });

      // Second item - 100% correct
      input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "I live in Tokyo" } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /finish/i }));
      });

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          totalItems: 2,
          correctCount: 2,
          totalAccuracy: 100,
        }),
      );
    });
  });

  describe("button states", () => {
    it("should disable check button when input is empty", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const checkButton = screen.getByRole("button", { name: /check/i });
      expect(checkButton).toBeDisabled();
    });

    it("should enable check button when input has content", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test" } });

      const checkButton = screen.getByRole("button", { name: /check/i });
      expect(checkButton).not.toBeDisabled();
    });

    it("should hide hint button after checking answer", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("button", { name: /hint/i })).toBeInTheDocument();

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /hint/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("keyboard shortcuts - additional", () => {
    it("should stop audio on Escape key", () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe("auto-play on start", () => {
    it("should auto-play audio for the first item on mount", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "My name is John.",
          expect.any(Number),
        );
      });
    });
  });

  describe("auto-play on next", () => {
    it("should auto-play audio for the next item after clicking Next", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check first answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Wait for checked state and click next
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /next/i }));
      });

      // speak is called once during handleCheck (for correct answer playback)
      // and should be called again for the next item's auto-play
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "I live in Tokyo.",
          expect.any(Number),
        );
      });
    });

    it("should auto-play audio after pressing N key to go next", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check first answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Wait for checked state, then press N key
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
      });

      mockSpeak.mockClear();
      fireEvent.keyDown(window, { key: "n" });

      // Should auto-play the next item's audio
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "I live in Tokyo.",
          expect.any(Number),
        );
      });
    });

    it("should auto-play audio after pressing Enter key to go next in checked state", async () => {
      render(
        <CallanDictation
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check first answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Wait for checked state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
      });

      mockSpeak.mockClear();
      fireEvent.keyDown(window, { key: "Enter" });

      // Should auto-play the next item's audio
      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          "I live in Tokyo.",
          expect.any(Number),
        );
      });
    });

    it("should not auto-play when finishing last item", async () => {
      render(
        <CallanDictation
          qaItems={[mockQAItems[0]]}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Check answer
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "My name is John." } });
      fireEvent.click(screen.getByRole("button", { name: /check/i }));

      // Clear speak calls from handleCheck
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
      });
      mockSpeak.mockClear();

      // Click finish
      fireEvent.click(screen.getByRole("button", { name: /finish/i }));

      // speak should NOT be called again (no next item)
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });
});
