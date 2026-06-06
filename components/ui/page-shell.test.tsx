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

  it("renders an optional back link above the title", () => {
    render(
      <PageShell title="Petros M." back={{ href: "/", label: "Ladder" }}>
        content
      </PageShell>,
    );
    const link = screen.getByRole("link", { name: /ladder/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
