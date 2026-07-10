import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { UploadCloud, User } from "lucide-react";

import { createRobot } from "../api/robot.api";
import { uploadRobotImage } from "../api/uploadRobot.api";
import { getWeightClassOptions, weightClassLabel } from "../constants/weightClasses";

type AgeCategory = "JUNIOR_INNOVATORS" | "YOUNG_ENGINEERS" | "ROBO_MINDS";
type ControlMode = "WIRED" | "WIRELESS";
type ControlType = "MANUAL" | "AUTONOMOUS" | "HYBRID";

interface SportOption {
  key: string;
  label: string;
  maxWeightKg: number | null;
  dims: [number, number, number] | null;
  controlType: ControlType;
  controlMode: ControlMode | null;
  eligibleCategories: AgeCategory[];
  weightClass?: string;
}

interface RobotTypeConfig {
  key: string;
  label: string;
  sports: SportOption[];
  extraFields?: { key: string; label: string; options: string[] }[];
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ROBOT_TYPES: RobotTypeConfig[] = [
  {
    key: "COMBAT_ROBOT",
    label: "Combat Robot",
    extraFields: [
      { key: "weaponType", label: "Weapon Type", options: ["SPINNER", "FLIPPER", "CRUSHER", "WEDGE", "LIFTER", "HAMMER", "OTHER"] },
    ],
    sports: [
      { key: "ROBOWAR_1_5KG", label: "RoboWar 1.5 kg", maxWeightKg: 1.5, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"], weightClass: "1.5KG" },
      { key: "ROBOWAR_8KG", label: "RoboWar 8 kg", maxWeightKg: 8, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "8KG" },
      { key: "ROBOWAR_15KG", label: "RoboWar 15 kg", maxWeightKg: 15, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "15KG" },
      { key: "ROBOWAR_30KG", label: "RoboWar 30 kg", maxWeightKg: 30, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "30KG" },
      { key: "ROBOWAR_60KG", label: "RoboWar 60 kg", maxWeightKg: 60, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "60KG" },
    ],
  },
  {
    key: "SOCCER_ROBOT",
    label: "Soccer Robot",
    sports: [
      { key: "ROBO_SOCCER", label: "Robo Soccer", maxWeightKg: 5, dims: [45, 45, 45], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
      { key: "PLUG_N_PLAY_SOCCER", label: "Plug N Play Soccer", maxWeightKg: 1, dims: [20, 20, 20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
  {
    key: "SUMO_ROBOT",
    label: "Sumo Robot",
    sports: [
      { key: "ROBO_SUMO", label: "Robo Sumo", maxWeightKg: 1, dims: [20, 20, 20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
  {
    key: "LINE_FOLLOWER_ROBOT",
    label: "Line Follower",
    sports: [
      { key: "LINE_FOLLOWER", label: "Line Follower", maxWeightKg: 1, dims: [20, 20, 20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
      { key: "LINE_FOLLOWER_AUTO", label: "Line Follower Auto", maxWeightKg: 1.5, dims: null, controlType: "AUTONOMOUS", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS"] },
    ],
  },
  {
    key: "TASK_ROBOT",
    label: "Task Robot",
    extraFields: [
      { key: "taskCategory", label: "Task Category", options: ["PICK_AND_PLACE", "OBSTACLE_COURSE", "SORTING", "CONSTRUCTION", "OTHER"] },
    ],
    sports: [
      { key: "MANUAL_TASK", label: "Manual Task", maxWeightKg: 1, dims: [20, 20, 20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
      { key: "THEME_BASED_TASKING", label: "Theme Based Tasking", maxWeightKg: 5, dims: [45, 45, 45], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "RC_VEHICLE",
    label: "RC Vehicle",
    extraFields: [
      { key: "vehicleType", label: "Vehicle Type", options: ["ELECTRIC", "NITRO"] },
      { key: "scaleClass", label: "Scale Class", options: ["1:8", "1:12", "OTHER"] },
    ],
    sports: [
      { key: "RC_RACING", label: "RC Racing", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "DRONE",
    label: "Drone",
    extraFields: [
      { key: "droneType", label: "Drone Type", options: ["FPV", "STANDARD_RACING", "FREESTYLE", "OTHER"] },
      { key: "frameSizeCm", label: "Frame Size (cm)", options: ["10", "20", "25", "30", "OTHER"] },
    ],
    sports: [
      { key: "DRONE_RACING", label: "Drone Racing", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
      { key: "DRONE_SOCCER", label: "Drone Soccer", maxWeightKg: null, dims: [30, 30, 30], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "AIRCRAFT",
    label: "Aircraft",
    extraFields: [
      { key: "aircraftType", label: "Aircraft Type", options: ["FIXED_WING", "RC_PLANE", "GLIDER", "JET", "OTHER"] },
    ],
    sports: [
      { key: "AEROMODELLING", label: "Aeromodelling", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"] },
    ],
  },
  {
    key: "INNOVATION_PROJECT",
    label: "Innovation Project",
    extraFields: [
      { key: "projectCategory", label: "Project Category", options: ["AUTOMATION", "IOT", "AI_ML", "RENEWABLE_ENERGY", "HEALTHCARE", "AGRICULTURE", "OTHER"] },
    ],
    sports: [
      { key: "PROJECT_BASED", label: "Project Based Competition", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
];

const AGE_OPTIONS: { key: AgeCategory; label: string; range: string }[] = [
  { key: "JUNIOR_INNOVATORS", label: "Junior Innovators", range: "8-12 years" },
  { key: "ROBO_MINDS", label: "Robo Minds", range: "12-16 years" },
  { key: "YOUNG_ENGINEERS", label: "Young Engineers", range: "16-18 years" },
];

const AGE_LABELS: Record<AgeCategory, string> = {
  JUNIOR_INNOVATORS: "Junior Innovators",
  ROBO_MINDS: "Robo Minds",
  YOUNG_ENGINEERS: "Young Engineers",
};

function competitionOptionsForAge(age: AgeCategory) {
  return ROBOT_TYPES.flatMap((type) =>
    type.sports
      .filter((sport) => sport.eligibleCategories.includes(age))
      .map((sport) => ({ type, sport }))
  );
}

function shortCompetitionLabel(label: string) {
  return label
    .replace("Project Based Competition", "Project\nBased\nCompetition")
    .replace("Plug N Play Soccer", "Plug N Play\nCompetition")
    .replace("Line Follower Auto", "Line\nFollower")
    .replace("Line Follower", "Line\nFollower")
    .replace("Robo Sumo", "RoboSumo")
    .replace("Manual Task", "Manual\nTask")
    .replace(" Competition", "");
}

function computeEligibility(
  sport: SportOption | null,
  weightKg: number | null,
  lengthCm: number | null,
  widthCm: number | null,
  heightCm: number | null
) {
  if (!sport) return [];

  return sport.eligibleCategories.filter(() => {
    if (sport.maxWeightKg !== null && weightKg !== null && weightKg > sport.maxWeightKg) return false;
    if (sport.dims !== null) {
      const [maxL, maxW, maxH] = sport.dims;
      if (lengthCm !== null && lengthCm > maxL) return false;
      if (widthCm !== null && widthCm > maxW) return false;
      if (heightCm !== null && heightCm > maxH) return false;
    }
    return true;
  });
}

export default function CreateRobotForm({ onSuccess, onCancel }: Props) {
  const [selectedAge, setSelectedAge] = useState<AgeCategory>("JUNIOR_INNOVATORS");
  const competitionOptions = useMemo(() => competitionOptionsForAge(selectedAge), [selectedAge]);

  const [selectedType, setSelectedType] = useState<RobotTypeConfig | null>(competitionOptions[0]?.type ?? null);
  const [selectedSport, setSelectedSport] = useState<SportOption | null>(competitionOptions[0]?.sport ?? null);
  const [robotName, setRobotName] = useState("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [lengthCm, setLengthCm] = useState<number | null>(null);
  const [widthCm, setWidthCm] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>("WIRELESS");
  const [weightClass, setWeightClass] = useState("");
  const [extraAttrs, setExtraAttrs] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const liveEligibility = computeEligibility(selectedSport, weightKg, lengthCm, widthCm, heightCm);

  const pickAge = (age: AgeCategory) => {
    const first = competitionOptionsForAge(age)[0];
    setSelectedAge(age);
    setSelectedType(first?.type ?? null);
    setSelectedSport(first?.sport ?? null);
    setWeightClass(first?.sport?.weightClass ?? "");
    setExtraAttrs({});
  };

  const pickCompetition = (type: RobotTypeConfig, sport: SportOption) => {
    const opts = sport.weightClass ? [sport.weightClass] : getWeightClassOptions(sport.key);
    setSelectedType(type);
    setSelectedSport(sport);
    setWeightClass(opts.length === 1 ? opts[0] : "");
    setExtraAttrs({});
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedType || !selectedSport) return;
    if (!robotName.trim()) {
      setError("Robot name is required");
      return;
    }

    const wcOptions = selectedSport.weightClass ? [selectedSport.weightClass] : getWeightClassOptions(selectedSport.key);
    if (wcOptions.length > 0 && !weightClass) {
      setError("Please select a weight class");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createRobot({
        robotName: robotName.trim(),
        robotType: selectedType.key,
        sport: selectedSport.key,
        controlType: selectedSport.controlType,
        controlMode: selectedSport.controlMode ?? controlMode,
        weightClass: weightClass || selectedSport.weightClass,
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

  const weightClassOptions = selectedSport?.weightClass
    ? [selectedSport.weightClass]
    : getWeightClassOptions(selectedSport?.key);

  return (
    <form className="robot-create-form" onSubmit={handleSubmit}>
      <header className="robot-create-head">
        <div>
          <h1>Create New Robot</h1>
          <div className="robot-create-progress" aria-hidden="true">
            <span className="active" />
            <span />
            <span />
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
          <strong>Select Age Category</strong>
        </div>

        <div className="robot-age-grid">
          {AGE_OPTIONS.map((age) => (
            <button
              key={age.key}
              type="button"
              className={selectedAge === age.key ? "robot-age-card active" : "robot-age-card"}
              onClick={() => pickAge(age.key)}
            >
              <span className="robot-age-icon"><User size={36} /></span>
              <strong>{age.label}</strong>
              <em>{age.range}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="robot-create-section">
        <div className="robot-create-section-title">
          <span>2</span>
          <strong>Select Competition</strong>
        </div>

        <div className="robot-competition-grid">
          {competitionOptions.map(({ type, sport }) => (
            <button
              key={`${type.key}-${sport.key}`}
              type="button"
              className={selectedSport?.key === sport.key ? "robot-competition-card active" : "robot-competition-card"}
              onClick={() => pickCompetition(type, sport)}
            >
              {shortCompetitionLabel(sport.label).split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </button>
          ))}
        </div>
      </section>

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

          <label className="robot-create-field">
            <span>Weight Class</span>
            {weightClassOptions.length > 0 ? (
              <select value={weightClass} onChange={(event) => setWeightClass(event.target.value)} disabled={weightClassOptions.length === 1}>
                {weightClassOptions.length > 1 && <option value="">Weight Class</option>}
                {weightClassOptions.map((wc) => (
                  <option key={wc} value={wc}>{weightClassLabel(wc)}</option>
                ))}
              </select>
            ) : (
              <input readOnly placeholder="Weight Class" />
            )}
          </label>

          <label className="robot-create-field">
            <span>Height (in cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              max={selectedSport?.dims?.[2] ?? undefined}
              value={heightCm ?? ""}
              onChange={(event) => setHeightCm(event.target.value ? parseFloat(event.target.value) : null)}
              placeholder="Height"
            />
          </label>

          <label className="robot-create-field">
            <span>Weight (in kg)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              max={selectedSport?.maxWeightKg ?? undefined}
              value={weightKg ?? ""}
              onChange={(event) => setWeightKg(event.target.value ? parseFloat(event.target.value) : null)}
              placeholder="Weight"
            />
          </label>

          <label className="robot-create-field">
            <span>Width (in cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              max={selectedSport?.dims?.[1] ?? undefined}
              value={widthCm ?? ""}
              onChange={(event) => setWidthCm(event.target.value ? parseFloat(event.target.value) : null)}
              placeholder="Width"
            />
          </label>

          <label className="robot-create-field">
            <span>Length (in cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              max={selectedSport?.dims?.[0] ?? undefined}
              value={lengthCm ?? ""}
              onChange={(event) => setLengthCm(event.target.value ? parseFloat(event.target.value) : null)}
              placeholder="Length"
            />
          </label>

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

          {selectedSport?.controlMode === null && (
            <div className="robot-control-mode">
              {(["WIRED", "WIRELESS"] as ControlMode[]).map((mode) => (
                <button key={mode} type="button" className={controlMode === mode ? "active" : ""} onClick={() => setControlMode(mode)}>
                  {mode === "WIRED" ? "Wired" : "Wireless"}
                </button>
              ))}
            </div>
          )}

          {selectedType?.extraFields?.map((field) => (
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

          {(weightKg !== null || widthCm !== null || heightCm !== null || lengthCm !== null) && (
            <div className="robot-create-eligibility">
              {liveEligibility.length > 0
                ? `Eligible: ${liveEligibility.map((cat) => AGE_LABELS[cat]).join(", ")}`
                : "Specs exceed the selected competition limits."}
            </div>
          )}

          <button type="submit" className="robot-create-save" disabled={submitting || !robotName.trim() || !selectedType || !selectedSport}>
            {submitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>
    </form>
  );
}
