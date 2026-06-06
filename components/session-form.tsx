"use client";

import { useState, useTransition } from "react";
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

interface SlotState {
  playerId: string; // player id, "" (none), or NEW
  newName: string;
  wins: string;
}

const emptySlot = (): SlotState => ({ playerId: "", newName: "", wins: "0" });

interface Props {
  players: Player[];
  // Pre-populated slots/notes for edit; defaults to 4 empty slots for submit.
  initialSlots?: SlotState[];
  initialNotes?: string;
  submitLabel: string;
  onSubmit: (slots: FormSlot[], notes: string) => Promise<SessionFormResult>;
  // Optional delete (edit mode). Receives nothing; parent binds the id.
  onDelete?: () => Promise<SessionFormResult>;
}

// Courtside doubles capture (step 13.5, per PROTOTYPE-NOTES-ux.md): a flat list of
// player slots — no teams (the engine infers pairings). Each slot: a tap-to-pick chip
// picker (with "+ New" for on-the-fly creation) + a segmented 0–7 "wins" selector.
// The public contract (props + FormSlot payload) is unchanged from the prior form, so
// both /submit and the edit page reuse it.
export function SessionForm({
  players,
  initialSlots,
  initialNotes = "",
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotState[]>(
    () => initialSlots ?? Array.from({ length: 4 }, emptySlot),
  );
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(i: number, patch: Partial<SlotState>) {
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, ...patch } : slot)));
  }

  function toPayload(): FormSlot[] {
    return slots
      .filter((s) => s.playerId !== "" || s.newName.trim() !== "")
      .map((s) => ({
        playerId: s.playerId === NEW ? undefined : s.playerId || undefined,
        newName: s.playerId === NEW ? s.newName : undefined,
        wins: Number(s.wins),
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

  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, i) => (
        <Slot
          key={i}
          n={i + 1}
          slot={slot}
          players={players}
          onChange={(patch) => update(i, patch)}
        />
      ))}

      {slots.length < 8 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSlots((s) => [...s, emptySlot()])}
        >
          + Add player
        </Button>
      )}

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

function Slot({
  n,
  slot,
  players,
  onChange,
}: {
  n: number;
  slot: SlotState;
  players: Player[];
  onChange: (patch: Partial<SlotState>) => void;
}) {
  const chosen =
    slot.playerId === NEW
      ? slot.newName.trim() || "New player"
      : players.find((p) => p.id === slot.playerId)?.name;
  const [picking, setPicking] = useState(!slot.playerId);

  return (
    <div
      role="group"
      aria-label={`Player ${n}`}
      className="bg-card border-border flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-heading font-black">{n}</span>
        <span className="flex-1 font-medium">
          {chosen ?? <span className="text-muted-foreground">Choose a player</span>}
        </span>
        {slot.playerId && (
          <button
            type="button"
            className="text-primary text-sm font-bold"
            onClick={() => setPicking((p) => !p)}
          >
            change
          </button>
        )}
      </div>

      {(picking || !slot.playerId) && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={slot.playerId === p.id}
                className={cn(
                  "border-border rounded-full border px-3 py-2 text-sm font-medium",
                  slot.playerId === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-background",
                )}
                onClick={() => {
                  onChange({ playerId: p.id, newName: "" });
                  setPicking(false);
                }}
              >
                {p.name}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={slot.playerId === NEW}
              className={cn(
                "border-primary text-primary rounded-full border border-dashed px-3 py-2 text-sm font-medium",
                slot.playerId === NEW && "bg-primary/10",
              )}
              onClick={() => onChange({ playerId: NEW })}
            >
              + New
            </button>
          </div>
          {slot.playerId === NEW && (
            <Input
              aria-label={`New player name ${n}`}
              placeholder="New player name"
              value={slot.newName}
              onChange={(e) => onChange({ newName: e.target.value })}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((g) => (
          <button
            key={g}
            type="button"
            aria-label={`${g} wins`}
            aria-pressed={Number(slot.wins) === g}
            className={cn(
              "border-border font-heading h-10 min-w-10 rounded-lg border font-bold tabular-nums",
              Number(slot.wins) === g
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background",
            )}
            onClick={() => onChange({ wins: String(g) })}
          >
            {g}
          </button>
        ))}
        <span className="text-muted-foreground ml-1 text-xs">wins</span>
      </div>
    </div>
  );
}
