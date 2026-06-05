import { execFileSync } from "node:child_process";

// Delete the ephemeral test users and any [e2e]-tagged players. Runs under tsx
// (separate process) for the same reason as global-setup.
export default function globalTeardown() {
  execFileSync("npx", ["tsx", "e2e/manage-test-users.ts", "teardown"], {
    stdio: "inherit",
  });
}
