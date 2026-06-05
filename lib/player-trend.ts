// Pure shaping of a player's RatingsLog into the trend chart + table (step 11).

// One RatingsLog row joined to its session's date, as queried from the DB.
export type PlayerLogRow = {
  timestamp: Date;
  ratingBefore: number;
  ratingChange: number;
  ratingAfter: number;
};

// A single point on the rating trend: the session date and the rating after it.
export type TrendPoint = {
  date: string; // YYYY-MM-DD, chart x-axis label
  rating: number;
};

// A row in the trend table below the chart.
export type TrendRow = {
  date: string; // YYYY-MM-DD
  ratingBefore: number;
  ratingChange: number;
  ratingAfter: number;
};

// Build the ordered (oldest → newest) trend points for the chart.
export function buildTrendPoints(rows: PlayerLogRow[]): TrendPoint[] {
  return [...rows]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((r) => ({
      date: r.timestamp.toISOString().slice(0, 10),
      rating: round1(r.ratingAfter),
    }));
}

// Build the table rows, most recent first.
export function buildTrendRows(rows: PlayerLogRow[]): TrendRow[] {
  return [...rows]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((r) => ({
      date: r.timestamp.toISOString().slice(0, 10),
      ratingBefore: round1(r.ratingBefore),
      ratingChange: round1(r.ratingChange),
      ratingAfter: round1(r.ratingAfter),
    }));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
