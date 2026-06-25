import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, X, ChevronDown, Info, Calendar, Users, Trophy, Swords, Tag, Edit2, Trash2 } from "lucide-react"
import { useSelector } from "react-redux"
import { useAdminEvents } from "../hooks/UseAdminEvent"
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime"
import type { CreateEventSportRequest, UpdateEventRequest, EventTier } from "../api/admin.api"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole } from "../../../shared/constants/roles"
import TierBadge from "../../../shared/components/TierBadge"
import LocationSelects from "../../../shared/components/LocationSelects"
import SponsorManager from "../components/SponsorManager"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const BG      = "#3a3a3a"
const CARD    = "rgba(0,0,0,0.25)"
const CARD2   = "rgba(0,0,0,0.35)"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#fa4715"
const TEXT    = "#ffffff"
const MUTED   = "#9ca3af"
const LABEL   = "#e5e7eb"
const SUCCESS = "#4ade80"
const WARNING = "#fbbf24"
const DANGER  = "#f87171"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type EventStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "ARCHIVED"

// Actual shape returned by the server (sport field, not sportName)
interface EventSportItem {
  id: string
  sport: string            // e.g. "LINE_FOLLOWER"
  sportsInfo?: string | null
  status?: string
  formatType?: string
  ageGroup?: string
  weightClass?: string
  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  entryFee?: number
  prizeMoney?: number
  registrationStartDate?: string
  registrationEndDate?: string
  registeredTeamsCount?: number
  registrations?: { id: string; teamName: string; teamLogoUrl?: string; lineup?: unknown[] }[]
}

interface SportConfig {
  value: string
  label: string
  weightClasses: { value: string; label: string }[]
  hint?: string
}

interface AgeGroupConfig {
  value: string
  label: string
  subLabel: string
  connectivity: string
  sports: SportConfig[]
}

type AddSportForm = CreateEventSportRequest

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert any enum-style string to a readable label: LINE_FOLLOWER → Line Follower */
function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ─────────────────────────────────────────────────────────────
// AGE GROUP → SPORT CATALOGUE
// ─────────────────────────────────────────────────────────────

const AGE_GROUP_CATALOGUE: AgeGroupConfig[] = [
  {
    value: "JUNIOR_INNOVATORS",
    label: "Junior Innovators",
    subLabel: "8–12 yrs",
    connectivity: "Wired / Wireless",
    sports: [
      { value: "PROJECT_BASED",           label: "Project Based Competition",  hint: "Concept & prototype presentation", weightClasses: [] },
      { value: "PLUG_N_PLAY_RACE_SOCCER", label: "Plug N Play — Race / Soccer", hint: "1 kg · 20×20×20 cm · single bot",   weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "LINE_FOLLOWER",           label: "Line Follower",               hint: "1 kg · 20×20×20 cm",               weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "MANUAL_TASK",             label: "Manual Task",                 hint: "1 kg · 20×20×20 cm",               weightClasses: [{ value: "1KG", label: "1 kg" }] },
      { value: "ROBO_SUMO",              label: "Robo Sumo",                   hint: "1 kg · 20×20×20 cm",               weightClasses: [{ value: "1KG", label: "1 kg" }] }
    ]
  },
  {
    value: "YOUNG_ENGINEERS",
    label: "Young Engineers",
    subLabel: "12–18 yrs",
    connectivity: "Wireless",
    sports: [
      { value: "ROBO_SOCCER",         label: "Robo Soccer",                hint: "3 kg · 30×30×30 cm",   weightClasses: [{ value: "3KG",   label: "3 kg"   }] },
      { value: "LINE_FOLLOWER_AUTO",  label: "Line Follower (Auto)",        hint: "1.5 kg",               weightClasses: [{ value: "1_5KG", label: "1.5 kg" }] },
      { value: "THEME_BASED_TASKING", label: "Theme-Based Tasking",         hint: "3 kg",                 weightClasses: [{ value: "3KG",   label: "3 kg"   }] },
      { value: "ROBO_WAR",            label: "RoboWar",                     hint: "1.5 kg only",          weightClasses: [{ value: "1_5KG", label: "1.5 kg" }] },
      { value: "DRONE_RACING_SOCCER", label: "Drone Racing / Drone Soccer", hint: "20 cm · 30×30×30 cm", weightClasses: [{ value: "OPEN",  label: "Open"   }] },
      { value: "RC_ROBO_RACING",      label: "RC Racing / Robo Racing",     hint: "",                     weightClasses: [{ value: "OPEN",  label: "Open"   }] }
    ]
  },
  {
    value: "ROBO_MINDS",
    label: "Robo Minds",
    subLabel: "18+ yrs",
    connectivity: "Wireless",
    sports: [
      { value: "ROBO_SOCCER_OPEN",         label: "Robo Soccer",                      hint: "5 kg · 45×45×45 cm",         weightClasses: [{ value: "5KG", label: "5 kg" }] },
      { value: "THEME_BASED_TASKING_OPEN", label: "Theme-Based Tasking",               hint: "5 kg · 45×45×45 cm",         weightClasses: [{ value: "5KG", label: "5 kg" }] },
      { value: "ROBO_WAR_OPEN",            label: "RoboWar",                            hint: "1.5 / 8 / 15 / 30 / 60 kg", weightClasses: [
        { value: "1_5KG", label: "1.5 kg" },
        { value: "8KG",   label: "8 kg"   },
        { value: "15KG",  label: "15 kg"  },
        { value: "30KG",  label: "30 kg"  },
        { value: "60KG",  label: "60 kg"  }
      ]},
      { value: "DRONE_RACING_FPV",  label: "Drone Racing (FPV) / Drone Soccer", hint: "",          weightClasses: [{ value: "OPEN", label: "Open" }] },
      { value: "RC_RACING_NITRO",   label: "RC Racing (Nitro + Electric)",       hint: "1:8 · 1:12", weightClasses: [{ value: "OPEN", label: "Open" }] },
      { value: "AEROMODELLING",     label: "Aeromodelling",                      hint: "",          weightClasses: [{ value: "OPEN", label: "Open" }] }
    ]
  }
]

