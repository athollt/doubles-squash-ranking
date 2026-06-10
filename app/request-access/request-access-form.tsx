"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requestAccessAction } from "./actions";

type League = { id: string; displayName: string };

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm";
// Sentinel for the "set up a new league" choice (distinct from a real id).
const NEW_LEAGUE = "__new__";

// "Request access" (stories #18 + new-league intake): pick an existing league to
// score for, or "set up a new league", optionally add notes, and submit. On
// success the page shows a confirmation; an admin reviews it in the queue.
export function RequestAccessForm({ leagues }: { leagues: League[] }) {
  const [choice, setChoice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isNewLeague = choice === NEW_LEAGUE;

  function submit() {
    setError(null);
    const leagueId = isNewLeague ? null : choice;
    startTransition(async () => {
      const result = await requestAccessAction(leagueId, notes);
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  if (done) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium">Request sent ✓</p>
        <p className="text-muted-foreground mt-1 text-sm">
          An admin will review your request and get you set up. There&rsquo;s
          nothing more to do for now.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="league">
        Which league do you help run?
      </label>
      <select
        id="league"
        className={SELECT_CLASS}
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="">Select a league…</option>
        {leagues.map((l) => (
          <option key={l.id} value={l.id}>
            {l.displayName}
          </option>
        ))}
        <option value={NEW_LEAGUE}>Set up a new league…</option>
      </select>

      <label className="text-sm font-medium" htmlFor="notes">
        Notes <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={
          isNewLeague
            ? "Tell the admin about the new league — sport, club, roughly how many players."
            : "Anything that helps the admin place you (e.g. which nights you score)."
        }
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={submit} disabled={isPending || choice === ""}>
        {isPending ? "Sending…" : "Request access"}
      </Button>
    </div>
  );
}
