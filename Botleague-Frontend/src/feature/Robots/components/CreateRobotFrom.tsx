import { useState, useRef, useCallback } from "react";
import { createRobot } from "../api/robot.api";
import { uploadRobotImage } from "../api/uploadRobot.api";

// ─────────────────────────────────────────────────────────────────────────────
// Domain types & rules
// ─────────────────────────────────────────────────────────────────────────────

type AgeCategory = "JUNIOR_INNOVATORS" | "YOUNG_ENGINEERS" | "ROBO_MINDS";
type ControlMode = "WIRED" | "WIRELESS";
type ControlType = "MANUAL" | "AUTONOMOUS" | "HYBRID";

interface SportOption {
  key: string;
  label: string;
  maxWeightKg: number | null;
  dims: [number, number, number] | null; // [L, W, H] max cm
  controlType: ControlType;
  controlMode: ControlMode | null; // null = user picks (Junior sports)
  eligibleCategories: AgeCategory[];
  weightClass?: string; // auto-derived label for RoboWar
}

interface RobotTypeConfig {
  key: string;
  label: string;
  icon: string;
  description: string;
  sports: SportOption[];
  extraFields?: ExtraField[];
}

interface ExtraField {
  key: string;
  label: string;
  options: string[];
  required?: boolean;
}

