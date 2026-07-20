import { useRef, useState } from "react";
import type { Robot } from "../types/types";
import { updateRobot, type UpdateRobotPayload } from "../api/robot.api";
import { uploadRobotImage } from "../api/uploadRobot.api";
import { getWeightClassOptions, weightClassLabel } from "../constants/weightClasses";
import robotFallback from "../../../assets/robot.png";
import "../../../styles/editTeamMockup.css";

interface RobotEditPanelProps {
  robot: Robot;
  onCancel: () => void;
  onSaved: (robot: Robot) => void;
}

const CONTROL_TYPES = ["MANUAL", "AUTONOMOUS", "HYBRID"];
const CONTROL_MODES = ["WIRED", "WIRELESS"];
const STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE"];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:      "#00D31C",
  INACTIVE:    "#9ca3af",
  MAINTENANCE: "#f59e0b",
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Inline "Edit Robot" panel shown in place of the robot profile's own
 * content — same etm- design system as EditTeamPage (border-gradient
 * cards, field inputs, gradient buttons) instead of the old dark
 * full-screen popup, and not a modal layered on top of unrelated content.
 */
export default function RobotEditPanel({ robot, onCancel, onSaved }: RobotEditPanelProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UpdateRobotPayload>({
    robotName:   robot.robotName,
    weightClass: robot.weightClass ?? "",
    weightKg:    robot.weightKg,
    controlType: robot.controlType,
    controlMode: robot.controlMode ?? "WIRELESS",
    lengthCm:    robot.lengthCm,
    widthCm:     robot.widthCm,
    heightCm:    robot.heightCm,
    description: robot.description ?? "",
    status:      robot.status,
  });

  const set = <K extends keyof UpdateRobotPayload>(k: K, v: UpdateRobotPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const updated = await updateRobot(robot.id, form);
      if (photoFile) {
        await uploadRobotImage(robot.id, photoFile);
      }
      onSaved(updated);
    } catch (ex) {
      setErr(extractErrorMessage(ex, "Failed to update robot"));
    } finally {
      setSaving(false);
    }
  };

  const statusColor = STATUS_COLOR[String(form.status)] ?? STATUS_COLOR.INACTIVE;
  const wcOptions = getWeightClassOptions(robot.sport);

  return (
    <div className="etm-page">
      <div className="w-full max-w-[1079px] mx-auto flex flex-col gap-5 md:gap-6 lg:gap-8">

        <div className="pl-1">
          <h2 className="text-[20px] md:text-[26px] lg:text-[35px] capitalize etm-font-sarpanch font-semibold tracking-wide">
            Edit <span className="text-[#0162D1]">Robot</span> Profile
          </h2>
        </div>

        {/* ── Profile banner card ────────────────────────────────────── */}
        <div className="etm-border-gradient-thick relative flex flex-col md:flex-row items-center gap-5 md:gap-8 lg:gap-10 w-full rounded-[23px] overflow-hidden bg-white shadow-[var(--etm-custom-shadow)] px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-6">

          <div className="flex-shrink-0 flex justify-center items-center rounded-xl bg-[#F0F0F0] w-full md:w-auto">
            <img
              className="w-full max-w-[320px] md:max-w-[340px] lg:max-w-[382px] h-auto rounded-xl object-cover"
              src={photoPreview || robot.robotIMG || robotFallback}
              alt="Robot"
            />
          </div>

          <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2 md:gap-4 lg:gap-6">
              <h2 className="uppercase font-bold etm-font-sarpanch tracking-tight etm-text-gradient text-[24px] md:text-[32px] lg:text-[44px]">
                {form.robotName || robot.robotName}
              </h2>
              <span
                className="flex items-center gap-1.5 border-2 font-semibold rounded-full px-3 py-0.5 text-[10px] md:text-[13px] lg:text-[15px] etm-font-poppins whitespace-nowrap"
                style={{ borderColor: statusColor, color: statusColor }}
              >
                <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                {form.status}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="etm-font-poppins font-medium text-[14px] md:text-[16px] lg:text-[18px] text-gray-700">
                Robot Code
              </span>
              <span className="etm-text-gradient etm-font-inter font-semibold tracking-wide text-[20px] md:text-[26px] lg:text-[35px]">
                {robot.robotCode || "—"}
              </span>
            </div>

            <div className="pt-2 lg:pt-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="robotPhotoInput" />
              <label htmlFor="robotPhotoInput" className="etm-btn-gradient inline-block cursor-pointer">
                Change Photo
              </label>
            </div>
          </div>
        </div>

        {/* ── Robot form ─────────────────────────────────────────────── */}
        <div
          className="etm-border-gradient-thick relative overflow-hidden w-full rounded-[15px] bg-white shadow-sm flex flex-col px-4 py-5 sm:px-8 sm:py-7 lg:px-[50px] lg:py-[50px]"
          style={{ gap: "clamp(14px, 2dvh, 24px)" }}
        >
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="robotName" className="etm-field-label">Robot Name</label>
            <input
              type="text"
              id="robotName"
              placeholder="e.g. Titan Crusher"
              value={form.robotName ?? ""}
              onChange={(e) => set("robotName", e.target.value)}
              className="etm-field-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weightClass" className="etm-field-label">Weight Class</label>
              {wcOptions.length === 0 ? (
                <input
                  type="text"
                  id="weightClass"
                  className="etm-field-input"
                  value={form.weightClass ?? ""}
                  onChange={(e) => set("weightClass", e.target.value)}
                  placeholder="N/A for this sport"
                />
              ) : (
                <select
                  id="weightClass"
                  className="etm-field-input"
                  value={form.weightClass ?? ""}
                  onChange={(e) => set("weightClass", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {wcOptions.map((wc) => <option key={wc} value={wc}>{weightClassLabel(wc)}</option>)}
                </select>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weightKg" className="etm-field-label">Weight (kg)</label>
              <input
                type="number" step="0.1" min="0"
                id="weightKg"
                className="etm-field-input"
                value={form.weightKg ?? ""}
                onChange={(e) => set("weightKg", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="controlType" className="etm-field-label">Control Type</label>
              <select
                id="controlType"
                className="etm-field-input"
                value={form.controlType}
                onChange={(e) => set("controlType", e.target.value)}
              >
                {CONTROL_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="controlMode" className="etm-field-label">Connection</label>
              <select
                id="controlMode"
                className="etm-field-input"
                value={form.controlMode}
                onChange={(e) => set("controlMode", e.target.value)}
              >
                {CONTROL_MODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lengthCm" className="etm-field-label">Length (cm)</label>
              <input
                type="number" step="0.1" min="0"
                id="lengthCm"
                className="etm-field-input"
                value={form.lengthCm ?? ""}
                onChange={(e) => set("lengthCm", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="widthCm" className="etm-field-label">Width (cm)</label>
              <input
                type="number" step="0.1" min="0"
                id="widthCm"
                className="etm-field-input"
                value={form.widthCm ?? ""}
                onChange={(e) => set("widthCm", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="heightCm" className="etm-field-label">Height (cm)</label>
              <input
                type="number" step="0.1" min="0"
                id="heightCm"
                className="etm-field-input"
                value={form.heightCm ?? ""}
                onChange={(e) => set("heightCm", e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="etm-field-label">Status</label>
              <select
                id="status"
                className="etm-field-input"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="robotDescription" className="etm-field-label">Description</label>
            <textarea
              id="robotDescription"
              rows={4}
              placeholder="Tell us about your robot…"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="etm-field-input"
            />
          </div>

          {err && <p className="text-sm text-red-500 etm-font-inter">{err}</p>}
        </div>

        {/* ── Save button ────────────────────────────────────────────── */}
        <div className="flex justify-center items-center pb-4 gap-3">
          <button type="button" onClick={onCancel} disabled={saving} className="etm-font-poppins font-semibold text-gray-500 cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={() => void handleSave()} disabled={saving} className="etm-btn-primary">
            {saving ? "Saving…" : "Save Robot Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}
