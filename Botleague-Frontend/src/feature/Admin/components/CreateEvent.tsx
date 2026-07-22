"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react"

import { createEvent as createEventApi } from "../api/admin.api"
import { uploadEventImage } from "../api/uploadEvent.api"
import LocationSelects from "../../../shared/components/LocationSelects"
import planeDeco from "../../../assets/Auth/plane.svg"
import droneDeco from "../../../assets/Auth/drone.svg"
import starDeco from "../../../assets/Auth/Star-two.svg"

// =====================================================
// TYPES
// =====================================================

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

// =====================================================
// DESIGN TOKENS — gradient-border form system
// (Sarpanch / Poppins / Inter, already loaded app-wide)
// =====================================================

const GRADIENT_BORDER: React.CSSProperties = {
    border: "2px solid transparent",
    backgroundImage: "linear-gradient(#ffffff, #ffffff), linear-gradient(180deg, #0162D1, #715bc0)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
}

const SELECT_ARROW =
    "url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')"

const inputStyle: React.CSSProperties = {
    ...GRADIENT_BORDER,
    width: "100%",
    borderRadius: "15px",
    backgroundColor: "#BDBDBD33",
    padding: "14px 16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.95rem",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
}

const selectStyle: React.CSSProperties = {
    border: "2px solid transparent",
    // Three stacked layers (first = topmost): the chevron icon, the white
    // padding-box fill, then the border-box gradient ring — kept as three
    // longhand background-* declarations (never the `background` shorthand,
    // which would silently reset backgroundImage and erase the other two).
    backgroundImage: `${SELECT_ARROW}, linear-gradient(#ffffff, #ffffff), linear-gradient(180deg, #0162D1, #715bc0)`,
    backgroundOrigin: "padding-box, border-box, border-box",
    backgroundClip: "padding-box, padding-box, border-box",
    backgroundRepeat: "no-repeat, no-repeat, no-repeat",
    backgroundPosition: "right 1rem center, 0 0, 0 0",
    backgroundSize: "1.25rem, auto, auto",
    width: "100%",
    borderRadius: "10px",
    padding: "14px 40px 14px 16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.95rem",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
}

const labelStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "clamp(14px, 1.6vw, 22px)",
    fontWeight: 500,
    color: "#374151",
}

// =====================================================
// COMPONENT
// =====================================================

