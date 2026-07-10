"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

import {
    ArrowLeft,
    CalendarDays,
    Globe,
    MapPin,
    Building2,
    FileText,
    Loader2,
    Image as ImageIcon
} from "lucide-react"

import { createEvent as createEventApi } from "../api/admin.api"
import { uploadEventImage } from "../api/uploadEvent.api"
import LocationSelects from "../../../shared/components/LocationSelects"

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
// DESIGN TOKENS
// =====================================================

const BG = "#3a3a3a"
const CARD = "rgba(0,0,0,0.25)"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT = "#ffffff"
const MUTED = "#9ca3af"
const ACCENT = "#fa4715"
const SUCCESS = "#4ade80"
const DANGER = "#f87171"

// =====================================================
// COMPONENT
// =====================================================

function CreateEvent() {

    const navigate = useNavigate()

    // =====================================================
    // FORM STATE
    // =====================================================

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

    // =====================================================
    // FLOW STATE
    // =====================================================

    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // =====================================================
    // HANDLE CHANGE
    // =====================================================

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // =====================================================
    // FILE CHANGE
    // =====================================================

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null
        setFormData((prev) => ({ ...prev, eventLogo: file }))
    }

    // =====================================================
    // SUBMIT  (one click → create + upload + save key)
    // =====================================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setError(null)
        setSuccess(false)
        setSubmitting(true)

        try {

            // -------------------------------------------------
            // 1) CREATE EVENT  (no logo yet)
            // -------------------------------------------------

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

            // -------------------------------------------------
            // 2) UPLOAD LOGO → R2 → SAVE KEY ON EVENT
            // -------------------------------------------------

            if (formData.eventLogo) {
                setUploadingImage(true)
                await uploadEventImage(createdEvent.id, formData.eventLogo)
                setUploadingImage(false)
            }

            // -------------------------------------------------
            // 3) DONE
            // -------------------------------------------------

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

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                background: BG,
                padding: "40px",
                color: TEXT
            }}
        >

            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "30px"
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${BORDER}`,
                        color: TEXT,
                        borderRadius: "10px",
                        padding: "10px",
                        cursor: "pointer"
                    }}
                >
                    <ArrowLeft size={18} />
                </button>

                <div>
                    <h1 style={{ margin: 0, fontSize: "2rem" }}>
                        Create Event
                    </h1>
                    <div style={{ marginTop: "6px", color: MUTED }}>
                        Create and publish a new BotLeague event
                    </div>
                </div>
            </div>

            {/* SUCCESS */}
            {success && (
                <div
                    style={{
                        background: "rgba(74,222,128,0.1)",
                        border: "1px solid rgba(74,222,128,0.25)",
                        color: SUCCESS,
                        padding: "14px 18px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}
                >
                    Event created successfully
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div
                    style={{
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: DANGER,
                        padding: "14px 18px",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gap: "24px" }}>

                    {/* EVENT */}
                    <Section title="Event Information">
                        <Input
                            icon={<FileText size={16} />}
                            label="Event Name"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleChange}
                            placeholder="BotLeague Championship"
                            required
                        />

                        <Textarea
                            label="Event Description"
                            name="eventDescription"
                            value={formData.eventDescription}
                            onChange={handleChange}
                            placeholder="Write event details..."
                            required
                        />

                        {/* FILE */}
                        <div>
                            <div
                                style={{
                                    marginBottom: "8px",
                                    color: MUTED,
                                    fontSize: "0.85rem"
                                }}
                            >
                                Event Logo
                            </div>

                            <div
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: `1px solid ${BORDER}`,
                                    borderRadius: "12px",
                                    padding: "16px"
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ color: TEXT }}
                                />

                                {formData.eventLogo && (
                                    <div
                                        style={{
                                            marginTop: "10px",
                                            color: MUTED,
                                            fontSize: "0.8rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        <ImageIcon size={15} />
                                        {formData.eventLogo.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* ORGANIZATION */}
                    <Section title="Organization">
                        <Input
                            icon={<Building2 size={16} />}
                            label="Organization Name"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            icon={<Globe size={16} />}
                            label="Organization URL"
                            name="organizationUrl"
                            value={formData.organizationUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </Section>

                    {/* VENUE */}
                    <Section title="Venue">
                        <Input
                            icon={<MapPin size={16} />}
                            label="Venue Name"
                            name="venueName"
                            value={formData.venueName}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            icon={<MapPin size={16} />}
                            label="Venue Address"
                            name="venueAddress"
                            value={formData.venueAddress}
                            onChange={handleChange}
                            required
                        />

                        <LocationSelects
                            country={formData.country}
                            state={formData.state}
                            city={formData.city}
                            onCountry={v => setFormData(f => ({ ...f, country: v }))}
                            onState={v => setFormData(f => ({ ...f, state: v }))}
                            onCity={v => setFormData(f => ({ ...f, city: v }))}
                            required
                            gridStyle={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                                gap: "18px"
                            }}
                        />
                    </Section>

                    {/* DATES */}
                    <Section title="Event Dates">
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit,minmax(220px,1fr))",
                                gap: "18px"
                            }}
                        >
                            <Input
                                icon={<CalendarDays size={16} />}
                                type="date"
                                label="Start Date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                icon={<CalendarDays size={16} />}
                                type="date"
                                label="End Date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </Section>

                    {/* ACTION */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end"
                        }}
                    >
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                background: ACCENT,
                                color: "#fff",
                                border: "none",
                                borderRadius: "12px",
                                padding: "14px 22px",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting && (
                                <Loader2 size={16} className="animate-spin" />
                            )}

                            {uploadingImage
                                ? "Uploading image..."
                                : submitting
                                    ? "Creating event..."
                                    : "Create Event"}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    )
}

export default CreateEvent

// =====================================================
// SECTION
// =====================================================

function Section({
    title,
    children
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div
            style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: "18px",
                padding: "24px"
            }}
        >
            <div
                style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    marginBottom: "22px"
                }}
            >
                {title}
            </div>

            <div style={{ display: "grid", gap: "18px" }}>
                {children}
            </div>
        </div>
    )
}

// =====================================================
// INPUT
// =====================================================

function Input({ icon, label, ...props }: any) {
    return (
        <div>
            <div
                style={{
                    marginBottom: "8px",
                    color: MUTED,
                    fontSize: "0.85rem"
                }}
            >
                {label}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    padding: "0 14px"
                }}
            >
                {icon && (
                    <div style={{ color: MUTED }}>{icon}</div>
                )}

                <input
                    {...props}
                    onClick={(e) => {
                        if (props.type === "date") {
                            (e.target as HTMLInputElement).showPicker?.()
                        }
                    }}
                    style={{
                        flex: 1,
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: TEXT,
                        padding: "14px 0",
                        cursor: props.type === "date" ? "pointer" : "text"
                    }}
                />
            </div>
        </div>
    )
}

// =====================================================
// TEXTAREA
// =====================================================

function Textarea({ label, ...props }: any) {
    return (
        <div>
            <div
                style={{
                    marginBottom: "8px",
                    color: MUTED,
                    fontSize: "0.85rem"
                }}
            >
                {label}
            </div>

            <textarea
                {...props}
                rows={5}
                style={{
                    width: "100%",
                    resize: "vertical",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "12px",
                    padding: "14px",
                    outline: "none",
                    color: TEXT
                }}
            />
        </div>
    )
}