import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DictionaryLink } from "./DictionaryLink";

describe("DictionaryLink", () => {
  const testWord = "example";

  describe("renders dictionary links", () => {
    it("renders Cambridge Dictionary link with correct URL", () => {
      render(<DictionaryLink word={testWord} />);
      const link = screen.getByRole("link", { name: /cambridge/i });
      expect(link).toHaveAttribute(
        "href",
        `https://dictionary.cambridge.org/dictionary/english/${testWord}`,
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders Merriam-Webster link with correct URL", () => {
      render(<DictionaryLink word={testWord} />);
      const link = screen.getByRole("link", { name: /merriam-webster/i });
      expect(link).toHaveAttribute(
        "href",
        `https://www.merriam-webster.com/dictionary/${testWord}`,
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders Oxford link with correct URL", () => {
      render(<DictionaryLink word={testWord} />);
      const link = screen.getByRole("link", { name: /oxford/i });
      expect(link).toHaveAttribute(
        "href",
        `https://www.oxfordlearnersdictionaries.com/definition/english/${testWord}`,
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("handles special characters", () => {
    it("encodes word with spaces", () => {
      render(<DictionaryLink word="ice cream" />);
      const link = screen.getByRole("link", { name: /cambridge/i });
      expect(link).toHaveAttribute(
        "href",
        "https://dictionary.cambridge.org/dictionary/english/ice%20cream",
      );
    });

    it("encodes word with special characters", () => {
      render(<DictionaryLink word="it's" />);
      const link = screen.getByRole("link", { name: /cambridge/i });
      expect(link).toHaveAttribute(
        "href",
        "https://dictionary.cambridge.org/dictionary/english/it's",
      );
    });
  });

  describe("accessibility", () => {
    it("all links are accessible", () => {
      render(<DictionaryLink word={testWord} />);
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
      links.forEach((link) => {
        expect(link).toBeVisible();
      });
    });
  });
});
