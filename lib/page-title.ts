// Title strings for league-scoped pages (step 24, ADR-013). The root layout's
// metadata template appends " — Rungs" to a page's own title; a league page wants
// its own absolute title showing the *league's* name (not Rungs), e.g.
// "Ladder — Doubles Squash @ BSC". Pure so it is unit-testable; the page's
// generateMetadata supplies the resolved league displayName and returns
// `{ title: { absolute } }` to bypass the template.
export function leaguePageTitle(label: string, displayName: string): string {
  return `${label} — ${displayName}`;
}
