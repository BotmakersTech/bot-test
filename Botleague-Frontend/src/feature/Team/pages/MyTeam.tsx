import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { deleteRobot } from "../../Robots/api/robot.api";
import {
  Users, Bot, Sword, Trophy, Plus, UserPlus, Pencil, Share2,
  MapPin, Globe, BadgeCheck, Building2, CalendarDays, Search,
  CalendarOff, BotOff, Camera, Copy, Check, AlertTriangle,
  Cpu, Hand, SlidersHorizontal, Crosshair, Radio,
  Loader2, DoorOpen, CircleCheckBig, Crown, Eye, Lock, ShieldAlert,
  UserX, Trash2, LogOut, Shield, UserCog, ChevronDown, X,
} from "lucide-react";

import useTeam from "../hooks/useTeam";
import useRobots from "../../Robots/hooks/useRobots";
import CreateRobotForm from "../../Robots/components/CreateRobotFrom";
import { useAppSelector } from "../../../app/hooks";
import Modal from "../../../shared/components/Modal";
import InputField from "../../../shared/components/InputField";
import LocationSelects from "../../../shared/components/LocationSelects";
import PrimaryBtn from "../../../shared/components/PrimaryBtn";
import ProfileIncompleteModal from "../../../shared/components/ProfileIncompleteModal";
import { useProfileComplete } from "../../../shared/hooks/useProfileComplete";
import InviteCard from "../TeamMembership/components/InviteCard";
import useTeamMembership from "../../Team/TeamMembership/hooks/useTeamMembership";
import RobotDetailModal from "../../Robots/components/RobotDetailModal";
import type { TeamRole } from "../../Team/TeamMembership/api/teamMembership.api";
import SponsorPanel from "../components/SponsorPanel";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeamMember {
  id?: string;
  userId: string;
  botleagueId?: string;
  username?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  membershipId?: string;
  teamId?: string;
  teamMemberId?: string;
  teamRole?: string;
  membershipStatus?: string;
}

interface Robot {
  id?: string;
  robotId?: string;
  robotName: string;
  category?: string;
  weightClass?: string;
  controlType?: string;
  description?: string;
  robotCode?: string;
  status?: string;
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  robotIMG?: string;
}

interface Team {
  teamName?: string;
  description?: string;
  institutionName?: string;
  city?: string;
  state?: string;
  country?: string;
  teamCode?: string;
  status?: string;
  logo_Url?: string;
  logoUrl?: string;
  createdBy?: string;
  ownerId?: string;
  captain?: string;
  captainId?: string;
}

interface CurrentUser {
  id?: string;
  _id?: string;
  userId: string;
  botleagueId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  membershipId?: string;
  teamId?: string;
  teamMemberId?: string;
  teamRole?: string;
  membershipStatus?: string;
}

// ─── API Error Parser ─────────────────────────────────────────────────────────
interface ApiError {
  status?: number;
  error?: string;
  path?: string;
  timestamp?: string;
  message?: string;
}

function parseApiError(err: unknown): string {
  if (!err) return "An unexpected error occurred.";

  // Axios error with response data
  const axiosErr = err as any;
  if (axiosErr?.response?.data) {
    const data: ApiError = axiosErr.response.data;
    if (data.error) return data.error;
    if (data.message) return data.message;
  }

  // Error instance with message
  if (err instanceof Error) {
    // Avoid leaking internal "Failed to X" wrappers; prefer the cause
    const cause = (err as any).cause;
    if (cause) return parseApiError(cause);
    return err.message;
  }

  if (typeof err === "string") return err;

  return "An unexpected error occurred.";
}

// ─── Role constants ───────────────────────────────────────────────────────────
const ALL_ROLES: TeamRole[] = ["CAPTAIN", "VICE_CAPTAIN", "MEMBER", "MENTOR"];

// Roles that can manage the team (invite, remove members, edit info, manage robots)
const ADMIN_ROLES  = new Set(["CAPTAIN", "VICE_CAPTAIN"]);
// Only captain can do privileged ops (transfer, assign vice-captain, delete team)
const CAPTAIN_ONLY = new Set(["CAPTAIN"]);

