import type { RobotType } from "../types/types";

export interface RobotAttributeField {
  key: string;
  label: string;
  options: string[];
}

/**
 * Descriptive, free-choice attributes per robot category — stored in
 * Robot.attributes alongside the gating specs.
 *
 * Anything a competition actually validates (scale, diameter) is deliberately
 * NOT listed here: those options come from the catalog row for the chosen
 * league+sport, because a hardcoded list drifts. CreateRobotFrom.tsx used to
 * offer scale 1:8 / 1:12 / OTHER while the catalog ran 1:8, 1:10 and 1:12, so
 * a 1:10 competition could not be entered by any robot the form could produce.
 *
 * Shared by the create form and the edit panel so the two can never offer a
 * different set of options for the same robot.
 */
export const ATTRIBUTE_FIELDS_BY_CATEGORY: Partial<Record<RobotType, RobotAttributeField[]>> = {
  COMBAT_ROBOT: [
    { key: "weaponType", label: "Weapon Type", options: ["SPINNER", "FLIPPER", "CRUSHER", "WEDGE", "LIFTER", "HAMMER", "OTHER"] },
  ],
  RC_VEHICLE: [
    { key: "vehicleType", label: "Vehicle Type", options: ["ELECTRIC", "NITRO"] },
  ],
  DRONE: [
    { key: "droneType", label: "Drone Type", options: ["FPV", "STANDARD_RACING", "FREESTYLE", "OTHER"] },
  ],
};

export function attributeFieldsFor(category?: RobotType | string | null): RobotAttributeField[] {
  if (!category) return [];
  return ATTRIBUTE_FIELDS_BY_CATEGORY[category as RobotType] ?? [];
}
