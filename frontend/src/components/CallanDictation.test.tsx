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
    it("should return null when no qaItems", () => {
      const { container } = render(
        <CallanDictation qaItems={[]} userId={1} onComplete={mockOnComplete} />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
