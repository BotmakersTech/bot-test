import { useState, type ReactNode } from "react"
import { X, ChevronDown, Info, Calendar, Plus, ArrowLeft, Check, Sparkles, Cpu, Brain } from "lucide-react"
import { AGE_GROUP_CATALOGUE, type SportConfig } from "../../constants/sportCatalogue"
import type { CreateEventSportRequest } from "../../../feature/Admin/api/admin.api"
import "../EventDashboard/EventDashboard.css"
import "./AddSportModal.css"

export interface AddSportModalProps {
  onAddSport: (request: CreateEventSportRequest) => Promise<unknown>
  submitting: boolean
  onClose: () => void
}

const FORMAT_TYPE_OPTIONS = [
  { value: "KNOCKOUT", label: "Knockout" },
  { value: "ROUND_ROBIN", label: "Round Robin" },
  { value: "SWISS", label: "Swiss" },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" },
]

interface ConfigState {
  sportData: string
  formatType: string
  minTeamSize: number
  maxTeamSize: number
  maxTeams: number
  entryFee: number
  prizeMoney: number
  registrationStartDate: string
  registrationEndDate: string
}

const INITIAL_CONFIG: ConfigState = {
  sportData: "",
  formatType: "",
  minTeamSize: 2,
  maxTeamSize: 5,
  maxTeams: 16,
  entryFee: 0,
  prizeMoney: 0,
  registrationStartDate: "",
  registrationEndDate: "",
}

type SubmitResult = { sport: SportConfig; ok: boolean; message?: string }

// ─────────────────────────────────────────────────────────────
// SMALL PIECES
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: "2px solid rgba(255,255,255,0.3)", borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "ed-spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

function AgeIcon({ value, size = 15 }: { value: string; size?: number }) {
  if (value === "YOUNG_ENGINEERS") return <Cpu size={size} />
  if (value === "ROBO_MINDS") return <Brain size={size} />
  return <Sparkles size={size} />
}

