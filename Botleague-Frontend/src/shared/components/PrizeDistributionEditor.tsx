import { Plus, X, Gift } from "lucide-react";
import {
  positionLabel,
  sumPrizeMoney,
  formatINR,
  prizeDistributionBalanced,
  type PrizePosition,
} from "../utils/prize";

interface Props {
  /** The techsport's Prize Pool (₹). The CASH rows must add up to this;
   *  goodies are extra and never counted against it. */
  poolAmount: number;
  positions: PrizePosition[];
  onChange: (next: PrizePosition[]) => void;
  /** hide the "cash prizes / pool" reconciliation line (e.g. read-only preview) */
  hideBalance?: boolean;
}

const wrap: React.CSSProperties = {
  border: "1px solid #e2e4ee",
  borderRadius: 10,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  background: "#fafbff",
};
const rowStyle: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const cell: React.CSSProperties = {
  border: "1px solid #d7d9e6",
  borderRadius: 8,
  padding: "7px 9px",
  fontSize: 13,
  background: "#fff",
};
const badge: React.CSSProperties = {
  minWidth: 46,
  textAlign: "center",
  fontWeight: 700,
  fontSize: 11,
  color: "#4b5563",
};
const addBtn: React.CSSProperties = {
  ...cell,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 600,
};

export default function PrizeDistributionEditor({ poolAmount, positions, onChange, hideBalance }: Props) {
  const rows: PrizePosition[] =
    positions.length > 0 ? positions : [{ position: 1, type: "MONEY", amount: undefined }];

  // Cash placings first, goodies (extras) after — one flat list for the API.
  const ordered = [...rows].sort((a, b) => (a.type === b.type ? 0 : a.type === "MONEY" ? -1 : 1));

  const moneyTotal = sumPrizeMoney(ordered);
  const cashOnly = ordered.filter((r) => r.type === "MONEY");
  const hasGoodies = ordered.some((r) => r.type === "GOODIES");
  const balanced = prizeDistributionBalanced(poolAmount, cashOnly);

  const commit = (list: PrizePosition[]) => onChange(list.map((r, i) => ({ ...r, position: i + 1 })));
  const setRow = (i: number, patch: Partial<PrizePosition>) =>
    commit(ordered.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => commit(ordered.filter((_, idx) => idx !== i));
  const addCash = () => commit([...ordered, { position: 0, type: "MONEY", amount: undefined }]);
  const addGoodies = () => commit([...ordered, { position: 0, type: "GOODIES", description: "" }]);

  let moneyRank = 0;

  return (
    <div style={wrap}>
      {ordered.map((r, i) => {
        const isCash = r.type === "MONEY";
        if (isCash) moneyRank += 1;
        return (
          <div key={i} style={rowStyle}>
            <span style={badge}>{isCash ? positionLabel(moneyRank) : "Extra"}</span>
            <span
              style={{
                ...cell,
                fontWeight: 700,
                color: isCash ? "#2563eb" : "#7c5cff",
                background: isCash ? "#eef4ff" : "#f4f0ff",
              }}
            >
              {isCash ? "Cash" : "Goodies"}
            </span>

            {isCash ? (
              <input
                type="number"
                min={0}
                step="any"
                placeholder="₹ amount"
                style={{ ...cell, flex: 1, minWidth: 120 }}
                value={r.amount ?? ""}
                onChange={(e) => setRow(i, { amount: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            ) : (
              <input
                type="text"
                placeholder="e.g. Trophy + robotics kit"
                style={{ ...cell, flex: 1, minWidth: 160 }}
                value={r.description ?? ""}
                onChange={(e) => setRow(i, { description: e.target.value })}
              />
            )}

            {ordered.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Remove ${isCash ? positionLabel(moneyRank) : "extra"} prize`}
                style={{ ...cell, cursor: "pointer", padding: "7px", color: "#dc2626", background: "#fff" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={addCash} style={{ ...addBtn, color: "#2563eb" }}>
          <Plus size={14} /> Add cash placing
        </button>
        <button type="button" onClick={addGoodies} style={{ ...addBtn, color: "#7c5cff" }}>
          <Gift size={14} /> Add goodies (extra)
        </button>
      </div>

      {!hideBalance && (
        <div style={{ fontSize: 12, fontWeight: 600, color: balanced ? "#16a34a" : "#dc2626" }}>
          Cash prizes {formatINR(moneyTotal)} of {formatINR(poolAmount)} pool
          {balanced ? " ✓" : " — cash placings must add up to the pool"}
          {hasGoodies && (
            <span style={{ color: "#6b7280", fontWeight: 500 }}> · goodies are extra, not part of the pool</span>
          )}
        </div>
      )}
    </div>
  );
}
