"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { suggestSlug } from "@/lib/slug";
import {
  createLeagueAction,
  updateLeagueAction,
  assignScorerAction,
} from "./actions";

type League = { id: string; name: string; slug: string; displayName: string };
type Scorer = { id: string; name: string; email: string };

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm";

export function LeaguesClient({
  leagues,
  scorers,
}: {
  leagues: League[];
  scorers: Scorer[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rowError, setRowError] = useState<string | null>(null);

  // Add-league dialog. Slug is suggested from the name until hand-edited.
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDisplay, setAddDisplay] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function onAddNameChange(value: string) {
    setAddName(value);
    // Display name mirrors the name unless the admin has typed their own.
    setAddDisplay((d) => (d === "" || d === addName ? value : d));
    if (!slugEdited) setAddSlug(suggestSlug(value));
  }

  function handleAdd() {
    setAddError(null);
    startTransition(async () => {
      const result = await createLeagueAction(
        addName,
        addDisplay || addName,
        addSlug,
      );
      if (result.ok) {
        setAddName("");
        setAddDisplay("");
        setAddSlug("");
        setSlugEdited(false);
        setAddOpen(false);
        router.refresh();
      } else {
        setAddError(result.error);
      }
    });
  }

  // Edit-league dialog (name + display name; slug is permanent — ADR-013).
  const [editing, setEditing] = useState<League | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplay, setEditDisplay] = useState("");

  function handleSaveEdit() {
    if (!editing) return;
    setRowError(null);
    startTransition(async () => {
      const result = await updateLeagueAction(editing.id, editName, editDisplay);
      if (result.ok) {
        setEditing(null);
        router.refresh();
      } else {
        setRowError(result.error);
      }
    });
  }

  // Assign-scorer card.
  const [scorerId, setScorerId] = useState(scorers[0]?.id ?? "");
  const [assignLeagueId, setAssignLeagueId] = useState(leagues[0]?.id ?? "");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);

  function handleAssign() {
    setAssignError(null);
    setAssigned(false);
    startTransition(async () => {
      const result = await assignScorerAction(scorerId, assignLeagueId);
      if (result.ok) {
        setAssigned(true);
        router.refresh();
      } else {
        setAssignError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAddOpen(true)}>Add League</Button>
        </div>

        {rowError && <p className="text-destructive text-sm">{rowError}</p>}

        {leagues.length === 0 ? (
          <p className="text-muted-foreground">No leagues yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {leagues.map((league) => (
              <li key={league.id}>
                <Card
                  role="group"
                  aria-label={league.displayName}
                  className="p-3 sm:flex sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{league.displayName}</p>
                    <p className="text-muted-foreground text-sm">
                      /l/{league.slug}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => {
                        setEditing(league);
                        setEditName(league.name);
                        setEditDisplay(league.displayName);
                        setRowError(null);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card className="p-4">
        <h2 className="font-heading mb-3 text-lg font-bold">Assign a scorer</h2>
        {leagues.length === 0 ? (
          <p className="text-muted-foreground text-sm">Create a league first.</p>
        ) : scorers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No scorers yet — add one on the{" "}
            <a href="/admin/users" className="text-primary hover:underline">
              Users
            </a>{" "}
            page first.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Scorer</span>
              <select
                aria-label="Scorer"
                className={SELECT_CLASS}
                value={scorerId}
                onChange={(e) => setScorerId(e.target.value)}
              >
                {scorers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">League</span>
              <select
                aria-label="League"
                className={SELECT_CLASS}
                value={assignLeagueId}
                onChange={(e) => setAssignLeagueId(e.target.value)}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add League</DialogTitle>
          </DialogHeader>
          <Input
            aria-label="League name"
            placeholder="Name (e.g. Padel Tuesdays)"
            value={addName}
            onChange={(e) => onAddNameChange(e.target.value)}
            autoFocus
          />
          <Input
            aria-label="Display name"
            placeholder="Display name"
            value={addDisplay}
            onChange={(e) => setAddDisplay(e.target.value)}
          />
          <Input
            aria-label="Slug"
            placeholder="slug"
            value={addSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setAddSlug(e.target.value);
            }}
          />
          <p className="text-muted-foreground text-xs">
            The ladder lives at /l/{addSlug || "your-slug"} — permanent once created.
          </p>
          {addError && <p className="text-destructive text-sm">{addError}</p>}
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit League</DialogTitle>
          </DialogHeader>
          <Input
            aria-label="League name"
            placeholder="Name"
            value={editName}
            disabled={isPending}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <Input
            aria-label="Display name"
            placeholder="Display name"
            value={editDisplay}
            disabled={isPending}
            onChange={(e) => setEditDisplay(e.target.value)}
          />
          {editing && (
            <p className="text-muted-foreground text-xs">
              /l/{editing.slug} — the slug is permanent and can&rsquo;t be changed.
            </p>
          )}
          {rowError && <p className="text-destructive text-sm">{rowError}</p>}
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