// ─── useTeamRole hook ─────────────────────────────────────────────────────────
function useTeamRole(team: Team | null, teamMemberships: TeamMember[], currentUser: CurrentUser | null) {
  // null = not resolved yet (data still loading) — keeps roleResolved guard working
  const [myRole, setMyRole]             = useState<string | null>(null);
  const [myMembership, setMyMembership] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!team || !currentUser) { setMyRole("MEMBER"); setMyMembership(null); return; }

    const uid     = currentUser.userId || currentUser.id || currentUser._id || "";
    const isOwner = team.createdBy === uid || team.ownerId === uid ||
                    team.captain   === uid || team.captainId === uid;
    const mine    = (teamMemberships ?? []).find(
      (m) => (uid && m.userId === uid) ||
             (currentUser.username   && m.username   === currentUser.username) ||
             (currentUser.botleagueId && m.botleagueId === currentUser.botleagueId)
    );

    setMyMembership(mine || null);

    if (isOwner) { setMyRole("CAPTAIN"); return; }

    const backendRole = mine?.teamRole?.toUpperCase() ?? "MEMBER";
    // Normalise legacy aliases from older frontend versions
    const normalized =
      backendRole === "LEADER" || backendRole === "CO_CAPTAIN" || backendRole === "ADMIN"
        ? "CAPTAIN"
        : backendRole === "VICE_CAPTAIN"
        ? "VICE_CAPTAIN"
        : "MEMBER";

    setMyRole(normalized);
  }, [team, teamMemberships, currentUser]);

  return {
    myRole: myRole ?? "MEMBER",
    myMembership,
    /** Can do everything: invite, remove members, edit team, manage robots */
    isTeamAdmin:    ADMIN_ROLES.has(myRole ?? "MEMBER"),
    /** Strict captain only: transfer captaincy, assign vice-captain */
    isCaptain:      CAPTAIN_ONLY.has(myRole ?? "MEMBER"),
    isViceCaptain:  myRole === "VICE_CAPTAIN",
    /** False while data is still loading — gates the full dashboard render */
    resolved:       myRole !== null,
  };
}

