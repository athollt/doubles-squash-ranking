"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Header "Sign in" — goes straight to Google (the production sign-in method).
// The email/password form lives on its own /signin screen for local/E2E use
// (ADR-006). Uses the design-system Button so the press is visibly acknowledged,
// and shows a pending label while the Google redirect is initiated.
export function SignInButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() => {
        setPending(true);
        signIn("google", { callbackUrl: "/" });
      }}
    >
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
