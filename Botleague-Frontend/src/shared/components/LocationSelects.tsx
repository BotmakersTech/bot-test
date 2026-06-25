import React from "react"
import { COUNTRIES, getStatesForCountry, getCitiesForState } from "../data/locationData"

interface LocationSelectsProps {
  country: string
  state: string
  city: string
  onCountry: (v: string) => void
  onState: (v: string) => void
  onCity: (v: string) => void
  required?: boolean
  // Use className-based styling (e.g. "profile-input") — skips inline defaults
  selectClassName?: string
  inputClassName?: string
  labelClassName?: string
  // Inline style overrides (used when no className provided)
  selectStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  labelStyle?: React.CSSProperties
  itemStyle?: React.CSSProperties
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
  country, state, city,
  onCountry, onState, onCity,
  required,
  selectClassName, inputClassName, labelClassName,
  selectStyle, inputStyle, labelStyle,
  itemStyle,
  gridStyle,
}: LocationSelectsProps) {
  const states = getStatesForCountry(country)
  const cities = getCitiesForState(country, state)

  const useClasses = !!(selectClassName || inputClassName)
  const selStyle = useClasses ? undefined : (selectStyle ?? DEFAULT_SEL)
  const inpStyle = useClasses ? undefined : (inputStyle  ?? DEFAULT_INP)
  const lblStyle = useClasses ? undefined : (labelStyle  ?? DEFAULT_LBL)

  function handleCountry(v: string) {
    onCountry(v)
    onState("")
    onCity("")
  }

  function handleState(v: string) {
    onState(v)
    onCity("")
  }

  return (
    <div style={gridStyle ?? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>

      <div style={itemStyle}>
        <label style={lblStyle} className={labelClassName}>Country</label>
        <select
          required={required}
          value={country}
          onChange={e => handleCountry(e.target.value)}
          style={selStyle}
          className={selectClassName}
        >
          <option value="">Select country…</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={itemStyle}>
        <label style={lblStyle} className={labelClassName}>State / Province</label>
        {states.length > 0 ? (
          <select
            required={required}
            value={state}
            onChange={e => handleState(e.target.value)}
            style={selStyle}
            className={selectClassName}
          >
            <option value="">Select state…</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <input
            type="text"
            placeholder="State / Province"
            value={state}
            onChange={e => handleState(e.target.value)}
            style={inpStyle}
            className={inputClassName}
          />
        )}
      </div>

      <div style={itemStyle}>
        <label style={lblStyle} className={labelClassName}>City</label>
        {cities.length > 0 ? (
          <select
            required={required}
            value={city}
            onChange={e => onCity(e.target.value)}
            style={selStyle}
            className={selectClassName}
          >
            <option value="">Select city…</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => onCity(e.target.value)}
            style={inpStyle}
            className={inputClassName}
          />
        )}
      </div>

    </div>
  )
}
