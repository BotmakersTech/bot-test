// features/Dashboard/pages/UserDashboard.tsx
import { useState, useCallback, useMemo, type ReactNode, type FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, Share2, PenLine, CalendarDays, Swords, Trophy, Medal, Shield,
  Bot, Wrench, Users, Crown, MapPin, Clock, Check, X, Bell, BellDot, Inbox,
  MailOpen, ChevronRight, ChevronDown, AlertCircle, CheckCircle2, AlertTriangle,
  Info, LogOut, Activity, Loader2, Hash,
  CalendarClock, MessageSquare,
} from "lucide-react";

import { acceptInvitation, declineInvitation } from "../api/userMembership.api";
import useDashboard, { type EventView, type MatchView } from "../hooks/useDashboardData";
import CategoryBadge from "../../../shared/components/CategoryBadge";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import ProfileIncompleteModal from "../../../shared/components/ProfileIncompleteModal";
import { useProfileComplete } from "../../../shared/hooks/useProfileComplete";

const CARD = "rounded-2xl border border-white/[0.11] bg-[radial-gradient(circle,_#272525_0%,_#151516_100%)] f gap-5 items-center p-5";
const numStyle = { fontFamily: "Orbitron", monospace: true } as const;
const mochachive="https://media.botleague.in/achive/pngtree-achievement-badge-png-image_14480644.png"; // base url for achievement icons

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;
const isExpired = (iso?: string | null) => !!iso && new Date(iso) < new Date();
const upper = (s?: string | null) => (s || "").toUpperCase();
const title = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
function statusClasses(s?: string) {
  switch (upper(s)) {
    case "ACCEPTED": case "ACTIVE": case "APPROVED":
    case "REGISTERED": case "PUBLISHED": case "COMPLETED": case "WIN":
      return "text-emerald-400 bg-emerald-500/10 ring-emerald-500/25";
    case "PENDING": case "UPCOMING": case "SCHEDULED": case "DRAFT":
      return "text-amber-400 bg-amber-500/10 ring-amber-500/25";
    case "DECLINED": case "CANCELLED": case "LEFT": case "LOSS":
      return "text-rose-400 bg-rose-500/10 ring-rose-500/25";
    case "ONGOING":
      return "text-[#df4a21] bg-[#df4a21]/10 ring-[#df4a21]/30";
    default:
      return "text-neutral-400 bg-white/5 ring-white/10";
  }
}

