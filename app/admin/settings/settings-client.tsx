"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { saveAndRecalculateAction } from "./actions";

type SettingRow = { key: string; value: number; description: string | null };

export function SettingsClient({ settings }: { settings: SettingRow[] }) {
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
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Card per setting — name + description stacked, value input full-width below.
          Replaces the 3-column table that clipped the input on a phone (step 13.5
          follow-up). On wider screens the value sits beside the label. */}
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
              <Input
                type="number"
                step="any"
                aria-label={s.key}
                className="w-20 shrink-0 tabular-nums"
                value={values[s.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [s.key]: e.target.value }))
                }
              />
            </Card>
          </li>
        ))}
      </ul>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {done && <p className="text-sm">Saved and recalculated.</p>}

      <Button onClick={handleSave} disabled={pending}>
        Save &amp; Recalculate
      </Button>
    </div>
  );
}
