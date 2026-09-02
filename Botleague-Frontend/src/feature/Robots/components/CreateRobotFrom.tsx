import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { UploadCloud } from "lucide-react";

import { createRobot } from "../api/robot.api";
import { uploadRobotImage } from "../api/uploadRobot.api";
import { getPublicLeagueSports, type LeagueSport } from "../../../shared/api/catalog.api";
import { useLeagues, formatAgeRange } from "../../../temp/pages/leagues/useLeagues";
import { constraintsFor } from "../../Event/utils/specPolicy";

type RobotCategoryKey =
  | "COMBAT_ROBOT" | "SOCCER_ROBOT" | "SUMO_ROBOT" | "LINE_FOLLOWER_ROBOT" | "RC_VEHICLE" | "DRONE";
type ControlMode = "WIRED" | "WIRELESS";
type ControlType = "MANUAL" | "AUTONOMOUS" | "HYBRID";

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ── Catalog sport -> robot-creation payload bridge ─────────────────────────
//
// The sport list and each sport's weight/size limits now come straight from
// the League/Sport catalog (real leagues, real per-league specs). But two
// fields the backend still needs are NOT catalog-driven:
//   - `robotType` is a hard Java enum (RobotCategory) with no free-text
//     escape hatch — an unrecognised value fails robot creation outright.
//   - `sport` is free text, but SportRegistrationService matches it against
//     a fixed set of OLD keys (ROBOWAR_8KG, ROBO_SOCCER, ...) to check a
//     robot is built for the right sport before it can register for an
//     event. An unrecognised key silently SKIPS that check rather than
//     failing, which is worse than getting it right here.
// This is the one place that bridges catalog sport name (+ league age group
// + chosen weight, for Robo War's per-weight-class keys) to those values.
interface SportBridge {
  robotCategory: RobotCategoryKey;
  sportKey: string;
  controlType: ControlType;
  /** null = no fixed connection type for this sport; user picks Wired/Wireless. */
  controlMode: ControlMode | null;
}

function resolveSportBridge(catalogSportName: string, ageGroup: string, weightKg: number | null): SportBridge {
  switch (catalogSportName) {
    case "Robo Sumo":
      return { robotCategory: "SUMO_ROBOT", sportKey: "ROBO_SUMO", controlType: "MANUAL", controlMode: null };
    case "Robo Soccer":
      return { robotCategory: "SOCCER_ROBOT", sportKey: "ROBO_SOCCER", controlType: "MANUAL", controlMode: "WIRELESS" };
    case "Line Follower":
      return ageGroup === "JUNIOR_INNOVATORS"
        ? { robotCategory: "LINE_FOLLOWER_ROBOT", sportKey: "LINE_FOLLOWER", controlType: "MANUAL", controlMode: null }
        : { robotCategory: "LINE_FOLLOWER_ROBOT", sportKey: "LINE_FOLLOWER_AUTO", controlType: "AUTONOMOUS", controlMode: "WIRELESS" };
    case "Robo War":
      return {
        robotCategory: "COMBAT_ROBOT",
        sportKey: weightKg != null ? `ROBOWAR_${String(weightKg).replace(".", "_")}KG` : "ROBOWAR",
        controlType: "MANUAL",
        controlMode: "WIRELESS",
      };
    case "Drone Soccer":
      return { robotCategory: "DRONE", sportKey: "DRONE_SOCCER", controlType: "MANUAL", controlMode: "WIRELESS" };
    case "Robo Race":
      // Distinct sportKey from RC Racing Car below — Robo Race is gated on
      // weight/dimension (see SportSpecPolicy), not scale, and the two must
      // never be treated as interchangeable when a robot registers for an
      // event (a Robo Race robot tagged "RC_RACING" would fail the
      // sport-compatibility check against a real "Robo Race" competition).
      return { robotCategory: "RC_VEHICLE", sportKey: "ROBO_RACE", controlType: "MANUAL", controlMode: "WIRELESS" };
    case "RC Racing Car":
      return { robotCategory: "RC_VEHICLE", sportKey: "RC_RACING", controlType: "MANUAL", controlMode: "WIRELESS" };
    default:
      // A catalog sport with no historical mapping (newly added by an admin,
      // never existed under the old system). Best-effort, non-blocking
      // fallback rather than refusing to let the team create a robot at all
      // — the sport-compatibility check on registration simply skips an
      // unrecognised key instead of rejecting it.
      return {
        robotCategory: "COMBAT_ROBOT",
        sportKey: catalogSportName.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
        controlType: "MANUAL",
        controlMode: "WIRELESS",
      };
  }
}

