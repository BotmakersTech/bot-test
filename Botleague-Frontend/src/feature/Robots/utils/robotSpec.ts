import { constraintsFor } from "../../Event/utils/specPolicy";

export interface RobotSpecInput {
  sport?: string | null;
  ageGroup?: string | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  scaleClass?: string | null;
}

/**
 * The spec(s) a robot's sport actually gates (see SportSpecPolicy), formatted
 * for a single label/value display line — a RoboWar shows Weight, an RC
 * Racing Car shows Scale, a Robo Race (Inferno/Apex) shows both. Never shows
 * a spec the sport doesn't care about, so an RC Racing Car never displays a
 * meaningless/empty "Weight -" line. Shared by RobotProfilePage.tsx (the
 * editable /robots/:robotId view) and RobotPublicPage.tsx (the read-only,
 * unauthenticated /robot/:code view) — same rule, two different data shapes.
 */
export function robotSpecDisplay(input: RobotSpecInput): { label: string; value: string } {
  const gates = constraintsFor(input.ageGroup, input.sport);
  const labels: string[] = [];
  const values: string[] = [];
  if (gates.weight) {
    labels.push("Weight");
    values.push(input.weightKg != null ? `${input.weightKg} Kg` : "-");
  }
  if (gates.dimension) {
    labels.push("Dimensions");
    values.push(
      input.lengthCm != null && input.widthCm != null && input.heightCm != null
        ? `${input.lengthCm}×${input.widthCm}×${input.heightCm} cm`
        : "-"
    );
  }
  if (gates.scale) {
    labels.push("Scale");
    values.push(input.scaleClass || "-");
  }
  if (labels.length === 0) return { label: "Spec", value: "-" };
  return { label: labels.join(" / "), value: values.join(" · ") };
}
