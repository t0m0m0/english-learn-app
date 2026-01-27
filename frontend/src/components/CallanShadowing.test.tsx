import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CallanShadowing, getAudioErrorMessage } from "./CallanShadowing";
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

// Mock useAudioRecorder hook with mutable state
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
const mockClearRecording = vi.fn();

let mockRecordedAudio: { blob: Blob; duration: number; url: string } | null =
  null;

vi.mock("../hooks/useAudioRecorder", () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    isSupported: true,
    get recordedAudio() {
      return mockRecordedAudio;
    },
    duration: 0,
    error: null,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    clearRecording: mockClearRecording,
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

describe("CallanShadowing", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordedAudio = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render progress indicator", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("should render answer text", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByText("My name is John.")).toBeInTheDocument();
    });

    it("should render play model button", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /play model/i }),
      ).toBeInTheDocument();
    });

    it("should render record button", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /record/i }),
      ).toBeInTheDocument();
    });

    it("should render speed slider", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
  });

  describe("TTS playback", () => {
    it("should call speak when play model button is clicked", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /play model/i }));

      expect(mockSpeak).toHaveBeenCalledWith(
        "My name is John.",
        expect.any(Number),
      );
    });

    it("should use speed value when playing", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      // Change speed
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "0.75" } });

      fireEvent.click(screen.getByRole("button", { name: /play model/i }));

      expect(mockSpeak).toHaveBeenCalledWith("My name is John.", 0.75);
    });
  });

  describe("recording", () => {
    it("should call startRecording when record button is clicked", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /record/i }));

      expect(mockStartRecording).toHaveBeenCalled();
    });
  });

  describe("keyboard shortcuts", () => {
    it("should trigger play model on P key", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.keyDown(window, { key: "p" });

      expect(mockSpeak).toHaveBeenCalled();
    });

    it("should trigger record on R key", () => {
      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.keyDown(window, { key: "r" });

      expect(mockStartRecording).toHaveBeenCalled();
    });
  });

  describe("empty state", () => {
    it("should return null when no qaItems", () => {
      const { container } = render(
        <CallanShadowing qaItems={[]} userId={1} onComplete={mockOnComplete} />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("audio playback error handling", () => {
    it("should not display error message initially", () => {
      mockRecordedAudio = {
        blob: new Blob(["test"], { type: "audio/webm" }),
        duration: 1,
        url: "blob:test-url",
      };

      render(
        <CallanShadowing
          qaItems={mockQAItems}
          userId={1}
          onComplete={mockOnComplete}
        />,
      );

      expect(screen.queryByText(/playback/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});

describe("getAudioErrorMessage", () => {
  it("should return 'Unknown playback error' for null error", () => {
    expect(getAudioErrorMessage(null)).toBe("Unknown playback error");
  });

  it("should return correct message for MEDIA_ERR_ABORTED (code 1)", () => {
    const error = { code: 1, message: "" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe("Playback was aborted");
  });

  it("should return correct message for MEDIA_ERR_NETWORK (code 2)", () => {
    const error = { code: 2, message: "" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe(
      "Network error occurred while loading audio",
    );
  });

  it("should return correct message for MEDIA_ERR_DECODE (code 3)", () => {
    const error = { code: 3, message: "" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe(
      "Audio decoding failed. The format may not be supported.",
    );
  });

  it("should return correct message for MEDIA_ERR_SRC_NOT_SUPPORTED (code 4)", () => {
    const error = { code: 4, message: "" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe(
      "Audio format not supported by your browser. Try recording again.",
    );
  });

  it("should use error.message for unknown error code when message exists", () => {
    const error = { code: 99, message: "Custom error message" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe("Custom error message");
  });

  it("should return default message for unknown error code without message", () => {
    const error = { code: 99, message: "" } as MediaError;
    expect(getAudioErrorMessage(error)).toBe("Failed to play recording");
  });
});