const EXTRA_FIELDS_BY_CATEGORY: Partial<Record<RobotCategoryKey, { key: string; label: string; options: string[] }[]>> = {
  COMBAT_ROBOT: [
    { key: "weaponType", label: "Weapon Type", options: ["SPINNER", "FLIPPER", "CRUSHER", "WEDGE", "LIFTER", "HAMMER", "OTHER"] },
  ],
  RC_VEHICLE: [
    { key: "vehicleType", label: "Vehicle Type", options: ["ELECTRIC", "NITRO"] },
    { key: "scaleClass", label: "Scale Class", options: ["1:8", "1:12", "OTHER"] },
  ],
  DRONE: [
    { key: "droneType", label: "Drone Type", options: ["FPV", "STANDARD_RACING", "FREESTYLE", "OTHER"] },
    { key: "frameSizeCm", label: "Frame Size (cm)", options: ["10", "20", "25", "30", "OTHER"] },
  ],
};

// Same "8kg -> 8KG" / "1.5kg -> 1_5KG" shape the ranking/weight-class system
// uses elsewhere (see Robots/constants/weightClasses.ts's WEIGHT_CLASS_LABELS).
function toWeightClassCode(weightKg: number): string {
  return `${String(weightKg).replace(".", "_")}KG`;
}

