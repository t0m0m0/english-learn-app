import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListeningPlayer } from "./ListeningPlayer";
import type { ListeningQuestion } from "../types";

// Mock useAudio
vi.mock("../hooks/useAudio", () => ({
  useAudio: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    isSpeaking: false,
    isReady: true,
    error: null,
    availableVoices: [],
    loadVoices: vi.fn(),
    speakSequence: vi.fn(),
    cancelSequence: vi.fn(),
  }),
}));

const mockQuestions: ListeningQuestion[] = [
  {
    id: "q1",
    passageId: "p1",
    type: "multiple_choice",
    question: "What does Sarah order?",
    options: JSON.stringify([
      "A cappuccino and a muffin",
      "A tea and a cookie",
      "A latte and a cake",
      "A coffee and a sandwich",
    ]),
    answer: "A cappuccino and a muffin",
    order: 1,
  },
  {
    id: "q2",
    passageId: "p1",
    type: "true_false",
    question: "The barista does not know Sarah's name.",
    options: null,
    answer: "false",
    order: 2,
  },
  {
    id: "q3",
    passageId: "p1",
    type: "fill_blank",
    question: "She orders a large ____ every morning.",
    options: null,
    answer: "cappuccino",
    order: 3,
  },
];

const passageText =
  "Sarah walks into a coffee shop every morning. She orders a large cappuccino and a blueberry muffin. The barista knows her name because she comes every day.";

const mockOnComplete = vi.fn();
const mockOnRecordProgress = vi.fn().mockResolvedValue(undefined);

describe("ListeningPlayer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockOnRecordProgress.mockResolvedValue(undefined);
  });

  it("renders the first question", () => {
    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("What does Sarah order?")).toBeInTheDocument();
  });

  it("renders multiple choice options", () => {
    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    expect(
      screen.getByText("A cappuccino and a muffin"),
    ).toBeInTheDocument();
    expect(screen.getByText("A tea and a cookie")).toBeInTheDocument();
    expect(screen.getByText("A latte and a cake")).toBeInTheDocument();
    expect(screen.getByText("A coffee and a sandwich")).toBeInTheDocument();
  });

  it("shows correct feedback on correct multiple choice answer", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    await user.click(screen.getByText("A cappuccino and a muffin"));

    await waitFor(() => {
      expect(screen.getByText(/Correct/)).toBeInTheDocument();
    });
    expect(mockOnRecordProgress).toHaveBeenCalledWith("q1", true);
  });

  it("shows incorrect feedback on wrong answer", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    await user.click(screen.getByText("A tea and a cookie"));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
    });
    expect(mockOnRecordProgress).toHaveBeenCalledWith("q1", false);
  });

  it("advances to the next question after answering", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    // Answer first question
    await user.click(screen.getByText("A cappuccino and a muffin"));

    // Click Next
    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Next"));

    // Should show second question (true/false)
    await waitFor(() => {
      expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
    });
    expect(
      screen.getByText("The barista does not know Sarah's name."),
    ).toBeInTheDocument();
  });

  it("renders true/false options for true_false questions", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    // Answer first question and go to second
    await user.click(screen.getByText("A cappuccino and a muffin"));
    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Next"));

    // Check true/false options
    await waitFor(() => {
      expect(screen.getByText("True")).toBeInTheDocument();
    });
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders text input for fill_blank questions", async () => {
    // Render only the fill_blank question
    render(
      <ListeningPlayer
        questions={[mockQuestions[2]]}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
  });

  it("handles fill_blank answer submission", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={[mockQuestions[2]]}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    const input = screen.getByPlaceholderText("Type your answer...");
    await user.type(input, "cappuccino");
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });
    expect(mockOnRecordProgress).toHaveBeenCalledWith("q3", true);
  });

  it("calls onComplete after the last question", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={[mockQuestions[0]]}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    // Answer the only question
    await user.click(screen.getByText("A cappuccino and a muffin"));

    // Click Finish
    await waitFor(() => {
      expect(screen.getByText("Finish")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Finish"));

    expect(mockOnComplete).toHaveBeenCalledWith({
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
    });
  });

  it("toggles transcript visibility", async () => {
    const user = userEvent.setup();

    render(
      <ListeningPlayer
        questions={mockQuestions}
        passageText={passageText}
        onComplete={mockOnComplete}
        onRecordProgress={mockOnRecordProgress}
      />,
    );

    // Transcript should be hidden initially
    expect(screen.queryByText(passageText)).not.toBeInTheDocument();

    // Click to show transcript
    await user.click(screen.getByText("Show Transcript"));

    expect(screen.getByText(passageText)).toBeInTheDocument();
  });
});
