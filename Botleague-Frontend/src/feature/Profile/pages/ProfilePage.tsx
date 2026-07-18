import { useRef, useState } from "react";
import useProfile from "../hooks/useProfile";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import { useProfileComplete } from "../../../shared/hooks/useProfileComplete";
import GuardianForm from "../../Eligibility/components/GuardianForm";
import AvatarPickerModal from "../components/AvatarPickerModal";
import LocationSelects from "../../../shared/components/LocationSelects";
import { sendOtp, changePhoneWithOtp } from "../../Auth/api/auth.api";
import teamDefaultImg from "../../../assets/TeamDefault.png";
import youtubeIcon from "../../../assets/youtube.png";
import facebookIcon from "../../../assets/facebook.png";
import instagramIcon from "../../../assets/Instagram.png";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import "../../../styles/profileMockup.css";

const PHONE_RESEND_COOLDOWN_S = 60;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}

function OutlineStar({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeWidth="1" d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.6h7.6z" />
    </svg>
  );
}

/**
 * Read-only display for a field — rendered as the SAME boxed/shadowed input
 * used in edit mode (via .pfm-form's shared input styling), just non-editable,
 * so toggling edit mode never changes the field's visual weight.
 */
function ReadOnlyField({ value, placeholder = "Not set" }: { value: string; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      readOnly
      placeholder={placeholder}
      className="w-full rounded-lg text-gray-500 placeholder-gray-400 cursor-default"
    />
  );
}