export default function CreateRobotForm({ onSuccess, onCancel }: Props) {
  const { leagues } = useLeagues();

  const [selectedLeagueSlug, setSelectedLeagueSlug] = useState("");
  const [leagueSports, setLeagueSports] = useState<LeagueSport[]>([]);
  const [leagueSportsLoading, setLeagueSportsLoading] = useState(false);
  const [selectedSportSlug, setSelectedSportSlug] = useState("");
  const [selectedWeightKgStr, setSelectedWeightKgStr] = useState("");

  const [robotName, setRobotName] = useState("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [widthCm, setWidthCm] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>("WIRELESS");
  const [extraAttrs, setExtraAttrs] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Default to the first league once the catalog loads, so there's one less
  // click for the common case — but nothing past it auto-selects (see below).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedLeagueSlug && leagues.length > 0) setSelectedLeagueSlug(leagues[0].slug);
  }, [leagues, selectedLeagueSlug]);

  // League chosen -> fetch that league's real LIVE sports (e.g. Ignite's 5)
  // and reset whatever sport/spec selection was made for the previous league.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSportSlug("");
    setSelectedWeightKgStr("");
    setExtraAttrs({});
    if (!selectedLeagueSlug) {
      setLeagueSports([]);
      return;
    }
    let cancelled = false;
    setLeagueSportsLoading(true);
    getPublicLeagueSports(selectedLeagueSlug)
      .then((rows) => { if (!cancelled) setLeagueSports(rows); })
      .catch(() => { if (!cancelled) setLeagueSports([]); })
      .finally(() => { if (!cancelled) setLeagueSportsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedLeagueSlug]);

  const selectedLeague = leagues.find((l) => l.slug === selectedLeagueSlug) ?? null;
  const selectedLeagueSport = leagueSports.find((ls) => ls.sportSlug === selectedSportSlug) ?? null;

  const weightOptions: { weightKg: number; label: string }[] = selectedLeagueSport
    ? selectedLeagueSport.weightClasses.length > 0
      ? selectedLeagueSport.weightClasses.map((wc) => ({ weightKg: wc.weightKg, label: `${wc.weightKg} kg` }))
      : selectedLeagueSport.weightLimitKg != null
        ? [{ weightKg: selectedLeagueSport.weightLimitKg, label: `${selectedLeagueSport.weightLimitKg} kg` }]
        : []
    : [];
  const selectedWeightOption = weightOptions.find((w) => String(w.weightKg) === selectedWeightKgStr) ?? null;
  const weightCeilingKg = selectedWeightOption?.weightKg ?? selectedLeagueSport?.weightLimitKg ?? null;

  const bridge = selectedLeagueSport && selectedLeague
    ? resolveSportBridge(selectedLeagueSport.sportName, selectedLeague.ageGroupValue, selectedWeightOption?.weightKg ?? null)
    : null;

  // The ONLY physical spec(s) this (league, sport) actually gates — e.g. RC
  // Racing Car is scale-only (no weight/dimension fields shown), Robo Race is
  // weight/dimension-only (no scale field), RoboWar is weight-only. Mirrors
  // the same policy used for event registration eligibility (specPolicy.ts).
  const specs = selectedLeagueSport && selectedLeague
    ? constraintsFor(selectedLeague.ageGroupValue, selectedLeagueSport.sportName)
    : { weight: true, dimension: true, scale: true };

  // RC_VEHICLE covers both Robo Race and RC Racing Car, but only the latter
  // needs the Scale Class field — drop it here rather than forking the whole
  // category so Vehicle Type still applies to both.
  const extraFields = (bridge ? EXTRA_FIELDS_BY_CATEGORY[bridge.robotCategory] ?? [] : [])
    .filter((f) => f.key !== "scaleClass" || specs.scale);

  // Auto-pick the sport's single weight option (nothing to choose); force an
  // explicit pick when there's more than one (e.g. Robo War's weight tiers).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedWeightKgStr(weightOptions.length === 1 ? String(weightOptions[0].weightKg) : "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExtraAttrs({});
  }, [selectedSportSlug]);

  const withinLeagueLimits =
    !selectedLeagueSport ||
    ((weightCeilingKg == null || weightKg == null || weightKg <= weightCeilingKg) &&
      (selectedLeagueSport.maxLengthCm == null || lengthCm == null || lengthCm <= selectedLeagueSport.maxLengthCm) &&
      (selectedLeagueSport.maxWidthCm == null || widthCm == null || widthCm <= selectedLeagueSport.maxWidthCm) &&
      (selectedLeagueSport.maxHeightCm == null || heightCm == null || heightCm <= selectedLeagueSport.maxHeightCm));
  const hasEnteredSpecs = weightKg !== null || widthCm !== null || heightCm !== null || lengthCm !== null;

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedLeagueSport || !bridge) return;
    if (!robotName.trim()) {
      setError("Robot name is required");
      return;
    }
    if (specs.weight && weightOptions.length > 0 && !selectedWeightOption) {
      setError("Please select a weight class");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createRobot({
        robotName: robotName.trim(),
        robotType: bridge.robotCategory,
        sport: bridge.sportKey,
        controlType: bridge.controlType,
        controlMode: bridge.controlMode ?? controlMode,
        weightClass: selectedWeightOption ? toWeightClassCode(selectedWeightOption.weightKg) : undefined,
        weightKg: weightKg ?? undefined,
        lengthCm: lengthCm ?? undefined,
        widthCm: widthCm ?? undefined,
        heightCm: heightCm ?? undefined,
        attributes: Object.keys(extraAttrs).length ? extraAttrs : undefined,
        description: description.trim(),
      });

      if (photoFile && created.id) {
        await uploadRobotImage(created.id, photoFile);
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create robot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="robot-create-form" onSubmit={handleSubmit}>
      <header className="robot-create-head">
        <div>
          <h1>Create New Robot</h1>
          <div className="robot-create-progress" aria-hidden="true">
            <span className="active" />
            <span />
            <span className={selectedSportSlug ? "active" : ""} />
            <span />
          </div>
        </div>

        {onCancel && (
          <button type="button" className="robot-create-cancel" onClick={onCancel}>
            Back
          </button>
        )}
      </header>

      <section className="robot-create-section">
        <div className="robot-create-section-title">
          <span>1</span>
          <strong>Select League</strong>
        </div>

        <div className="robot-age-grid">
          {leagues.map((league) => (
            <button
              key={league.slug}
              type="button"
              className={selectedLeagueSlug === league.slug ? "robot-age-card active" : "robot-age-card"}
              onClick={() => setSelectedLeagueSlug(league.slug)}
            >
              <strong>{league.shortName}</strong>
              <em>{formatAgeRange(league.minAge, league.maxAge)} yrs</em>
            </button>
          ))}
        </div>
      </section>

      <section className="robot-create-section">
        <div className="robot-create-section-title">
          <span>2</span>
          <strong>Select Techsport</strong>
        </div>

        <div className="robot-competition-grid">
          {leagueSportsLoading ? (
            <p style={{ gridColumn: "1 / -1", margin: 0, color: "#7e7e7e", fontSize: 13 }}>Loading sports…</p>
          ) : leagueSports.length === 0 ? (
            <p style={{ gridColumn: "1 / -1", margin: 0, color: "#7e7e7e", fontSize: 13 }}>
              {selectedLeagueSlug ? "No sports are live for this league yet." : "Select a league first."}
            </p>
          ) : (
            leagueSports.map((ls) => (
              <button
                key={ls.sportSlug}
                type="button"
                className={selectedSportSlug === ls.sportSlug ? "robot-competition-card active" : "robot-competition-card"}
                onClick={() => setSelectedSportSlug(ls.sportSlug)}
              >
                <span>{ls.sportName}</span>
              </button>
            ))
          )}
        </div>
      </section>

      {selectedLeagueSport && bridge && (
        <section className="robot-create-section">
          <div className="robot-create-section-title">
            <span>3</span>
            <strong>Robot Details</strong>
          </div>

          {error && <div className="robot-create-error">{error}</div>}

          <div className="robot-create-fields">
            <label className="robot-create-field robot-create-field-full">
              <span>Robot Name</span>
              <input value={robotName} onChange={(event) => setRobotName(event.target.value)} placeholder="Enter Your Robot Name" />
            </label>

            {specs.weight && (
              <label className="robot-create-field">
                <span>Weight Class</span>
                {weightOptions.length > 0 ? (
                  <select value={selectedWeightKgStr} onChange={(event) => setSelectedWeightKgStr(event.target.value)} disabled={weightOptions.length === 1}>
                    {weightOptions.length > 1 && <option value="">Weight Class</option>}
                    {weightOptions.map((w) => (
                      <option key={w.weightKg} value={w.weightKg}>{w.label}</option>
                    ))}
                  </select>
                ) : (
                  <input readOnly placeholder="Weight Class" />
                )}
              </label>
            )}

            {specs.dimension && (
              <label className="robot-create-field">
                <span>Height (in cm)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  max={selectedLeagueSport.maxHeightCm ?? undefined}
                  value={heightCm ?? ""}
                  onChange={(event) => setHeightCm(event.target.value ? parseFloat(event.target.value) : null)}
                  placeholder="Height"
                />
              </label>
            )}

            {specs.weight && (
              <label className="robot-create-field">
                <span>Weight (in kg)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={weightCeilingKg ?? undefined}
                  value={weightKg ?? ""}
                  onChange={(event) => setWeightKg(event.target.value ? parseFloat(event.target.value) : null)}
                  placeholder="Weight"
                />
              </label>
            )}

            {specs.dimension && (
              <label className="robot-create-field">
                <span>Width (in cm)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  max={selectedLeagueSport.maxWidthCm ?? undefined}
                  value={widthCm ?? ""}
                  onChange={(event) => setWidthCm(event.target.value ? parseFloat(event.target.value) : null)}
                  placeholder="Width"
                />
              </label>
            )}

            {specs.dimension && (
              <label className="robot-create-field">
                <span>Length (in cm)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  max={selectedLeagueSport.maxLengthCm ?? undefined}
                  value={lengthCm ?? ""}
                  onChange={(event) => setLengthCm(event.target.value ? parseFloat(event.target.value) : null)}
                  placeholder="Length"
                />
              </label>
            )}

            <label className="robot-create-field robot-create-field-full">
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe Your Robot" />
            </label>

            <label className="robot-create-field robot-create-field-full">
              <span>Robot Image</span>
              <button type="button" className="robot-upload-zone" onClick={() => fileRef.current?.click()}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Robot preview" />
                ) : (
                  <>
                    <UploadCloud size={34} />
                    <em>Click to upload or <b>drag & drop</b></em>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>

            {bridge.controlMode === null && (
              <div className="robot-control-mode">
                {(["WIRED", "WIRELESS"] as ControlMode[]).map((mode) => (
                  <button key={mode} type="button" className={controlMode === mode ? "active" : ""} onClick={() => setControlMode(mode)}>
                    {mode === "WIRED" ? "Wired" : "Wireless"}
                  </button>
                ))}
              </div>
            )}

            {extraFields.map((field) => (
              <label className="robot-create-field" key={field.key}>
                <span>{field.label}</span>
                <select value={extraAttrs[field.key] ?? ""} onChange={(event) => setExtraAttrs(prev => ({ ...prev, [field.key]: event.target.value }))}>
                  <option value="">Select {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </label>
            ))}

            {hasEnteredSpecs && (
              <div className="robot-create-eligibility">
                {withinLeagueLimits
                  ? `Within ${selectedLeague?.shortName ?? "this league"}'s specs for ${selectedLeagueSport.sportName}.`
                  : `Exceeds ${selectedLeague?.shortName ?? "this league"}'s specs for ${selectedLeagueSport.sportName}.`}
              </div>
            )}

            <button type="submit" className="robot-create-save" disabled={submitting || !robotName.trim()}>
              {submitting ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
