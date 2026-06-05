import { execFileSync } from "node:child_process";

// Create the ephemeral test users. Runs the DB work under tsx (a separate
// process) so the generated ESM Prisma client loads cleanly — Playwright's
// own module loader cannot require() it.
export default function globalSetup() {
  execFileSync("npx", ["tsx", "e2e/manage-test-users.ts", "setup"], {
    stdio: "inherit",
  });
}
