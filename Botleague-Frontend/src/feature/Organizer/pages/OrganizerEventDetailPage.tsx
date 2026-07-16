import React, { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { ArrowLeft, Plus, X, ChevronDown, Info, Calendar, Users, Trophy, Swords, Edit2, CheckCircle2 } from "lucide-react"
import {
  getMyEventById, updateEventInfo, changeEventStatus, createEventSport, submitSportForApproval,
  type OrganizerEvent, type OrganizerSport, type UpdateEventInfoRequest, type CreateEventSportRequest,
} from "../api/organizer.api"
import EventMediaField from "../components/EventMediaField"
import SponsorManager from "../../Admin/components/SponsorManager"
import SupportContactManager from "../components/SupportContactManager"
import { ORG } from "../theme/organizerTheme"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole } from "../../../shared/constants/roles"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const BG      = ORG.pageBg
const CARD2   = "rgba(255,255,255,0.9)"
const BORDER  = "rgba(75,134,232,0.3)"
const ACCENT  = "#8c6cff"
const TEXT    = "#111111"
const MUTED   = "#5d5d5d"
const SUCCESS = "#1fa952"
const WARNING = "#a16207"
const DANGER  = "#e04b4b"

type EventStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "ARCHIVED"

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

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
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
// SMALL SHARED PIECES
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(75,134,232,0.12)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    DRAFT:     { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "📝" },
    PUBLISHED: { bg: "rgba(140,108,255,0.11)",  border: "rgba(140,108,255,0.28)",   color: ACCENT,  icon: "📣" },
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

function SportStatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string }> = {
    DRAFT:               { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)", color: MUTED },
    PENDING_APPROVAL:     { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING },
    APPROVED:             { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS },
    ACTIVE:               { bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)",   color: SUCCESS },
    REGISTRATION_OPEN:    { bg: "rgba(140,108,255,0.1)",   border: "rgba(140,108,255,0.28)",   color: ACCENT },
    REGISTRATION_CLOSED:  { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)", color: MUTED },
    REJECTED:             { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", color: DANGER },
    COMPLETED:            { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED },
  }
  const key = status?.toUpperCase() || "DRAFT"
  const s   = MAP[key] || MAP["DRAFT"]
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {key.replace(/_/g, " ")}
    </span>
  )
}

const chip = (): React.CSSProperties => ({
  background: "rgba(75,134,232,0.06)",
  border: `1px solid ${BORDER}`,
  color: "#374151",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "3px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
})

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{ background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", color: MUTED, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: TEXT, fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>
        {value}
      </div>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 14px" }}>
      <div style={{ color: MUTED, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: TEXT, fontWeight: 600, fontSize: "0.85rem" }}>{value || "—"}</div>
    </div>
  )
}

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

