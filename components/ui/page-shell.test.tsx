import { render, screen } from "@testing-library/react";
import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders the page title as a level-1 heading", () => {
    render(<PageShell title="Ladder">content</PageShell>);
    expect(screen.getByRole("heading", { level: 1, name: "Ladder" })).toBeInTheDocument();
  });

  it("renders its children inside a main landmark", () => {
    render(<PageShell title="Ladder">the ladder table</PageShell>);
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("the ladder table");
  });
});
