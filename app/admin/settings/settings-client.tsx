"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { saveAndRecalculateAction } from "./actions";

type SettingRow = { key: string; value: number; description: string | null };

// Settings are read-only by default. An ADMIN (canEdit) gets an "Edit" button
// that reveals the inputs + "Save & Recalculate"; scorers only ever view. The
// save action re-checks the role server-side (actions.ts) — this is UI gating.
export function SettingsClient({
  settings,
  canEdit,
}: {
  settings: SettingRow[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, String(s.value)])),
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setDone(false);
    const updates = settings.map((s) => ({
      key: s.key,
      value: Number(values[s.key]),
    }));
    startTransition(async () => {
      const result = await saveAndRecalculateAction(updates);
      if (result.ok) {
        setDone(true);
        setEditing(false);
      } else {
        setError(result.error);
      }
    });
  }

  function handleCancel() {
    // Discard edits, back to the stored values.
    setValues(Object.fromEntries(settings.map((s) => [s.key, String(s.value)])));
    setError(null);
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {canEdit && !editing && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}

      {/* Card per setting — name + description, value on the right. Read-only by
          default (plain value); in edit mode the value is an input. */}
      <ul className="flex flex-col gap-3">
        {settings.map((s) => (
          <li key={s.key}>
            <Card className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.key}</p>
                {s.description && (
                  <p className="text-muted-foreground text-sm">{s.description}</p>
                )}
              </div>
              {editing ? (
                <Input
                  type="number"
                  step="any"
                  aria-label={s.key}
                  className="w-20 shrink-0 text-center tabular-nums"
                  value={values[s.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [s.key]: e.target.value }))
                  }
                />
              ) : (
                <p className="font-heading w-20 shrink-0 text-center font-bold tabular-nums">
                  {s.value}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {done && <p className="text-sm">Saved and recalculated.</p>}

      {editing && (
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={pending}>
            Save &amp; Recalculate
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={pending}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
