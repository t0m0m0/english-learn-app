import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("displays current and total values", () => {
    render(<ProgressBar current={50} total={100} />);
    expect(screen.getByText("50 / 100")).toBeInTheDocument();
  });

  it("calculates and displays percentage correctly", () => {
    render(<ProgressBar current={25} total={100} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("displays label when provided", () => {
    render(<ProgressBar current={10} total={50} label="Progress" />);
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("hides percentage when showPercentage is false", () => {
    render(<ProgressBar current={50} total={100} showPercentage={false} />);
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("handles zero total without error", () => {
    render(<ProgressBar current={0} total={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("formats large numbers with locale string", () => {
    render(<ProgressBar current={1000} total={10000} />);
    expect(screen.getByText("1,000 / 10,000")).toBeInTheDocument();
  });
});
