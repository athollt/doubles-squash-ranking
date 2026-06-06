import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Petros M.</Card>);
    expect(screen.getByText("Petros M.")).toBeInTheDocument();
  });

  it("renders an optional title above the content", () => {
    render(<Card title="Recent sessions">a session</Card>);
    expect(screen.getByText("Recent sessions")).toBeInTheDocument();
    expect(screen.getByText("a session")).toBeInTheDocument();
  });
});
