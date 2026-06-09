import { Card } from "@/components/ui/card";

// Player-facing "How ratings work" — the plain-English version of
// docs/RATING-ALGORITHM.md, validated against lib/rating-engine.ts. Refers to the
// settings by name (not value) so it stays true when an admin edits them below.
export function RatingExplainer() {
  return (
    <Card className="space-y-3 p-4 text-sm leading-relaxed">
      <h2 className="font-heading text-lg font-bold">How ratings work</h2>

      <p>
        Every time a session is submitted, edited, or deleted, all ratings are{" "}
        <strong>recalculated from scratch</strong> — the whole history is replayed
        in order, so the ladder is always consistent with the raw results. Partners
        and opponents aren&apos;t recorded; the engine only knows who played and how
        many games each won.
      </p>

      <p>
        For each session, a player&apos;s actual <strong>share</strong> of the games
        won is compared with the share their current rating predicts against{" "}
        <em>that</em> set of opponents (a higher-rated player is expected to win a
        bigger share). Win more than expected and your rating rises; less, and it
        falls. The size of the move scales with the <em>K-factor</em>, with the
        session&apos;s length (longer sessions count for a little more, with
        diminishing returns), and with any new- or returning-player boost.
      </p>

      <p>
        A <strong>new player</strong> gets a larger multiplier for their first few
        sessions so they find their level quickly, and a player returning after a
        long absence gets a similar boost for a few sessions. After that, moves
        settle to the normal size.
      </p>

      <p>
        The ladder ranks by <strong>ladder score</strong>, which is a player&apos;s
        rating plus an <strong>activity bonus</strong> — a small reward for each
        recent session, up to a cap — so turning up regularly counts for something.
        Active players (who&apos;ve played recently) are listed first, then inactive
        ones; players still in their opening sessions are flagged as provisional.
      </p>

      <p className="text-muted-foreground">
        The exact numbers — the K-factor, the strength scale, the boost sizes and
        windows, the activity bonus and the active threshold — are the settings
        below, and an admin can tune them. Changing one and saving recalculates the
        whole ladder.
      </p>
    </Card>
  );
}
