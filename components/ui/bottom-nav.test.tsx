import { render, screen } from "@testing-library/react";
import { BottomNav } from "./bottom-nav";

const SLUG = "bsc-doubles-squash";

describe("BottomNav", () => {
  it("shows public tabs when logged out", () => {
    render(<BottomNav role={undefined} slug={SLUG} pathname={`/l/${SLUG}`} />);
    expect(screen.getByRole("link", { name: /ladder/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sessions/i })).toBeInTheDocument();
  });

  it("does not show Submit when logged out", () => {
    render(<BottomNav role={undefined} slug={SLUG} pathname={`/l/${SLUG}`} />);
    expect(screen.queryByRole("link", { name: /submit/i })).not.toBeInTheDocument();
  });

  it("shows Submit for a scorer", () => {
    render(<BottomNav role="SCORER" slug={SLUG} pathname={`/l/${SLUG}`} />);
    expect(screen.getByRole("link", { name: /submit/i })).toBeInTheDocument();
  });

  it("links the tabs to the current league", () => {
    render(<BottomNav role="SCORER" slug={SLUG} pathname={`/l/${SLUG}`} />);
    expect(screen.getByRole("link", { name: /submit/i })).toHaveAttribute(
      "href",
      `/l/${SLUG}/submit`,
    );
  });

  it("marks the active tab via aria-current", () => {
    render(
      <BottomNav role={undefined} slug={SLUG} pathname={`/l/${SLUG}/sessions`} />,
    );
    expect(screen.getByRole("link", { name: /sessions/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /ladder/i })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
