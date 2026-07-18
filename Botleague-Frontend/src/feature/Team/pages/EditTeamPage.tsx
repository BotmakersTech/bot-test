import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTeam from "../hooks/useTeam";
import { useSponsors } from "../hooks/useSponsors";
import { uploadSponsorLogo, type Sponsor } from "../api/sponsor.api";
import { uploadTeamLogo } from "../CreateTeam/api/uploadTeamLogo.api";
import LocationSelects from "../../../shared/components/LocationSelects";
import { useAppSelector } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import planeDeco from "../../../assets/Auth/plane.svg";
import droneDeco from "../../../assets/Auth/drone.svg";
import starDeco from "../../../assets/Auth/Star-two.svg";
import teamDefaultImg from "../../../assets/TeamDefault.png";
import "../../../styles/editTeamMockup.css";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

interface TeamMember {
  userId?: string;
  botleagueId?: string;
  teamRole?: string;
  role?: string;
}

// ── Sponsors: inline logo+name adder → chips, backed by the real team-sponsor API ──
function SponsorsField({ teamId }: { teamId: string | null | undefined }) {
  const { sponsors, loading, error, add, remove } = useSponsors(teamId);

  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!teamId || !name.trim()) return;
    setBusy(true);
    setLocalError(null);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        logoUrl = await uploadSponsorLogo(teamId, logoFile);
      }
      await add(teamId, { sponsorName: name.trim(), logoUrl });
      setName("");
      setLogoFile(null);
      setLogoPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setLocalError(extractErrorMessage(err, "Failed to add sponsor"));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (sponsor: Sponsor) => {
    setLocalError(null);
    try {
      await remove(sponsor.id);
    } catch (err) {
      setLocalError(extractErrorMessage(err, "Failed to remove sponsor"));
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="etm-field-label">Sponsors</label>

      <div className="flex items-center gap-2 sm:gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload sponsor logo"
          disabled={!teamId}
          className="flex-shrink-0 w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-lg border-2 border-dashed border-[#BDBDBD] bg-[#bdbdbd2b] flex items-center justify-center overflow-hidden cursor-pointer transition-colors duration-150 hover:border-[#8C6CFF] disabled:cursor-not-allowed"
          style={{ boxShadow: "var(--etm-custom-box-shadow)" }}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Sponsor name"
          className="etm-field-input flex-1 min-w-0"
        />

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={busy || !name.trim() || !teamId}
          className="etm-btn-gradient flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
          {busy ? "..." : "Add"}
        </button>
      </div>

      {(error || localError) && <p className="text-xs text-red-500">{error || localError}</p>}

      {loading ? (
        <p className="text-[12px] text-gray-400 etm-font-inter">Loading sponsors…</p>
      ) : sponsors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sponsors.map((s) => (
            <div key={s.id} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[#BDBDBD] bg-[#bdbdbd2b] shadow-sm">
              {s.logoUrl ? (
                <img src={s.logoUrl} alt={s.sponsorName} className="w-[28px] h-[28px] rounded-full object-cover border border-white shadow-sm" />
              ) : (
                <span
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#0162D1,#8C6CFF)" }}
                >
                  {s.sponsorName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="text-[13px] sm:text-[14px] font-medium text-gray-700 max-w-[120px] truncate">{s.sponsorName}</span>
              <button
                type="button"
                onClick={() => void handleRemove(s)}
                title={`Remove ${s.sponsorName}`}
                className="ml-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#f87171] transition-colors duration-150 cursor-pointer"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="7" y2="7" />
                  <line x1="7" y1="1" x2="1" y2="7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-gray-400 etm-font-inter">No sponsors added yet. Upload a logo and enter a name above.</p>
      )}
    </div>
  );
}

export default function EditTeamPage() {
  const navigate = useNavigate();
  const t = useTeam();
  const authUser = useAppSelector((state: RootState) => state.auth.user);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  // Not backed by the team API yet — kept local so the field still matches
  // the mockup visually without silently pretending it persists.
  const [pinCode, setPinCode] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await t.handleUpdateTeam({
        teamName: t.teamName,
        description: t.description,
        institutionName: t.institutionName,
        city: t.city,
        state: t.state,
        country: t.country || "India",
      });
      if (logoFile && t.team?.id) {
        await uploadTeamLogo(t.team.id, logoFile);
        await t.loadTeam();
      }
      setLogoFile(null);
      setLogoPreview("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // t.error already holds a message — surfaced inline below.
    }
  };

  // Team name conflicts are the one error worth pinning to its own field;
  // everything else shows as a general banner above the Save button.
  const isNameConflict = t.error?.toLowerCase().includes("team name") ?? false;

  // ── Captain / vice-captain gate — mirrors MyTeam.tsx's own "who am I in
  //    this roster" lookup, since the team API doesn't return the caller's
  //    own role directly. ─────────────────────────────────────────────────
  const allMembers: TeamMember[] = t.teamMemberships.flatMap((entry) => entry.members ?? []);
  const selfMember = allMembers.find(
    (m) =>
      (!!authUser?.id && m.userId === authUser.id) ||
      (!!authUser?.botleagueId && m.botleagueId === authUser.botleagueId)
  );
  const selfRole = String(selfMember?.teamRole || selfMember?.role || "").toUpperCase();
  const canEdit = selfRole === "CAPTAIN" || selfRole === "VICE_CAPTAIN";

  const statusUpper = (t.team?.status || "").toUpperCase();
  const statusBadge =
    statusUpper === "ACTIVE"
      ? { color: "#00D31C", label: "Active" }
      : statusUpper === "REJECTED"
      ? { color: "#f87171", label: "Rejected" }
      : { color: "#f59e0b", label: "Pending" };

  if (t.isLoading && !t.team) {
    return (
      <div className="etm-page min-h-screen flex items-center justify-center">
        <p className="text-gray-500 etm-font-inter">Loading team…</p>
      </div>
    );
  }

  if (!t.team || t.status === "NO_TEAM") {
    return (
      <div className="etm-page min-h-screen flex items-center justify-center">
        <p className="text-gray-500 etm-font-inter">You're not part of a team yet.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="etm-page min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-500 etm-font-inter text-center">
          Only the team captain or vice-captain can edit team details.
        </p>
      </div>
    );
  }

  return (
    <div className="etm-page min-h-screen">
      <section className="relative min-h-screen flex flex-col mx-auto overflow-x-hidden">

        <img className="etm-bg-deco absolute top-40 left-6 w-[110px]" src={planeDeco} alt="" aria-hidden="true" />
        <img className="etm-bg-deco absolute right-16 top-72 w-[90px]" src={droneDeco} alt="" aria-hidden="true" />
        <img className="etm-bg-deco absolute w-[50px] bottom-40 left-24" src={starDeco} alt="" aria-hidden="true" />
        <img className="etm-bg-deco absolute w-[130px] right-40 -bottom-5" src={starDeco} alt="" aria-hidden="true" />

        <div className="relative z-10 flex-1 etm-page-content py-6 md:py-8 lg:py-12">
          <div className="w-full max-w-[1079px] mx-auto flex flex-col gap-5 md:gap-6 lg:gap-8">

            <div className="pl-1">
              <h2 className="text-[20px] md:text-[26px] lg:text-[35px] capitalize etm-font-sarpanch font-semibold tracking-wide">
                Edit <span className="text-[#0162D1]">Team</span> Profile
              </h2>
            </div>

            {/* ── Profile banner card ────────────────────────────────────── */}
            <div className="etm-border-gradient-thick relative flex flex-col md:flex-row items-center gap-5 md:gap-8 lg:gap-10 w-full rounded-[23px] overflow-hidden bg-white shadow-[var(--etm-custom-shadow)] px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-6">

              <div className="flex-shrink-0 flex justify-center items-center rounded-xl bg-[#F0F0F0] w-full md:w-auto">
                <img
                  className="w-full max-w-[320px] md:max-w-[340px] lg:max-w-[382px] h-auto rounded-xl object-cover"
                  src={logoPreview || t.team.logoUrl || teamDefaultImg}
                  alt="Team logo"
                />
              </div>

              <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 lg:gap-6">
                  <h2 className="uppercase font-bold etm-font-sarpanch tracking-tight etm-text-gradient text-[24px] md:text-[32px] lg:text-[44px]">
                    {t.teamName || "Your Team"}
                  </h2>
                  <span
                    className="flex items-center gap-1.5 border-2 font-semibold rounded-full px-3 py-0.5 text-[10px] md:text-[13px] lg:text-[15px] etm-font-poppins whitespace-nowrap"
                    style={{ borderColor: statusBadge.color, color: statusBadge.color }}
                  >
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: statusBadge.color }} />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="etm-font-poppins font-medium text-[14px] md:text-[16px] lg:text-[18px] text-gray-700">
                    Team ID
                  </span>
                  <span className="etm-text-gradient etm-font-inter font-semibold tracking-wide text-[20px] md:text-[26px] lg:text-[35px]">
                    {t.team.teamCode || "—"}
                  </span>
                </div>

                <div className="pt-2 lg:pt-4">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="teamLogoInput" />
                  <label htmlFor="teamLogoInput" className="etm-btn-gradient inline-block">
                    Change Logo
                  </label>
                </div>
              </div>
            </div>

            {/* ── Team form ──────────────────────────────────────────────── */}
            <div
              className="etm-border-gradient-thick relative overflow-hidden w-full rounded-[15px] bg-white shadow-sm flex flex-col px-4 py-5 sm:px-8 sm:py-7 lg:px-[50px] lg:py-[50px]"
              style={{ gap: "clamp(14px, 2dvh, 24px)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="teamName" className="etm-field-label">Team Name</label>
                  <input
                    type="text"
                    id="teamName"
                    placeholder="e.g. Blackrockx"
                    value={t.teamName}
                    onChange={(e) => t.setTeamName(e.target.value)}
                    className="etm-field-input"
                  />
                  {isNameConflict && <p className="text-xs text-red-500">{t.error}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="organization" className="etm-field-label">Organization</label>
                  <input
                    type="text"
                    id="organization"
                    placeholder="e.g. BotLeague Inc."
                    value={t.institutionName}
                    onChange={(e) => t.setInstitutionName(e.target.value)}
                    className="etm-field-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
                <LocationSelects
                  hideCountry
                  country={t.country || "India"}
                  state={t.state}
                  city={t.city}
                  onCountry={t.setCountry}
                  onState={t.setState}
                  onCity={t.setCity}
                  gridStyle={{ display: "contents" }}
                  labelClassName="etm-field-label"
                  selectClassName="etm-field-input"
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pin" className="etm-field-label">Pin Code</label>
                  <input
                    type="text"
                    id="pin"
                    placeholder="e.g. 411001"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="etm-field-input"
                  />
                </div>
              </div>

              <SponsorsField teamId={t.team.id} />

              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="description" className="etm-field-label">Description</label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Tell us about your team…"
                  value={t.description}
                  onChange={(e) => t.setDescription(e.target.value)}
                  className="etm-field-input"
                />
              </div>

              {t.error && !isNameConflict && (
                <p className="text-sm text-red-500 etm-font-inter">{t.error}</p>
              )}
            </div>

            {/* ── Save button ────────────────────────────────────────────── */}
            <div className="flex justify-center items-center pb-4 gap-3">
              <button type="button" onClick={() => navigate("/my-team")} className="etm-font-poppins font-semibold text-gray-500 cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={t.isLoading} className="etm-btn-primary">
                {t.isLoading ? "Saving…" : saveSuccess ? "Saved!" : "Save Team Profile"}
              </button>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
