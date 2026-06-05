import { Suspense } from "react";
import { SignInForm } from "./signin-form";

export const metadata = {
  title: "Sign in — Doubles Squash @ BSC",
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
