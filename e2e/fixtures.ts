// Ephemeral E2E test users. Created in global-setup, deleted in global-teardown.
// They never appear in the seed, so real data stays clean.
export const TEST_ADMIN = {
  email: "testadmin@bsc.local",
  name: "TestAdmin",
  role: "ADMIN" as const,
  password: "test-admin-pw",
};

export const TEST_SCORER = {
  email: "testscorer@bsc.local",
  name: "TestScorer",
  role: "SCORER" as const,
  password: "test-scorer-pw",
};

// An email that is deliberately never created — used to verify the allowlist
// denies unknown accounts (step 04 behaviour 8).
export const NON_ALLOWLISTED = {
  email: "stranger@bsc.local",
  password: "whatever",
};

export const TEST_USER_EMAILS = [TEST_ADMIN.email, TEST_SCORER.email];