const inputStyle: React.CSSProperties = {
  background: "#f8f9ff",
  border: `1px solid rgba(75,134,232,0.12)`,
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

function SectionHeader({ step, currentStep, label, subLabel }: { step: number; currentStep: number; totalSteps: number; label: string; subLabel?: string }) {
  const done   = currentStep > step
  const active = currentStep === step
  return (
    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: active ? ACCENT : done ? "rgba(140,108,255,0.55)" : MUTED, marginBottom: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
      <span style={{ background: active ? ACCENT : done ? "rgba(140,108,255,0.4)" : "rgba(75,134,232,0.12)", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0 }}>
        {done ? "✓" : step}
      </span>
      {label}
      {subLabel && <span style={{ color: MUTED, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem" }}>— {subLabel}</span>}
    </div>
  )
}

function AgeGroupPicker({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
      {AGE_GROUP_CATALOGUE.map(ag => {
        const active = selected === ag.value
        return (
          <button key={ag.value} type="button" onClick={() => onSelect(ag.value)} style={{ background: active ? "rgba(140,108,255,0.12)" : "#f8f9ff", border: `1.5px solid ${active ? "rgba(140,108,255,0.5)" : "rgba(75,134,232,0.09)"}`, borderRadius: "10px", padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ color: active ? ACCENT : TEXT, fontWeight: 700, fontSize: "0.82rem", display: "block" }}>{ag.label}</span>
            <span style={{ color: active ? "rgba(140,108,255,0.75)" : MUTED, fontSize: "0.68rem", display: "block" }}>{ag.subLabel}</span>
            <span style={{ marginTop: "4px", background: active ? "rgba(140,108,255,0.15)" : "rgba(75,134,232,0.06)", border: `1px solid ${active ? "rgba(140,108,255,0.25)" : BORDER}`, color: active ? ACCENT : MUTED, borderRadius: "4px", fontSize: "0.6rem", padding: "2px 6px", display: "inline-block", fontWeight: 600 }}>{ag.connectivity}</span>
          </button>
        )
      })}
    </div>
  )
}

function SportPicker({ ageGroupValue, selected, onSelect }: { ageGroupValue: string; selected: string; onSelect: (s: SportConfig) => void }) {
  const ag = AGE_GROUP_CATALOGUE.find(a => a.value === ageGroupValue)
  if (!ag) return null
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      {ag.sports.map(sp => {
        const active = selected === sp.value
        return (
          <button key={sp.value} type="button" onClick={() => onSelect(sp)} style={{ background: active ? "rgba(140,108,255,0.1)" : "rgba(75,134,232,0.05)", border: `1.5px solid ${active ? "rgba(140,108,255,0.45)" : "rgba(75,134,232,0.07)"}`, borderRadius: "9px", padding: "10px 14px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", transition: "all 0.12s" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: active ? ACCENT : TEXT, fontWeight: 600, fontSize: "0.83rem" }}>{sp.label}</span>
              {sp.hint && <span style={{ color: MUTED, fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "4px" }}><Info size={10} style={{ flexShrink: 0 }} />{sp.hint}</span>}
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {sp.weightClasses.map(wc => (
                <span key={wc.value} style={{ background: active ? "rgba(140,108,255,0.18)" : "rgba(75,134,232,0.07)", border: `1px solid ${active ? "rgba(140,108,255,0.3)" : BORDER}`, color: active ? ACCENT : MUTED, borderRadius: "5px", fontSize: "0.62rem", padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>{wc.label}</span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function WeightClassPicker({ weightClasses, selected, onSelect }: { weightClasses: { value: string; label: string }[]; selected: string; onSelect: (v: string) => void }) {
  if (weightClasses.length <= 1) return null
  return (
    <FormField label="Weight Class" required>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {weightClasses.map(wc => {
          const active = selected === wc.value
          return <button key={wc.value} type="button" onClick={() => onSelect(wc.value)} style={{ background: active ? "rgba(140,108,255,0.15)" : "#f8f9ff", border: `1.5px solid ${active ? "rgba(140,108,255,0.5)" : "rgba(75,134,232,0.1)"}`, color: active ? ACCENT : "#374151", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, padding: "7px 16px", cursor: "pointer", transition: "all 0.12s" }}>{wc.label}</button>
        })}
      </div>
    </FormField>
  )
}

// ─────────────────────────────────────────────────────────────
// ADD SPORT MODAL
// ─────────────────────────────────────────────────────────────

function AddSportModal({ onAddSport, submitting, onClose }: {
  onAddSport: (request: CreateEventSportRequest) => Promise<unknown>
  submitting: boolean
  onClose: () => void
}) {
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
      setError(err?.response?.data?.message || err?.message || "Something went wrong.")
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#ffffff", border: `1px solid rgba(140,108,255,0.22)`, borderRadius: "18px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, background: "rgba(140,108,255,0.04)", borderRadius: "18px 18px 0 0", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em" }}>ADD SPORT</div>
            <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>Configure a new sport for this event</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[1, 2, 3].map(n => <div key={n} style={{ width: n === step ? "20px" : "8px", height: "8px", borderRadius: "99px", background: n <= step ? ACCENT : "rgba(75,134,232,0.18)", opacity: n < step ? 0.5 : 1, transition: "all 0.25s" }} />)}
            <button type="button" onClick={onClose} style={{ marginLeft: "8px", background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", color: MUTED, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, overflowY: "auto" }}>

          <div>
            <SectionHeader step={1} currentStep={step} totalSteps={3} label="Age Category" />
            <AgeGroupPicker selected={form.ageGroup} onSelect={handleAgeGroupSelect} />
          </div>

          {form.ageGroup && (
            <div>
              <SectionHeader step={2} currentStep={step} totalSteps={3} label="Select Sport" subLabel={`${selectedAg?.label} · ${selectedAg?.subLabel}`} />
              <SportPicker ageGroupValue={form.ageGroup} selected={form.sport} onSelect={handleSportSelect} />
            </div>
          )}

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

              <div style={{ background: "rgba(140,108,255,0.04)", border: "1px solid rgba(140,108,255,0.14)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 20px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button type="button" onClick={onClose} disabled={submitting} style={{ background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting || step < 3} style={{ background: (submitting || step < 3) ? "rgba(140,108,255,0.3)" : ACCENT, border: "none", color: step < 3 ? MUTED : "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: (submitting || step < 3) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s" }}>
            {submitting ? <><Spinner size={14} color="#fff" />Adding…</> : <><Plus size={14} />Add Sport</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SPORT CARD (view + on-page "submit for approval" — no navigation)
// ─────────────────────────────────────────────────────────────

function SportCard({ sport, index, eventId, navigate, onSubmitApproval, submittingId }: {
  sport: OrganizerSport; index: number; eventId: string; navigate: ReturnType<typeof useNavigate>
  onSubmitApproval: (sportId: string) => void; submittingId: string | null
}) {
  const teamCount   = sport.registrations?.length ?? sport.registeredTeamsCount ?? 0
  const playerCount = sport.registrations?.reduce((n, t) => n + (t.lineup?.length ?? 0), 0) ?? 0
  const displayName = toLabel(sport.sport)
  const hue         = (index * 47 + 11) % 360
  const canSubmit   = sport.status?.toUpperCase() === "DRAFT"
  const submitting  = submittingId === sport.id

  return (
    <div
      onClick={() => navigate(`/organizer/events/${eventId}/sports/${sport.id}`)}
      style={{ background: "rgba(75,134,232,0.06)", border: `1px solid rgba(75,134,232,0.09)`, borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}
    >
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${ACCENT}, hsl(${hue},80%,55%))` }} />

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span style={{ background: "rgba(140,108,255,0.13)", border: "1px solid rgba(140,108,255,0.28)", color: ACCENT, borderRadius: "6px", fontSize: "0.62rem", fontWeight: 800, padding: "2px 7px", flexShrink: 0 }}>#{index + 1}</span>
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: TEXT, lineHeight: 1.3 }}>{displayName}</span>
          </div>
          <Swords size={15} style={{ color: MUTED, flexShrink: 0, marginTop: "2px" }} />
        </div>

        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {sport.ageGroup && <span style={chip()}>{toLabel(sport.ageGroup)}</span>}
          {sport.weightClass && <span style={chip()}>{toLabel(sport.weightClass)}</span>}
          {sport.formatType && <span style={chip()}>{toLabel(sport.formatType)}</span>}
          {sport.status && <SportStatusPill status={sport.status} />}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Trophy size={13} style={{ color: WARNING, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Teams</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>{teamCount}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Users size={13} style={{ color: SUCCESS, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Players</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>{playerCount}</div>
            </div>
          </div>
        </div>

        {(sport.entryFee != null || sport.prizeMoney != null) && (
          <div style={{ display: "flex", gap: "10px" }}>
            {sport.entryFee != null && (
              <div style={{ flex: 1, background: "rgba(75,134,232,0.03)", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "6px 10px" }}>
                <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Entry Fee</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: WARNING }}>₹{sport.entryFee.toLocaleString("en-IN")}</div>
              </div>
            )}
            {sport.prizeMoney != null && (
              <div style={{ flex: 1, background: "rgba(75,134,232,0.03)", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "6px 10px" }}>
                <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Prize Pool</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: SUCCESS }}>₹{sport.prizeMoney.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        )}

        {sport.registrationStartDate && sport.registrationEndDate && (
          <div style={{ fontSize: "0.67rem", color: MUTED, display: "flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={10} style={{ flexShrink: 0 }} />
            {new Date(sport.registrationStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" → "}
            {new Date(sport.registrationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
      </div>

      {canSubmit && (
        <div style={{ padding: "0 18px 16px" }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSubmitApproval(sport.id)}
            disabled={submitting}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", background: "rgba(140,108,255,0.1)", border: "1px solid rgba(140,108,255,0.3)", color: ACCENT, borderRadius: "8px", padding: "8px 14px", fontSize: "0.78rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? <Spinner size={13} /> : <CheckCircle2 size={13} />} Submit for Approval
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITIONS
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

function EditEventModal({ event, onSave, saving, onClose, onMediaChange }: {
  event: OrganizerEvent
  onSave: (req: UpdateEventInfoRequest) => Promise<unknown>
  saving: boolean
  onClose: () => void
  onMediaChange: () => void
}) {
  const fmt = (d?: string | null) => d ? d.slice(0, 10) : ""
  const [form, setForm] = useState<UpdateEventInfoRequest>({
    eventName:        event.eventName        ?? "",
    eventDescription: event.eventDescription ?? "",
    eventLogoUrl:     event.eventLogoUrl      ?? "",
    organizationName: event.organizationName  ?? "",
    organizationUrl:  event.organizationUrl   ?? "",
    venueName:        event.venueName         ?? "",
    venueAddress:     event.venueAddress      ?? "",
    city:             event.city              ?? "",
    state:            event.state             ?? "",
    country:          event.country           ?? "",
    startDate:        fmt(event.startDate),
    endDate:          fmt(event.endDate),
  })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof UpdateEventInfoRequest, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.eventName?.trim()) { setError("Event name is required."); return }
    setError(null)
    try { await onSave(form); onClose() }
    catch (err: any) { setError(err?.response?.data?.message || err?.message || "Save failed.") }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#ffffff", border: `1px solid rgba(140,108,255,0.22)`, borderRadius: "18px", width: "100%", maxWidth: "620px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, background: "rgba(140,108,255,0.04)", borderRadius: "18px 18px 0 0" }}>
          <div>
            <div style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em" }}>EDIT EVENT</div>
            <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>Fill in as many details as you have — the rest can be added later</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", color: MUTED, cursor: "pointer", padding: "6px", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Event Name" required>
            <input style={inputStyle} value={form.eventName} onChange={e => set("eventName", e.target.value)} />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", fontFamily: "inherit" }} value={form.eventDescription} onChange={e => set("eventDescription", e.target.value)} />
          </FormField>
          <FormField label="Logo URL">
            <input style={inputStyle} placeholder="https://…" value={form.eventLogoUrl ?? ""} onChange={e => set("eventLogoUrl", e.target.value)} />
          </FormField>

          <EventMediaField eventId={event.id} slot="THUMBNAIL" kind="image" label="Thumbnail Image" currentUrl={event.eventThumbnailUrl} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
          <EventMediaField eventId={event.id} slot="TEASER_1" kind="video" label="Teaser Video 1" currentUrl={event.teaserVideo1Url} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
          <EventMediaField eventId={event.id} slot="TEASER_2" kind="video" label="Teaser Video 2" currentUrl={event.teaserVideo2Url} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />

          <FormField label="Organization Name">
            <input style={inputStyle} value={form.organizationName} onChange={e => set("organizationName", e.target.value)} />
          </FormField>
          <FormField label="Organization URL">
            <input style={inputStyle} value={form.organizationUrl} onChange={e => set("organizationUrl", e.target.value)} />
          </FormField>
          <FormField label="Venue Name">
            <input style={inputStyle} value={form.venueName} onChange={e => set("venueName", e.target.value)} />
          </FormField>
          <FormField label="Venue Address">
            <input style={inputStyle} value={form.venueAddress} onChange={e => set("venueAddress", e.target.value)} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <FormField label="City"><input style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} /></FormField>
            <FormField label="State"><input style={inputStyle} value={form.state} onChange={e => set("state", e.target.value)} /></FormField>
            <FormField label="Country"><input style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField label="Start Date"><input type="date" style={dateInputStyle} value={form.startDate} onChange={e => set("startDate", e.target.value)} /></FormField>
            <FormField label="End Date"><input type="date" style={dateInputStyle} value={form.endDate} min={form.startDate || undefined} onChange={e => set("endDate", e.target.value)} /></FormField>
          </div>

          {error && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600 }}>⚠️ {error}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(140,108,255,0.3)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
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
        select option { background: #ffffff; color: #111111; }
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

export default function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate     = useNavigate()

  const [event,   setEvent]   = useState<OrganizerEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [showAddSport,  setShowAddSport]  = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [sportSubmitting, setSportSubmitting] = useState(false)
  const [approvalSubmittingId, setApprovalSubmittingId] = useState<string | null>(null)
  const [actionError,   setActionError]   = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [savingEdit,    setSavingEdit]    = useState(false)

  const load = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    getMyEventById(eventId)
      .then(setEvent)
      .catch((err: any) => setError(err?.response?.data?.message || "Failed to load event"))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => { load() }, [load])

  // SPORT_HEAD can view the event their sport belongs to, but only
  // EVENT_HEAD-and-up can actually manage it — event section is read-only
  // for them; their own sport (via OrganizerSportDetailPage) is not.
  const user = useSelector((state: RootState) => state.auth.user)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])
  const canManageEvent = hasRole(userRoles, [AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.ORGANISER, AppRole.EVENT_HEAD])

  const eventStatus = event?.status as EventStatus | undefined
  const isDraft      = eventStatus === "DRAFT"
  const isArchived   = eventStatus === "ARCHIVED"
  const isLive       = eventStatus === "LIVE"
  const isCompleted  = eventStatus === "COMPLETED"
  const canEdit      = canManageEvent && !isArchived && !isLive && !isCompleted
  const canAddSport  = canManageEvent && isDraft
  // Deliberately includes isLive — status transitions (e.g. "Complete Event"
  // on a LIVE event) must stay reachable even though info edits don't.
  const canChangeStatus = canManageEvent && !isArchived && !isCompleted

  const handleSaveEdit = async (req: UpdateEventInfoRequest) => {
    if (!eventId) return
    setSavingEdit(true)
    try {
      const updated = await updateEventInfo(eventId, req)
      setEvent(updated)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      const updated = await changeEventStatus(eventId, status)
      setEvent(updated)
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to change status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddSport = async (request: CreateEventSportRequest) => {
    if (!eventId) return
    setSportSubmitting(true)
    try {
      await createEventSport(eventId, request)
      load()
    } finally {
      setSportSubmitting(false)
    }
  }

  const handleSubmitApproval = async (sportId: string) => {
    if (!eventId) return
    setApprovalSubmittingId(sportId)
    try {
      await submitSportForApproval(eventId, sportId)
      load()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to submit sport for approval.")
    } finally {
      setApprovalSubmittingId(null)
    }
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

  if (!event || !eventId) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Event not found</div>
      </PageWrapper>
    )
  }

  const sports = event.sports ?? []
  const totalSports = sports.length
  const totalRegistrations = sports.reduce((t, s) => t + (s.registrations?.length ?? s.registeredTeamsCount ?? 0), 0)

  return (
    <PageWrapper>
      {showAddSport && (
        <AddSportModal onAddSport={handleAddSport} submitting={sportSubmitting} onClose={() => setShowAddSport(false)} />
      )}

      {showEditEvent && (
        <EditEventModal event={event} onSave={handleSaveEdit} saving={savingEdit} onClose={() => setShowEditEvent(false)} onMediaChange={load} />
      )}

      {/* BACK — stays within /organizer */}
      <button type="button" onClick={() => navigate("/organizer/events")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginBottom: "28px" }}>
        <ArrowLeft size={14} /> Back to My Events
      </button>

      {actionError && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600, marginBottom: "16px" }}>⚠️ {actionError}</div>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Sarpanch', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>{event.eventName}</h1>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
            {canEdit && (
              <button type="button" onClick={() => setShowEditEvent(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(75,134,232,0.07)", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Edit2 size={14} /> EDIT
              </button>
            )}
            {canAddSport && (
              <button type="button" onClick={() => setShowAddSport(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(75,134,232,0.07)", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Plus size={14} /> ADD SPORT
              </button>
            )}
            {canChangeStatus && STATUS_TRANSITIONS[event.status as string]?.map(t => (
              <button key={t.value} type="button" onClick={() => handleStatusChange(t.value)} disabled={actionLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: actionLoading ? "rgba(75,134,232,0.04)" : t.color === ACCENT ? ACCENT : `${t.color}22`, border: `1px solid ${t.color}44`, color: t.color === ACCENT ? "#fff" : t.color, borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {actionLoading ? <Spinner size={14} color={t.color} /> : null}{t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          <StatusPill status={event.status} />
          {event.organizationName && <span style={chip()}>🏛 {event.organizationName}</span>}
          {isDraft && <span style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: WARNING, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 600 }}>✏️ Draft — sports can be added</span>}
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
      <div style={{ background: CARD2, border: "1px solid rgba(140,108,255,0.14)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(140,108,255,0.04)", fontWeight: 700, letterSpacing: "0.06em" }}>EVENT DETAILS</div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            <InfoCell label="Status"       value={event.status} />
            <InfoCell label="Organization" value={event.organizationName ?? undefined} />
            <InfoCell label="City"         value={event.city ?? undefined} />
            <InfoCell label="State"        value={event.state ?? undefined} />
            <InfoCell label="Country"      value={event.country ?? undefined} />
            <InfoCell label="Venue"        value={event.venueName ?? undefined} />
            <InfoCell label="Start Date"   value={event.startDate ? new Date(event.startDate).toLocaleDateString("en-IN") : undefined} />
            <InfoCell label="End Date"     value={event.endDate ? new Date(event.endDate).toLocaleDateString("en-IN") : undefined} />
          </div>
        </div>
      </div>

      {/* SPONSORS — event-level management only, not shown to SPORT_HEAD */}
      {canManageEvent && (
        <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" />
      )}

      {/* SUPPORT CONTACTS — event-level management only, not shown to SPORT_HEAD */}
      {canManageEvent && (
        <SupportContactManager mode="event" eventId={eventId} title="Event Support Contacts" />
      )}

      {/* SPORTS LIST */}
      <div style={{ background: CARD2, border: "1px solid rgba(140,108,255,0.14)", borderRadius: "16px", overflow: "hidden", marginTop: "24px" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(140,108,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem" }}>SPORTS</span>
            <span style={{ background: "rgba(140,108,255,0.13)", border: "1px solid rgba(140,108,255,0.28)", color: ACCENT, borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800, padding: "1px 9px" }}>{sports.length}</span>
          </div>
          {canAddSport && (
            <button type="button" onClick={() => setShowAddSport(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(140,108,255,0.1)", border: "1px solid rgba(140,108,255,0.3)", color: ACCENT, borderRadius: "8px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
              <Plus size={13} /> ADD SPORT
            </button>
          )}
        </div>

        <div style={{ padding: "18px 20px" }}>
          {sports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "2.5rem" }}>🏅</div>
              <div style={{ color: MUTED, fontSize: "0.85rem", fontWeight: 600 }}>No sports added yet</div>
              {canAddSport && (
                <button type="button" onClick={() => setShowAddSport(true)} style={{ display: "flex", alignItems: "center", gap: "7px", background: ACCENT, border: "none", color: "#fff", borderRadius: "9px", padding: "9px 20px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}>
                  <Plus size={14} /> Add the first sport
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
              {sports.map((sport, i) => (
                <SportCard key={sport.id} sport={sport} index={i} eventId={eventId ?? ""} navigate={navigate} onSubmitApproval={handleSubmitApproval} submittingId={approvalSubmittingId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
