"use client";

import { signIn } from "next-auth/react";

// Header "Sign in" — goes straight to Google (the production sign-in method).
// The email/password form lives on its own /signin screen for local/E2E use
// (ADR-006). A button, not a link, so the common case is one tap to Google.
export function SignInButton() {
  return (
    <button
      type="button"
      className="text-sm font-medium"
      onClick={() => signIn("google", { callbackUrl: "/" })}
    >
      Sign in
    </button>
  );
}
