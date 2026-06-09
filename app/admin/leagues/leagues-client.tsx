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
  revokeScorerAction,
} from "./actions";

type Scorer = { id: string; name: string; email: string };
type League = {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  scorers: Scorer[];
};

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

  // Edit-league dialog (name + display name; slug permanent — ADR-013). Also the
  // home for scorer management: list current scorers, add (unassigned dropdown),
  // remove each.
  const [editing, setEditing] = useState<League | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplay, setEditDisplay] = useState("");
  const [addScorerId, setAddScorerId] = useState("");

  // The editing league re-read from the latest props, so the scorer list reflects
  // add/remove after router.refresh() without closing the dialog.
  const editingLive = editing
    ? (leagues.find((l) => l.id === editing.id) ?? editing)
    : null;
  const assignedIds = new Set(editingLive?.scorers.map((s) => s.id));
  const unassigned = scorers.filter((s) => !assignedIds.has(s.id));

  function openEdit(league: League) {
    setEditing(league);
    setEditName(league.name);
    setEditDisplay(league.displayName);
    setAddScorerId("");
    setRowError(null);
  }

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

  function handleAddScorer() {
    if (!editingLive || !addScorerId) return;
    setRowError(null);
    startTransition(async () => {
      const result = await assignScorerAction(addScorerId, editingLive.id);
      if (result.ok) {
        setAddScorerId("");
        router.refresh();
      } else {
        setRowError(result.error);
      }
    });
  }

  function handleRemoveScorer(userId: string) {
    if (!editingLive) return;
    setRowError(null);
    startTransition(async () => {
      const result = await revokeScorerAction(userId, editingLive.id);
      if (result.ok) router.refresh();
      else setRowError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Add League</Button>
      </div>

      {rowError && !editing && (
        <p className="text-destructive text-sm">{rowError}</p>
      )}

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
                  <p className="text-muted-foreground text-sm">{league.slug}</p>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
                  <span className="text-muted-foreground mr-auto text-sm sm:mr-2">
                    {league.scorers.length}{" "}
                    {league.scorers.length === 1 ? "scorer" : "scorers"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openEdit(league)}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

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
            URL slug: {addSlug || "your-slug"} — permanent once created.
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
          {editingLive && (
            <p className="text-muted-foreground text-xs">
              Slug: {editingLive.slug} — permanent, can&rsquo;t be changed.
            </p>
          )}

          {/* Scorer management (assign multiple, remove each). */}
          <div className="border-border mt-2 border-t pt-3">
            <p className="mb-2 text-sm font-medium">Scorers</p>
            {editingLive && editingLive.scorers.length > 0 ? (
              <ul className="mb-3 flex flex-col gap-2">
                {editingLive.scorers.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {s.name}{" "}
                      <span className="text-muted-foreground">({s.email})</span>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRemoveScorer(s.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-3 text-sm">
                No scorers assigned yet.
              </p>
            )}

            {scorers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No scorers exist — add one on the{" "}
                <a href="/admin/users" className="text-primary hover:underline">
                  Users
                </a>{" "}
                page first.
              </p>
            ) : unassigned.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Every scorer is already assigned.
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <label className="flex-1 text-sm">
                  <span className="sr-only">Add scorer</span>
                  <select
                    aria-label="Add scorer"
                    className={SELECT_CLASS}
                    value={addScorerId}
                    onChange={(e) => setAddScorerId(e.target.value)}
                  >
                    <option value="">Select a scorer…</option>
                    {unassigned.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || !addScorerId}
                  onClick={handleAddScorer}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {rowError && editing && (
            <p className="text-destructive text-sm">{rowError}</p>
          )}
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
