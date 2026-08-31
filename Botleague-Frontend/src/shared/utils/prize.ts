// Structured prize breakdown for an event sport. Mirrors backend
// PrizePositionDTO / event_sports.prize_distribution_json.

export type PrizeType = "MONEY" | "GOODIES";

export interface PrizePosition {
  position: number;            // 1, 2, 3, ...
  type: PrizeType;
  amount?: number | null;      // MONEY
  description?: string | null; // GOODIES
}

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th" ... */
export function positionLabel(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** ₹ with Indian digit grouping. */
export function formatINR(n: number | null | undefined): string {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

/** Sum of just the MONEY placings. */
export function sumPrizeMoney(positions: PrizePosition[] | null | undefined): number {
  return (positions ?? []).reduce(
    (t, p) => t + (p.type === "MONEY" ? Number(p.amount) || 0 : 0),
    0
  );
}

/** money sum matches the pool (to the paisa). */
export function prizeDistributionBalanced(
  poolAmount: number | null | undefined,
  positions: PrizePosition[] | null | undefined
): boolean {
  if (!positions || positions.length === 0) return true;
  return Math.round(sumPrizeMoney(positions) * 100) === Math.round((Number(poolAmount) || 0) * 100);
}

/** One-line summary: "1st — ₹50,000" for cash placings, "Extra — Trophy + kit"
 *  for goodies (goodies are add-ons, not a numbered placing in the pool). */
export function formatPrizePosition(p: PrizePosition): string {
  if (p.type === "MONEY") return `${positionLabel(p.position)} — ${formatINR(p.amount)}`;
  return `Extra — ${p.description || "Goodies"}`;
}
