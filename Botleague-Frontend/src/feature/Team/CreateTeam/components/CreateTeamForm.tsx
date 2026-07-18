import { useState } from "react";
import useCreateTeam from "../hooks/useCreateTeam";
import LocationSelects from "../../../../shared/components/LocationSelects";
import ProfileIncompleteModal from "../../../../shared/components/ProfileIncompleteModal";
import "../../../../styles/editTeamMockup.css";

const STAR_PATH = "M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z";

function OutlineStar({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 51 48" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Purely decorative billboard-collage panel — no real data, matches the mockup exactly. */
function BillboardCollage() {
  return (
    <div
      className="rounded-xl overflow-hidden flex-1 relative"
      style={{ background: "linear-gradient(160deg,#141414 0%,#241a3d 30%,#0d3b4a 55%,#1a2438 80%,#0b0b12 100%)", minHeight: 340 }}
    >
      <div className="absolute inset-0 flex flex-col gap-1 p-2">
        <div className="flex-1 flex gap-1">
          <div className="flex-1 rounded" style={{ background: "linear-gradient(135deg,#e8117a,#7a1d5c)" }} />
          <div
            className="flex-[1.4] rounded flex items-center justify-center text-white font-bold text-xs text-center leading-tight"
            style={{ background: "linear-gradient(135deg,#2b6cb0,#0f3a5f)", fontFamily: "Poppins, sans-serif" }}
          >
            GLOBAL<br />CITIZEN<br />FESTIVAL
          </div>
          <div className="flex-1 rounded" style={{ background: "#0e2a3a" }} />
        </div>
        <div className="flex-1 flex gap-1">
          <div className="flex-[1.2] rounded" style={{ background: "#111" }} />
          <div className="flex-1 rounded" style={{ background: "linear-gradient(135deg,#e0532c,#a8391b)" }} />
          <div className="flex-1 rounded" style={{ background: "#0d2a2a" }} />
        </div>
        <div className="flex-1 flex gap-1">
          <div className="flex-1 rounded" style={{ background: "#1a1a1a" }} />
          <div className="flex-[1.3] rounded" style={{ background: "linear-gradient(135deg,#1fa9a0,#0d6b66)" }} />
          <div className="flex-1 rounded" style={{ background: "linear-gradient(135deg,#f2c14e,#c99a2e)" }} />
        </div>
        <div className="h-10 rounded-b flex items-center justify-center gap-2 opacity-70">
          <div className="w-1/3 h-full bg-black/40 rounded" />
          <div className="w-1/3 h-full bg-black/30 rounded" />
          <div className="w-1/3 h-full bg-black/40 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CreateTeamForm() {
  const {
    form,
    logoPreview,
    isLoading,
    error,
    handleChange,
    setField,
    handleLogoUpload,
    handleSubmit,
    showProfileGate,
    missingFields,
    closeProfileGate,
  } = useCreateTeam();

  const isNameConflict = error?.toLowerCase().includes("team name") ?? false;
  // Not backed by the team API yet — kept local so the field still matches
  // the mockup visually without silently pretending it persists.
  const [pinCode, setPinCode] = useState("");

  return (
    <div className="etm-page min-h-screen">
      <section className="relative min-h-screen flex flex-col mx-auto overflow-x-hidden">

        <OutlineStar className="etm-bg-deco absolute top-16 right-[14%] w-20 h-20 text-indigo-100 opacity-90" />
        <OutlineStar className="etm-bg-deco absolute top-[30%] right-[24%] w-14 h-14 text-indigo-100 opacity-80" />
        <OutlineStar className="etm-bg-deco absolute top-[36%] left-[10%] w-16 h-16 text-indigo-100 opacity-80" />
        <OutlineStar className="etm-bg-deco absolute bottom-[16%] left-[10%] w-16 h-16 text-indigo-100 opacity-80" />

        <div className="relative z-10 flex-1 etm-page-content py-6 md:py-8 lg:py-12">
          <div className="w-full max-w-[1079px] mx-auto flex flex-col gap-5 md:gap-6 lg:gap-8">

            <div className="pl-1">
              <h2 className="text-[20px] md:text-[26px] lg:text-[35px] capitalize etm-font-sarpanch font-semibold tracking-wide">
                Create <span className="text-[#0162D1]">Team</span> Profile
              </h2>
            </div>

            {/* ── Profile banner card ────────────────────────────────────── */}
            <div className="etm-border-gradient-thick relative flex items-center gap-8 w-full rounded-[23px] overflow-hidden bg-white shadow-[var(--etm-custom-shadow)] px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-6">

              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center relative z-10 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Team logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-14 h-14 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                    </svg>
                  )}
                </div>

                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="createTeamLogoInput" />
                <label
                  htmlFor="createTeamLogoInput"
                  className="etm-btn-gradient absolute bottom-0 right-0 w-9 h-9 !p-0 rounded-full flex items-center justify-center z-20 border-4 border-white cursor-pointer"
                  title="Upload team logo"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                    <path d="M18 9v-2M17 8h2" />
                  </svg>
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="etm-font-sarpanch etm-text-gradient text-2xl md:text-3xl font-bold truncate">
                    {form.teamName || "Your Team"}
                  </h1>
                  <span className="bg-[#AEB9F5] text-white text-xs font-semibold px-4 py-1.5 rounded-full shrink-0">Profile</span>
                </div>

                <p className="text-xs font-bold tracking-wider text-gray-700 mb-1">TEAM ID</p>
                <p className="etm-font-sarpanch text-2xl font-extrabold text-[#4F6EF7]">BL-PENDING</p>
              </div>
            </div>

            {/* ── Team form ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="lg:col-span-2 etm-border-gradient-thick rounded-2xl bg-white p-6 lg:p-8">
                <h2 className="etm-font-sarpanch text-2xl font-bold text-gray-900 mb-6">Team Information</h2>

                <div className="mb-5">
                  <label className="etm-field-label block mb-2">TEAM NAME</label>
                  <input
                    type="text"
                    name="teamName"
                    value={form.teamName}
                    onChange={handleChange}
                    placeholder="Enter your Team name"
                    className="etm-field-input"
                  />
                  {isNameConflict && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>

                <div className="mb-5">
                  <label className="etm-field-label block mb-2">TEAM ORGANISATION</label>
                  <input
                    type="text"
                    name="institutionName"
                    value={form.institutionName}
                    onChange={handleChange}
                    placeholder="Enter here"
                    className="etm-field-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <LocationSelects
                    hideCountry
                    country={form.country || "India"}
                    state={form.state || ""}
                    city={form.city || ""}
                    onCountry={(v) => setField("country", v)}
                    onState={(v) => setField("state", v)}
                    onCity={(v) => setField("city", v)}
                    gridStyle={{ display: "contents" }}
                    labelClassName="etm-field-label"
                    selectClassName="etm-field-input"
                    inputClassName="etm-field-input"
                  />
                  <div>
                    <label className="etm-field-label block mb-2">PIN CODE</label>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 411001"
                      className="etm-field-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="etm-field-label block mb-2">DESCRIPTION</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Describe your team"
                    className="etm-field-input"
                  />
                </div>

                {error && !isNameConflict && (
                  <p className="text-sm text-red-500 mt-4">{error}</p>
                )}

                {/* Sponsors can only be attached to a team that already
                    exists — add them from Edit Team once this one's created. */}
              </div>

              {/* ── Image + Social card ──────────────────────────────────── */}
              <div className="etm-border-gradient-thick rounded-2xl bg-white p-5 flex flex-col">
                <BillboardCollage />

                <div className="mt-5 flex items-center gap-3">
                  <span className="etm-font-poppins text-lg text-gray-900">Follow us :</span>
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6l10 6-10 6z" /></svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H17V3.7c-.28-.04-1.24-.12-2.35-.12-2.33 0-3.93 1.42-3.93 4.03V10H8v3.1h2.72V21z" /></svg>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "radial-gradient(circle at 30% 110%, #ffd521, #f8641b 25%, #e1306c 50%, #c62cb0 70%, #6a34d6 90%)" }}>
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="16" height="16" rx="4" />
                      <circle cx="12" cy="12" r="3.2" />
                      <circle cx="16.2" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pb-4">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="etm-btn-primary"
              >
                {isLoading ? "Creating…" : "Save Profile Data"}
              </button>
            </div>

          </div>
        </div>
      </section>

      {showProfileGate && (
        <ProfileIncompleteModal
          missingFields={missingFields}
          action="create a team"
          onClose={closeProfileGate}
        />
      )}
    </div>
  );
}
