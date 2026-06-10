import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AdminMenu } from "./admin-menu";

// AdminMenu reads the current path to scope its per-league links; stub it to a
// league route so the menu has links to render.
vi.mock("next/navigation", () => ({
  usePathname: () => "/l/bsc-doubles-squash/admin/players",
}));

describe("AdminMenu", () => {
  it("renders a hamburger trigger labelled for the menu", () => {
    render(<AdminMenu role="ADMIN" />);
    // The trigger is an icon button (hamburger); it keeps an accessible name so
    // the E2E + assistive tech can find it.
    const trigger = screen.getByRole("button", { name: /menu/i });
    expect(trigger).toBeInTheDocument();
    // Links stay collapsed until opened (open behaviour covered by e2e).
    expect(screen.queryByText("Players")).toBeNull();
  });
});