/* ─── primitives ───────────────────────────────────────────────────────── */
function Pill({ children, status, className = "" }: { children: ReactNode; status?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[1rem] font-bold ring-1 ${status ? statusClasses(status) : ""} ${className}`}>
      {children}
    </span>
  );
}

type BtnVariant = "accent" | "ghost" | "success" | "danger";
function Button({
  children, onClick, variant = "ghost", icon: Icon, disabled, loading, small,
}: { children: ReactNode; onClick?: () => void; variant?: BtnVariant; icon?: FC<any>; disabled?: boolean; loading?: boolean; small?: boolean }) {
  const dis = disabled || loading;
  const base = "inline-flex items-center justify-center gap-1.5 rounded-md font-bold transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const size = small ? "px-3.5 py-1 text-[0.78rem]" : "px-4 py-2 text-[0.82rem]";
  const skin: Record<BtnVariant, string> = {
    accent:  "text-white bg-gradient-to-r !from-[#990A00] !to-[#FF1100] hover:opacity-90",
    ghost:   "text-neutral-100 bg-white/5 ring-1 ring-white/10 hover:bg-white/[0.09]",
    success: "text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:bg-emerald-500/15",
    danger:  "text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/15",
  };
  return (
    <button onClick={onClick} disabled={dis} className={`${base} ${size} ${skin[variant]}`}>
      {loading ? <Loader2 size={small ? 13 : 15} className="animate-spin" /> : Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

function SectionHead({ icon: Icon, title: t, action }: { icon: FC<any>; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-neutral-100">
        <Icon size={13} /> {t}
      </h3>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title: t, sub, action }: { icon: FC<any>; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 h-[320px] bg-black/10 px-5 py-8 text-center">
      <Icon size={30} className="text-neutral-600" />
      <div className="text-sm font-bold text-neutral-300">{t}</div>
      {sub && <div className="max-w-[260px] text-[0.78rem] leading-relaxed text-neutral-500">{sub}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ─── toasts ───────────────────────────────────────────────────────────── */
type TType = "success" | "error" | "info";
interface Toast { id: number; type: TType; title: string; msg?: string }
const TOAST_SKIN: Record<TType, { icon: FC<any>; cls: string; iconCls: string }> = {
  success: { icon: CheckCircle2, cls: "bg-emerald-500/10 ring-emerald-500/25", iconCls: "text-emerald-400" },
  error:   { icon: AlertCircle,  cls: "bg-rose-500/10 ring-rose-500/25",       iconCls: "text-rose-400"   },
  info:    { icon: Info,         cls: "bg-sky-500/10 ring-sky-500/25",         iconCls: "text-sky-400"    },
};
function useToast() {
  const [toasts, set] = useState<Toast[]>([]);
  const add = useCallback((type: TType, title: string, msg?: string) => {
    const id = Date.now() + Math.random();
    set((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => set((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const rem = useCallback((id: number) => set((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, rem };
}
function Toasts({ toasts, onRem }: { toasts: Toast[]; onRem: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[2000] flex flex-col gap-2.5">
      {toasts.map((t) => {
        const s = TOAST_SKIN[t.type]; const I = s.icon;
        return (
          <div key={t.id} className={`pointer-events-auto flex min-w-[300px] max-w-[380px] items-start gap-3 rounded-2xl px-4 py-3.5 ring-1 backdrop-blur ${s.cls}`}>
            <I size={17} className={`mt-0.5 shrink-0 ${s.iconCls}`} />
            <div className="flex-1">
              <div className="text-[0.86rem] font-bold text-neutral-50">{t.title}</div>
              {t.msg && <div className="mt-0.5 text-[0.78rem] text-neutral-400">{t.msg}</div>}
            </div>
            <button onClick={() => onRem(t.id)} className="shrink-0 text-neutral-500 hover:text-neutral-300"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── leave-team confirm ───────────────────────────────────────────────── */
function ConfirmLeave({ open, teamName, loading, onConfirm, onCancel }: { open: boolean; teamName?: string; loading: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}>
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#1c1c1e] p-7">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30"><AlertTriangle size={18} /></div>
          <div className="text-base font-extrabold text-neutral-50">Leave team</div>
        </div>
        <p className="mb-6 text-[0.88rem] leading-relaxed text-neutral-400">
          Are you sure you want to leave <span className="font-semibold text-neutral-200">{teamName ?? "your team"}</span>? This can&rsquo;t be undone.
        </p>
        <div className="flex justify-end gap-2.5">
          <Button onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} variant="danger" loading={loading} icon={LogOut}>Leave team</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── invitation card ─────────────────────────────────────────────────── */
function InviteCard({ inv, onAccept, onDecline, accepting, declining }: {
  inv: any; onAccept: (id: string) => void; onDecline: (id: string) => void; accepting: string | null; declining: string | null;
}) {
  const id = inv.inviteId || inv.id;
  const expired = isExpired(inv.expiresAt);
  const pending = upper(inv.status) === "PENDING" && !expired;
  const busy = !!(accepting || declining);
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 p-4">
      {pending && <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#fa4715] to-[#f97316]" />}
      <div className="flex items-start gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#df4a21]/15 text-base font-extrabold text-[#df4a21] ring-1 ring-[#df4a21]/25">
          {inv.teamName?.charAt(0)?.toUpperCase() ?? "T"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[0.92rem] font-bold text-neutral-100">{inv.teamName ?? "Team"}</span>
            <Pill status={pending ? "PENDING" : inv.status}>{pending ? "Pending" : title(inv.status)}</Pill>
            {upper(inv.status) === "PENDING" && expired && <Pill>Expired</Pill>}
          </div>
          <div className="mb-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.76rem] text-neutral-400">
            <span>Invited by <span className="font-semibold text-neutral-300">{inv.invitedByName ?? "—"}</span></span>
            {inv.expiresAt && (
              <span className={`flex items-center gap-1 ${expired ? "text-rose-400" : "text-amber-400"}`}>
                <Clock size={11} />{expired ? "Expired" : "Expires"} {fmt(inv.expiresAt)}
              </span>
            )}
          </div>
          {pending && (
            <div className="flex flex-wrap gap-2">
              <Button small variant="success" icon={accepting === id ? undefined : Check} loading={accepting === id} disabled={busy} onClick={() => onAccept(id)}>
                {accepting === id ? "Accepting…" : "Accept"}
              </Button>
              <Button small variant="danger" icon={declining === id ? undefined : X} loading={declining === id} disabled={busy} onClick={() => onDecline(id)}>
                {declining === id ? "Declining…" : "Decline"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── invitations modal ────────────────────────────────────────────────── */
function InvitationsModal({ open, onClose, loading, pending, expired, past, ...handlers }: {
  open: boolean; onClose: () => void; loading: boolean; pending: any[]; expired: any[]; past: any[];
  onAccept: (id: string) => void; onDecline: (id: string) => void; accepting: string | null; declining: string | null;
}) {
  if (!open) return null;
  const groups = [
    { key: "pending", label: `Pending (${pending.length})`, items: pending, icon: BellDot },
    { key: "expired", label: `Expired (${expired.length})`, items: expired, icon: Clock },
    { key: "past",    label: "Past",                        items: past,    icon: Inbox },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-2xl border border-white/[0.08] bg-[#1c1c1e]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2 text-base font-extrabold text-neutral-50"><Bell size={17} className="text-[#df4a21]" /> Invitations</div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-8 text-sm text-neutral-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : groups.length === 0 ? (
            <EmptyState icon={MailOpen} title="No invitations yet" sub="When teams invite you, they'll show up here." />
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <SectionHead icon={g.icon} title={g.label} />
                <div className="space-y-3">
                  {g.items.map((inv: any) => <InviteCard key={inv.inviteId || inv.id} inv={inv} {...handlers} />)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── performance bar ──────────────────────────────────────────────────── */
function PerformanceBar({ wins, losses, pending }: { wins: number; losses: number; pending: number }) {
  const total = wins + losses + pending;
  if (total === 0) return <EmptyState icon={Swords} title="No matches yet" sub="Your win/loss record appears once you play." />;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="bg-[#F44336] transition-all"   style={{ width: pct(losses) }} />
        <div className="bg-[#FFDD55] transition-all"  style={{ width: pct(pending) }} />
        <div className="bg-[#14FE34] transition-all" style={{ width: pct(wins) }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-[#F44336]" /> Loss
          <span className="font-bold text-neutral-100" style={numStyle}>{losses}</span>
        </span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-[#FFDD55]" /> Tie
          <span className="font-bold text-neutral-100" style={numStyle}>{pending}</span>
        </span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-[#14FE34]" /> Win
          <span className="font-bold text-neutral-100" style={numStyle}>{wins}</span>
        </span>
      </div>
    </div>
  );
}

/* ─── achievement tile ─────────────────────────────────────────────────── */
const TIER: Record<string, { ring: string; grad: string; icon: string }> = {
  gold:   { ring: "ring-amber-500/30",  grad: "from-amber-400/20",  icon: "text-amber-400"  },
  silver: { ring: "ring-slate-400/30",  grad: "from-slate-300/20",  icon: "text-slate-300"  },
  bronze: { ring: "ring-orange-700/30", grad: "from-orange-600/20", icon: "text-orange-400" },
};
function Achievement({ a }: { a: { name: string; desc: string; icon: FC<any>; tier: keyof typeof TIER } }) {
  const t = TIER[a.tier];
  return (
   <div
  className={`relative mt-8 flex w-[130px] flex-col items-center rounded-xl bg-gradient-to-b ${t.grad} to-transparent px-3 pb-3 pt-8 text-center ring-1 ${t.ring}`}
  title={a.desc}
>
  {/* Badge Image */}
  <div
    className={`absolute -top-5 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-xl bg-[#1c1c1e] ring-1 ${t.ring}`}
  >
    <img
      src={mochachive}
      alt={a.name}
      className="h-10 w-10 object-contain"
    />
  </div>

  <div className="text-[0.72rem] font-bold leading-tight text-neutral-100">
    {a.name}
  </div>

  <div className="text-[0.6rem] uppercase tracking-wide text-neutral-500">
    Match
  </div>
</div>
  );
}

/* ─── match row ─────────────────────────────────────────────────────────── */
function TeamSlot({ name, isWinner, isMe }: { name?: string | null; isWinner: boolean; isMe: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {isWinner && <Crown size={13} className="shrink-0 text-emerald-400" />}
      <span className={`truncate text-[0.82rem] font-semibold ${isWinner ? "text-emerald-300" : name ? "text-neutral-200" : "italic text-neutral-600"}`}>
        {name || "TBD"}
      </span>
      {isMe && (
        <span className="shrink-0 rounded bg-[#df4a21]/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#df4a21] ring-1 ring-[#df4a21]/25">
          You
        </span>
      )}
    </div>
  );
}

function MatchRow({ m }: { m: MatchView }) {
  const aWins = !!m.winnerRegistrationId && m.teamARegistrationId === m.winnerRegistrationId;
  const bWins = !!m.winnerRegistrationId && m.teamBRegistrationId === m.winnerRegistrationId;
  const outcomePill =
    m.outcome === "WIN"  ? <Pill status="WIN">Win</Pill>
    : m.outcome === "LOSS" ? <Pill status="LOSS">Loss</Pill>
    : <Pill className="text-[0.7rem]!" status={m.status}>  {title(m.status)}
</Pill>

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-wide text-neutral-500">
          <Hash size={10} /> Round {m.roundNumber} · Match {m.matchNumber}
        </span>
        {outcomePill}
      </div>
      <div className="flex items-center gap-3">
        <TeamSlot name={m.teamAName} isWinner={aWins} isMe={m.mySide === "A"} />
        <div className="shrink-0 rounded-lg bg-white/[0.04] px-2.5 py-1 text-[0.82rem] font-extrabold text-neutral-100 ring-1 ring-white/[0.06]" style={numStyle}>
          {m.teamAScore ?? 0}<span className="px-1 text-neutral-600">:</span>{m.teamBScore ?? 0}
        </div>
        <div className="flex min-w-0 flex-1 justify-end">
          <TeamSlot name={m.teamBName} isWinner={bWins} isMe={m.mySide === "B"} />
        </div>
      </div>
      {m.scheduledAt && (
        <div className="mt-2 flex items-center gap-1 text-[0.7rem] text-neutral-500">
          <CalendarClock size={11} /> {fmt(m.scheduledAt)}
        </div>
      )}
    </div>
  );
}

