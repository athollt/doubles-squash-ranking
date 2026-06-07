import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// signIn never resolves here, so the form stays in its pending state after submit
// — letting us assert the button shows visible feedback (the reported bug: the
// button "doesn't respond" though it works).
const signIn = vi.fn(() => new Promise(() => {}));
vi.mock("next-auth/react", () => ({ signIn: (...a: unknown[]) => signIn(...a) }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { SignInForm } from "./signin-form";

describe("SignInForm", () => {
  it("shows a pending label on the button after submit", async () => {
    render(<SignInForm />);
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "a@x.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("button", { name: /signing in/i }),
    ).toBeDisabled();
  });
});
