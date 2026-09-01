import React from "react"
import { INDIA_STATES, getCitiesForState } from "../data/locationData"

interface LocationSelectsProps {
  /** Kept for call-site compatibility — the platform is India-only, so this is
   *  forced to "India" and the country field is never rendered. */
  country?: string
  state: string
  city: string
  /** Called once on mount with "India" so the parent form submits the right
   *  value even though there's no country field. Optional. */
  onCountry?: (v: string) => void
  onState: (v: string) => void
  onCity: (v: string) => void
  required?: boolean
  /** No-op now (country is always hidden) — kept so existing call sites compile. */
  hideCountry?: boolean
  // Use className-based styling (e.g. "profile-input") — skips inline defaults
  selectClassName?: string
  inputClassName?: string
  labelClassName?: string
  // Inline style overrides (used when no className provided)
  selectStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  labelStyle?: React.CSSProperties
  itemStyle?: React.CSSProperties
  /** Class on each field's wrapper div — e.g. "adp-field" to inherit a form's
   *  own input/label styling without per-control classes. */
  itemClassName?: string
  gridStyle?: React.CSSProperties
}

const DEFAULT_SEL: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "#fff",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
}

const DEFAULT_INP: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "#fff",
  fontSize: "0.95rem",
  outline: "none",
  boxSizing: "border-box",
}

const DEFAULT_LBL: React.CSSProperties = {
  display: "block",
  color: "#9ca3af",
  fontSize: "0.8rem",
  fontWeight: 600,
  marginBottom: "8px",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
}

export default function LocationSelects({
  state, city,
  onCountry, onState, onCity,
  required,
  selectClassName, inputClassName, labelClassName,
  selectStyle, inputStyle, labelStyle,
  itemStyle, itemClassName,
  gridStyle,
}: LocationSelectsProps) {
  // Country is fixed — make sure the parent form ends up submitting "India".
  React.useEffect(() => {
    onCountry?.("India")
    // once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cities = getCitiesForState("India", state)

  // Stable id for the <datalist> that backs the searchable city field.
  const cityListId = `city-options-${React.useId()}`

  const useClasses = !!(selectClassName || inputClassName)
  const selStyle = useClasses ? undefined : (selectStyle ?? DEFAULT_SEL)
  const inpStyle = useClasses ? undefined : (inputStyle  ?? DEFAULT_INP)
  const lblStyle = useClasses ? undefined : (labelStyle  ?? DEFAULT_LBL)

  // Show a stored value that isn't in the canonical list (legacy free-text)
  // rather than silently dropping it.
  const stateOptions = state && !INDIA_STATES.includes(state)
    ? [state, ...INDIA_STATES]
    : INDIA_STATES

  function handleState(v: string) {
    onState(v)
    onCity("")
  }

  return (
    <div style={gridStyle ?? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" }}>

      <div style={itemStyle} className={itemClassName}>
        <label style={lblStyle} className={labelClassName}>State</label>
        <select
          required={required}
          value={state}
          onChange={e => handleState(e.target.value)}
          style={selStyle}
          className={selectClassName}
        >
          <option value="">Select state…</option>
          {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={itemStyle} className={itemClassName}>
        <label style={lblStyle} className={labelClassName}>City</label>
        {/* Searchable: type to filter ~hundreds of options; a value not in the
            list is still accepted (kept for towns the dataset misses). */}
        <input
          type="text"
          list={cities.length > 0 ? cityListId : undefined}
          required={required}
          value={city}
          disabled={!state}
          onChange={e => onCity(e.target.value)}
          placeholder={state ? "Type or pick a city…" : "Select a state first"}
          autoComplete="off"
          style={inpStyle}
          className={inputClassName ?? selectClassName}
        />
        {cities.length > 0 && (
          <datalist id={cityListId}>
            {cities.map(c => <option key={c} value={c} />)}
          </datalist>
        )}
      </div>

    </div>
  )
}
