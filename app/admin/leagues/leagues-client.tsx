"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  deleteLeagueAction,
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
  counts: { players: number; sessions: number; ratings: number };
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

  // Clear the add form so reopening the dialog always starts blank (the fields
  // are real inputs, not placeholders — leftover text from a previous open would
  // look like a default).
  function resetAddForm() {
    setAddName("");
    setAddDisplay("");
    setAddSlug("");
    setSlugEdited(false);
    setAddError(null);
  }

  function openAdd() {
    resetAddForm();
    setAddOpen(true);
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
        resetAddForm();
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

  // Delete-league confirmation. `deleting` holds the league pending confirmation;
  // the modal shows what will be destroyed and only then calls the action.
  const [deleting, setDeleting] = useState<League | null>(null);

  function handleConfirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    setRowError(null);
    startTransition(async () => {
      const result = await deleteLeagueAction(id);
      if (result.ok) {
        setDeleting(null);
        router.refresh();
      } else {
        setRowError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>Add League</Button>
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
                {/* Click the name/slug to view the league's ladder (like the
                    landing list). Edit/Delete are separate controls. */}
                <Link
                  href={`/l/${league.slug}`}
                  className="group/row min-w-0 flex-1"
                >
                  <p className="group-hover/row:text-primary truncate font-medium">
                    {league.displayName}
                    <span aria-hidden className="text-primary ml-1">
                      ›
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm">{league.slug}</p>
                </Link>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setDeleting(league);
                      setRowError(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add League</DialogTitle>
          </DialogHeader>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <Input
              aria-label="League name"
              placeholder="e.g. Padel Tuesdays"
              value={addName}
              onChange={(e) => onAddNameChange(e.target.value)}
              autoFocus
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Internal name for this league.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Display name</span>
            <Input
              aria-label="Display name"
              placeholder="e.g. Padel Tuesdays @ BSC"
              value={addDisplay}
              onChange={(e) => setAddDisplay(e.target.value)}
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Shown to players on the ladder and in the league list.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Slug (URL)</span>
            <Input
              aria-label="Slug"
              placeholder="slug"
              value={addSlug}
              onChange={(e) => {
                setSlugEdited(true);
                setAddSlug(e.target.value);
              }}
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              /l/{addSlug || "your-slug"} — permanent once created.
            </span>
          </label>
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
          <label className="text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <Input
              aria-label="League name"
              placeholder="Name"
              value={editName}
              disabled={isPending}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Internal name for this league.
            </span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Display name</span>
            <Input
              aria-label="Display name"
              placeholder="Display name"
              value={editDisplay}
              disabled={isPending}
              onChange={(e) => setEditDisplay(e.target.value)}
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Shown to players on the ladder and in the league list.
            </span>
          </label>
          {editingLive && (
            <div className="text-sm">
              <span className="mb-1 block font-medium">Slug (URL)</span>
              <p className="text-muted-foreground text-xs">
                /l/{editingLive.slug} — permanent, can&rsquo;t be changed.
              </p>
            </div>
          )}

          {/* Scorer management: add control on top, current-scorer list below,
              then a status note. */}
          <div className="border-border mt-2 border-t pt-3">
            <p className="mb-2 text-sm font-medium">Scorers</p>

            {/* Add control — only when there is someone left to add. */}
            {unassigned.length > 0 && (
              <div className="mb-3 flex items-end gap-2">
                <label className="min-w-0 flex-1 text-sm">
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
                  className="shrink-0"
                  disabled={isPending || !addScorerId}
                  onClick={handleAddScorer}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Current scorers. */}
            {editingLive && editingLive.scorers.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {editingLive.scorers.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {s.name}{" "}
                      <span className="text-muted-foreground">({s.email})</span>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0"
                      disabled={isPending}
                      onClick={() => handleRemoveScorer(s.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No scorers assigned yet.
              </p>
            )}

            {/* Status note below the list. */}
            {scorers.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-xs">
                No scorers exist yet — add one on the{" "}
                <a href="/admin/users" className="text-primary hover:underline">
                  Users
                </a>{" "}
                page first.
              </p>
            ) : (
              unassigned.length === 0 && (
                <p className="text-muted-foreground mt-3 text-xs">
                  Every scorer is already assigned.
                </p>
              )
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

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete league?</DialogTitle>
          </DialogHeader>
          {deleting && (
            <div className="space-y-3 text-sm">
              <p>
                This permanently deletes{" "}
                <span className="font-medium">{deleting.displayName}</span> and
                everything in it. This cannot be undone.
              </p>
              <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                <li>
                  {deleting.counts.players}{" "}
                  {deleting.counts.players === 1 ? "player" : "players"}
                </li>
                <li>
                  {deleting.counts.sessions}{" "}
                  {deleting.counts.sessions === 1 ? "session" : "sessions"}
                </li>
                <li>
                  {deleting.counts.ratings} rating{" "}
                  {deleting.counts.ratings === 1 ? "record" : "records"} and all
                  ladder history
                </li>
                <li>all scorer assignments and rating settings</li>
              </ul>
              <p className="text-muted-foreground">
                The ladder at /l/{deleting.slug} will stop working.
              </p>
            </div>
          )}
          {rowError && deleting && (
            <p className="text-destructive text-sm">{rowError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              Delete league
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