const FORMAT_TYPE_OPTIONS = [
  { value: "KNOCKOUT",           label: "Knockout"           },
  { value: "ROUND_ROBIN",        label: "Round Robin"        },
  { value: "SWISS",              label: "Swiss"              },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" }
]

const INITIAL_FORM: AddSportForm = {
  sport: "",
  ageGroup: "",
  sportData: "",
  weightClass: "",
  minTeamSize: 2,
  maxTeamSize: 5,
  maxTeams: 16,
  entryFee: 0,
  prizeMoney: 0,
  formatType: "",
  registrationStartDate: "",
  registrationEndDate: ""
}

// ─────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(255,255,255,0.12)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    DRAFT:     { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "📝" },
    PUBLISHED: { bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   color: ACCENT,  icon: "📣" },
    LIVE:      { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🟢" },
    COMPLETED: { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED,   icon: "✅" },
    ARCHIVED:  { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)", color: "#64748b", icon: "🗄️" },
  }
  const key = status?.toUpperCase() || "DRAFT"
  const s   = MAP[key] || MAP["DRAFT"]
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.icon} {key.replace(/_/g, " ")}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// CHIP
// ─────────────────────────────────────────────────────────────

const chip = (active = false): React.CSSProperties => ({
  background: active ? "rgba(250,71,21,0.13)" : "rgba(255,255,255,0.06)",
  border: `1px solid ${active ? "rgba(250,71,21,0.35)" : BORDER}`,
  color: active ? ACCENT : LABEL,
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "3px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
})

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", color: MUTED, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: TEXT, fontFamily: "'Orbitron', sans-serif" }}>
        {value}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INFO CELL
