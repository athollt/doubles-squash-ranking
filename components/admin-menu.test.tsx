import { render, screen } from "@testing-library/react";
import { AdminMenu } from "./admin-menu";

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