export default function ProfilePage() {
  const p = useProfile();
  const { eligibility, reload: reloadEligibility } = useEligibility();
  const { isComplete } = useProfileComplete();
  const isMinor = eligibility ? eligibility.age >= 0 && eligibility.age < 18 : false;

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  // First-time users (profile not yet complete) land straight in edit mode;
  // everyone else sees read-only until they tap "Edit Profile".
  const [isEditMode, setIsEditMode] = useState(!isComplete);
  // Not backed by the profile API yet — kept local so the field still
  // matches the mockup visually without silently pretending it persists.
  const [pinCode, setPinCode] = useState("");

  // ── Contact number: OTP-verified change flow ──────────────────────────
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneOtpSuccess, setPhoneOtpSuccess] = useState<string | null>(null);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const phoneCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const savedPhone = p.profile?.phone ?? "";
  const phoneChanged = p.phone !== savedPhone && p.phone.trim().length > 0;

  // Collapse the whole form back to read-only once a save actually succeeds
  // — adjusted during render (React's documented pattern for deriving state
  // from a prop change) rather than an effect, to avoid an extra render pass.
  const [prevSaveSuccess, setPrevSaveSuccess] = useState(p.saveSuccess);
  if (p.saveSuccess !== prevSaveSuccess) {
    setPrevSaveSuccess(p.saveSuccess);
    if (p.saveSuccess) {
      setIsEditMode(false);
    }
  }

  const handleUsernameToggle = async () => {
    if (!isEditingUsername) {
      setIsEditingUsername(true);
      return;
    }
    await p.saveUsername();
    setIsEditingUsername(false);
  };

  const handleEnterEditMode = () => {
    // Pre-seed so the email input starts from the real current value —
    // binding straight to pendingEmailInput (no `|| p.email` fallback)
    // means an untouched empty string would otherwise show as blank.
    if (!p.pendingEmail) {
      p.setPendingEmailInput(p.email);
    }
    setIsEditMode(true);
  };

  const startPhoneResendCooldown = () => {
    if (phoneCooldownTimerRef.current) clearInterval(phoneCooldownTimerRef.current);
    setPhoneResendCooldown(PHONE_RESEND_COOLDOWN_S);
    phoneCooldownTimerRef.current = setInterval(() => {
      setPhoneResendCooldown((prev) => {
        if (prev <= 1) {
          if (phoneCooldownTimerRef.current) clearInterval(phoneCooldownTimerRef.current);
          phoneCooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendPhoneOtp = async () => {
    setPhoneOtpError(null);
    setPhoneOtpSuccess(null);
    setPhoneOtpLoading(true);
    try {
      await sendOtp(p.phone);
      setPhoneOtpSent(true);
      startPhoneResendCooldown();
    } catch (err) {
      setPhoneOtpError(extractErrorMessage(err, "Failed to send OTP"));
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpValue.trim()) {
      setPhoneOtpError("Enter the OTP sent to your phone.");
      return;
    }
    setPhoneOtpError(null);
    setPhoneOtpLoading(true);
    try {
      await changePhoneWithOtp({ newPhone: p.phone, otp: phoneOtpValue.trim() });
      setPhoneOtpSent(false);
      setPhoneOtpValue("");
      setPhoneOtpSuccess("Phone number updated successfully.");
      await p.refetch();
    } catch (err) {
      setPhoneOtpError(extractErrorMessage(err, "Invalid or expired OTP"));
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  return (
    <div className="pfm-page min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto relative overflow-hidden">

        <OutlineStar className="absolute top-24 right-16 w-16 h-16 text-indigo-100 opacity-70" />
        <OutlineStar className="absolute bottom-16 left-10 w-10 h-10 text-indigo-100 opacity-70" />

        {/* ── Top Profile Bar ─────────────────────────────────────────── */}
        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-5 flex items-center gap-4 mb-6 relative">
          <div className="relative shrink-0">
            <img
              src={bLogo}
              alt=""
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] object-contain opacity-50 -z-0 pointer-events-none"
            />

            <button
              type="button"
              onClick={p.openAvatarModal}
              title="Change avatar"
              aria-label="Change avatar"
              className="w-[128px] h-[128px] rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center relative z-10 p-[3px] cursor-pointer"
            >
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {p.profilePhotoUrl ? (
                  <img src={p.profilePhotoUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-9 h-9 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
                  </svg>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={p.openAvatarModal}
              title="Change avatar"
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 w-[46px] h-[46px] rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white z-20 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditingUsername ? (
                <input
                  type="text"
                  value={p.username}
                  onChange={(e) => p.setUsername(e.target.value)}
                  onBlur={() => void handleUsernameToggle()}
                  onKeyDown={(e) => e.key === "Enter" && void handleUsernameToggle()}
                  autoFocus
                  className="pfm-username-input pfm-font-sarpanch text-indigo-600 font-bold text-lg"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void handleUsernameToggle()}
                  title="Edit username"
                  className="pfm-font-sarpanch text-indigo-600 font-bold text-4xl underline decoration-2 underline-offset-2 cursor-pointer mb-3"
                >
                  @{p.username || "UserName"}
                </button>
              )}
              <span className="text-xs font-semibold text-indigo-500 bg-indigo-100 px-3 py-0.5 rounded-full">Profile</span>
            </div>

            <p className="text-base font-semibold text-black tracking-wide">BOTLEAGUE ID</p>
            <p className="text-indigo-600 font-bold text-2xl leading-tight px-4">{p.botleagueId || "BL-PENDING"}</p>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Personal Information Form */}
          <div className="lg:col-span-2 bg-white border border-indigo-100 rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5">Personal Information</h2>

            <div className="pfm-form grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 tracking-wide mb-1">FIRST NAME</label>
                {isEditMode ? (
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    value={p.firstName}
                    onChange={(e) => p.setFirstName(e.target.value)}
                    className="w-full rounded-lg text-gray-500 placeholder-gray-400"
                  />
                ) : (
                  <ReadOnlyField value={p.firstName} />
                )}
                {p.errors.firstName && <p className="pfm-error">{p.errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 tracking-wide mb-1">LAST NAME</label>
                {isEditMode ? (
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    value={p.lastName}
                    onChange={(e) => p.setLastName(e.target.value)}
                    className="w-full rounded-lg text-gray-500 placeholder-gray-400"
                  />
                ) : (
                  <ReadOnlyField value={p.lastName} />
                )}
                {p.errors.lastName && <p className="pfm-error">{p.errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 tracking-wide mb-1">DATE OF BIRTH</label>
                {isEditMode ? (
                  <input
                    type="date"
                    value={p.dateOfBirth}
                    onChange={(e) => p.setDateOfBirth(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg text-gray-500 cursor-pointer"
                  />
                ) : (
                  <ReadOnlyField
                    value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                  />
                )}
                {p.errors.dateOfBirth && <p className="pfm-error">{p.errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 tracking-wide mb-1">CONTACT NUMBER</label>
                {isEditMode ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={p.phone}
                        onChange={(e) => p.setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 rounded-lg text-gray-500 placeholder-gray-400"
                      />
                      {phoneChanged && !phoneOtpSent && (
                        <button
                          type="button"
                          onClick={() => void handleSendPhoneOtp()}
                          disabled={phoneOtpLoading || p.phone.length !== 10}
                          className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold px-4 rounded-lg shrink-0 disabled:opacity-60 cursor-pointer"
                        >
                          {phoneOtpLoading ? "..." : "Send OTP"}
                        </button>
                      )}
                    </div>
                    {phoneOtpSent && (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="4-digit OTP"
                          value={phoneOtpValue}
                          onChange={(e) => setPhoneOtpValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          maxLength={4}
                          autoFocus
                          className="flex-1 rounded-lg text-gray-500 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => void handleVerifyPhoneOtp()}
                          disabled={phoneOtpLoading}
                          className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold px-4 rounded-lg shrink-0 disabled:opacity-60 cursor-pointer"
                        >
                          {phoneOtpLoading ? "..." : "Verify"}
                        </button>
                      </div>
                    )}
                    {phoneOtpSent && (
                      <p className="pfm-hint">
                        {phoneResendCooldown > 0 ? (
                          `Resend OTP in ${phoneResendCooldown}s`
                        ) : (
                          <button type="button" onClick={() => void handleSendPhoneOtp()} className="underline cursor-pointer">
                            Resend OTP
                          </button>
                        )}
                      </p>
                    )}
                    {phoneOtpError && <p className="pfm-error">{phoneOtpError}</p>}
                    {phoneOtpSuccess && <p className="pfm-hint">{phoneOtpSuccess}</p>}
                  </div>
                ) : (
                  <ReadOnlyField value={p.phone} />
                )}
                {p.errors.phone && <p className="pfm-error">{p.errors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 tracking-wide mb-1">EMAIL ADDRESS</label>
                {isEditMode ? (
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="e.g. botmakers12@gmail.com"
                      value={p.pendingEmailInput}
                      onChange={(e) => p.setPendingEmailInput(e.target.value)}
                      className="flex-1 rounded-lg text-gray-500 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => void p.saveEmail()}
                      disabled={p.isLoading}
                      className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold px-6 rounded-lg shrink-0 disabled:opacity-60 cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                ) : (
                  <ReadOnlyField value={p.email} />
                )}
                {p.errors.email && <p className="pfm-error">{p.errors.email}</p>}
                {p.pendingEmail && (
                  <p className="pfm-hint">
                    Verification email sent to {p.pendingEmail} — check your inbox.
                    {p.resendCooldownSeconds > 0 && ` You can resend in ${p.resendCooldownSeconds}s.`}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isEditMode ? (
                  <LocationSelects
                    hideCountry
                    country={p.country || "India"}
                    state={p.state}
                    city={p.city}
                    onCountry={p.setCountry}
                    onState={p.setState}
                    onCity={p.setCity}
                    gridStyle={{ display: "contents" }}
                    labelClassName="block text-xs font-medium text-gray-600 mb-1"
                    selectClassName="w-full rounded-lg text-gray-500"
                  />
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <ReadOnlyField value={p.state} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <ReadOnlyField value={p.city} />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">pin code</label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full rounded-lg text-gray-500"
                    />
                  ) : (
                    <ReadOnlyField value={pinCode} />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={p.address}
                  onChange={(e) => p.setAddress(e.target.value)}
                  readOnly={!isEditMode}
                  placeholder="Not set"
                  className={`w-full rounded-lg text-gray-500 placeholder-gray-400 resize-none ${isEditMode ? "" : "cursor-default"}`}
                />
                {p.errors.address && <p className="pfm-error">{p.errors.address}</p>}
              </div>

              {p.errors.global && <p className="pfm-error sm:col-span-2">{p.errors.global}</p>}
            </div>
          </div>

          {/* Right Side: Image + Social */}
          <div className="bg-white border border-[#BDBDBD] rounded-2xl shadow-sm p-4 flex flex-col">
            <div className="rounded-xl overflow-hidden mb-4 flex-1 min-h-[260px] bg-[#F0F0F0]">
              <img src={teamDefaultImg} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-800 font-medium text-sm">Follow us :</span>
              <a href="#" className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <img src={youtubeIcon} alt="YouTube" className="w-full h-full object-cover" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <img src={facebookIcon} alt="Facebook" className="w-full h-full object-cover" />
              </a>
              <a href="#" className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <img src={instagramIcon} alt="Instagram" className="w-full h-full object-cover" />
              </a>
            </div>
          </div>
        </div>

        {/* Edit / Save Button — the single toggle for the whole form */}
        <div className="flex justify-center mt-6">
          {isEditMode ? (
            <button
              type="button"
              onClick={() => void p.handleUpdate()}
              disabled={p.isLoading}
              className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold tracking-wide px-8 py-3 rounded-lg shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {p.isLoading ? "SAVING..." : p.saveSuccess ? "SAVED!" : "SAVE PROFILE DATA"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnterEditMode}
              className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold tracking-wide px-8 py-3 rounded-lg shadow-sm cursor-pointer"
            >
              EDIT PROFILE
            </button>
          )}
        </div>
      </div>

      {/* Guardian Info — shown for users under 18 */}
      {(isMinor || (eligibility && eligibility.requiresGuardian)) && (
        <div className="max-w-5xl mx-auto mt-6">
          <GuardianForm onSaved={reloadEligibility} />
        </div>
      )}

      {p.isAvatarModalOpen && (
        <AvatarPickerModal
          currentValue={p.rawProfilePhotoValue}
          onClose={p.closeAvatarModal}
          onSelectAvatar={p.handleSelectAvatar}
          onUploadFile={p.handleAvatarChange}
        />
      )}
    </div>
  );
}