const ROBOT_TYPES: RobotTypeConfig[] = [
  {
    key: "COMBAT_ROBOT",
    label: "Combat Robot",
    icon: "⚔️",
    description: "RoboWar competitor — armoured robots built to fight",
    extraFields: [
      { key: "weaponType", label: "Weapon Type", options: ["SPINNER", "FLIPPER", "CRUSHER", "WEDGE", "LIFTER", "HAMMER", "OTHER"] },
    ],
    sports: [
      { key: "ROBOWAR_1_5KG", label: "RoboWar 1.5 kg", maxWeightKg: 1.5, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"], weightClass: "1.5KG" },
      { key: "ROBOWAR_8KG",   label: "RoboWar 8 kg",   maxWeightKg: 8,   dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "8KG" },
      { key: "ROBOWAR_15KG",  label: "RoboWar 15 kg",  maxWeightKg: 15,  dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "15KG" },
      { key: "ROBOWAR_30KG",  label: "RoboWar 30 kg",  maxWeightKg: 30,  dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "30KG" },
      { key: "ROBOWAR_60KG",  label: "RoboWar 60 kg",  maxWeightKg: 60,  dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["ROBO_MINDS"], weightClass: "60KG" },
    ],
  },
  {
    key: "SOCCER_ROBOT",
    label: "Soccer Robot",
    icon: "⚽",
    description: "Football robots — push or kick a ball into the goal",
    sports: [
      { key: "ROBO_SOCCER",      label: "Robo Soccer",       maxWeightKg: 5,  dims: [45,45,45], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
      { key: "PLUG_N_PLAY_SOCCER", label: "Plug N Play Soccer", maxWeightKg: 1, dims: [20,20,20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
  {
    key: "SUMO_ROBOT",
    label: "Sumo Robot",
    icon: "🥋",
    description: "Push opponents out of the ring",
    sports: [
      { key: "ROBO_SUMO", label: "Robo Sumo", maxWeightKg: 1, dims: [20,20,20], controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
  {
    key: "LINE_FOLLOWER_ROBOT",
    label: "Line Follower",
    icon: "📏",
    description: "Robots that autonomously trace a track",
    sports: [
      { key: "LINE_FOLLOWER",      label: "Line Follower (Manual)", maxWeightKg: 1,   dims: [20,20,20], controlType: "MANUAL",     controlMode: null,       eligibleCategories: ["JUNIOR_INNOVATORS"] },
      { key: "LINE_FOLLOWER_AUTO", label: "Line Follower (Auto)",   maxWeightKg: 1.5, dims: null,       controlType: "AUTONOMOUS", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS"] },
    ],
  },
  {
    key: "TASK_ROBOT",
    label: "Task Robot",
    icon: "🔧",
    description: "General-purpose robots built for competition tasks",
    extraFields: [
      { key: "taskCategory", label: "Task Category", options: ["PICK_AND_PLACE", "OBSTACLE_COURSE", "SORTING", "CONSTRUCTION", "OTHER"] },
    ],
    sports: [
      { key: "MANUAL_TASK",         label: "Manual Task",          maxWeightKg: 1, dims: [20,20,20], controlType: "MANUAL", controlMode: null,       eligibleCategories: ["JUNIOR_INNOVATORS"] },
      { key: "THEME_BASED_TASKING", label: "Theme Based Tasking",  maxWeightKg: 5, dims: [45,45,45], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "RC_VEHICLE",
    label: "RC Vehicle",
    icon: "🏎️",
    description: "Remote-controlled racing cars",
    extraFields: [
      { key: "vehicleType", label: "Vehicle Type", options: ["ELECTRIC", "NITRO"] },
      { key: "scaleClass",  label: "Scale Class",  options: ["1:8", "1:12", "OTHER"] },
    ],
    sports: [
      { key: "RC_RACING", label: "RC Racing", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "DRONE",
    label: "Drone",
    icon: "🚁",
    description: "Multi-rotor flying machines — racing or soccer",
    extraFields: [
      { key: "droneType",    label: "Drone Type",   options: ["FPV", "STANDARD_RACING", "FREESTYLE", "OTHER"] },
      { key: "frameSizeCm",  label: "Frame Size (cm)", options: ["10", "20", "25", "30", "OTHER"] },
    ],
    sports: [
      { key: "DRONE_RACING", label: "Drone Racing",  maxWeightKg: null, dims: null,       controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
      { key: "DRONE_SOCCER", label: "Drone Soccer",  maxWeightKg: null, dims: [30,30,30], controlType: "MANUAL", controlMode: "WIRELESS", eligibleCategories: ["YOUNG_ENGINEERS", "ROBO_MINDS"] },
    ],
  },
  {
    key: "AIRCRAFT",
    label: "Aircraft",
    icon: "✈️",
    description: "Fixed-wing RC planes and gliders",
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
    icon: "💡",
    description: "Creative technology solutions — no competition limits",
    extraFields: [
      { key: "projectCategory", label: "Project Category", options: ["AUTOMATION", "IOT", "AI_ML", "RENEWABLE_ENERGY", "HEALTHCARE", "AGRICULTURE", "OTHER"] },
    ],
    sports: [
      { key: "PROJECT_BASED", label: "Project Based Competition", maxWeightKg: null, dims: null, controlType: "MANUAL", controlMode: null, eligibleCategories: ["JUNIOR_INNOVATORS"] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const AGE_LABELS: Record<AgeCategory, string> = {
  JUNIOR_INNOVATORS: "Junior Innovators (8-12 yrs)",
  YOUNG_ENGINEERS:   "Young Engineers (12-18 yrs)",
  ROBO_MINDS:        "Robo Minds (18+ yrs)",
};

const AGE_COLORS: Record<AgeCategory, string> = {
  JUNIOR_INNOVATORS: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  YOUNG_ENGINEERS:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ROBO_MINDS:        "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

function computeLiveEligibility(sport: SportOption | null, weightKg: number | null, lengthCm: number | null, widthCm: number | null, heightCm: number | null): AgeCategory[] {
  if (!sport) return [];
  return sport.eligibleCategories.filter(() => {
    // Weight check
    if (sport.maxWeightKg !== null && weightKg !== null && weightKg > sport.maxWeightKg) return false;
    // Dims check (only if the sport has a limit)
    if (sport.dims !== null) {
      const [maxL, maxW, maxH] = sport.dims;
      if (lengthCm !== null && lengthCm > maxL) return false;
      if (widthCm  !== null && widthCm  > maxW) return false;
      if (heightCm !== null && heightCm > maxH) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3;

export default function CreateRobotForm({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [selectedType, setSelectedType] = useState<RobotTypeConfig | null>(null);

  // Step 2
  const [selectedSport, setSelectedSport] = useState<SportOption | null>(null);

  // Step 3 — form fields
  const [robotName, setRobotName]     = useState("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg]       = useState<number | null>(null);
  const [lengthCm, setLengthCm]       = useState<number | null>(null);
  const [widthCm, setWidthCm]         = useState<number | null>(null);
  const [heightCm, setHeightCm]       = useState<number | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>("WIRELESS");
  const [extraAttrs, setExtraAttrs]   = useState<Record<string, string>>({});

  // Photo upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Live eligibility
  const liveEligibility = computeLiveEligibility(selectedSport, weightKg, lengthCm, widthCm, heightCm);

  // ── Navigation ────────────────────────────────────────────────────────────

  const pickType = useCallback((type: RobotTypeConfig) => {
    setSelectedType(type);
    setSelectedSport(null);
    // Auto-advance if only one sport option
    if (type.sports.length === 1) {
      setSelectedSport(type.sports[0]);
      setStep(3);
    } else {
      setStep(2);
    }
  }, []);

  const pickSport = useCallback((sport: SportOption) => {
    setSelectedSport(sport);
    setStep(3);
  }, []);

  const goBack = () => {
    if (step === 3) {
      setStep(selectedType && selectedType.sports.length === 1 ? 1 : 2);
    } else {
      setStep(1);
    }
  };

  // ── Photo ────────────────────────────────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedSport) return;
    if (!robotName.trim()) { setError("Robot name is required"); return; }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        robotName: robotName.trim(),
        robotType: selectedType.key,
        sport: selectedSport.key,
        controlType: selectedSport.controlType,
        controlMode: selectedSport.controlMode ?? controlMode,
        weightClass: selectedSport.weightClass,
        weightKg:  weightKg  ?? undefined,
        lengthCm:  lengthCm  ?? undefined,
        widthCm:   widthCm   ?? undefined,
        heightCm:  heightCm  ?? undefined,
        attributes: Object.keys(extraAttrs).length ? extraAttrs : undefined,
        description: description.trim(),
      };

      const created = await createRobot(payload);

      // Upload photo if selected
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Register Your Robot</h1>
          <p className="text-gray-400 text-sm">
            {step === 1 && "Choose what kind of robot you're building"}
            {step === 2 && "Select the competition your robot is designed for"}
            {step === 3 && "Enter your robot's specifications"}
          </p>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s < step ? "bg-orange-500 text-white" :
                  s === step ? "bg-orange-500 text-white ring-4 ring-orange-500/30" :
                  "bg-white/10 text-gray-500"
                }`}>
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-orange-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Robot Type ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROBOT_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => pickType(type)}
                className="group relative p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
              >
                <span className="text-3xl mb-3 block">{type.icon}</span>
                <h3 className="font-semibold text-white text-sm mb-1">{type.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{type.description}</p>
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full border border-white/20 group-hover:border-orange-500/60 group-hover:bg-orange-500/20 transition-all" />
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Sport ────────────────────────────────────────────────── */}
        {step === 2 && selectedType && (
          <div>
            <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm cursor-pointer">
              ← Back to Robot Types
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{selectedType.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedType.label}</h2>
                <p className="text-gray-400 text-sm">Select your competition</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedType.sports.map((sport) => (
                <button
                  key={sport.key}
                  onClick={() => pickSport(sport)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{sport.label}</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {sport.eligibleCategories.map(cat => (
                          <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${AGE_COLORS[cat]}`}>
                            {cat === "JUNIOR_INNOVATORS" ? "Junior (8-12)" : cat === "YOUNG_ENGINEERS" ? "Young (12-18)" : "Minds (18+)"}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {sport.maxWeightKg !== null && (
                          <span>⚖️ Max {sport.maxWeightKg} kg</span>
                        )}
                        {sport.dims && (
                          <span>📐 Max {sport.dims[0]}×{sport.dims[1]}×{sport.dims[2]} cm</span>
                        )}
                        <span>{sport.controlType === "AUTONOMOUS" ? "🤖 Autonomous" : "🎮 Manual control"}</span>
                        {sport.controlMode === null
                          ? <span>🔌 Wired or Wireless</span>
                          : <span>📡 {sport.controlMode === "WIRELESS" ? "Wireless only" : "Wired only"}</span>
                        }
                      </div>
                    </div>
                    <div className="text-orange-400 text-xl mt-1">→</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Specifications ───────────────────────────────────────── */}
        {step === 3 && selectedType && selectedSport && (
          <form onSubmit={handleSubmit}>
            <button type="button" onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm cursor-pointer">
              ← Back
            </button>

            {/* Competition summary card */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedType.icon}</span>
                <div>
                  <div className="font-semibold text-white">{selectedType.label} — {selectedSport.label}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSport.eligibleCategories.map(cat => (
                      <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${AGE_COLORS[cat]}`}>
                        {AGE_LABELS[cat]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-300">
                {selectedSport.maxWeightKg !== null && <span>⚖️ Max weight: <strong>{selectedSport.maxWeightKg} kg</strong></span>}
                {selectedSport.dims && <span>📐 Max size: <strong>{selectedSport.dims[0]}×{selectedSport.dims[1]}×{selectedSport.dims[2]} cm</strong></span>}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Robot Name *</label>
                <input
                  type="text"
                  value={robotName}
                  onChange={e => setRobotName(e.target.value)}
                  placeholder="e.g. Iron Thunderbolt"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 transition-colors"
                  required
                />
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Robot Photo</label>
                <div
                  className="relative w-full h-36 bg-white/5 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/40 transition-colors overflow-hidden"
                  onClick={() => fileRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-3xl mb-2">📷</span>
                      <span className="text-gray-400 text-sm">Click to upload photo</span>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Weight (kg)
                  {selectedSport.maxWeightKg !== null && (
                    <span className="ml-2 text-xs text-gray-500">max {selectedSport.maxWeightKg} kg</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedSport.maxWeightKg ?? undefined}
                  value={weightKg ?? ""}
                  onChange={e => setWeightKg(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Enter weight in kg"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 transition-colors"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Dimensions (cm) — Length × Width × Height
                  {selectedSport.dims && (
                    <span className="ml-2 text-xs text-gray-500">max {selectedSport.dims.join("×")} cm</span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Length", "Width", "Height"] as const).map((axis, i) => {
                    const val = i === 0 ? lengthCm : i === 1 ? widthCm : heightCm;
                    const setter = i === 0 ? setLengthCm : i === 1 ? setWidthCm : setHeightCm;
                    return (
                      <div key={axis}>
                        <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={selectedSport.dims?.[i] ?? undefined}
                          value={val ?? ""}
                          onChange={e => setter(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="cm"
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 text-sm transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Control mode (only for Junior sports where user picks) */}
              {selectedSport.controlMode === null && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Control Mode</label>
                  <div className="flex gap-3">
                    {(["WIRED", "WIRELESS"] as ControlMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setControlMode(mode)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          controlMode === mode
                            ? "bg-orange-500/20 border-orange-500 text-orange-300"
                            : "bg-white/5 border-white/15 text-gray-400 hover:border-white/30"
                        }`}
                      >
                        {mode === "WIRED" ? "🔌 Wired" : "📡 Wireless"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type-specific extra fields */}
              {selectedType.extraFields?.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{field.label}</label>
                  <select
                    value={extraAttrs[field.key] ?? ""}
                    onChange={e => setExtraAttrs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/60 transition-colors"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your robot — design, capabilities, special features…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/60 transition-colors resize-none"
                />
              </div>

              {/* Live eligibility preview */}
              {(weightKg !== null || lengthCm !== null) && (
                <div className="p-4 bg-white/3 border border-white/10 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Eligibility based on your specs:</p>
                  {liveEligibility.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {liveEligibility.map(cat => (
                        <span key={cat} className={`text-xs px-3 py-1 rounded-full border font-medium ${AGE_COLORS[cat]}`}>
                          ✓ {AGE_LABELS[cat]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">⚠️ Specs exceed the competition limits — reduce weight or dimensions</span>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !robotName.trim()}
                className="w-full py-4 bg-linear-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base cursor-pointer"
              >
                {submitting ? "Registering…" : "Register Robot"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
