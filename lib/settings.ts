export interface SettingUpdate {
  key: string;
  value: number;
}

export type SettingsResult =
  | { ok: true; updates: SettingUpdate[] }
  | { ok: false; error: string };

// All algorithm settings must be positive, finite numbers (SPEC: K-factor,
// multipliers, thresholds — no upper bound, but > 0).
export function validateSettings(updates: SettingUpdate[]): SettingsResult {
  for (const u of updates) {
    if (!Number.isFinite(u.value) || u.value <= 0) {
      return { ok: false, error: `${u.key} must be a positive number.` };
    }
  }
  return { ok: true, updates };
}
