// Canonical age-group -> sport catalogue.
//
// This value set was previously duplicated (in slightly different shapes)
// across AdminEventDetail.tsx, OrganizerEventDetailPage.tsx, AdminSport.tsx,
// and OrganizerSportDetailPage.tsx. AdminEventDetail.tsx and
// OrganizerEventDetailPage.tsx have since been migrated to import this file
// directly (see shared/components/AddSportModal/AddSportModal.tsx, which
// both pages now render). AdminSport.tsx and OrganizerSportDetailPage.tsx
// still carry their own separate copies for unrelated display/lookup
// purposes and remain out of scope.

export interface SportConfig {
  value: string;
  label: string;
  weightClasses: { value: string; label: string }[];
  hint?: string;
}

export interface AgeGroupConfig {
  value: string;
  label: string;
  subLabel: string;
  connectivity: string;
  sports: SportConfig[];
}

export const AGE_GROUP_CATALOGUE: AgeGroupConfig[] = [
  {
    value: "JUNIOR_INNOVATORS",
    label: "Ignite",
    subLabel: "8–12 yrs",
    connectivity: "Wired / Wireless",
    sports: [
      { value: "PROJECT_BASED", label: "Project Based Competition", hint: "Concept & prototype presentation", weightClasses: [] },
      { value: "PLUG_N_PLAY_RACE_SOCCER", label: "Plug N Play — Race / Soccer", hint: "1 kg · 20×20×20 cm · single bot", weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "LINE_FOLLOWER", label: "Line Follower", hint: "1 kg · 20×20×20 cm", weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "MANUAL_TASK", label: "Manual Task", hint: "1 kg · 20×20×20 cm", weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "ROBO_SUMO", label: "Robo Sumo", hint: "1 kg · 20×20×20 cm", weightClasses: [{ value: "1KG", label: "1 kg" }] },
    ],
  },
  {
    value: "YOUNG_ENGINEERS",
    label: "Inferno",
    subLabel: "12–18 yrs",
    connectivity: "Wireless",
    sports: [
      { value: "ROBO_SOCCER", label: "Robo Soccer", hint: "3 kg · 30×30×30 cm", weightClasses: [{ value: "3KG", label: "3 kg" }] },
      { value: "LINE_FOLLOWER_AUTO", label: "Line Follower (Auto)", hint: "1.5 kg", weightClasses: [{ value: "1_5KG", label: "1.5 kg" }] },
      { value: "THEME_BASED_TASKING", label: "Theme-Based Tasking", hint: "3 kg", weightClasses: [{ value: "3KG", label: "3 kg" }] },
      { value: "ROBO_WAR", label: "RoboWar", hint: "1.5 kg only", weightClasses: [{ value: "1_5KG", label: "1.5 kg" }] },
      { value: "DRONE_RACING_SOCCER", label: "Drone Racing / Drone Soccer", hint: "20 cm · 30×30×30 cm", weightClasses: [{ value: "OPEN", label: "Open" }] },
      { value: "RC_ROBO_RACING", label: "RC Racing / Robo Racing", hint: "", weightClasses: [{ value: "OPEN", label: "Open" }] },
    ],
  },
  {
    value: "ROBO_MINDS",
    label: "Apex",
    subLabel: "18+ yrs",
    connectivity: "Wireless",
    sports: [
      { value: "ROBO_SOCCER_OPEN", label: "Robo Soccer", hint: "5 kg · 45×45×45 cm", weightClasses: [{ value: "5KG", label: "5 kg" }] },
      { value: "THEME_BASED_TASKING_OPEN", label: "Theme-Based Tasking", hint: "5 kg · 45×45×45 cm", weightClasses: [{ value: "5KG", label: "5 kg" }] },
      {
        value: "ROBO_WAR_OPEN", label: "RoboWar", hint: "1.5 / 8 / 15 / 30 / 60 kg", weightClasses: [
          { value: "1_5KG", label: "1.5 kg" },
          { value: "8KG", label: "8 kg" },
          { value: "15KG", label: "15 kg" },
          { value: "30KG", label: "30 kg" },
          { value: "60KG", label: "60 kg" },
        ],
      },
      { value: "DRONE_RACING_FPV", label: "Drone Racing (FPV) / Drone Soccer", hint: "", weightClasses: [{ value: "OPEN", label: "Open" }] },
      { value: "RC_RACING_NITRO", label: "RC Racing (Nitro + Electric)", hint: "1:8 · 1:12", weightClasses: [{ value: "OPEN", label: "Open" }] },
      { value: "AEROMODELLING", label: "Aeromodelling", hint: "", weightClasses: [{ value: "OPEN", label: "Open" }] },
    ],
  },
];

/** Flattened { value, label, ageGroupLabel } list — for a single sport multi-select. */
export const ALL_SPORTS: { value: string; label: string; ageGroupLabel: string }[] =
  AGE_GROUP_CATALOGUE.flatMap((group) =>
    group.sports.map((sport) => ({ value: sport.value, label: sport.label, ageGroupLabel: group.label }))
  );

/**
 * Accurate age ranges for the 3 AgeCategory values, matching
 * EligibilityUtils' real backend boundaries (8–11 / 12–17 / 18+). Do NOT use
 * AGE_GROUP_CATALOGUE's own `subLabel` field for this — it's imprecise
 * marketing copy ("8–12 yrs" / "12–18 yrs") that has been harmless so far
 * only because the frontend never did its own age math before now.
 */
export const AGE_CATEGORY_RANGES: Record<string, string> = {
  JUNIOR_INNOVATORS: "8–11 yrs",
  YOUNG_ENGINEERS: "12–17 yrs",
  ROBO_MINDS: "18+ yrs",
};
