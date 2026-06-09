import { render, screen } from "@testing-library/react";
import { RatingExplainer } from "./rating-explainer";

describe("RatingExplainer", () => {
  it("renders a How-ratings-work overview heading", () => {
    render(<RatingExplainer />);
    expect(
      screen.getByRole("heading", { name: /how ratings work/i }),
    ).toBeInTheDocument();
  });

  it("explains the core mechanics in plain language", () => {
    render(<RatingExplainer />);
    const text = document.body.textContent ?? "";
    // The engine's defining behaviours (validated against lib/rating-engine.ts):
    expect(text).toMatch(/recalculat/i); // full recalculation every change
    expect(text).toMatch(/share/i); // actual vs expected share of wins
    expect(text).toMatch(/new player/i); // new-player boost
    expect(text).toMatch(/ladder score/i); // rating + activity bonus
    expect(text).toMatch(/activity bonus/i);
  });

  it("does not hard-code tunable values into the prose", () => {
    render(<RatingExplainer />);
    const text = document.body.textContent ?? "";
    // Numbers that live in Settings (e.g. K-factor 160, scale 400) must not be
    // baked into the copy — the prose refers to the settings, which an admin edits.
    expect(text).not.toMatch(/\b160\b/);
    expect(text).not.toMatch(/\b400\b/);
  });
});
