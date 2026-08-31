import { Plus, X } from "lucide-react";
import {
  positionLabel,
  sumPrizeMoney,
  formatINR,
  prizeDistributionBalanced,
  type PrizePosition,
  type PrizeType,
} from "../utils/prize";

interface Props {
  /** The sport's total Prize Pool (₹). The MONEY rows must add up to this. */
  poolAmount: number;
  positions: PrizePosition[];
  onChange: (next: PrizePosition[]) => void;
  /** hide the "Distributed / Pool" reconciliation line (e.g. read-only preview) */
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
const posBadge: React.CSSProperties = {
  minWidth: 38,
  textAlign: "center",
  fontWeight: 700,
  fontSize: 12,
  color: "#4b5563",
};

export default function PrizeDistributionEditor({ poolAmount, positions, onChange, hideBalance }: Props) {
  const rows: PrizePosition[] =
    positions.length > 0 ? positions : [{ position: 1, type: "MONEY", amount: undefined }];

  const moneyTotal = sumPrizeMoney(rows);
  const balanced = prizeDistributionBalanced(poolAmount, rows);

  const renumber = (list: PrizePosition[]) => list.map((r, i) => ({ ...r, position: i + 1 }));

  const setRow = (i: number, patch: Partial<PrizePosition>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () =>
    onChange([...rows, { position: rows.length + 1, type: "MONEY", amount: undefined }]);

  const removeRow = (i: number) => onChange(renumber(rows.filter((_, idx) => idx !== i)));

  return (
    <div style={wrap}>
      {rows.map((r, i) => (
        <div key={i} style={rowStyle}>
          <span style={posBadge}>{positionLabel(r.position)}</span>

          <select
            style={{ ...cell, cursor: "pointer" }}
            value={r.type}
            onChange={(e) => {
              const type = e.target.value as PrizeType;
              setRow(i, { type, amount: type === "MONEY" ? r.amount : undefined, description: type === "GOODIES" ? r.description : undefined });
            }}
          >
            <option value="MONEY">Money</option>
            <option value="GOODIES">Goodies</option>
          </select>

          {r.type === "MONEY" ? (
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
            <>
              <input
                type="text"
                placeholder="e.g. Trophy + robotics kit"
                style={{ ...cell, flex: 1, minWidth: 160 }}
                value={r.description ?? ""}
                onChange={(e) => setRow(i, { description: e.target.value })}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c5cff", whiteSpace: "nowrap" }}>+ extra</span>
            </>
          )}

          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label={`Remove ${positionLabel(r.position)} prize`}
              style={{ ...cell, cursor: "pointer", padding: "7px", color: "#dc2626", background: "#fff" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        style={{
          ...cell,
          alignSelf: "flex-start",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
          color: "#2563eb",
        }}
      >
        <Plus size={14} /> Add position
      </button>

      {!hideBalance && (
        <div style={{ fontSize: 12, fontWeight: 600, color: balanced ? "#16a34a" : "#dc2626" }}>
          Cash prizes {formatINR(moneyTotal)} of {formatINR(poolAmount)} pool
          {balanced ? " ✓" : " — cash placings must add up to the pool"}
          {rows.some((r) => r.type === "GOODIES") && (
            <span style={{ color: "#6b7280", fontWeight: 500 }}> · goodies are extra, not part of the pool</span>
          )}
        </div>
      )}
    </div>
  );
}
