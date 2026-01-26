import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CallanProgressSection } from "./CallanProgressSection";
import type { CallanProgressSummary } from "../types";

const mockSummary: CallanProgressSummary = {
  totalLessons: 10,
  completedLessons: 3,
  totalQAItems: 150,
  practicedQAItems: 45,
  byMode: {
    qa: { total: 45, correct: 38, accuracy: 84 },
    shadowing: { total: 30, practiced: 25 },
    dictation: { total: 20, correct: 15, accuracy: 75 },
  },
  streakDays: 5,
};

describe("CallanProgressSection", () => {
  it("renders lesson completion progress", () => {
    render(<CallanProgressSection summary={mockSummary} />);

    // Check for lesson progress section
    expect(screen.getByText("レッスン進捗")).toBeInTheDocument();
    expect(screen.getAllByText(/レッスン完了/).length).toBeGreaterThan(0);
  });

  it("renders QA items practiced count", () => {
    render(<CallanProgressSection summary={mockSummary} />);

    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText(/Q&A練習済/)).toBeInTheDocument();
  });

  it("renders streak days", () => {
    render(<CallanProgressSection summary={mockSummary} />);

    // Check for streak banner
    expect(screen.getByText(/5日連続学習中/)).toBeInTheDocument();
  });

  it("renders mode statistics", () => {
    render(<CallanProgressSection summary={mockSummary} />);

    expect(screen.getByText("Q&A")).toBeInTheDocument();
    expect(screen.getByText(/シャドーイング/)).toBeInTheDocument();
    expect(screen.getByText(/ディクテーション/)).toBeInTheDocument();
    // Check accuracy values exist
    expect(screen.getAllByText(/84%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/75%/).length).toBeGreaterThan(0);
  });

  it("renders loading state", () => {
    render(<CallanProgressSection summary={null} loading={true} />);

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    const emptySummary: CallanProgressSummary = {
      totalLessons: 0,
      completedLessons: 0,
      totalQAItems: 0,
      practicedQAItems: 0,
      byMode: {
        qa: { total: 0, correct: 0, accuracy: 0 },
        shadowing: { total: 0, practiced: 0 },
        dictation: { total: 0, correct: 0, accuracy: 0 },
      },
      streakDays: 0,
    };

    render(<CallanProgressSection summary={emptySummary} />);

    expect(
      screen.getByText(/まだ練習を始めていません/),
    ).toBeInTheDocument();
  });
});