// ─── Error Alert ──────────────────────────────────────────────────────────────
function ErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold">
      <AlertTriangle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 hover:text-red-300 transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-[#fa4715] shrink-0" />;
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────
function RoleBadge({ myRole }: { myRole: string }) {
  const cfg =
    myRole === "CAPTAIN"
      ? { cls: "bg-amber-500/14 border-amber-500/30 text-amber-400", icon: <Crown size={11} />, label: "CAPTAIN" }
      : myRole === "VICE_CAPTAIN"
      ? { cls: "bg-purple-500/14 border-purple-500/30 text-purple-400", icon: <Shield size={11} />, label: "VICE CAPTAIN" }
      : myRole === "MENTOR"
      ? { cls: "bg-blue-500/14 border-blue-500/30 text-blue-400", icon: <Eye size={11} />, label: "MENTOR" }
      : { cls: "bg-[#fa4715]/12 border-[#fa4715]/28 text-[#fa4715]", icon: <Eye size={11} />, label: "MEMBER" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── ReadOnlyBanner ───────────────────────────────────────────────────────────
function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2.5 bg-amber-400/12 border border-amber-400/28 rounded-xl px-4 py-3 mb-5">
      <Eye size={16} className="text-amber-400 shrink-0" />
      <span className="text-amber-400 text-sm font-semibold">
        View-only access — only the team captain can edit team info, invite members, or manage robots.
      </span>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold mb-1.5 tracking-wider uppercase">{label}</label>
      {children}
    </div>
  );
}

// ─── inputCls ─────────────────────────────────────────────────────────────────
const inputCls = "w-full bg-black/30 border border-white/9 rounded-xl px-4 py-3 text-white text-sm outline-none font-inherit transition-colors focus:border-[#fa4715]/28 box-border";

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold border ${
      accent
        ? "bg-[#fa4715]/12 border-[#fa4715]/28 text-[#fa4715]"
        : "bg-white/7 border-white/9 text-gray-300"
    }`}>
      {children}
    </span>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({
  icon: Icon, label, onClick, accent = false, small = false, disabled = false,
}: {
  icon?: React.ElementType; label: string; onClick?: () => void;
  accent?: boolean; small?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? "Only the captain can do this" : undefined}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all whitespace-nowrap leading-none border ${
        small ? "px-3.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      } ${
        disabled
          ? "bg-white/3 border-white/5 text-gray-500 cursor-not-allowed opacity-45"
          : accent
          ? "bg-[#fa4715] border-transparent text-white hover:bg-[#fa4715]/88 cursor-pointer"
          : "bg-white/6 border-white/9 text-white hover:bg-white/10 cursor-pointer"
      }`}
    >
      {disabled ? <Lock size={small ? 11 : 13} /> : Icon && <Icon size={small ? 13 : 15} />}
      {label}
    </button>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-black/25 border border-white/9 rounded-[18px] p-5 hover:border-[#fa4715]/38 transition-colors">
      <div className="text-gray-400 mb-1.5"><Icon size={18} /></div>
      <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1.5">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

// ─── CATEGORY / CONTROL ICONS ─────────────────────────────────────────────────
const CATEGORY_ICON: Record<string, React.ElementType> = { COMBAT: Sword, DRONE: Radio, RC: Crosshair, AUTONOMOUS: Bot };
const CONTROL_ICON: Record<string, React.ElementType> = { MANUAL: Hand, AUTONOMOUS: Cpu, HYBRID: SlidersHorizontal };

// ─── RobotCard ────────────────────────────────────────────────────────────────
function RobotCard({ robot, onClick, isCaptain, onDelete }: {
  robot: Robot; onClick: () => void; isCaptain: boolean; onDelete?: (robot: Robot) => void;
}) {
  const [hov, setHov] = useState(false);
  const CatIcon = CATEGORY_ICON[robot.category ?? ""] || Bot;
  const CtrlIcon = CONTROL_ICON[robot.controlType ?? ""] || Bot;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`relative overflow-hidden rounded-[18px] p-5 cursor-pointer transition-all border ${
        hov ? "bg-[#fa4715]/6 border-[#fa4715]/38" : "bg-black/25 border-white/9"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fa4715]" />
      {isCaptain && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(robot); }}
          title="Remove robot"
          className={`absolute top-3.5 right-3.5 bg-red-500/12 border border-red-500/28 text-red-400 w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer p-0 transition-opacity ${hov ? "opacity-100" : "opacity-0"}`}
        >
          <Trash2 size={13} />
        </button>
      )}
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="w-[52px] h-[52px] rounded-[14px] bg-[#fa4715]/12 border border-[#fa4715]/28 flex items-center justify-center shrink-0 text-[#fa4715]">
          <CatIcon size={22} />
        </div>
        <div>
          <h3 className="text-white m-0 text-base font-bold">{robot.robotName}</h3>
          <p className="text-gray-400 m-0 mt-0.5 text-xs">{robot.category}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {robot.weightClass && <Pill>{robot.weightClass}</Pill>}
        {robot.controlType && <Pill><CtrlIcon size={12} /> {robot.controlType}</Pill>}
      </div>
      {robot.description && (
        <p className="text-gray-500 text-xs mt-2.5 leading-relaxed line-clamp-2">{robot.description}</p>
      )}
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, children, onClick }: { icon: React.ElementType; children: React.ReactNode; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-sm ${onClick ? "text-[#fa4715] cursor-pointer" : "text-gray-300"}`}
    >
      <Icon size={14} className={onClick ? "text-[#fa4715]" : "text-gray-400"} />
      {children}
    </span>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({ title, icon: Icon, action, children }: {
  title: string; icon?: React.ElementType; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#343434] rounded-[20px] p-6 border border-white/9">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold m-0 flex items-center gap-2 text-white">
          {Icon && <Icon size={18} className="text-gray-400" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, cta, onCta }: { icon: React.ElementType; message: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="text-gray-500 mb-3 flex justify-center"><Icon size={40} /></div>
      <p className="text-gray-400 mb-4 text-sm">{message}</p>
      {cta && (
        <button onClick={onCta} className="bg-[#fa4715] border-none text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm hover:bg-[#fa4715]/88 transition-colors">
          {cta}
        </button>
      )}
    </div>
  );
}

// ─── EditTeamModal ────────────────────────────────────────────────────────────
function EditTeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { handleUpdateTeam } = useTeam();
  const [teamName, setTeamName] = useState(team?.teamName || "");
  const [description, setDescription] = useState(team?.description || "");
  const [institutionName, setInstitutionName] = useState(team?.institutionName || "");
  const [city, setCity] = useState(team?.city || "");
  const [state, setState] = useState(team?.state || "");
  const [country, setCountry] = useState(team?.country || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await handleUpdateTeam({ teamName, description, institutionName, city, state, country });
      setSaved(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Team Info" onClose={onClose}>
      {saved ? (
        <div className="text-center py-6 text-green-400 text-base font-semibold flex items-center justify-center gap-2">
          <CircleCheckBig size={22} /> Team info updated!
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <InputField label="Team Name" placeholder="Team Name" value={teamName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamName(e.target.value)} />
          <InputField label="Institution Name" placeholder="e.g. TechNova Institute" value={institutionName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInstitutionName(e.target.value)} />
          <LocationSelects
            country={country}
            state={state}
            city={city}
            onCountry={setCountry}
            onState={setState}
            onCity={setCity}
            gridStyle={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}
          />
          <Field label="Description">
            <textarea placeholder="Team description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-y min-h-[100px]`} />
          </Field>
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          <PrimaryBtn onClick={handleSave} disabled={saving}>
            {saving ? <span className="flex items-center gap-2"><Spinner size={15} /> Saving...</span> : "Save Changes"}
          </PrimaryBtn>
        </div>
      )}
    </Modal>
  );
}

// ─── ShareCodeModal ───────────────────────────────────────────────────────────
function ShareCodeModal({ teamCode, onClose }: { teamCode: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal title="Share Team Code" onClose={onClose}>
      <p className="text-gray-400 mb-5 text-sm">Share this code with others so they can join your team.</p>
      <div className="bg-[#fa4715]/12 border border-dashed border-[#fa4715]/28 rounded-[14px] p-5 text-center mb-5">
        <div className="text-3xl font-bold tracking-[0.15em] text-[#fa4715] font-mono">{teamCode}</div>
      </div>
      <PrimaryBtn onClick={handleCopy}>
        {copied
          ? <span className="flex items-center gap-1.5"><Check size={16} /> Copied!</span>
          : <span className="flex items-center gap-1.5"><Copy size={16} /> Copy Code</span>
        }
      </PrimaryBtn>
    </Modal>
  );
}

// ─── RemoveMemberModal ────────────────────────────────────────────────────────
function RemoveMemberModal({ member, onConfirm, onClose }: {
  member: TeamMember;
  onConfirm: (member: TeamMember) => Promise<void>;
  onClose: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!member?.userId && !member?.id) { setError("No member selected for removal"); return; }
    try {
      setError(null);
      setRemoving(true);
      await onConfirm(member);
      onClose();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setRemoving(false);
    }
  };

  const displayName = member?.userName || member?.username ||
    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() || "this member";

  return (
    <Modal title="Remove Member" onClose={onClose}>
      <div className="text-center pt-2 pb-5">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/28 flex items-center justify-center mx-auto mb-4 text-red-400">
          <UserX size={28} />
        </div>
        <p className="text-gray-300 text-sm mb-2">
          Remove <strong className="text-white">{displayName}</strong> from the team?
        </p>
        <p className="text-gray-500 text-xs mb-2">This action cannot be undone.</p>
        {error && <div className="mb-4"><ErrorAlert message={error} onDismiss={() => setError(null)} /></div>}
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={onClose} disabled={removing} className="bg-white/6 border border-white/9 text-gray-300 px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={removing} className="bg-red-400 border-none text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm flex items-center gap-1.5 disabled:opacity-70">
            <UserX size={15} />
            {removing ? "Removing..." : "Remove Member"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── AssignRoleModal ──────────────────────────────────────────────────────────
function AssignRoleModal({ member, onConfirm, onClose }: {
  member: TeamMember;
  onConfirm: (userId: string, role: TeamRole) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<TeamRole>((member.teamRole as TeamRole) || "MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAssign = async () => {
    const userId = member.userId || member.id;
    if (!userId) { setError("Member ID not found"); return; }
    try {
      setError(null);
      setLoading(true);
      await onConfirm(userId, selectedRole);
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const displayName = member?.userName || member?.username ||
    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() || "Member";

  const roleLabels: Record<TeamRole, { label: string; desc: string }> = {
    CAPTAIN:      { label: "Captain",      desc: "Full control over the team" },
    VICE_CAPTAIN: { label: "Vice Captain", desc: "Assist captain, limited admin" },
    MEMBER:       { label: "Member",       desc: "Standard team member" },
    MENTOR:       { label: "Mentor",       desc: "Advisory role, read-only" },
  };

  return (
    <Modal title="Assign Role" onClose={onClose}>
      {success ? (
        <div className="text-center py-6 text-green-400 font-semibold flex items-center justify-center gap-2">
          <CircleCheckBig size={22} /> Role updated for {displayName}!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-gray-400 text-sm">
            Assign a new role to <strong className="text-white">{displayName}</strong>
          </p>
          <div className="flex flex-col gap-2">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === role
                    ? "bg-[#fa4715]/12 border-[#fa4715]/28 text-[#fa4715]"
                    : "bg-white/4 border-white/9 text-gray-300 hover:bg-white/8"
                }`}
              >
                <Shield size={16} className={selectedRole === role ? "text-[#fa4715]" : "text-gray-500"} />
                <div>
                  <div className="font-semibold text-sm">{roleLabels[role].label}</div>
                  <div className="text-xs text-gray-500">{roleLabels[role].desc}</div>
                </div>
                {selectedRole === role && <Check size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          <button
            onClick={handleAssign}
            disabled={loading}
            className="bg-[#fa4715] text-white border-none py-3 px-6 rounded-[14px] font-bold text-sm cursor-pointer hover:bg-[#fa4715]/88 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size={15} /> Assigning...</> : <><Shield size={15} /> Assign Role</>}
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── TransferCaptainModal ─────────────────────────────────────────────────────
function TransferCaptainModal({ member, onConfirm, onClose }: {
  member: TeamMember;
  onConfirm: (userId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTransfer = async () => {
    const userId = member.userId || member.id;
    if (!userId) { setError("Member ID not found"); return; }
    try {
      setError(null);
      setLoading(true);
      await onConfirm(userId);
      setSuccess(true);
      setTimeout(onClose, 1600);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const displayName = member?.userName || member?.username ||
    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() || "this member";

  return (
    <Modal title="Transfer Captaincy" onClose={onClose}>
      {success ? (
        <div className="text-center py-6 text-amber-400 font-semibold flex items-center justify-center gap-2">
          <Crown size={22} /> Captaincy transferred to {displayName}!
        </div>
      ) : (
        <div className="text-center pt-2 pb-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/14 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Crown size={28} />
          </div>
          <p className="text-gray-300 text-sm mb-1">
            Transfer captaincy to <strong className="text-white">{displayName}</strong>?
          </p>
          <p className="text-gray-500 text-xs mb-4">You will become a regular member after this transfer.</p>
          {error && <div className="mb-4"><ErrorAlert message={error} onDismiss={() => setError(null)} /></div>}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={onClose} disabled={loading} className="bg-white/6 border border-white/9 text-gray-300 px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm disabled:opacity-50">Cancel</button>
            <button onClick={handleTransfer} disabled={loading} className="bg-amber-500 border-none text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm flex items-center gap-1.5 disabled:opacity-70">
              <Crown size={15} />
              {loading ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── LeaveTeamModal ───────────────────────────────────────────────────────────
function LeaveTeamModal({ onConfirm, onClose }: {
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    try {
      setError(null);
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Leave Team" onClose={onClose}>
      <div className="text-center pt-2 pb-5">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/28 flex items-center justify-center mx-auto mb-4 text-red-400">
          <LogOut size={28} />
        </div>
        <p className="text-gray-300 text-sm mb-2">Are you sure you want to leave this team?</p>
        <p className="text-gray-500 text-xs mb-4">You will lose access to all team resources.</p>
        {error && <div className="mb-4"><ErrorAlert message={error} onDismiss={() => setError(null)} /></div>}
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={onClose} disabled={loading} className="bg-white/6 border border-white/9 text-gray-300 px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm disabled:opacity-50">Cancel</button>
          <button onClick={handleLeave} disabled={loading} className="bg-red-400 border-none text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm flex items-center gap-1.5 disabled:opacity-70">
            <LogOut size={15} />
            {loading ? "Leaving..." : "Leave Team"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── MemberActions dropdown ───────────────────────────────────────────────────
function MemberActionsMenu({ member, isTeamAdmin, isStrictCaptain, onRemove, onAssignRole, onTransferCaptain }: {
  member: TeamMember;
  isTeamAdmin:     boolean;  // captain OR vice captain — can manage members
  isStrictCaptain: boolean;  // captain only — can transfer captaincy
  onRemove: (m: TeamMember) => void;
  onAssignRole: (m: TeamMember) => void;
  onTransferCaptain: (m: TeamMember) => void;
}) {
  const [open, setOpen] = useState(false);
  const memberRole = member.teamRole?.toUpperCase() ?? "";
  const isMemberCaptain    = memberRole === "CAPTAIN";
  const isMemberViceCaptain = memberRole === "VICE_CAPTAIN";

  // Hide if current user has no management access, or if target is the captain
  if (!isTeamAdmin || isMemberCaptain) return null;
  // Vice captains cannot manage other vice captains
  if (!isStrictCaptain && isMemberViceCaptain) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="bg-white/6 border border-white/9 text-gray-400 w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer p-0 hover:bg-white/10 transition-colors"
      >
        <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-[#2e2e2e] border border-white/9 rounded-xl shadow-2xl py-1 min-w-[170px]">
            <button
              onClick={() => { setOpen(false); onAssignRole(member); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/7 cursor-pointer transition-colors"
            >
              <UserCog size={14} className="text-[#fa4715]" /> Assign Role
            </button>
            {isStrictCaptain && (
              <button
                onClick={() => { setOpen(false); onTransferCaptain(member); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/7 cursor-pointer transition-colors"
              >
                <Crown size={14} className="text-amber-400" /> Transfer Captain
              </button>
            )}
            <div className="h-px bg-white/9 mx-2 my-1" />
            <button
              onClick={() => { setOpen(false); onRemove(member); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/8 cursor-pointer transition-colors"
            >
              <UserX size={14} /> Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MyTeams() {
  const currentUser = useAppSelector(
    (state: any) => state.auth?.user || state.user?.user || state.user
  ) as CurrentUser | null;

  const team1 = useAppSelector((state: any) => state.team);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

  const navigate = useNavigate();
  const { team, isLoading } = useTeam();

  // Profile completion gate
  const { isComplete: profileComplete, missingFields } = useProfileComplete();
  const [showProfileGate, setShowProfileGate]   = useState(false);
  const [gateAction,      setGateAction]         = useState<"create a team" | "join a team">("create a team");

  const handleCreateTeamClick = () => {
    if (!profileComplete) { setGateAction("create a team"); setShowProfileGate(true); return; }
    navigate("/create-team");
  };

  const handleJoinTeamClick = () => {
    if (!profileComplete) { setGateAction("join a team"); setShowProfileGate(true); return; }
    navigate("/join-team");
  };
  const { robots, loading: robotsLoading, error: robotsError } = useRobots(team1?.teamCode);

  const {
    members: teamMemberships,
    removeMember: removeMemberFn,
    assignRole: assignRoleFn,
    transferCaptain: transferCaptainFn,
    leaveTeam: leaveTeamFn,
    reload: reloadMemberships,
    actionLoading,
  } = useTeamMembership(team1?.teamCode);

  // ── Local state ───────────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [assigningRoleMember, setAssigningRoleMember] = useState<TeamMember | null>(null);
  const [transferringCaptainMember, setTransferringCaptainMember] = useState<TeamMember | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { myRole, isCaptain, isViceCaptain, isTeamAdmin, resolved: roleResolved } = useTeamRole(team, teamMemberships, currentUser);

  // ── Action wrappers with error extraction ─────────────────────────────────
  const handleRemoveMember = useCallback(async (member: TeamMember): Promise<void> => {
    if (!isTeamAdmin) return;  // captain OR vice captain
    const memberId = member.userId || member.id;
    if (!memberId) throw new Error("Member ID not found");
    try {
      await removeMemberFn(memberId);
      await reloadMemberships();
    } catch (err) {
      throw new Error(parseApiError(err), { cause: err });
    }
  }, [isTeamAdmin, removeMemberFn, reloadMemberships]);

  const handleAssignRole = useCallback(async (userId: string, role: TeamRole): Promise<void> => {
    if (!isTeamAdmin) return;  // captain OR vice captain (backend validates further)
    try {
      await assignRoleFn(userId, role);
      await reloadMemberships();
    } catch (err) {
      throw new Error(parseApiError(err), { cause: err });
    }
  }, [isTeamAdmin, assignRoleFn, reloadMemberships]);

  const handleTransferCaptain = useCallback(async (userId: string): Promise<void> => {
    if (!isCaptain) return;  // CAPTAIN only
    try {
      await transferCaptainFn(userId);
      await reloadMemberships();
    } catch (err) {
      throw new Error(parseApiError(err), { cause: err });
    }
  }, [isCaptain, transferCaptainFn, reloadMemberships]);

  const handleLeaveTeam = useCallback(async (): Promise<void> => {
    try {
      await leaveTeamFn();
      navigate("/");
    } catch (err) {
      throw new Error(parseApiError(err), { cause: err });
    }
  }, [leaveTeamFn, navigate]);

  const handleDeleteRobot = useCallback(async (robot: Robot) => {
    if (!isTeamAdmin) return;  // captain OR vice captain
    const robotId = robot.id ?? robot.robotId;
    if (!robotId) return;
    try {
      await deleteRobot(robotId);
    } catch (err) {
      setGlobalError(parseApiError(err));
    }
  }, [isTeamAdmin]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#282727] text-white">
        <div className="text-center">
          <Spinner size={44} />
          <span className="text-gray-400 text-sm block mt-4">Loading team...</span>
        </div>
      </div>
    );
  }

  // ── No team ───────────────────────────────────────────────────────────────
  if (team?.status === "NO_TEAM") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#282727] text-white p-6">
        <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#434343] to-[#2a2a2a] flex items-center justify-center text-gray-400 mb-7 border border-white/9 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Users size={44} />
        </div>
        <h1 className="text-3xl font-bold mb-2.5 tracking-wider">No Team Found</h1>
        <p className="text-gray-400 mb-9 text-sm text-center max-w-sm leading-relaxed">
          You're not part of any team yet. Create your own team or join an existing one to start competing.
        </p>
        {/* Profile gate modal */}
        {showProfileGate && (
          <ProfileIncompleteModal
            missingFields={missingFields}
            action={gateAction}
            onClose={() => setShowProfileGate(false)}
          />
        )}

        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={handleCreateTeamClick} className="bg-[#fa4715] border-none text-white px-7 py-3.5 rounded-[18px] cursor-pointer font-bold text-sm inline-flex items-center gap-2 shadow-[0_4px_20px_rgba(250,71,21,0.35)] hover:opacity-88 transition-opacity">
            <Plus size={18} /> Create Team
          </button>
          <button onClick={handleJoinTeamClick} className="bg-white/6 border border-white/9 text-white px-7 py-3.5 rounded-[18px] cursor-pointer font-bold text-sm inline-flex items-center gap-2 hover:bg-white/10 hover:border-[#fa4715]/38 transition-all">
            <DoorOpen size={18} /> Join Team
          </button>
        </div>
      </div>
    );
  }

  if (!roleResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#282727] text-white">
        <Spinner size={36} />
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const typedTeam = team as Team;
  const teamName = typedTeam.teamName || "Team Name";
  const description = typedTeam.description || "No description provided.";
  const institution = typedTeam.institutionName || "—";
  const city = typedTeam.city || "—";
  const state = typedTeam.state || "—";
  const country = typedTeam.country || "—";
  const teamCode = typedTeam.teamCode || "—";
  const status = typedTeam.status || "ACTIVE";
  const logoUrl = typedTeam.logoUrl || typedTeam.logo_Url || null;
  const memberCount = teamMemberships.length;
  const logoInitial = teamName.charAt(0).toUpperCase();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white bg-[#282727] p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-44 -right-44 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(250,71,21,0.1),transparent_70%)] pointer-events-none" />

      <div className="relative z-10">

        {/* ── GLOBAL ERROR ─────────────────────────────────────────────── */}
        {globalError && (
          <div className="mb-4">
            <ErrorAlert message={globalError} onDismiss={() => setGlobalError(null)} />
          </div>
        )}

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3.5 mb-2">
              <h1 className="text-3xl font-bold tracking-wider m-0">TEAM DASHBOARD</h1>
              <RoleBadge myRole={myRole} />
            </div>
            <p className="text-gray-400 text-sm m-0">
              {isCaptain
                ? "You have full captain access — manage your team, robots, and members."
                : isViceCaptain
                ? "You have vice captain access — invite members, manage robots, and edit team info."
                : "Welcome back! You're viewing your team's information."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isTeamAdmin ? (
              <>
                <ActionBtn icon={UserPlus} label="Invite Member" onClick={() => setActiveModal("invite")} accent />
                <ActionBtn icon={Bot} label="Add Robot" onClick={() => setActiveModal("robot")} />
                <ActionBtn icon={Pencil} label="Edit Team" onClick={() => setActiveModal("edit")} />
                <ActionBtn icon={Share2} label="Share Code" onClick={() => setActiveModal("share")} />
              </>
            ) : (
              <>
                <ActionBtn icon={Share2} label="Share Code" onClick={() => setActiveModal("share")} />
                <ActionBtn icon={LogOut} label="Leave Team" onClick={() => setActiveModal("leave")} />
              </>
            )}
          </div>
        </div>

        {/* ── READ-ONLY NOTICE ─────────────────────────────────────────── */}
        {!isTeamAdmin && <ReadOnlyBanner />}

        {/* ── TEAM CARD ────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#434343] to-[#262626] border border-white/9 rounded-[24px] p-8 mb-7 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-start flex-wrap gap-7">
            {/* Logo */}
            <div className="shrink-0">
              {logoUrl && !logoError ? (
                <img src={logoUrl} alt={teamName} onError={() => setLogoError(true)}
                  className="w-[130px] h-[130px] rounded-[28px] object-cover border-2 border-[#fa4715]/28" />
              ) : (
                <div className="w-[130px] h-[130px] rounded-[28px] bg-[#fa4715] flex items-center justify-center text-5xl font-bold text-white">
                  {logoInitial}
                </div>
              )}
              {isTeamAdmin && (
                <button
                  onClick={() => alert("Upload logo coming soon!")}
                  className="mt-2.5 w-[130px] bg-white/6 border border-white/9 text-gray-400 py-1.5 rounded-[10px] cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors"
                >
                  <Camera size={13} /> Upload Logo
                </button>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-3.5 flex-wrap">
                <h2 className="text-4xl font-bold m-0">{teamName}</h2>
                <span className="bg-green-400/14 text-green-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider">{status}</span>
                {isCaptain && (
                  <span className="bg-amber-500/14 text-amber-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1">
                    <Crown size={11} /> Captain
                  </span>
                )}
                {isViceCaptain && (
                  <span className="bg-purple-500/14 text-purple-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1">
                    <Shield size={11} /> Vice Captain
                  </span>
                )}
              </div>

              <p className="text-[#c5c5c5] mt-3.5 leading-7 max-w-[780px] text-sm">{description}</p>

              <div className="flex flex-wrap gap-4 mt-5">
                <InfoRow icon={Building2}>{institution}</InfoRow>
                <InfoRow icon={MapPin}>{city}, {state}</InfoRow>
                <InfoRow icon={Globe}>{country}</InfoRow>
                <InfoRow icon={BadgeCheck} onClick={() => setActiveModal("share")}>{teamCode}</InfoRow>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5">
                <ActionBtn icon={CalendarDays} label="Register Event" onClick={() => navigate("/events")} />
                {isTeamAdmin && <ActionBtn icon={Pencil} label="Edit Info" onClick={() => setActiveModal("edit")} />}
                {!isTeamAdmin && <ActionBtn icon={LogOut} label="Leave Team" onClick={() => setActiveModal("leave")} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 mb-7">
          <StatCard icon={Users} label="Members" value={String(memberCount).padStart(2, "0")} />
          <StatCard icon={Bot} label="Robots" value={String(robots?.length || 0).padStart(2, "0")} />
          <StatCard icon={Sword} label="Matches" value="00" />
          <StatCard icon={Trophy} label="Win Rate" value="0%" />
        </div>

        {/* ── MEMBERS + EVENTS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {/* Members panel */}
          <Panel
            title="Team Members"
            icon={Users}
            action={
              isTeamAdmin ? (
                <ActionBtn icon={UserPlus} label="Invite" small accent onClick={() => setActiveModal("invite")} />
              ) : null
            }
          >
            {teamMemberships.length ? (
              teamMemberships.map((member) => {
                const mRole = member.teamRole?.toUpperCase() ?? "";
                const avatarColor = mRole === "CAPTAIN" ? "bg-amber-500" : mRole === "VICE_CAPTAIN" ? "bg-purple-500" : "bg-[#fa4715]";
                const avatarIcon = mRole === "CAPTAIN" ? <Crown size={16} /> : mRole === "VICE_CAPTAIN" ? <Shield size={16} /> : (member.teamRole?.charAt(0)?.toUpperCase() || "T");
                return (
                <div key={member.userId} className="flex items-center justify-between py-3 border-b border-white/9 last:border-b-0">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base text-white shrink-0 ${avatarColor}`}>
                      {avatarIcon}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {member.username ||
                          `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unknown"}
                      </div>
                      <div className="text-gray-400 text-xs">{member.teamRole?.replace("_", " ")}</div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                      <BadgeCheck size={13} /> Active
                    </span>
                    {actionLoading ? (
                      <Spinner size={16} />
                    ) : (
                      <MemberActionsMenu
                        member={member}
                        isTeamAdmin={isTeamAdmin}
                        isStrictCaptain={isCaptain}
                        onRemove={setRemovingMember}
                        onAssignRole={setAssigningRoleMember}
                        onTransferCaptain={setTransferringCaptainMember}
                      />
                    )}
                  </div>
                </div>
              )})
            ) : (
              <EmptyState
                icon={Users}
                message="No members yet"
                cta={isTeamAdmin ? "Invite Your First Member" : undefined}
                onCta={isTeamAdmin ? () => setActiveModal("invite") : undefined}
              />
            )}
          </Panel>

          {/* Events panel */}
          <Panel
            title="Upcoming Events"
            icon={CalendarDays}
            action={<ActionBtn icon={Search} label="Browse" small onClick={() => navigate("/events")} />}
          >
            <EmptyState
              icon={CalendarOff}
              message="No upcoming events registered"
              cta="Register for an Event"
              onCta={() => navigate("/events")}
            />
          </Panel>
        </div>

        {/* ── ROBOTS PANEL ─────────────────────────────────────────────── */}
        <div className="mt-5">
          <Panel
            title="Robots"
            icon={Bot}
            action={isTeamAdmin
              ? <ActionBtn icon={Plus} label="Add Robot" small accent onClick={() => setActiveModal("robot")} />
              : null}
          >
            {robotsLoading && (
              <div className="text-center py-7 text-gray-400 flex flex-col items-center gap-3">
                <Spinner size={30} />
                <span className="text-sm">Loading robots...</span>
              </div>
            )}

            {robotsError && !robotsLoading && (
              <ErrorAlert message={parseApiError(robotsError)} />
            )}

            {!robotsLoading && !robotsError && robots?.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
                {robots.map((robot: Robot) => (
                  <RobotCard
                    key={robot.id ?? robot.robotId}
                    robot={robot}
                    isCaptain={isTeamAdmin}
                    onClick={() => setSelectedRobot(robot as any)}
                    onDelete={handleDeleteRobot}
                  />
                ))}
              </div>
            )}

            {!robotsLoading && !robotsError && (!robots || robots.length === 0) && (
              <EmptyState
                icon={BotOff}
                message="No robots registered yet"
                cta={isTeamAdmin ? "Register Your First Robot" : undefined}
                onCta={isTeamAdmin ? () => setActiveModal("robot") : undefined}
              />
            )}
          </Panel>
        </div>

        {/* ── SPONSORS PANEL ───────────────────────────────────────────── */}
        <SponsorPanel teamId={team1?.id ?? null} isCaptain={isTeamAdmin} />
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Captain OR Vice Captain can invite, add robot, edit team */}
      {activeModal === "invite" && isTeamAdmin && (
        <InviteCard onClose={() => setActiveModal(null)} teamCode={typedTeam.teamCode ?? ""} />
      )}

      {activeModal === "robot" && isTeamAdmin && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80">
          <button
            onClick={() => setActiveModal(null)}
            className="fixed top-4 right-4 z-60 bg-white/10 border border-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <CreateRobotForm onSuccess={() => setActiveModal(null)} />
        </div>
      )}

      {activeModal === "edit" && isTeamAdmin && (
        <EditTeamModal team={typedTeam} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === "share" && (
        <ShareCodeModal teamCode={teamCode} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === "leave" && !isTeamAdmin && (
        <LeaveTeamModal onConfirm={handleLeaveTeam} onClose={() => setActiveModal(null)} />
      )}

      {/* Captain OR Vice Captain can remove members and assign roles */}
      {removingMember && isTeamAdmin && (
        <RemoveMemberModal
          member={removingMember}
          onConfirm={handleRemoveMember}
          onClose={() => setRemovingMember(null)}
        />
      )}

      {assigningRoleMember && isTeamAdmin && (
        <AssignRoleModal
          member={assigningRoleMember}
          onConfirm={handleAssignRole}
          onClose={() => setAssigningRoleMember(null)}
        />
      )}

      {/* Transfer captain = CAPTAIN only */}
      {transferringCaptainMember && isCaptain && (
        <TransferCaptainModal
          member={transferringCaptainMember}
          onConfirm={handleTransferCaptain}
          onClose={() => setTransferringCaptainMember(null)}
        />
      )}

      {selectedRobot && (
        <RobotDetailModal robot={selectedRobot as any} onClose={() => setSelectedRobot(null)} />
      )}

      {/* Safety net — member-only restricted modal */}
      {activeModal && !isTeamAdmin && !["share", "leave"].includes(activeModal) && (
        <Modal title="Access Restricted" onClose={() => setActiveModal(null)}>
          <div className="text-center pt-4 pb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/28 flex items-center justify-center mx-auto mb-4 text-red-400">
              <ShieldAlert size={28} />
            </div>
            <p className="text-gray-300 text-sm mb-1.5">Only the captain or vice captain can perform this action.</p>
            <p className="text-gray-500 text-xs">Contact your team admin to make changes.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}