// ─────────────────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ color: MUTED, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: TEXT, fontWeight: 600, fontSize: "0.85rem" }}>{value || "—"}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FORM FIELD
// ─────────────────────────────────────────────────────────────

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
        {label}{required && <span style={{ color: ACCENT, marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INPUT STYLES
// ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.35)",
  border: `1px solid rgba(255,255,255,0.12)`,
  borderRadius: "8px",
  color: TEXT,
  fontSize: "0.85rem",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
}
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer", paddingRight: "32px" }
const dateInputStyle: React.CSSProperties = { ...inputStyle, colorScheme: "dark", cursor: "pointer" }

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────

function SectionHeader({ step, currentStep, label, subLabel }: { step: number; currentStep: number; totalSteps: number; label: string; subLabel?: string }) {
  const done   = currentStep > step
  const active = currentStep === step
  return (
    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: active ? ACCENT : done ? "rgba(250,71,21,0.55)" : MUTED, marginBottom: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
      <span style={{ background: active ? ACCENT : done ? "rgba(250,71,21,0.4)" : "rgba(255,255,255,0.12)", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0 }}>
        {done ? "✓" : step}
      </span>
      {label}
      {subLabel && <span style={{ color: MUTED, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem" }}>— {subLabel}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AGE GROUP PICKER
// ─────────────────────────────────────────────────────────────

function AgeGroupPicker({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
      {AGE_GROUP_CATALOGUE.map(ag => {
        const active = selected === ag.value
        return (
          <button key={ag.value} onClick={() => onSelect(ag.value)} style={{ background: active ? "rgba(250,71,21,0.12)" : "rgba(0,0,0,0.3)", border: `1.5px solid ${active ? "rgba(250,71,21,0.5)" : "rgba(255,255,255,0.09)"}`, borderRadius: "10px", padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ color: active ? ACCENT : TEXT, fontWeight: 700, fontSize: "0.82rem", display: "block" }}>{ag.label}</span>
            <span style={{ color: active ? "rgba(250,71,21,0.75)" : MUTED, fontSize: "0.68rem", display: "block" }}>{ag.subLabel}</span>
            <span style={{ marginTop: "4px", background: active ? "rgba(250,71,21,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${active ? "rgba(250,71,21,0.25)" : BORDER}`, color: active ? ACCENT : MUTED, borderRadius: "4px", fontSize: "0.6rem", padding: "2px 6px", display: "inline-block", fontWeight: 600 }}>{ag.connectivity}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SPORT PICKER
// ─────────────────────────────────────────────────────────────

function SportPicker({ ageGroupValue, selected, onSelect }: { ageGroupValue: string; selected: string; onSelect: (s: SportConfig) => void }) {
  const ag = AGE_GROUP_CATALOGUE.find(a => a.value === ageGroupValue)
  if (!ag) return null
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      {ag.sports.map(sp => {
        const active = selected === sp.value
        return (
          <button key={sp.value} onClick={() => onSelect(sp)} style={{ background: active ? "rgba(250,71,21,0.1)" : "rgba(0,0,0,0.25)", border: `1.5px solid ${active ? "rgba(250,71,21,0.45)" : "rgba(255,255,255,0.07)"}`, borderRadius: "9px", padding: "10px 14px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", transition: "all 0.12s" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: active ? ACCENT : TEXT, fontWeight: 600, fontSize: "0.83rem" }}>{sp.label}</span>
              {sp.hint && <span style={{ color: MUTED, fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "4px" }}><Info size={10} style={{ flexShrink: 0 }} />{sp.hint}</span>}
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {sp.weightClasses.map(wc => (
                <span key={wc.value} style={{ background: active ? "rgba(250,71,21,0.18)" : "rgba(255,255,255,0.07)", border: `1px solid ${active ? "rgba(250,71,21,0.3)" : BORDER}`, color: active ? ACCENT : MUTED, borderRadius: "5px", fontSize: "0.62rem", padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>{wc.label}</span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WEIGHT CLASS PICKER
// ─────────────────────────────────────────────────────────────

function WeightClassPicker({ weightClasses, selected, onSelect }: { weightClasses: { value: string; label: string }[]; selected: string; onSelect: (v: string) => void }) {
  if (weightClasses.length <= 1) return null
  return (
    <FormField label="Weight Class" required>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {weightClasses.map(wc => {
          const active = selected === wc.value
          return <button key={wc.value} onClick={() => onSelect(wc.value)} style={{ background: active ? "rgba(250,71,21,0.15)" : "rgba(0,0,0,0.3)", border: `1.5px solid ${active ? "rgba(250,71,21,0.5)" : "rgba(255,255,255,0.1)"}`, color: active ? ACCENT : LABEL, borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, padding: "7px 16px", cursor: "pointer", transition: "all 0.12s" }}>{wc.label}</button>
        })}
      </div>
    </FormField>
  )
}

// ─────────────────────────────────────────────────────────────
// ADD SPORT MODAL
// ─────────────────────────────────────────────────────────────

interface AddSportModalProps {
  eventId: string
  onAddSport: (request: CreateEventSportRequest) => Promise<unknown>
  submitting: boolean
  onClose: () => void
}

function AddSportModal({ eventId: _eventId, onAddSport, submitting, onClose }: AddSportModalProps) {
  const [form, setForm]   = useState<AddSportForm>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)

  const selectedAg       = AGE_GROUP_CATALOGUE.find(a => a.value === form.ageGroup) || null
  const selectedSp       = selectedAg?.sports.find(s => s.value === form.sport) || null
  const needWeightPicker = (selectedSp?.weightClasses?.length ?? 0) > 1
  const step             = !form.ageGroup ? 1 : !form.sport ? 2 : 3

  const set = (key: keyof AddSportForm, value: string | number) => setForm(f => ({ ...f, [key]: value }))

  const handleAgeGroupSelect = (value: string) => setForm(f => ({ ...f, ageGroup: value, sport: "", weightClass: "" }))

  const handleSportSelect = (sport: SportConfig) => {
    const wc = sport.weightClasses.length === 1 ? sport.weightClasses[0].value : ""
    setForm(f => ({ ...f, sport: sport.value, weightClass: wc }))
  }

  const handleSubmit = async () => {
    if (!form.ageGroup)                                              { setError("Please select an age group.");                         return }
    if (!form.sport)                                                 { setError("Please select a sport.");                              return }
    if (needWeightPicker && !form.weightClass)                       { setError("Please select a weight class.");                       return }
    if (!form.formatType)                                            { setError("Please select a format type.");                        return }
    if (!form.registrationStartDate)                                 { setError("Please set a registration start date.");               return }
    if (!form.registrationEndDate)                                   { setError("Please set a registration end date.");                 return }
    if (form.registrationStartDate > form.registrationEndDate)       { setError("Registration start date must be before end date.");    return }
    if ((form.minTeamSize ?? 0) > (form.maxTeamSize ?? 0))           { setError("Min team size cannot exceed max team size.");          return }
    setError(null)
    try {
      await onAddSport({ ...form, weightClass: form.weightClass || "OPEN" })
      onClose()
    } catch (err: any) {
      setError(err?.message || "Something went wrong.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#2a2a2a", border: `1px solid rgba(250,71,21,0.22)`, borderRadius: "18px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", borderRadius: "18px 18px 0 0", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em" }}>ADD SPORT</div>
            <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>Configure a new sport for this event</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[1, 2, 3].map(n => <div key={n} style={{ width: n === step ? "20px" : "8px", height: "8px", borderRadius: "99px", background: n <= step ? ACCENT : "rgba(255,255,255,0.18)", opacity: n < step ? 0.5 : 1, transition: "all 0.25s" }} />)}
            <button onClick={onClose} style={{ marginLeft: "8px", background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", color: MUTED, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, overflowY: "auto" }}>

          {/* STEP 1 */}
          <div>
            <SectionHeader step={1} currentStep={step} totalSteps={3} label="Age Category" />
            <AgeGroupPicker selected={form.ageGroup} onSelect={handleAgeGroupSelect} />
          </div>

          {/* STEP 2 */}
          {form.ageGroup && (
            <div>
              <SectionHeader step={2} currentStep={step} totalSteps={3} label="Select Sport" subLabel={`${selectedAg?.label} · ${selectedAg?.subLabel}`} />
              <SportPicker ageGroupValue={form.ageGroup} selected={form.sport} onSelect={handleSportSelect} />
            </div>
          )}

          {/* STEP 3 */}
          {form.sport && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SectionHeader step={3} currentStep={step} totalSteps={3} label="Configuration" />

              {needWeightPicker && <WeightClassPicker weightClasses={selectedSp!.weightClasses} selected={form.weightClass ?? ""} onSelect={v => set("weightClass", v)} />}

              <FormField label="Format Type" required>
                <div style={{ position: "relative" }}>
                  <select style={selectStyle} value={form.formatType} onChange={e => set("formatType", e.target.value)}>
                    <option value="">Select format…</option>
                    {FORMAT_TYPE_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
                </div>
              </FormField>

              <FormField label="Description">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "68px", fontFamily: "inherit" }} placeholder="Describe this sport category…" value={form.sportData} onChange={e => set("sportData", e.target.value)} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <FormField label="Min Team Size" required><input type="number" min={1} style={inputStyle} value={form.minTeamSize} onChange={e => set("minTeamSize", parseInt(e.target.value) || 1)} /></FormField>
                <FormField label="Max Team Size" required><input type="number" min={1} style={inputStyle} value={form.maxTeamSize} onChange={e => set("maxTeamSize", parseInt(e.target.value) || 1)} /></FormField>
                <FormField label="Max Teams" required><input type="number" min={2} style={inputStyle} value={form.maxTeams} onChange={e => set("maxTeams", parseInt(e.target.value) || 2)} /></FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="Entry Fee (₹)" required><input type="number" min={0} step={50} style={inputStyle} value={form.entryFee} onChange={e => set("entryFee", parseFloat(e.target.value) || 0)} /></FormField>
                <FormField label="Prize Money (₹)" required><input type="number" min={0} step={1000} style={inputStyle} value={form.prizeMoney} onChange={e => set("prizeMoney", parseFloat(e.target.value) || 0)} /></FormField>
              </div>

              {/* REGISTRATION DATES */}
              <div style={{ background: "rgba(250,71,21,0.04)", border: "1px solid rgba(250,71,21,0.14)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: ACCENT }}>
                  <Calendar size={13} />Registration Window
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <FormField label="Start Date" required><input type="date" style={dateInputStyle} value={form.registrationStartDate} onChange={e => set("registrationStartDate", e.target.value)} /></FormField>
                  <FormField label="End Date" required><input type="date" style={dateInputStyle} value={form.registrationEndDate} min={form.registrationStartDate || undefined} onChange={e => set("registrationEndDate", e.target.value)} /></FormField>
                </div>
                {form.registrationStartDate && form.registrationEndDate && (
                  <div style={{ fontSize: "0.72rem", color: SUCCESS, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    ✅ Open from <strong>{new Date(form.registrationStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong> to <strong>{new Date(form.registrationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600 }}>⚠️ {error}</div>}
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 20px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={submitting} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || step < 3} style={{ background: (submitting || step < 3) ? "rgba(250,71,21,0.3)" : ACCENT, border: "none", color: step < 3 ? MUTED : "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: (submitting || step < 3) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}>
            {submitting ? <><Spinner size={14} color="#fff" />Adding…</> : <><Plus size={14} />Add Sport</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SPORT CARD
// — reads `sport.sport` (the enum value from server)
// ─────────────────────────────────────────────────────────────

function SportCard({ sport, index, eventId, navigate }: { sport: EventSportItem; index: number; eventId: string; navigate: (path: string) => void }) {
  const teamCount   = sport.registrations?.length ?? sport.registeredTeamsCount ?? 0
  const playerCount = sport.registrations?.reduce((n, t) => n + ((t.lineup as any[])?.length ?? 0), 0) ?? 0
  const displayName = toLabel(sport.sport)   // ← uses sport.sport, not sport.sportName
  const hue         = (index * 47 + 11) % 360

  return (
    <div
      onClick={() => navigate(`/admin/events/${eventId}/sports/${sport.id}`)}
      style={{ background: "rgba(0,0,0,0.28)", border: `1px solid rgba(255,255,255,0.09)`, borderRadius: "14px", overflow: "hidden", transition: "border-color 0.15s, transform 0.15s", position: "relative", cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(250,71,21,0.38)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}
    >
      {/* accent stripe */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${ACCENT}, hsl(${hue},80%,55%))` }} />

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* name + index */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span style={{ background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.28)", color: ACCENT, borderRadius: "6px", fontSize: "0.62rem", fontWeight: 800, padding: "2px 7px", flexShrink: 0 }}>#{index + 1}</span>
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: TEXT, lineHeight: 1.3 }}>{displayName}</span>
          </div>
          <Swords size={15} style={{ color: MUTED, flexShrink: 0, marginTop: "2px" }} />
        </div>

        {/* meta chips row */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {sport.ageGroup && <span style={chip()}>{toLabel(sport.ageGroup)}</span>}
          {sport.weightClass && <span style={chip()}>{toLabel(sport.weightClass)}</span>}
          {sport.formatType && <span style={chip()}>{toLabel(sport.formatType)}</span>}
          {sport.status && <StatusPill status={sport.status} />}
        </div>

        {/* stats */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Trophy size={13} style={{ color: WARNING, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Teams</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, fontFamily: "'Orbitron', sans-serif" }}>{teamCount}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Users size={13} style={{ color: SUCCESS, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Players</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, fontFamily: "'Orbitron', sans-serif" }}>{playerCount}</div>
            </div>
          </div>
        </div>

        {/* fee / prize */}
        {(sport.entryFee != null || sport.prizeMoney != null) && (
          <div style={{ display: "flex", gap: "10px" }}>
            {sport.entryFee != null && (
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "6px 10px" }}>
                <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Entry Fee</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: WARNING }}>₹{sport.entryFee.toLocaleString("en-IN")}</div>
              </div>
            )}
            {sport.prizeMoney != null && (
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "6px 10px" }}>
                <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Prize Pool</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: SUCCESS }}>₹{sport.prizeMoney.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        )}

        {/* registration window */}
        {sport.registrationStartDate && sport.registrationEndDate && (
          <div style={{ fontSize: "0.67rem", color: MUTED, display: "flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={10} style={{ flexShrink: 0 }} />
            {new Date(sport.registrationStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" → "}
            {new Date(sport.registrationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}

        {/* team chips */}
        {sport.registrations && sport.registrations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {sport.registrations.slice(0, 4).map(t => (
              <span key={t.id} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "5px", fontSize: "0.65rem", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Tag size={9} style={{ flexShrink: 0 }} />{t.teamName}
              </span>
            ))}
            {sport.registrations.length > 4 && (
              <span style={{ background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.22)", color: ACCENT, borderRadius: "5px", fontSize: "0.65rem", padding: "2px 8px", fontWeight: 700 }}>+{sport.registrations.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SPORTS LIST SECTION
// ─────────────────────────────────────────────────────────────

function SportsList({ sports, isDraft, eventId, onAddSport, navigate }: { sports: EventSportItem[]; isDraft: boolean; eventId: string; onAddSport: () => void; navigate: (p: string) => void }) {
  return (
    <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "16px", overflow: "hidden", marginTop: "24px" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem" }}>SPORTS</span>
          <span style={{ background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.28)", color: ACCENT, borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800, padding: "1px 9px" }}>{sports.length}</span>
        </div>
        {isDraft && (
          <button onClick={onAddSport} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.3)", color: ACCENT, borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
            <Plus size={13} /> ADD SPORT
          </button>
        )}
      </div>

      <div style={{ padding: "18px 20px" }}>
        {sports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "2.5rem" }}>🏅</div>
            <div style={{ color: MUTED, fontSize: "0.85rem", fontWeight: 600 }}>No sports added yet</div>
            {isDraft && (
              <button onClick={onAddSport} style={{ display: "flex", alignItems: "center", gap: "7px", background: ACCENT, border: "none", color: "#fff", borderRadius: "9px", padding: "9px 20px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}>
                <Plus size={14} /> Add the first sport
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {sports.map((sport, i) => (
              <SportCard key={sport.id} sport={sport} index={i} eventId={eventId} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITION CONFIG
// ─────────────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, { value: string; label: string; color: string }[]> = {
  DRAFT:     [{ value: "PUBLISHED", label: "Publish",        color: ACCENT  }],
  PUBLISHED: [{ value: "LIVE",      label: "Start Event",    color: SUCCESS },
              { value: "ARCHIVED",  label: "Archive",         color: MUTED   }],
  LIVE:      [{ value: "COMPLETED", label: "Complete Event", color: SUCCESS }],
  COMPLETED: [{ value: "ARCHIVED",  label: "Archive",         color: MUTED   }],
}

// ─────────────────────────────────────────────────────────────
// EDIT EVENT MODAL
// ─────────────────────────────────────────────────────────────

interface EditEventModalProps {
  event: { eventName: string; eventDescription?: string; organizationName?: string; organizationUrl?: string; venueName?: string; city?: string; state?: string; country?: string; startDate?: string; endDate?: string; tier?: string }
  onSave: (req: UpdateEventRequest) => Promise<unknown>
  saving: boolean
  onClose: () => void
  /** When true (PUBLISHED + organizer), only name/description/logo/org are editable */
  limitedEdit?: boolean
}

const TIER_OPTIONS: { value: EventTier; label: string; icon: string; desc: string }[] = [
  { value: "S_TIER", label: "S-Tier", icon: "👑", desc: "Elite championship events" },
  { value: "A_TIER", label: "A-Tier", icon: "⭐", desc: "Major competitive events"  },
  { value: "B_TIER", label: "B-Tier", icon: "🏅", desc: "Standard events"           },
]

function EditEventModal({ event, onSave, saving, onClose, limitedEdit = false }: EditEventModalProps) {
  const fmt = (d?: string) => d ? d.slice(0, 10) : ""
  const [form, setForm] = useState<UpdateEventRequest>({
    eventName:       event.eventName       ?? "",
    eventDescription:event.eventDescription ?? "",
    organizationName:event.organizationName ?? "",
    organizationUrl: event.organizationUrl  ?? "",
    venueName:       event.venueName        ?? "",
    city:            event.city             ?? "",
    state:           event.state            ?? "",
    country:         event.country          ?? "",
    startDate:       fmt(event.startDate),
    endDate:         fmt(event.endDate),
    tier:            (event.tier as EventTier) ?? "B_TIER",
  })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof UpdateEventRequest, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.eventName?.trim()) { setError("Event name is required."); return }
    setError(null)
    try { await onSave(form); onClose() }
    catch (err: any) { setError(err?.message || "Save failed.") }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#2a2a2a", border: `1px solid rgba(250,71,21,0.22)`, borderRadius: "18px", width: "100%", maxWidth: "620px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", borderRadius: "18px 18px 0 0" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em" }}>EDIT EVENT</div>
            <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>
              {limitedEdit ? "Basic info only — event is published" : "Update event details"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", color: MUTED, cursor: "pointer", padding: "6px", display: "flex" }}><X size={16} /></button>
        </div>
        {/* body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {limitedEdit && (
            <div style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: "8px", padding: "9px 13px", color: WARNING, fontSize: "0.78rem", fontWeight: 600 }}>
              ✏️ Published events — only name, description, logo and organisation name can be changed.
            </div>
          )}
          <FormField label="Event Name" required>
            <input style={inputStyle} value={form.eventName} onChange={e => set("eventName", e.target.value)} />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", fontFamily: "inherit" }} value={form.eventDescription} onChange={e => set("eventDescription", e.target.value)} />
          </FormField>
          <FormField label="Logo URL">
            <input style={inputStyle} placeholder="https://…" value={form.eventLogoUrl ?? ""} onChange={e => set("eventLogoUrl", e.target.value)} />
          </FormField>
          <FormField label="Organization Name">
            <input style={inputStyle} value={form.organizationName} onChange={e => set("organizationName", e.target.value)} />
          </FormField>

          {/* Extended fields — DRAFT or admin only */}
          {!limitedEdit && (
            <>
              <FormField label="Organization URL">
                <input style={inputStyle} value={form.organizationUrl} onChange={e => set("organizationUrl", e.target.value)} />
              </FormField>
              <FormField label="Venue Name">
                <input style={inputStyle} value={form.venueName} onChange={e => set("venueName", e.target.value)} />
              </FormField>
              <LocationSelects
                country={form.country ?? ""}
                state={form.state ?? ""}
                city={form.city ?? ""}
                onCountry={v => set("country", v)}
                onState={v => set("state", v)}
                onCity={v => set("city", v)}
                selectStyle={selectStyle}
                inputStyle={inputStyle}
                labelStyle={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, marginBottom: "6px", display: "block" }}
                gridStyle={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="Start Date"><input type="date" style={dateInputStyle} value={form.startDate} onChange={e => set("startDate", e.target.value)} /></FormField>
                <FormField label="End Date"><input type="date" style={dateInputStyle} value={form.endDate} min={form.startDate || undefined} onChange={e => set("endDate", e.target.value)} /></FormField>
              </div>

              {/* TIER SELECTOR */}
              <FormField label="Event Tier">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {TIER_OPTIONS.map(opt => {
                    const active = form.tier === opt.value
                    const colors = { S_TIER: "#fbbf24", A_TIER: "#60a5fa", B_TIER: "#fa8c4f" }
                    const c = colors[opt.value]
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("tier", opt.value)}
                        style={{
                          background:   active ? `${c}18` : "rgba(0,0,0,0.25)",
                          border:       `1.5px solid ${active ? c : "rgba(255,255,255,0.1)"}`,
                          borderRadius: "10px",
                          padding:      "10px 8px",
                          cursor:       "pointer",
                          textAlign:    "center",
                          transition:   "all 0.18s",
                          boxShadow:    active ? `0 0 10px ${c}30` : "none",
                        }}
                      >
                        <div style={{ fontSize: "1.3rem", marginBottom: "3px" }}>{opt.icon}</div>
                        <div style={{ color: active ? c : "#fff", fontWeight: 700, fontSize: "0.8rem" }}>{opt.label}</div>
                        <div style={{ color: MUTED, fontSize: "0.62rem", marginTop: "2px" }}>{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </FormField>
            </>
          )}

          {error && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600 }}>⚠️ {error}</div>}
        </div>
        {/* footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} disabled={saving} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(250,71,21,0.3)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {saving ? <><Spinner size={14} color="#fff" />Saving…</> : <>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE WRAPPER
// ─────────────────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "40px 48px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #2a2a2a; color: #fff; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const { user } = useSelector((state: RootState) => state.auth)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])

  const isAdmin           = hasRole(userRoles, [AppRole.ADMINISTRATOR, AppRole.SUPER_ADMIN])
  const canDelete         = hasRole(userRoles, [AppRole.MANAGER])
  const canManageSponsors = isAdmin

  const {
    event, loading, error, refetch,
    createEventSport, sportLoading,
    publishLoading,
    updateEvent, changeEventStatus, deleteEvent,
  } = useAdminEvents(eventId)

  const [showAddSport,   setShowAddSport]   = useState(false)
  const [showEditEvent,  setShowEditEvent]  = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError,    setActionError]    = useState<string | null>(null)
  const [actionLoading,  setActionLoading]  = useState(false)

  // Real-time: when event/sport changes come in over WebSocket, re-fetch so
  // the admin view shows the latest data without a manual page refresh.
  useEventRealtime(eventId, {
    onEventUpdated:       () => refetch(),
    onEventStatusChanged: () => refetch(),
    onSportUpdated:       () => refetch(),
    onRegistrationNew:    () => refetch(),
  })

  const eventStatus  = event?.status as EventStatus | undefined
  const isDraft      = eventStatus === "DRAFT"
  const isPublished  = eventStatus === "PUBLISHED"
  const isArchived   = eventStatus === "ARCHIVED"

  // ADMINISTRATOR/SUPER_ADMIN can edit at any stage except ARCHIVED
  // ORGANIZER can edit in DRAFT (full) or PUBLISHED (basic fields only)
  const canEditFull  = !isArchived && (isAdmin || isDraft)
  const canEditBasic = !isArchived && (isAdmin || isPublished)
  const canEdit      = canEditFull || canEditBasic
  // Pass to modal: limitedEdit when organizer in PUBLISHED state
  const limitedEdit  = canEditBasic && !canEditFull

  const sports   = (event?.sports ?? []) as unknown as EventSportItem[]
  const totalSports = sports.length
  const totalRegistrations = sports.reduce((t, s) => t + (s.registrations?.length ?? s.registeredTeamsCount ?? 0), 0)

  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishConfirm, setPublishConfirm] = useState(false)

  const handlePublishEvent = async () => {
    if (!eventId) return
    setPublishError(null)
    try {
      await changeEventStatus(eventId, "PUBLISHED")
      setPublishConfirm(false)
    } catch (err: any) {
      setPublishError(err?.message || "Failed to publish event.")
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      await changeEventStatus(eventId, status)
    } catch (err: any) {
      setActionError(err?.message || "Failed to change status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveEdit = async (req: UpdateEventRequest) => {
    if (!eventId) return
    await updateEvent(eventId, req)
  }

  const handleDeleteEvent = async () => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      await deleteEvent(eventId)
      navigate("/admin/user")
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete event.")
      setActionLoading(false)
    }
  }

  const handleAddSport = async (request: CreateEventSportRequest) => {
    if (!eventId) return
    await createEventSport(eventId, request)
    await refetch()
  }

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: MUTED }}>
          <Spinner size={40} /><div style={{ fontSize: "0.9rem" }}>Loading event...</div>
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "10px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600 }}>⚠️ {error}</div>
      </PageWrapper>
    )
  }

  if (!event) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Event not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {showAddSport && eventId && (
        <AddSportModal eventId={eventId} onAddSport={handleAddSport} submitting={sportLoading} onClose={() => setShowAddSport(false)} />
      )}

      {showEditEvent && event && (
        <EditEventModal event={event} onSave={handleSaveEdit} saving={publishLoading} onClose={() => setShowEditEvent(false)} limitedEdit={limitedEdit} />
      )}

      {/* PUBLISH CONFIRM DIALOG */}
      {publishConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
             onClick={e => { if (e.target === e.currentTarget) setPublishConfirm(false) }}>
          <div style={{ background: "#2a2a2a", border: `1px solid rgba(250,71,21,0.3)`, borderRadius: "16px", padding: "28px 28px 24px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>📣</div>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Orbitron', sans-serif", fontSize: "1rem", fontWeight: 700 }}>Publish Event?</h2>
            <p style={{ margin: "0 0 20px", color: MUTED, fontSize: "0.82rem", lineHeight: 1.6 }}>
              Move <strong style={{ color: TEXT }}>{event.eventName}</strong> from <strong style={{ color: WARNING }}>DRAFT</strong> to <strong style={{ color: ACCENT }}>PUBLISHED</strong>.
            </p>
            {publishError && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", fontWeight: 600, marginBottom: "14px" }}>⚠️ {publishError}</div>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setPublishConfirm(false); setPublishError(null) }} disabled={publishLoading} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handlePublishEvent} disabled={publishLoading} style={{ background: publishLoading ? "rgba(250,71,21,0.4)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                {publishLoading ? <><Spinner size={14} color="#fff" />Publishing…</> : <>📣 Confirm Publish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
             onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}>
          <div style={{ background: "#2a2a2a", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "16px", padding: "28px 28px 24px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>🗑️</div>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Orbitron', sans-serif", fontSize: "1rem", fontWeight: 700, color: DANGER }}>Delete Event?</h2>
            <p style={{ margin: "0 0 20px", color: MUTED, fontSize: "0.82rem", lineHeight: 1.6 }}>
              <strong style={{ color: TEXT }}>{event.eventName}</strong> will be permanently removed. This cannot be undone.
            </p>
            {actionError && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", fontWeight: 600, marginBottom: "14px" }}>⚠️ {actionError}</div>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDeleteEvent} disabled={actionLoading} style={{ background: actionLoading ? "rgba(248,113,113,0.3)" : DANGER, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                {actionLoading ? <><Spinner size={14} color="#fff" />Deleting…</> : <><Trash2 size={14} />Confirm Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACK */}
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginBottom: "28px" }}>
        <ArrowLeft size={14} /> Back to Events
      </button>

      {actionError && !showDeleteConfirm && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600, marginBottom: "16px" }}>⚠️ {actionError}</div>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>{event.eventName}</h1>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
            {/* Edit button — ORGANIZER+ */}
            {canEdit && (
              <button onClick={() => setShowEditEvent(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Edit2 size={14} /> EDIT
              </button>
            )}
            {/* Add Sport — only in DRAFT with full edit rights */}
            {isDraft && canEditFull && (
              <button onClick={() => setShowAddSport(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Plus size={14} /> ADD SPORT
              </button>
            )}
            {/* Status transition buttons */}
            {canEdit && STATUS_TRANSITIONS[event.status as string]?.map(t => (
              <button key={t.value} onClick={() => handleStatusChange(t.value)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: actionLoading ? "rgba(255,255,255,0.04)" : t.color === ACCENT ? ACCENT : `${t.color}22`, border: `1px solid ${t.color}44`, color: t.color === ACCENT ? "#fff" : t.color, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {actionLoading ? <Spinner size={14} color={t.color} /> : null}{t.label}
              </button>
            ))}
            {/* Delete button — MANAGER+ */}
            {canDelete && (
              <button onClick={() => setShowDeleteConfirm(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: DANGER, borderRadius: "10px", padding: "10px 16px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          <StatusPill status={event.status} />
          {event.organizationName && <span style={chip()}>🏛 {event.organizationName}</span>}
          {isDraft && canEdit && <span style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: WARNING, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 600 }}>✏️ Draft — sports can be added</span>}
          {isArchived && <span style={{ background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", color: "#64748b", borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 600 }}>🗄️ Archived — read only</span>}
        </div>
        <p style={{ marginTop: "18px", color: MUTED, maxWidth: "700px", lineHeight: 1.7, fontSize: "0.9rem" }}>{event.eventDescription}</p>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
        <StatCard label="Sports"        value={totalSports}             icon="🏅" />
        <StatCard label="Registrations" value={totalRegistrations}      icon="📋" />
        <StatCard label="Venue"         value={event.venueName || "—"}  icon="🏟️" />
      </div>

      {/* EVENT DETAILS */}
      <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", fontWeight: 700, letterSpacing: "0.06em" }}>EVENT DETAILS</div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            <InfoCell label="Status"       value={event.status} />
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase", marginBottom: "4px" }}>Tier</div>
              <TierBadge tier={event.tier} size="md" />
            </div>
            <InfoCell label="Organization" value={event.organizationName} />
            <InfoCell label="City"         value={event.city} />
            <InfoCell label="State"        value={event.state} />
            <InfoCell label="Country"      value={event.country} />
            <InfoCell label="Venue"        value={event.venueName} />
            <InfoCell label="Start Date"   value={new Date(event.startDate).toLocaleDateString("en-IN")} />
            <InfoCell label="End Date"     value={new Date(event.endDate).toLocaleDateString("en-IN")} />
          </div>
        </div>
      </div>

      {/* SPORTS LIST */}
      {eventId && (
        <SportsList
          sports={sports}
          isDraft={isDraft && canEditFull}
          eventId={eventId}
          onAddSport={() => setShowAddSport(true)}
          navigate={navigate}
        />
      )}

      {/* SPONSOR MANAGEMENT — ADMINISTRATOR+ */}
      {eventId && canManageSponsors && (
        <>
          <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" />
          {sports.map(sport => (
            <SponsorManager
              key={sport.id}
              mode="sport"
              entityId={sport.id}
              title={`Sponsors — ${toLabel(sport.sport)}`}
            />
          ))}
        </>
      )}
    </PageWrapper>
  )
}