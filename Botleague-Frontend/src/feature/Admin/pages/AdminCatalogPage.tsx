import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ORG } from "../../Organizer/theme/organizerTheme";
import "../../../styles/organizerTheme.css";
import {
  getAdminLeagues,
  createAdminLeague,
  updateAdminLeague,
  getAdminSports,
  createAdminSport,
  updateAdminSport,
  getAdminLeagueSports,
  createAdminLeagueSport,
  updateAdminLeagueSport,
  type CreateLeagueRequest,
  type CreateSportRequest,
  type CreateLeagueSportRequest,
} from "../api/adminCatalog.api";
import type { League, Sport, LeagueSport, WeightClass, ControlType } from "../../../shared/api/catalog.api";

type Tab = "leagues" | "sports" | "pairings";

const CARD_BORDER = "rgba(75,134,232,0.25)";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

function StatusBadge({ status }: { status: string }) {
  const positive = status === "ACTIVE" || status === "LIVE";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
        positive ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        style={{ border: `1px solid ${CARD_BORDER}` }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f9ff] text-gray-500 hover:bg-[#eef2ff]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#4b86e8]";

export default function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>("leagues");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [pairings, setPairings] = useState<LeagueSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingLeague, setEditingLeague] = useState<League | "new" | null>(null);
  const [editingSport, setEditingSport] = useState<Sport | "new" | null>(null);
  const [editingPairing, setEditingPairing] = useState<LeagueSport | "new" | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([getAdminLeagues(), getAdminSports(), getAdminLeagueSports()])
      .then(([l, s, p]) => {
        setLeagues(l);
        setSports(s);
        setPairings(p);
        setError(null);
      })
      .catch(() => setError("Failed to load the catalog"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="org-page-bg p-8">
      <div className="mb-6">
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">League Catalog</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage leagues, sports, and each sport's specs within a league. Only LIVE pairings under an ACTIVE
          league are visible to organisers when they set up an event.
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        {(["leagues", "sports", "pairings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition"
            style={
              tab === t
                ? { background: ORG.gradientCta, color: "#fff" }
                : { background: "#fff", color: "#374151", border: `1px solid ${CARD_BORDER}` }
            }
          >
            {t === "leagues" ? "Leagues" : t === "sports" ? "Sports" : "League/Sport Pairings"}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : tab === "leagues" ? (
        <LeaguesTable leagues={leagues} onEdit={setEditingLeague} onNew={() => setEditingLeague("new")} />
      ) : tab === "sports" ? (
        <SportsTable sports={sports} onEdit={setEditingSport} onNew={() => setEditingSport("new")} />
      ) : (
        <PairingsTable
          pairings={pairings}
          leagues={leagues}
          sports={sports}
          onEdit={setEditingPairing}
          onNew={() => setEditingPairing("new")}
        />
      )}

      {editingLeague && (
        <LeagueFormOverlay
          league={editingLeague === "new" ? null : editingLeague}
          leagues={leagues}
          onClose={() => setEditingLeague(null)}
          onSaved={() => {
            setEditingLeague(null);
            loadAll();
          }}
        />
      )}
      {editingSport && (
        <SportFormOverlay
          sport={editingSport === "new" ? null : editingSport}
          onClose={() => setEditingSport(null)}
          onSaved={() => {
            setEditingSport(null);
            loadAll();
          }}
        />
      )}
      {editingPairing && (
        <PairingFormOverlay
          pairing={editingPairing === "new" ? null : editingPairing}
          leagues={leagues}
          sports={sports}
          onClose={() => setEditingPairing(null)}
          onSaved={() => {
            setEditingPairing(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LEAGUES
// ═══════════════════════════════════════════════════════════════════════

function LeaguesTable({
  leagues,
  onEdit,
  onNew,
}: {
  leagues: League[];
  onEdit: (l: League) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={onNew}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: ORG.gradientCta }}
        >
          + New League
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: CARD_BORDER }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: ORG.gradientPill }}>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Name</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Slug</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Age Group Code</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Age Range</th>
              <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
              <th className="px-4 py-3.5 text-right font-semibold text-white">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {leagues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No leagues yet
                </td>
              </tr>
            ) : (
              leagues.map((l) => (
                <tr key={l.id} className="border-t hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-4 py-3 font-medium text-[#374151]">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{l.ageGroupCode}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {l.minAge ?? "—"}
                    {l.maxAge ? `–${l.maxAge}` : l.minAge ? "+" : ""}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(l)}
                      className="rounded-lg border bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#eef2ff]"
                      style={{ borderColor: CARD_BORDER }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeagueFormOverlay({
  league,
  leagues,
  onClose,
  onSaved,
}: {
  league: League | null;
  leagues: League[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [slug, setSlug] = useState(league?.slug ?? "");
  const [ageGroupCode, setAgeGroupCode] = useState(league?.ageGroupCode ?? "");
  const [name, setName] = useState(league?.name ?? "");
  const [minAge, setMinAge] = useState(league?.minAge?.toString() ?? "");
  const [maxAge, setMaxAge] = useState(league?.maxAge?.toString() ?? "");
  const [tagline, setTagline] = useState(league?.tagline ?? "");
  const [status, setStatus] = useState(league?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const req: CreateLeagueRequest = {
        slug,
        ageGroupCode,
        name,
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        tagline: tagline || undefined,
      };
      if (league) {
        await updateAdminLeague(league.id, { ...req, status: status as League["status"] });
      } else {
        await createAdminLeague(req);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save league"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay title={league ? `Edit ${league.name}` : "New League"} onClose={onClose}>
      <Field label="Name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ignite" />
      </Field>
      <Field label="Slug (URL-safe, unique)">
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ignite" />
      </Field>
      <Field label="Age group code (stable eligibility key, unique)">
        <input
          className={inputCls}
          value={ageGroupCode}
          onChange={(e) => setAgeGroupCode(e.target.value.toUpperCase())}
          placeholder="JUNIOR_INNOVATORS"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min age">
          <input className={inputCls} type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        </Field>
        <Field label="Max age (blank = unbounded)">
          <input className={inputCls} type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        </Field>
      </div>
      <Field label="Tagline">
        <input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </Field>
      {league && (
        <Field label="Status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as League["status"])}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </Field>
      )}
      {leagues.length > 0 && !league?.nextLeagueId && (
        <p className="mb-3 text-xs text-gray-400">
          Existing leagues: {leagues.map((l) => l.slug).join(", ")}
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving || !slug || !ageGroupCode || !name}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: ORG.gradientCta }}
      >
        {saving ? "Saving…" : "Save League"}
      </button>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SPORTS
// ═══════════════════════════════════════════════════════════════════════

function SportsTable({ sports, onEdit, onNew }: { sports: Sport[]; onEdit: (s: Sport) => void; onNew: () => void }) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={onNew}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: ORG.gradientCta }}
        >
          + New Sport
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: CARD_BORDER }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: ORG.gradientPill }}>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Name</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Slug</th>
              <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
              <th className="px-4 py-3.5 text-right font-semibold text-white">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sports.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  No sports yet
                </td>
              </tr>
            ) : (
              sports.map((s) => (
                <tr key={s.id} className="border-t hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-4 py-3 font-medium text-[#374151]">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(s)}
                      className="rounded-lg border bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#eef2ff]"
                      style={{ borderColor: CARD_BORDER }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SportFormOverlay({
  sport,
  onClose,
  onSaved,
}: {
  sport: Sport | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sport?.name ?? "");
  const [slug, setSlug] = useState(sport?.slug ?? "");
  // Competition-type hint is no longer surfaced in the UI, but keep the
  // existing value flowing through so editing a sport doesn't wipe it.
  const [competitionTypeHint] = useState(sport?.competitionTypeHint ?? "");
  const [status, setStatus] = useState(sport?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const req: CreateSportRequest = { name, slug, competitionTypeHint: competitionTypeHint || undefined };
      if (sport) {
        await updateAdminSport(sport.id, { ...req, status: status as Sport["status"] });
      } else {
        await createAdminSport(req);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save sport"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay title={sport ? `Edit ${sport.name}` : "New Sport"} onClose={onClose}>
      <Field label="Name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Robo War" />
      </Field>
      <Field label="Slug (URL-safe, unique)">
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="robo-war" />
      </Field>
      {sport && (
        <Field label="Status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Sport["status"])}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </Field>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving || !name || !slug}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: ORG.gradientCta }}
      >
        {saving ? "Saving…" : "Save Sport"}
      </button>
    </Overlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAIRINGS (LeagueSport)
// ═══════════════════════════════════════════════════════════════════════

function PairingsTable({
  pairings,
  leagues,
  sports,
  onEdit,
  onNew,
}: {
  pairings: LeagueSport[];
  leagues: League[];
  sports: Sport[];
  onEdit: (p: LeagueSport) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={onNew}
          disabled={leagues.length === 0 || sports.length === 0}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: ORG.gradientCta }}
        >
          + New Pairing
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: CARD_BORDER }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: ORG.gradientPill }}>
              <th className="px-4 py-3.5 text-left font-semibold text-white">League</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Techsport</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Spec</th>
              <th className="px-4 py-3.5 text-left font-semibold text-white">Note</th>
              <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
              <th className="px-4 py-3.5 text-right font-semibold text-white">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {pairings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No pairings yet
                </td>
              </tr>
            ) : (
              pairings.map((p) => (
                <tr key={p.id} className="border-t hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-4 py-3 font-medium text-[#374151]">{p.leagueName}</td>
                  <td className="px-4 py-3 text-[#374151]">{p.sportName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatSpec(p)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.entryNote ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(p)}
                      className="rounded-lg border bg-[#f8f9ff] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#eef2ff]"
                      style={{ borderColor: CARD_BORDER }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatSpec(p: LeagueSport): string {
  if (p.weightClasses.length > 0) {
    return p.weightClasses.map((w) => `${w.weightKg} kg`).join(" / ");
  }
  const parts: string[] = [];
  if (p.weightLimitKg != null) parts.push(`${p.weightLimitKg}kg`);
  if (p.maxLengthCm != null && p.maxWidthCm != null) {
    parts.push(
      p.maxHeightCm != null
        ? `${p.maxLengthCm}×${p.maxWidthCm}×${p.maxHeightCm}cm`
        : `${p.maxLengthCm}×${p.maxWidthCm}cm`
    );
  }
  const extra = Object.entries(p.extraSpecs).map(([k, v]) => `${k}: ${v}`);
  parts.push(...extra);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function PairingFormOverlay({
  pairing,
  leagues,
  sports,
  onClose,
  onSaved,
}: {
  pairing: LeagueSport | null;
  leagues: League[];
  sports: Sport[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [leagueId, setLeagueId] = useState(pairing?.leagueId ?? leagues[0]?.id ?? "");
  const [sportId, setSportId] = useState(pairing?.sportId ?? sports[0]?.id ?? "");
  const [weightLimitKg, setWeightLimitKg] = useState(pairing?.weightLimitKg?.toString() ?? "");
  const [maxLengthCm, setMaxLengthCm] = useState(pairing?.maxLengthCm?.toString() ?? "");
  const [maxWidthCm, setMaxWidthCm] = useState(pairing?.maxWidthCm?.toString() ?? "");
  const [maxHeightCm, setMaxHeightCm] = useState(pairing?.maxHeightCm?.toString() ?? "");
  // Control type is no longer surfaced in the UI, but keep the existing value
  // flowing through so editing a pairing doesn't wipe it.
  const [controlType] = useState<ControlType | "">(pairing?.controlType ?? "");
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>(pairing?.weightClasses ?? []);
  const [extraSpecs, setExtraSpecs] = useState<[string, string][]>(Object.entries(pairing?.extraSpecs ?? {}));
  const [entryNote, setEntryNote] = useState(pairing?.entryNote ?? "");
  const [status, setStatus] = useState(pairing?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWeightClass = () => setWeightClasses([...weightClasses, { label: "", weightKg: 0 }]);
  const updateWeightClass = (i: number, field: keyof WeightClass, value: string) => {
    const next = [...weightClasses];
    next[i] = { ...next[i], [field]: field === "weightKg" ? Number(value) : value };
    setWeightClasses(next);
  };
  const removeWeightClass = (i: number) => setWeightClasses(weightClasses.filter((_, idx) => idx !== i));

  const addExtraSpec = () => setExtraSpecs([...extraSpecs, ["", ""]]);
  const updateExtraSpec = (i: number, field: 0 | 1, value: string) => {
    const next = [...extraSpecs];
    next[i] = field === 0 ? [value, next[i][1]] : [next[i][0], value];
    setExtraSpecs(next);
  };
  const removeExtraSpec = (i: number) => setExtraSpecs(extraSpecs.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const req: CreateLeagueSportRequest = {
        leagueId,
        sportId,
        weightLimitKg: weightLimitKg ? Number(weightLimitKg) : null,
        maxLengthCm: maxLengthCm ? Number(maxLengthCm) : null,
        maxWidthCm: maxWidthCm ? Number(maxWidthCm) : null,
        maxHeightCm: maxHeightCm ? Number(maxHeightCm) : null,
        controlType: controlType || null,
        weightClasses: weightClasses.filter((w) => w.label),
        extraSpecs: Object.fromEntries(extraSpecs.filter(([k]) => k)),
        entryNote: entryNote || undefined,
        status: status as LeagueSport["status"],
      };
      if (pairing) {
        const { leagueId: _l, sportId: _s, ...updateReq } = req;
        await updateAdminLeagueSport(pairing.id, updateReq);
      } else {
        await createAdminLeagueSport(req);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to save pairing"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay
      title={pairing ? `Edit ${pairing.leagueName} / ${pairing.sportName}` : "New League/Sport Pairing"}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="League">
          <select className={inputCls} value={leagueId} onChange={(e) => setLeagueId(e.target.value)} disabled={!!pairing}>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Techsport">
          <select className={inputCls} value={sportId} onChange={(e) => setSportId(e.target.value)} disabled={!!pairing}>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Weight limit (kg) — leave blank if using weight classes below">
        <input className={inputCls} type="number" min={0} step="any" value={weightLimitKg} onChange={(e) => setWeightLimitKg(e.target.value)} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Length (cm)">
          <input className={inputCls} type="number" value={maxLengthCm} onChange={(e) => setMaxLengthCm(e.target.value)} />
        </Field>
        <Field label="Width (cm)">
          <input className={inputCls} type="number" value={maxWidthCm} onChange={(e) => setMaxWidthCm(e.target.value)} />
        </Field>
        <Field label="Height (cm)">
          <input className={inputCls} type="number" value={maxHeightCm} onChange={(e) => setMaxHeightCm(e.target.value)} />
        </Field>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Weight classes (e.g. a sport offered at 1.5kg AND 60kg)</span>
          <button onClick={addWeightClass} className="text-xs font-semibold text-[#4b86e8]">
            + Add
          </button>
        </div>
        {weightClasses.map((w, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              className={inputCls}
              placeholder="Label (e.g. 1.5kg)"
              value={w.label}
              onChange={(e) => updateWeightClass(i, "label", e.target.value)}
            />
            <input
              className={inputCls}
              type="number"
              min={0}
              step="any"
              placeholder="kg"
              value={w.weightKg}
              onChange={(e) => updateWeightClass(i, "weightKg", e.target.value)}
            />
            <button onClick={() => removeWeightClass(i)} className="px-2 text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Extra specs (drone diameter, track size, ...)</span>
          <button onClick={addExtraSpec} className="text-xs font-semibold text-[#4b86e8]">
            + Add
          </button>
        </div>
        {extraSpecs.map(([k, v], i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input className={inputCls} placeholder="Key (e.g. diameterCm)" value={k} onChange={(e) => updateExtraSpec(i, 0, e.target.value)} />
            <input className={inputCls} placeholder="Value" value={v} onChange={(e) => updateExtraSpec(i, 1, e.target.value)} />
            <button onClick={() => removeExtraSpec(i)} className="px-2 text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <Field label="Entry note (e.g. flag a placeholder spec)">
        <input className={inputCls} value={entryNote} onChange={(e) => setEntryNote(e.target.value)} />
      </Field>

      <Field label="Status — LIVE is what makes this pairing pickable by organisers">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as LeagueSport["status"])}>
          <option value="DRAFT">DRAFT</option>
          <option value="LIVE">LIVE</option>
        </select>
      </Field>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving || !leagueId || !sportId}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: ORG.gradientCta }}
      >
        {saving ? "Saving…" : "Save Pairing"}
      </button>
    </Overlay>
  );
}
