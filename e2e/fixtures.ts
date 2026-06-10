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

// A non-staff signed-in user (step 23): a SCORER-role account with a password
// but NO league grant, so bounceTarget routes them to /request-access — the
// E2E-credentials stand-in for a fresh Google user with no access. After the
// admin approves their request they gain a grant and can act on that league.
export const TEST_NONSTAFF = {
  email: "testnonstaff@bsc.local",
  name: "TestNonStaff",
  role: "SCORER" as const,
  password: "test-nonstaff-pw",
};

export const TEST_USER_EMAILS = [
  TEST_ADMIN.email,
  TEST_SCORER.email,
  TEST_NONSTAFF.email,
];

// The seed league slug (step 21). Public + scorer/admin league routes live under
// /l/{slug}; lpath() builds them so specs stay slug-aware.
export const LEAGUE_SLUG = "bsc-doubles-squash";
export function lpath(sub = ""): string {
  return sub ? `/l/${LEAGUE_SLUG}/${sub}` : `/l/${LEAGUE_SLUG}`;
}

// A second, ephemeral league used to verify cross-league authz: the test scorer
// is granted the BSC league but NOT this one, so its scorer routes must bounce
// them to /unauthorised. Created in global-setup, removed in teardown.
export const OTHER_LEAGUE = {
  slug: "e2e-other-league",
  name: "[e2e] Other League",
};