/* ─── event card (collapsible) ──────────────────────────────────────────── */
function EventCard({ ev }: { ev: EventView }) {
  const [open, setOpen] = useState(false);
  const matches = ev.matchViews ?? [];
  const place = [ev.venueName, ev.city].filter(Boolean).join(", ");

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5">
      <div className="flex items-center gap-3">
        {ev.logoURL ? (
          <img src={ev.logoURL} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10" />
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#df4a21]/15 text-sm font-extrabold text-[#df4a21] ring-1 ring-[#df4a21]/25">
            {ev.eventName?.charAt(0)?.toUpperCase() ?? "E"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[0.85rem] font-bold text-neutral-100">{ev.eventName}</span>
          
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.7rem] text-neutral-500">
            {place && <span className="flex items-center gap-0.5"><MapPin size={10} />{place}</span>}
            
          </div>
        </div>
        {matches.length > 0 && (
          <button onClick={() => setOpen((s) => !s)} className="shrink-0 text-neutral-500 hover:text-[#df4a21]">
            <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
          {matches.map((m) => <MatchRow key={m.matchId} m={m} />)}
        </div>
      )}
    </div>
  );
}

/* ─── message row ───────────────────────────────────────────────────────── */
interface MessageItem {
  id: string;
  name: string;
  avatar?: string;
  preview: string;
  time: string;
  unread?: boolean;
  badge?: string;
}

function MessageRow({ msg }: { msg: MessageItem }) {
  const initials = msg.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/4 transition-colors">
      <div className="relative shrink-0">
        {msg.avatar ? (
          <img src={msg.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#2a2a2c] text-[0.72rem] font-bold text-neutral-300 ring-1 ring-white/10">
            {initials}
          </div>
        )}
        {msg.badge && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#df4a21] px-1 py-px text-[0.5rem] font-bold text-white ring-1 ring-[#1c1c1e]">
            {msg.badge}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[0.82rem] font-semibold text-neutral-100">{msg.name}</span>
          <span className="shrink-0 text-[0.65rem] text-neutral-500">{msg.time}</span>
        </div>
        <div className="mt-0.5 truncate text-[0.72rem] text-neutral-500">{msg.preview}</div>
      </div>
      {msg.unread && <div className="h-2 w-2 shrink-0 rounded-full bg-[#df4a21]" />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const navigate = useNavigate();
  const { toasts, add: toast, rem: removeToast } = useToast();

  const [avatarErr, setAvatarErr] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [showProfileGate, setShowProfileGate] = useState(false);

  const { isComplete: profileComplete, missingFields } = useProfileComplete();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const {
    user, robots, apiTeams, events, team,
    pendingInvites, expiredPending, pastInvites, invitesLoading,
    leaveTeam, stats, isLoading, error, refresh,
  } = useDashboard();

  const { eligibility } = useEligibility();
  /* derived */
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const initials = profileName
    ? profileName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const avatarSrc = user?.profilePhotoUrl || user?.avatarUrl || "";
  const hasAvatar = !!avatarSrc && !avatarErr;

  const wins    = stats.wins;
  const losses  = stats.losses;
  const played  = stats.matchesPlayed;
  const ties    = Math.max(0, played - wins - losses); // derived: ties = played - wins - losses

  // win rate: percentage, derived from hook data
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  // achievements derived from real stats
  const achievements = useMemo(() => {
    const list: { id: string; name: string; desc: string; icon: FC<any>; tier: keyof typeof TIER }[] = [];
    if (wins >= 1)                                    list.push({ id: "first-win",   name: "First Win",       desc: "Won your first match",    icon: Trophy,       tier: "gold"   });
    if (wins >= 10)                                   list.push({ id: "veteran",     name: "Veteran",         desc: "10+ match wins",          icon: Swords,       tier: "silver" });
    if (winRate >= 60 && played >= 5)                 list.push({ id: "untouchable", name: "Untouchable",     desc: "60%+ win rate",           icon: Shield,       tier: "gold"   });
    if (stats.rankNum > 0 && stats.rankNum <= 100)    list.push({ id: "top-100",     name: "Top 100",         desc: "Ranked in the top 100",   icon: Crown,        tier: "gold"   });
    if (robots.length >= 3)                           list.push({ id: "builder",     name: "Master Builder",  desc: "Built 3+ robots",         icon: Wrench,       tier: "gold"   });
    if (apiTeams.length >= 1)                         list.push({ id: "team-player", name: "Team Player",     desc: "Joined a team",           icon: Users,        tier: "bronze" });
    if (stats.seasonPoints > 0)                       list.push({ id: "scorer",      name: "Point Scorer",    desc: "Earned season points",    icon: Star,         tier: "silver" });
    return list;
  }, [wins, played, winRate, stats.rankNum, stats.seasonPoints, robots.length, apiTeams.length]);

  const eventsToShow = showAllEvents ? events : events.slice(0, 5);

  // Build message list from invitations (real data) + teams as conversation threads
  const messages: MessageItem[] = useMemo(() => {
    const items: MessageItem[] = [];
    // Pending invitations shown as messages
    pendingInvites.slice(0, 3).forEach((inv: any) => {
      items.push({
        id: inv.inviteId || inv.id,
        name: inv.invitedByName || inv.teamName || "Team",
        preview: `You've been invited to join ${inv.teamName ?? "a team"}`,
        time: inv.invitedAt ? fmtTime(inv.invitedAt) || "Now" : "Now",
        unread: true,
        badge: "Host",
      });
    });
    // Accepted invitations as past threads
    pastInvites.slice(0, 3).forEach((inv: any) => {
      items.push({
        id: (inv.inviteId || inv.id) + "-past",
        name: inv.invitedByName || inv.teamName || "Team",
        preview: upper(inv.status) === "ACCEPTED" ? "You joined the team." : "Invitation declined.",
        time: inv.respondedAt ? fmtTime(inv.respondedAt) || "—" : "—",
        unread: false,
      });
    });
    return items;
  }, [pendingInvites, pastInvites]);

  /* handlers */
  const handleAccept = async (id: string) => {
    if (!profileComplete) { setShowProfileGate(true); return; }
    setAccepting(id);
    try { await acceptInvitation(id); toast("success", "Invitation accepted!", "You've joined the team."); refresh(); }
    catch (e: any) { toast("error", "Failed to accept", e?.response?.data?.message || e?.message); }
    finally { setAccepting(null); }
  };
  const handleDecline = async (id: string) => {
    setDeclining(id);
    try { await declineInvitation(id); toast("info", "Invitation declined"); refresh(); }
    catch (e: any) { toast("error", "Failed to decline", e?.response?.data?.message || e?.message); }
    finally { setDeclining(null); }
  };
  const confirmLeave = async () => {
    setLeaving(true);
    try { await leaveTeam(); setLeaveOpen(false); toast("success", "Left team", "You have left the team."); refresh(); }
    catch (e: any) { toast("error", "Failed to leave", e?.response?.data?.message || e?.message); }
    finally { setLeaving(false); }
  };
  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: profileName ?? "Profile", url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast("success", "Link copied!"); }
    } catch { /* dismissed */ }
  };

  /* loading / error */
  if (isLoading && !user?.firstName && !error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3.5 text-neutral-400">
        <Loader2 size={26} className="animate-spin text-[#df4a21]" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3.5 text-neutral-400">
        <AlertCircle size={30} className="text-rose-400" />
        <span className="text-sm text-neutral-100">{String(error)}</span>
        <Button onClick={refresh} variant="accent" icon={Activity}>Retry</Button>
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="mx-auto max-w-[1152px] px-4 py-6">
      <Toasts toasts={toasts} onRem={removeToast} />

      {/* Profile completion gate — shown before accepting an invite */}
      {showProfileGate && (
        <ProfileIncompleteModal
          missingFields={missingFields}
          action="join a team"
          onClose={() => setShowProfileGate(false)}
        />
      )}

      <ConfirmLeave open={leaveOpen} teamName={team?.teamName} loading={leaving} onConfirm={confirmLeave} onCancel={() => setLeaveOpen(false)} />
      <InvitationsModal
        open={showInvites} onClose={() => setShowInvites(false)} loading={invitesLoading}
        pending={pendingInvites} expired={expiredPending} past={pastInvites}
        onAccept={handleAccept} onDecline={handleDecline} accepting={accepting} declining={declining}
      />

      {/* ── page header ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-50">My Dashboard</h1>
          <p className="mt-0.5 text-[0.85rem] text-neutral-500">Your competition stats, events, and team at a glance</p>
        </div>
        <div className="flex gap-2.5">
          <Button icon={pendingInvites.length ? BellDot : Bell} onClick={() => setShowInvites(true)}>
            Invitations
            {pendingInvites.length > 0 && (
              <span className="ml-1 rounded-full bg-[#df4a21] px-1.5 text-[0.62rem] font-extrabold text-white">{pendingInvites.length}</span>
            )}
          </Button>
         
        </div>
      </div>

      {/* ── two-column layout ── */}
      <div className="max-w-[1152px] flex  justify-between gap-8.25">

        {/* ════ LEFT ════ */}
        <div className="space-y-2 max-w-[744px] max-h-[277] flex flex-col">

          {/* hero card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#2a2a2c] to-[#161618] p-5 sm:p-6 ">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(223,74,33,0.14),transparent_70%)]" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <Pill className="my-4 text-amber-300 bg-amber-500/10 ring-amber-500/25">
                  <Star size={11} className="fill-amber-300" /> Rank · {stats.ranking}
                </Pill>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-2xl font-semibold  tracking-tight sm:text-[1.75rem] ${profileName ? "text-neutral-50" : "italic text-neutral-500"}`}>
                    {profileName || "No name set"}
                  </h2>
                  {team ? (
                    <Pill className="text-emerald-400 text-[0.7rem]! bg-emerald-500/10 ring-emerald-500/25">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                    </Pill>
                  ) : (
                    <Pill className="text-neutral-400 text-[0.7rem] bg-white/5 ring-white/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" /> Free agent
                    </Pill>
                  )}
                </div>
                <div className="mt-1.5 flex flex-col items-start gap-x-4 gap-y-1 text-[1rem] text-neutral-400">
                  {user?.botLeagueId && <span>BotLeague ID · <span className="text-neutral-300">{user.botLeagueId}</span></span>}
                  {user?.userName ? <span className="font-bold text-[#df4a21]">@{user.userName}</span> : <span className="italic text-neutral-600">No username</span>}
                  {eligibility?.category && (
                    <CategoryBadge category={eligibility.category} size="sm" showAgeRange />
                  )}
                </div>
                <div className="mt-6 m flex flex-wrap gap-2">
                  <Button icon={Share2} onClick={handleShare}>Share</Button>
                  <Button icon={PenLine} variant="accent" onClick={() => navigate("/profile")}>Edit</Button>
                </div>
              </div>
              <div className="shrink-0">
                {hasAvatar ? (
                  <img src={avatarSrc} alt={profileName || "Profile"} onError={() => setAvatarErr(true)}
                    className="h-32 w-32 rounded-2xl object-cover ring-2 ring-[#df4a21]/40 sm:h-36 sm:w-36" />
                ) : (
                  <div className="grid h-32 w-32 place-items-center rounded-2xl bg-gradient-to-br from-[#fa4715] to-[#f97316] text-4xl font-extrabold text-white ring-2 ring-[#df4a21]/40 sm:h-36 sm:w-36">
                    {profileName ? initials : <Users size={38} />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* stat strip — 3 cols */}
          <div className="grid grid-cols-3 gap-4">
  {/* Events */}
  <div className={`${CARD} flex items-center gap-4 p-6`}>
    <CalendarDays size={32} className="shrink-0 text-[#FF0000]" />

    <div className="flex items-center gap-3">
      <div
        className="text-4xl font-extrabold leading-none text-neutral-50"
        style={numStyle}
      >
        {events.length}
      </div>

      <div className="leading-tight">
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-50">
          Events
        </div>
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-400">
          Participated
        </div>
      </div>
    </div>
  </div>

  {/* Matches */}
  <div className={`${CARD} flex items-center gap-4 p-6`}>
    <Swords size={32} className="shrink-0 text-[#FF0000]" />

    <div className="flex items-center gap-3">
      <div
        className="text-4xl font-extrabold leading-none text-neutral-50"
        style={numStyle}
      >
        {stats.matchesTotal}
      </div>

      <div className="leading-tight">
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-50">
          Matches
        </div>
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-400">
          Played
        </div>
      </div>
    </div>
  </div>

  {/* Win Rate */}
  <div className={`${CARD} flex items-center gap-4 p-8`}>
    <Trophy size={32} className="shrink-0 text-[#FF0000]" />

    <div className="flex items-center gap-3">
      <div
        className="text-4xl font-extrabold leading-none text-neutral-50"
        style={numStyle}
      >
        {winRate}%
      </div>

      <div className="leading-tight">
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-50">
          Win
        </div>
        <div className="text-[0.72rem] font-medium uppercase tracking-widest text-neutral-400">
          Rate
        </div>
      </div>
    </div>
  </div>
</div>

          {/* team + performance row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* current team */}
            <div className={`${CARD} p-0!`}>
            
              {team ? (
                <div className="flex items-center h-full gap-5">
                  {/* robot image or initials */}
                  <div className="h-full w-32 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
                    {team?.teamLogo ? (
                      <img src={team.teamLogo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#2a2a2c] to-[#1a1a1c] text-[#df4a21]">
                        <Bot size={32} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-1.5">
                      <span className="truncate text-[1rem] font-bold text-neutral-100">Current Team</span>
                     
                     
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[0.95rem] font-bold text-neutral-400">{team.teamName}</span>
                     
                     
                    </div>
                   
                    <div className="mt-3">
                      <Button small variant="danger" icon={LogOut} onClick={() => setLeaveOpen(true)}>Leave Team</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Shield} title="No team yet" sub="Join or create a team to start competing."
                  action={<Button variant="accent" icon={Users} onClick={() => navigate("/join-team")}>Join a Team</Button>} />
              )}
            </div>

            {/* performance */}
            <div className={`${CARD} p-5`}>
              <SectionHead icon={Activity} title="Performance" />
              {/* ties derived from played - wins - losses */}
              <PerformanceBar wins={wins} losses={losses} pending={ties} />
            </div>
          </div>

          {/* top achievements */}
          <div className={`${CARD} p-5`}>
            <SectionHead icon={Medal} title="Top Achievements" />
            {achievements.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {achievements.slice(0, 10).map((a) => <Achievement key={a.id} a={a} />)}
              </div>
            ) : (
              <EmptyState icon={Trophy} title="No achievements yet" sub="Compete in events and win matches to start earning badges." />
            )}
          </div>
        </div>

        {/* ════ RIGHT ════ */}
        <div className="space-y-5 max-w-[375px] ">

          {/* messages panel — sourced from invitations data */}
          <div className={`${CARD} p-5 h-[400px]`}>
            <SectionHead icon={MessageSquare} title="Messages" />
            {messages.length > 0 ? (
              <div className="-mx-2 space-y-0.5">
                {messages.map((msg) => <MessageRow key={msg.id} msg={msg} />)}
              </div>
            ) : (
              <EmptyState icon={MailOpen} title="No messages" sub="Team invitations and notifications appear here." />
            )}
          </div>

          {/* recent events */}
          <div className={`${CARD} p-5`}>
            <SectionHead icon={CalendarDays} title="Recent Events"
              action={events.length > 5 ? (
                <button onClick={() => setShowAllEvents((s) => !s)} className="flex items-center gap-0.5 text-[0.78rem] font-bold text-neutral-500 hover:text-[#df4a21]">
                  View all <ChevronRight size={13} />
                </button>
              ) : undefined} />
            {events.length > 0 ? (
              <div className="space-y-2">
                {eventsToShow.map((ev) => (
                  <EventCard key={`${ev.eventId}-${ev.sport?.eventSportId}`} ev={ev} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* skeleton placeholders when no events */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}