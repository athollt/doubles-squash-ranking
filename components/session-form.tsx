"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-4">
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            aria-label={`Player ${i + 1}`}
            className="border-input h-9 rounded-md border px-3 text-sm"
            value={slot.playerId}
            onChange={(e) => update(i, { playerId: e.target.value })}
          >
            <option value="">— select player —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={NEW}>+ Add new player…</option>
          </select>

          {slot.playerId === NEW && (
            <Input
              aria-label={`New player name ${i + 1}`}
              placeholder="New player name"
              value={slot.newName}
              onChange={(e) => update(i, { newName: e.target.value })}
            />
          )}

          <Input
            type="number"
            min={0}
            aria-label={`Wins ${i + 1}`}
            className="sm:w-24"
            value={slot.wins}
            onChange={(e) => update(i, { wins: e.target.value })}
          />
        </div>
      ))}

      {slots.length < 8 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSlots((s) => [...s, emptySlot()])}
        >
          Add player slot
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
        <Button onClick={handleSubmit} disabled={pending}>
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
