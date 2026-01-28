import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ListeningPractice } from "./ListeningPractice";

const mockPassages = [
  {
    id: "p1",
    title: "At the Coffee Shop",
    text: "Sarah walks into a coffee shop.",
    difficulty: "beginner",
    topic: "daily life",
    order: 1,
    questions: [{ id: "q1" }, { id: "q2" }],
  },
  {
    id: "p2",
    title: "A Day at the Office",
    text: "John works at a technology company.",
    difficulty: "intermediate",
    topic: "work",
    order: 2,
    questions: [{ id: "q3" }, { id: "q4" }, { id: "q5" }],
  },
  {
    id: "p3",
    title: "Climate Change",
    text: "Climate change is a pressing challenge.",
    difficulty: "advanced",
    topic: "environment",
    order: 3,
    questions: [{ id: "q6" }, { id: "q7" }, { id: "q8" }, { id: "q9" }],
  },
];

vi.mock("../services/api", () => ({
  listeningApi: {
    getPassages: vi.fn(() => Promise.resolve({ passages: mockPassages })),
  },
}));

import { listeningApi } from "../services/api";

describe("ListeningPractice", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (listeningApi.getPassages as ReturnType<typeof vi.fn>).mockResolvedValue({
      passages: mockPassages,
    });
  });

  it("renders page title", async () => {
    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    expect(screen.getByText("Listening Practice")).toBeInTheDocument();
  });

  it("renders passages after loading", async () => {
    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("At the Coffee Shop")).toBeInTheDocument();
    });
    expect(screen.getByText("A Day at the Office")).toBeInTheDocument();
    expect(screen.getByText("Climate Change")).toBeInTheDocument();
  });

  it("shows difficulty badges", async () => {
    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("beginner")).toBeInTheDocument();
    });
    expect(screen.getByText("intermediate")).toBeInTheDocument();
    expect(screen.getByText("advanced")).toBeInTheDocument();
  });

  it("shows question count for each passage", async () => {
    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("2 questions")).toBeInTheDocument();
    });
    expect(screen.getByText("3 questions")).toBeInTheDocument();
    expect(screen.getByText("4 questions")).toBeInTheDocument();
  });

  it("filters passages by difficulty", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("At the Coffee Shop")).toBeInTheDocument();
    });

    // Click beginner filter
    await user.click(screen.getByRole("button", { name: /Beginner/i }));

    expect(listeningApi.getPassages).toHaveBeenCalledWith("beginner");
  });

  it("shows error state on API failure", async () => {
    (listeningApi.getPassages as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(
      <MemoryRouter>
        <ListeningPractice />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });
});
