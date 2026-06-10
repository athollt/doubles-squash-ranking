// Title for league-scoped pages (step 24, ADR-013): the Rungs brand leads, then
// the league's display name — "Rungs - Doubles Squash @ BSC", the same across a
// league's pages (no per-page label). Pure so it is unit-testable; the page's
// generateMetadata supplies the resolved league displayName and returns
// `{ title: { absolute } }` to bypass the layout's "%s — Rungs" template.
export function leaguePageTitle(displayName: string): string {
  return `Rungs - ${displayName}`;
}
