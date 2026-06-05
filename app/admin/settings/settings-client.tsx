"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Setting</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((s) => (
            <TableRow key={s.key}>
              <TableCell>{s.key}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  aria-label={s.key}
                  value={values[s.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [s.key]: e.target.value }))
                  }
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {s.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {done && <p className="text-sm">Saved and recalculated.</p>}

      <Button onClick={handleSave} disabled={pending}>
        Save &amp; Recalculate
      </Button>
    </div>
  );
}