function CreateEvent() {

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null
        setFormData((prev) => ({ ...prev, eventLogo: file }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setError(null)
        setSuccess(false)
        setSubmitting(true)

        try {
            const createdEvent = await createEventApi({
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
            })

            if (formData.eventLogo) {
                setUploadingImage(true)
                await uploadEventImage(createdEvent.id, formData.eventLogo)
                setUploadingImage(false)
            }

            setSuccess(true)
            setTimeout(() => navigate(`/admin/event/${createdEvent.id}`), 1200)

        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to create event"
            setError(message)
        } finally {
            setSubmitting(false)
            setUploadingImage(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-white">
            <img src={planeDeco} alt="" aria-hidden className="pointer-events-none absolute -left-4 top-40 hidden w-[180px] -rotate-6 opacity-80 lg:block" />
            <img src={droneDeco} alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 hidden w-[220px] opacity-80 lg:block" />
            <img src={starDeco} alt="" aria-hidden className="pointer-events-none absolute right-16 top-72 hidden w-12 opacity-70 lg:block" />
            <img src={starDeco} alt="" aria-hidden className="pointer-events-none absolute left-10 bottom-24 hidden w-16 opacity-60 lg:block" />

            <div className="relative mx-auto w-full max-w-[1155px] px-10 py-12 sm:py-10">

                {/* Heading */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Back"
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#0162D1]/30 text-[#0162D1] transition hover:bg-[#0162D1]/5"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h2
                        className="text-[28px] font-semibold capitalize tracking-wide text-[#0162D1] sm:text-[32px] lg:text-[35px]"
                        style={{ fontFamily: "'Sarpanch', sans-serif" }}
                    >
                        Create Event
                    </h2>
                </div>

                {success && (
                    <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 font-medium text-green-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Event created successfully
                    </div>
                )}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 font-medium text-red-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* ── 1. Event Information ── */}
                    <SectionBadge n={1} title="Event Information" />

                    <Field label="Event Name">
                        <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} style={inputStyle} required />
                    </Field>

                    <Field label="Event Description">
                        <textarea name="eventDescription" rows={4} value={formData.eventDescription} onChange={handleChange} style={{ ...inputStyle, resize: "vertical" }} />
                    </Field>

                    <Field label="Event Logo">
                        <label
                            htmlFor="eventLogo"
                            className="relative flex h-[157px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[15px] text-center"
                            style={inputStyle}
                        >
                            <UploadCloud size={26} className="text-[#9ca3af]" />
                            <span className="text-[15px] text-zinc-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                click to upload or <span className="text-[#0162D1]">drag & drop</span>
                            </span>
                            {formData.eventLogo && (
                                <span className="mt-1 flex items-center gap-1.5 text-xs text-[#0162D1]">
                                    <ImageIcon size={13} /> {formData.eventLogo.name}
                                </span>
                            )}
                            <input id="eventLogo" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                        </label>
                    </Field>

                    {/* ── 2. Organization ── */}
                    <SectionBadge n={2} title="Organization" />

                    <Field label="Organization Name">
                        <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} style={inputStyle} />
                    </Field>

                    <Field label="Organization URL">
                        <input type="text" name="organizationUrl" value={formData.organizationUrl} onChange={handleChange} placeholder="https://…" style={inputStyle} />
                    </Field>

                    {/* ── 3. Venue ── */}
                    <SectionBadge n={3} title="Venue" />

                    <Field label="Venue Name">
                        <input type="text" name="venueName" value={formData.venueName} onChange={handleChange} style={inputStyle} />
                    </Field>

                    <Field label="Venue Address">
                        <input type="text" name="venueAddress" value={formData.venueAddress} onChange={handleChange} style={inputStyle} />
                    </Field>

                    <LocationSelects
                        country={formData.country}
                        state={formData.state}
                        city={formData.city}
                        onCountry={v => setFormData(f => ({ ...f, country: v }))}
                        onState={v => setFormData(f => ({ ...f, state: v }))}
                        onCity={v => setFormData(f => ({ ...f, city: v }))}
                        gridStyle={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "24px" }}
                        selectStyle={selectStyle}
                        inputStyle={inputStyle}
                        labelStyle={labelStyle}
                    />

                    {/* ── 4. Event Dates ── */}
                    <SectionBadge n={4} title="Event Dates" />

                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Start Date">
                            <input
                                type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                style={{ ...inputStyle, borderRadius: "10px", cursor: "pointer" }}
                            />
                        </Field>
                        <Field label="End Date">
                            <input
                                type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                style={{ ...inputStyle, borderRadius: "10px", cursor: "pointer" }}
                            />
                        </Field>
                    </div>

                </form>

                {/* Submit */}
                <div className="mt-6 flex items-center justify-center pb-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2.5 rounded-[10px] px-8 py-3.5 font-medium text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        style={{ background: "linear-gradient(300deg, #9d7df9 40%, #5385ed 100%)", fontFamily: "'Poppins', sans-serif" }}
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {uploadingImage ? "Uploading image…" : submitting ? "Creating event…" : "Create Event"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateEvent

// =====================================================
// SECTION BADGE — numbered gradient-border marker + title + divider
// =====================================================

function SectionBadge({ n, title }: { n: number; title: string }) {
    return (
        <div className="mt-2 flex w-full items-center gap-3 sm:gap-5">
            <span
                className="flex size-6.25 flex-shrink-0 items-center justify-center rounded-sm text-[14px]"
                style={{ ...GRADIENT_BORDER, borderRadius: "6px", fontFamily: "'Poppins', sans-serif" }}
            >
                <span
                    className="font-medium leading-none"
                    style={{
                        backgroundImage: "linear-gradient(to right, #0162D1, #8C6CFF)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                    }}
                >
                    {n}
                </span>
            </span>
            <p
                className="whitespace-nowrap text-lg font-medium text-[#0162D1] sm:text-xl md:text-2xl lg:text-[28px]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
            >
                {title}
            </p>
            <div className="h-px w-full bg-gray-300" />
        </div>
    )
}

// =====================================================
// FIELD — label + input wrapper
// =====================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex w-full flex-col gap-2">
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    )
}