function SectionHead({ step, currentStep, label, subLabel }: { step: number; currentStep: number; label: string; subLabel?: string }) {
  const done = currentStep > step
  const active = currentStep === step
  return (
    <div className={`asm-section-head${active ? " asm-section-head--active" : ""}`}>
      <span className="asm-section-badge">{done ? <Check size={11} /> : step}</span>
      {label}
      {subLabel && <span className="asm-section-sub">— {subLabel}</span>}
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="asm-field">
      <label className="asm-field-label">{label}{required && <span className="asm-required">*</span>}</label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ADD SPORT MODAL
// ─────────────────────────────────────────────────────────────

export default function AddSportModal({ onAddSport, submitting, onClose }: AddSportModalProps) {
  const [ageGroup, setAgeGroup] = useState("")
  const [selectedSports, setSelectedSports] = useState<SportConfig[]>([])
  const [weightClassBySport, setWeightClassBySport] = useState<Record<string, string>>({})
  const [confirmedSports, setConfirmedSports] = useState(false)
  const [config, setConfig] = useState<ConfigState>(INITIAL_CONFIG)
  const [error, setError] = useState<string | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{ index: number; total: number } | null>(null)

  const selectedAg = AGE_GROUP_CATALOGUE.find(a => a.value === ageGroup) || null
  const step = !ageGroup ? 1 : !confirmedSports ? 2 : 3
  const busy = submitting || bulkProgress !== null
  const sportsNeedingWeightClass = selectedSports.filter(s => s.weightClasses.length > 1)

  const setCfg = (key: keyof ConfigState, value: string | number) => setConfig(c => ({ ...c, [key]: value }))

  const handleAgeGroupSelect = (value: string) => {
    setAgeGroup(value)
    setSelectedSports([])
    setWeightClassBySport({})
    setConfirmedSports(false)
    setError(null)
  }

  const toggleSport = (sport: SportConfig) => {
    setSelectedSports(prev => {
      const exists = prev.some(s => s.value === sport.value)
      if (exists) return prev.filter(s => s.value !== sport.value)
      if (sport.weightClasses.length === 1) {
        setWeightClassBySport(w => ({ ...w, [sport.value]: sport.weightClasses[0].value }))
      }
      return [...prev, sport]
    })
    setError(null)
  }

  const removeSport = (sportValue: string) => setSelectedSports(prev => prev.filter(s => s.value !== sportValue))

  const handleContinue = () => {
    if (selectedSports.length === 0) { setError("Please select at least one sport."); return }
    setError(null)
    setConfirmedSports(true)
  }

  const buildRequest = (sport: SportConfig): CreateEventSportRequest => ({
    sport: sport.value,
    ageGroup,
    sportData: config.sportData,
    weightClass: weightClassBySport[sport.value] || sport.weightClasses[0]?.value || "OPEN",
    formatType: config.formatType,
    minTeamSize: config.minTeamSize,
    maxTeamSize: config.maxTeamSize,
    maxTeams: config.maxTeams,
    entryFee: config.entryFee,
    prizeMoney: config.prizeMoney,
    registrationStartDate: config.registrationStartDate,
    registrationEndDate: config.registrationEndDate,
  })

  const handleSubmit = async () => {
    if (selectedSports.length === 0) { setError("Please select at least one sport."); return }
    const missingWeightClass = sportsNeedingWeightClass.filter(s => !weightClassBySport[s.value])
    if (missingWeightClass.length > 0) { setError(`Please select a weight class for: ${missingWeightClass.map(s => s.label).join(", ")}.`); return }
    if (!config.formatType) { setError("Please select a format type."); return }
    if (!config.registrationStartDate) { setError("Please set a registration start date."); return }
    if (!config.registrationEndDate) { setError("Please set a registration end date."); return }
    if (config.registrationStartDate > config.registrationEndDate) { setError("Registration start date must be before end date."); return }
    if (config.minTeamSize > config.maxTeamSize) { setError("Min team size cannot exceed max team size."); return }

    setError(null)
    const results: SubmitResult[] = []
    for (let i = 0; i < selectedSports.length; i++) {
      const sport = selectedSports[i]
      setBulkProgress({ index: i + 1, total: selectedSports.length })
      try {
        await onAddSport(buildRequest(sport))
        results.push({ sport, ok: true })
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string }
        results.push({ sport, ok: false, message: e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Something went wrong." })
      }
    }
    setBulkProgress(null)

    const failed = results.filter(r => !r.ok)
    if (failed.length === 0) {
      onClose()
      return
    }
    setSelectedSports(failed.map(f => f.sport))
    const succeededCount = results.length - failed.length
    const failLines = failed.map(f => `${f.sport.label}: ${f.message}`).join("\n")
    setError(`${succeededCount} of ${results.length} sport${results.length > 1 ? "s" : ""} added. Failed:\n${failLines}`)
  }

  return (
    <div className="ed-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ed-modal asm-modal">
        <div className="ed-modal-head">
          <div>
            <h2 className="ed-modal-title">ADD SPORT</h2>
            <div className="asm-head-meta">Configure new sport(s) for this event</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="asm-step-dots">
              {[1, 2, 3].map(n => (
                <div key={n} className={`asm-step-dot${n === step ? " asm-step-dot--active" : n < step ? " asm-step-dot--done" : ""}`} />
              ))}
            </div>
            <button type="button" className="ed-modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="ed-modal-body">
          <div>
            <SectionHead step={1} currentStep={step} label="Age Category" />
            <div className="asm-age-grid">
              {AGE_GROUP_CATALOGUE.map(ag => {
                const active = ageGroup === ag.value
                return (
                  <button key={ag.value} type="button" className={`asm-age-card${active ? " asm-age-card--active" : ""}`} onClick={() => handleAgeGroupSelect(ag.value)}>
                    <span className="asm-age-icon"><AgeIcon value={ag.value} /></span>
                    <span className="asm-age-label">{ag.label}</span>
                    <span className="asm-age-sub">{ag.subLabel}</span>
                    <span className="asm-age-pill">{ag.connectivity}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedAg && (
            <div>
              <SectionHead step={2} currentStep={step} label="Select Sport(s)" subLabel={`${selectedAg.label} · ${selectedAg.subLabel}`} />

              {!confirmedSports && (
                <>
                  <div className="asm-sport-grid">
                    {selectedAg.sports.map(sp => {
                      const active = selectedSports.some(s => s.value === sp.value)
                      return (
                        <button key={sp.value} type="button" className={`asm-sport-card${active ? " asm-sport-card--active" : ""}`} onClick={() => toggleSport(sp)}>
                          <span className={`asm-sport-checkbox${active ? " asm-sport-checkbox--active" : ""}`}>{active && <Check size={11} />}</span>
                          <span className="asm-sport-label">{sp.label}</span>
                          {sp.hint && <span className="asm-sport-hint"><Info size={10} style={{ flexShrink: 0, marginTop: "2px" }} />{sp.hint}</span>}
                          {sp.weightClasses.length > 0 && (
                            <span className="asm-sport-pills">
                              {sp.weightClasses.map(wc => <span key={wc.value} className="asm-sport-pill">{wc.label}</span>)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedSports.length > 0 && (
                    <div className="asm-chip-row">
                      {selectedSports.map(s => (
                        <span key={s.value} className="asm-chip">
                          {s.label}
                          <button type="button" className="asm-chip-remove" onClick={() => removeSport(s.value)}><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="asm-continue-row">
                    <button type="button" className="asm-continue-btn" disabled={selectedSports.length === 0} onClick={handleContinue}>
                      Continue to Configuration <Plus size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <button type="button" className="asm-back-link" disabled={busy} onClick={() => setConfirmedSports(false)}><ArrowLeft size={12} /> Back to sports</button>
                <SectionHead step={3} currentStep={step} label="Configuration" subLabel={`${selectedSports.length} sport${selectedSports.length > 1 ? "s" : ""} selected`} />
              </div>

              {sportsNeedingWeightClass.length > 0 && (
                <div className="asm-weight-section">
                  {sportsNeedingWeightClass.map(sp => (
                    <div key={sp.value}>
                      <div className="asm-weight-row-label">{sp.label} — Weight Class <span className="asm-required">*</span></div>
                      <div className="asm-weight-pills">
                        {sp.weightClasses.map(wc => {
                          const active = weightClassBySport[sp.value] === wc.value
                          return (
                            <button key={wc.value} type="button" className={`asm-weight-pill${active ? " asm-weight-pill--active" : ""}`} onClick={() => setWeightClassBySport(w => ({ ...w, [sp.value]: wc.value }))}>
                              {wc.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <FormField label="Format Type" required>
                <div className="asm-select-wrap">
                  <select className="asm-select" value={config.formatType} onChange={e => setCfg("formatType", e.target.value)}>
                    <option value="">Select format…</option>
                    {FORMAT_TYPE_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="asm-select-chevron" />
                </div>
              </FormField>

              <FormField label="Description">
                <textarea className="asm-textarea" placeholder="Describe this sport category…" value={config.sportData} onChange={e => setCfg("sportData", e.target.value)} />
              </FormField>

              <div className="asm-grid-3">
                <FormField label="Min Team Size" required><input type="number" min={1} className="asm-input" value={config.minTeamSize} onChange={e => setCfg("minTeamSize", parseInt(e.target.value) || 1)} /></FormField>
                <FormField label="Max Team Size" required><input type="number" min={1} className="asm-input" value={config.maxTeamSize} onChange={e => setCfg("maxTeamSize", parseInt(e.target.value) || 1)} /></FormField>
                <FormField label="Max Teams" required><input type="number" min={2} className="asm-input" value={config.maxTeams} onChange={e => setCfg("maxTeams", parseInt(e.target.value) || 2)} /></FormField>
              </div>

              <div className="asm-grid-2">
                <FormField label="Entry Fee (₹)" required><input type="number" min={0} step={50} className="asm-input" value={config.entryFee} onChange={e => setCfg("entryFee", parseFloat(e.target.value) || 0)} /></FormField>
                <FormField label="Prize Money (₹)" required><input type="number" min={0} step={1000} className="asm-input" value={config.prizeMoney} onChange={e => setCfg("prizeMoney", parseFloat(e.target.value) || 0)} /></FormField>
              </div>

              <div className="asm-reg-box">
                <div className="asm-reg-label"><Calendar size={13} />Registration Window</div>
                <div className="asm-grid-2">
                  <FormField label="Start Date" required><input type="date" className="asm-date" value={config.registrationStartDate} onChange={e => setCfg("registrationStartDate", e.target.value)} /></FormField>
                  <FormField label="End Date" required><input type="date" className="asm-date" value={config.registrationEndDate} min={config.registrationStartDate || undefined} onChange={e => setCfg("registrationEndDate", e.target.value)} /></FormField>
                </div>
                {config.registrationStartDate && config.registrationEndDate && (
                  <div className="asm-reg-confirm">
                    ✅ Open from <strong>{new Date(config.registrationStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong> to <strong>{new Date(config.registrationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="asm-error">⚠️ {error}</div>}
        </div>

        <div className="asm-footer">
          <button type="button" className="asm-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="asm-btn-submit" onClick={handleSubmit} disabled={busy || step < 3}>
            {bulkProgress
              ? <><Spinner />Adding {bulkProgress.index} of {bulkProgress.total}…</>
              : <><Plus size={14} />{selectedSports.length > 1 ? `Add ${selectedSports.length} Sports` : "Add Sport"}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
