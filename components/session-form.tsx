"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Player = { id: string; name: string };

export interface FormSlot {
  playerId?: string;
  newName?: string;
  wins: number;
}

export type SessionFormResult = { ok: true } | { ok: false; error: string };

const NEW = "__new__";

// Persisted shape the edit page passes in (one per existing session player).
interface SlotState {
  playerId: string; // player id, "" (none), or NEW
  newName: string;
  wins: string;
}

// In-form entry: one selected player (existing or new), with a stable key so
// removing one doesn't reshuffle the others' React state.
interface Entry {
  key: number;
  playerId: string; // a real player id, or NEW for an on-the-fly player
  newName: string;
  wins: string;
}

interface Props {
  players: Player[];
  // Pre-populated slots/notes for edit; submit starts with nothing selected.
  initialSlots?: SlotState[];
  initialNotes?: string;
  submitLabel: string;
  onSubmit: (slots: FormSlot[], notes: string) => Promise<SessionFormResult>;
  // Optional delete (edit mode). Receives nothing; parent binds the id.
  onDelete?: () => Promise<SessionFormResult>;
}

// Courtside doubles capture (step 16.2, rev. single-grid): one "Choose players"
// grid where the scorer taps to select/unselect any number of players (+ "+ New"
// for on-the-fly creation). Each selected player gets a score block below, in
// selection order, with a segmented 0–9 "wins" selector. A flat list, no teams
// (the engine infers pairings). The public contract (props + FormSlot payload) is
// unchanged, so both /submit and the edit page reuse it; edit (initialSlots) opens
// with those players pre-selected.
export function SessionForm({
  players,
  initialSlots,
  initialNotes = "",
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(() =>
    (initialSlots ?? []).map((s, i) => ({
      key: i,
      playerId: s.playerId,
      newName: s.newName,
      wins: s.wins,
    })),
  );
  // Monotonic key source for entries added after mount; seeded past the initial
  // entries' indices. Only touched in event handlers, never during render.
  const keySeq = useRef((initialSlots?.length ?? 0));
  const nextKey = () => keySeq.current++;
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedIds = new Set(
    entries.filter((e) => e.playerId !== NEW).map((e) => e.playerId),
  );

  function togglePlayer(id: string) {
    setEntries((es) =>
      selectedIds.has(id)
        ? es.filter((e) => e.playerId !== id)
        : [...es, { key: nextKey(), playerId: id, newName: "", wins: "0" }],
    );
  }

  function addNew() {
    setEntries((es) => [
      ...es,
      { key: nextKey(), playerId: NEW, newName: "", wins: "0" },
    ]);
  }

  function patch(key: number, p: Partial<Entry>) {
    setEntries((es) => es.map((e) => (e.key === key ? { ...e, ...p } : e)));
  }

  function remove(key: number) {
    setEntries((es) => es.filter((e) => e.key !== key));
  }

  function toPayload(): FormSlot[] {
    return entries
      .filter((e) => e.playerId !== NEW || e.newName.trim() !== "")
      .map((e) => ({
        playerId: e.playerId === NEW ? undefined : e.playerId,
        newName: e.playerId === NEW ? e.newName : undefined,
        wins: Number(e.wins),
      }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(toPayload(), notes);
      if (result.ok) router.push("/");
      else setError(result.error);
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result.ok) router.push("/");
      else setError(result.error);
    });
  }

  // Stable 1-based ordinal for each on-the-fly entry, by creation order — so an
  // unnamed new block is labelled "New player N" regardless of how many others
  // are named. (Naming a block just swaps the label to the typed name.)
  const newOrdinal = new Map<number, number>();
  let n = 0;
  for (const e of entries) {
    if (e.playerId === NEW) newOrdinal.set(e.key, ++n);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Choose players"
        className="bg-card border-border flex flex-col gap-2 rounded-xl border p-3"
      >
        <p className="text-muted-foreground text-xs">Choose players</p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={selectedIds.has(p.id)}
              className={cn(
                "border-border rounded-full border px-3 py-2 text-sm font-medium",
                selectedIds.has(p.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background",
              )}
              onClick={() => togglePlayer(p.id)}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            className="border-primary text-primary rounded-full border border-dashed px-3 py-2 text-sm font-medium"
            onClick={addNew}
          >
            + New
          </button>
        </div>
      </div>

      {entries.map((e) => {
        const name =
          e.playerId === NEW
            ? e.newName.trim() || `New player ${newOrdinal.get(e.key)}`
            : (players.find((p) => p.id === e.playerId)?.name ?? "Player");
        return (
          <ScoreBlock
            key={e.key}
            name={name}
            entry={e}
            onChange={(p) => patch(e.key, p)}
            onRemove={() => remove(e.key)}
          />
        );
      })}

      <Input
        aria-label="Notes"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={pending} className="flex-1">
          {submitLabel}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function ScoreBlock({
  name,
  entry,
  onChange,
  onRemove,
}: {
  name: string;
  entry: Entry;
  onChange: (p: Partial<Entry>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      role="group"
      aria-label={name}
      className="bg-card border-border flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 font-medium">{name}</span>
        <button
          type="button"
          className="text-muted-foreground text-sm font-bold"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
        >
          remove
        </button>
      </div>

      {entry.playerId === NEW && (
        <Input
          aria-label="New player name"
          placeholder="New player name"
          value={entry.newName}
          onChange={(e) => onChange({ newName: e.target.value })}
        />
      )}

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs">wins</p>
        {/* 0–9 as two rows of five, large thumb targets for courtside entry. */}
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
            <button
              key={g}
              type="button"
              aria-label={`${g} wins`}
              aria-pressed={Number(entry.wins) === g}
              className={cn(
                "border-border font-heading h-12 rounded-lg border text-lg font-bold tabular-nums",
                Number(entry.wins) === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background",
              )}
              onClick={() => onChange({ wins: String(g) })}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
