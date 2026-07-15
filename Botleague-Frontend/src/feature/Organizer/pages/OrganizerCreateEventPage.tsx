import { useState } from "react"
import type { ChangeEvent, FormEvent, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CalendarDays, Globe, MapPin, Building2, FileText, Loader2, Image as ImageIcon } from "lucide-react"
import { createEvent, uploadEventImage, type CreateEventRequest } from "../api/organizer.api"
import LocationSelects from "../../../shared/components/LocationSelects"
import { ORG } from "../theme/organizerTheme"
import "../../../styles/organizerTheme.css"

const BORDER = "rgba(75,134,232,0.3)"
const TEXT   = ORG.text
const MUTED  = ORG.muted

interface FormData {
  eventName: string
  eventDescription: string
  eventLogo: File | null
  organizationName: string
  organizationUrl: string
  venueName: string
  venueAddress: string
  city: string
  state: string
  country: string
  startDate: string
  endDate: string
}

export default function OrganizerCreateEventPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    eventDescription: "",
    eventLogo: null,
    organizationName: "",
    organizationUrl: "",
    venueName: "",
    venueAddress: "",
    city: "",
    state: "",
    country: "India",
    startDate: "",
    endDate: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, eventLogo: file }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    try {
      const req: CreateEventRequest = {
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        organizationName: formData.organizationName,
        organizationUrl: formData.organizationUrl,
        venueName: formData.venueName,
        venueAddress: formData.venueAddress,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }
      const createdEvent = await createEvent(req)

      if (formData.eventLogo) {
        setUploadingImage(true)
        await uploadEventImage(createdEvent.id, formData.eventLogo)
        setUploadingImage(false)
      }

      setSuccess(true)
      setTimeout(() => navigate(`/organizer/events/${createdEvent.id}`), 1200)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to create event"
      setError(message)
    } finally {
      setSubmitting(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="org-page-bg" style={{ padding: "28px 32px", fontFamily: ORG.fontBody, color: TEXT }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: ORG.cardBg, border: `1.5px solid ${BORDER}`, color: TEXT, borderRadius: "10px", padding: "10px", cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontFamily: ORG.fontHeading, color: ORG.blueHeading, fontWeight: 700 }}>Create Event</h1>
          <p style={{ marginTop: "4px", color: MUTED, fontSize: "0.85rem" }}>Set up a new BotLeague event — starts as a draft, add sports and publish when ready</p>
        </div>
      </div>

      {success && (
        <div style={{ background: "rgba(31,169,82,0.1)", border: "1px solid rgba(31,169,82,0.25)", color: ORG.success, padding: "14px 18px", borderRadius: "12px", marginBottom: "20px" }}>
          Event created successfully — redirecting…
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.25)", color: ORG.danger, padding: "14px 18px", borderRadius: "12px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "20px", maxWidth: "760px" }}>
          <Section title="Event Information">
            <Input icon={<FileText size={16} />} label="Event Name" name="eventName" value={formData.eventName} onChange={handleChange} placeholder="BotLeague Championship" required />
            <Textarea label="Event Description" name="eventDescription" value={formData.eventDescription} onChange={handleChange} placeholder="Write event details… (optional)" />
            <div>
              <div style={{ marginBottom: "8px", color: MUTED, fontSize: "0.85rem" }}>Event Logo</div>
              <div style={{ background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px" }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ color: TEXT }} />
                {formData.eventLogo && (
                  <div style={{ marginTop: "10px", color: MUTED, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ImageIcon size={15} />
                    {formData.eventLogo.name}
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Organization (optional)">
            <Input icon={<Building2 size={16} />} label="Organization Name" name="organizationName" value={formData.organizationName} onChange={handleChange} />
            <Input icon={<Globe size={16} />} label="Organization URL" name="organizationUrl" value={formData.organizationUrl} onChange={handleChange} placeholder="https://…" />
          </Section>

          <Section title="Venue (optional)">
            <Input icon={<MapPin size={16} />} label="Venue Name" name="venueName" value={formData.venueName} onChange={handleChange} />
            <Input icon={<MapPin size={16} />} label="Venue Address" name="venueAddress" value={formData.venueAddress} onChange={handleChange} />
            <LocationSelects
              country={formData.country}
              state={formData.state}
              city={formData.city}
              onCountry={(v) => setFormData((f) => ({ ...f, country: v }))}
              onState={(v) => setFormData((f) => ({ ...f, state: v }))}
              onCity={(v) => setFormData((f) => ({ ...f, city: v }))}
              gridStyle={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "18px" }}
              selectStyle={{ width: "100%", background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "12px 16px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
              labelStyle={{ display: "block", color: MUTED, fontSize: "0.85rem", fontWeight: 400, marginBottom: "8px", textTransform: "none", letterSpacing: "normal" }}
            />
          </Section>

          <Section title="Event Dates (optional)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "18px" }}>
              <Input icon={<CalendarDays size={16} />} type="date" label="Start Date" name="startDate" value={formData.startDate} onChange={handleChange} />
              <Input icon={<CalendarDays size={16} />} type="date" label="End Date" name="endDate" value={formData.endDate} onChange={handleChange} />
            </div>
          </Section>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{ background: ORG.gradientCta, color: "#fff", border: "none", borderRadius: "12px", padding: "14px 22px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, boxShadow: ORG.btnShadow }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {uploadingImage ? "Uploading image…" : submitting ? "Creating event…" : "Create Event"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: ORG.cardBg, border: `1.5px solid ${BORDER}`, borderRadius: "16px", padding: "22px" }}>
      <div style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "18px", color: TEXT, fontFamily: ORG.fontHeading }}>{title}</div>
      <div style={{ display: "grid", gap: "16px" }}>{children}</div>
    </div>
  )
}

function Input({ icon, label, ...props }: any) {
  return (
    <div>
      <div style={{ marginBottom: "8px", color: MUTED, fontSize: "0.85rem" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "0 14px" }}>
        {icon && <div style={{ color: MUTED }}>{icon}</div>}
        <input
          {...props}
          onClick={(e: any) => {
            if (props.type === "date") (e.target as HTMLInputElement).showPicker?.()
          }}
          style={{ flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", color: TEXT, padding: "13px 0", cursor: props.type === "date" ? "pointer" : "text" }}
        />
      </div>
    </div>
  )
}

function Textarea({ label, ...props }: any) {
  return (
    <div>
      <div style={{ marginBottom: "8px", color: MUTED, fontSize: "0.85rem" }}>{label}</div>
      <textarea
        {...props}
        rows={5}
        style={{ width: "100%", resize: "vertical", background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "13px", outline: "none", color: TEXT }}
      />
    </div>
  )
}
