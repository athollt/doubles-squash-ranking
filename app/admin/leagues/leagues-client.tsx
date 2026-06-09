"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { suggestSlug } from "@/lib/slug";
import { createLeagueAction, assignScorerAction } from "./actions";

type League = { id: string; slug: string; displayName: string };

export function LeaguesClient({ leagues }: { leagues: League[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create-league form. The slug is suggested from the name and stays in sync
  // until the admin edits it by hand (slugEdited), after which it's left alone.
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function onNameChange(value: string) {
    setName(value);
    if (!displayName) setDisplayName(value);
    if (!slugEdited) setSlug(suggestSlug(value));
  }

  function handleCreate() {
    setCreateError(null);
    startTransition(async () => {
      const result = await createLeagueAction(name, displayName || name, slug);
      if (result.ok) {
        setName("");
        setDisplayName("");
        setSlug("");
        setSlugEdited(false);
        router.refresh();
      } else {
        setCreateError(result.error);
      }
    });
  }

  // Assign-scorer form.
  const [email, setEmail] = useState("");
  const [scorerName, setScorerName] = useState("");
  const [leagueId, setLeagueId] = useState(leagues[0]?.id ?? "");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);

  function handleAssign() {
    setAssignError(null);
    setAssigned(false);
    startTransition(async () => {
      const result = await assignScorerAction(email, scorerName, leagueId);
      if (result.ok) {
        setEmail("");
        setScorerName("");
        setAssigned(true);
        router.refresh();
      } else {
        setAssignError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <h2 className="font-heading mb-3 text-lg font-bold">Create a league</h2>
        <div className="flex flex-col gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <Input
              aria-label="League name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Padel Tuesdays"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Display name</span>
            <Input
              aria-label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Padel Tuesdays @ The Club"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Slug (URL)</span>
            <Input
              aria-label="Slug"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              placeholder="padel-tuesdays"
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              The ladder lives at /l/{slug || "your-slug"} — permanent once created.
            </span>
          </label>
          {createError && (
            <p className="text-destructive text-sm">{createError}</p>
          )}
          <div>
            <Button type="button" onClick={handleCreate} disabled={isPending}>
              Create league
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-heading mb-3 text-lg font-bold">Assign a scorer</h2>
        {leagues.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Create a league first.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <Input
                aria-label="Scorer email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scorer@club.test"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Name</span>
              <Input
                aria-label="Scorer name"
                value={scorerName}
                onChange={(e) => setScorerName(e.target.value)}
                placeholder="Jordan"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">League</span>
              <select
                aria-label="League"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="border-input h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.displayName}
                  </option>
                ))}
              </select>
            </label>
            {assignError && (
              <p className="text-destructive text-sm">{assignError}</p>
            )}
            {assigned && (
              <p className="text-sm text-[var(--up)]">Scorer assigned ✓</p>
            )}
            <div>
              <Button type="button" onClick={handleAssign} disabled={isPending}>
                Assign scorer
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
