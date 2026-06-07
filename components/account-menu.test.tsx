import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

import { AccountMenu } from "./account-menu";

describe("AccountMenu", () => {
  it("renders the avatar as the account-menu trigger", () => {
    render(
      <AccountMenu name="Alice" email="alice@x.com" image={null} />,
    );
    // The avatar is the trigger; it carries an accessible account name.
    expect(
      screen.getByRole("button", { name: /account/i }),
    ).toBeInTheDocument();
    // Menu items stay collapsed until opened (open behaviour covered by e2e).
    expect(screen.queryByText("Sign out")).toBeNull();
  });
});
