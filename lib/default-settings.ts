// The default rating-algorithm settings a new League is seeded with (SPEC §4.2).
// Single source of truth shared by the DB seed (prisma/seed.ts) and the
// create-League flow (step 22), so a League created in-app gets the same starting
// parameters as the seeded BSC League. Per-League editable afterwards (ADR-011).
export const DEFAULT_SETTINGS: {
  key: string;
  value: number;
  description: string;
}[] = [
  { key: "StartingRating", value: 1000, description: "Rating every player starts at" },
  { key: "KFactor", value: 160, description: "Sensitivity of rating change per session" },
  { key: "NewPlayerMultiplier", value: 2.0, description: "Rating multiplier for new players" },
  { key: "NewPlayerSessions", value: 5, description: "Sessions a new player receives the multiplier" },
  { key: "ReturningPlayerMultiplier", value: 2.0, description: "Rating multiplier for returning players" },
  { key: "ReturningPlayerSessions", value: 5, description: "Sessions a returning player receives the multiplier" },
  { key: "BaselineSessionGames", value: 8, description: "Inferred games a baseline session represents" },
  { key: "MinSessionWeight", value: 0.6, description: "Lower bound on session weight" },
  { key: "MaxSessionWeight", value: 1.25, description: "Upper bound on session weight" },
  { key: "ActivityBonusPerSession", value: 2, description: "Activity bonus per recent session" },
  { key: "ActivityBonusWindowDays", value: 90, description: "Window for counting recent sessions" },
  { key: "ActivityBonusCap", value: 30, description: "Maximum activity bonus" },
  { key: "ActiveThresholdDays", value: 90, description: "Days since last play to remain active" },
  { key: "LongAbsenceDays", value: 90, description: "Absence that triggers the returning-player boost" },
  { key: "StrengthScale", value: 400, description: "Scale used in the strength-weight exponent" },
];
