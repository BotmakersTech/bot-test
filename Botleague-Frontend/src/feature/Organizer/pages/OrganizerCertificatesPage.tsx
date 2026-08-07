import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getMyEvents, getMySports, type OrganizerEvent, type OrganizerSport } from "../api/organizer.api";
import {
  getOrganizerTemplates,
  createOrganizerTemplate,
  updateOrganizerTemplate,
  archiveOrganizerTemplate,
  getOrganizerCertificateTypes,
  createOrganizerCertificateType,
  updateOrganizerCertificateType,
  triggerOrganizerGeneration,
  getOrganizerGenerationJobs,
  getOrganizerGenerationJob,
  getOrganizerIssuedCertificates,
  revokeOrganizerCertificate,
  resendOrganizerCertificate,
  previewOrganizerTemplate,
} from "../api/certificate.api";
import type { CertificateTemplate } from "../../Certificates/api/certificate.api";
import TemplateManager from "../../Certificates/components/TemplateManager";
import CertificateTypeManager from "../../Certificates/components/CertificateTypeManager";
import PageWrapper from "../components/PageWrapper";
import { ORG } from "../theme/organizerTheme";

export default function OrganizerCertificatesPage() {
  const [searchParams] = useSearchParams();
  const preselectedSportId = searchParams.get("eventSportId") ?? "";

  const [tab, setTab] = useState<"templates" | "types">(preselectedSportId ? "types" : "templates");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [sports, setSports] = useState<OrganizerSport[]>([]);
  const [eventSportId, setEventSportId] = useState(preselectedSportId);

  const refreshTemplates = () => {
    getOrganizerTemplates().then(setTemplates).catch(() => {});
  };

  useEffect(() => {
    refreshTemplates();
    Promise.all([getMyEvents(), getMySports()]).then(([ev, sp]) => {
      setEvents(ev);
      setSports(sp);
      // Arriving from a specific sport's own page already knows which one it
      // wants — only default to the first sport when nobody asked for one.
      if (!preselectedSportId && sp.length) setEventSportId(sp[0].id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTemplates = templates.filter((t) => t.status === "ACTIVE");
  const preselectedSport = preselectedSportId ? sports.find((s) => s.id === preselectedSportId) : undefined;

  const eventName = (eventId: string) => events.find((e) => e.id === eventId)?.eventName ?? "Event";
  const groupedSports = useMemo(() => {
    const byEvent = new Map<string, OrganizerSport[]>();
    for (const s of sports) {
      const list = byEvent.get(s.eventId) ?? [];
      list.push(s);
      byEvent.set(s.eventId, list);
    }
    return byEvent;
  }, [sports]);

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[38px] font-medium text-[#0162d1]">Certificates</h1>
          <p className="text-sm mt-0.5" style={{ color: ORG.muted }}>Your own certificate templates and per-sport certificate configuration</p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: ORG.blue + "14" }}>
          <button
            onClick={() => setTab("templates")}
            className="rounded-lg px-4 py-1.5 text-sm font-semibold"
            style={tab === "templates" ? { background: "#fff", color: ORG.blueHeading, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: ORG.muted }}
          >
            Templates
          </button>
          <button
            onClick={() => setTab("types")}
            className="rounded-lg px-4 py-1.5 text-sm font-semibold"
            style={tab === "types" ? { background: "#fff", color: ORG.blueHeading, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: ORG.muted }}
          >
            Certificate Types
          </button>
        </div>
      </div>

      {tab === "templates" ? (
        <TemplateManager
          uploadBasePath="/organizer/certificates"
          listTemplates={getOrganizerTemplates}
          createTemplate={createOrganizerTemplate}
          updateTemplate={updateOrganizerTemplate}
          archiveTemplate={archiveOrganizerTemplate}
          previewTemplate={previewOrganizerTemplate}
          templates={templates}
          onChanged={refreshTemplates}
        />
      ) : (
        <div className="space-y-4">
          {preselectedSport && (
            <div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: ORG.violet + "14", color: ORG.violetHeading }}>
              Opened from {eventName(preselectedSport.eventId)} — {preselectedSport.sport.replace(/_/g, " ")}. Switch sports below anytime.
            </div>
          )}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Event Sport</label>
            <select
              value={eventSportId}
              onChange={(e) => setEventSportId(e.target.value)}
              className="w-full max-w-md rounded-lg px-3 py-2 text-sm ring-1"
              style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}
            >
              {Array.from(groupedSports.entries()).map(([eventId, sportList]) => (
                <optgroup key={eventId} label={eventName(eventId)}>
                  {sportList.map((s) => (
                    <option key={s.id} value={s.id}>{s.sport.replace(/_/g, " ")}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {eventSportId ? (
            <CertificateTypeManager
              eventSportId={eventSportId}
              activeTemplates={activeTemplates}
              listTypes={getOrganizerCertificateTypes}
              createType={createOrganizerCertificateType}
              updateType={updateOrganizerCertificateType}
              triggerGeneration={triggerOrganizerGeneration}
              listJobs={getOrganizerGenerationJobs}
              getJob={getOrganizerGenerationJob}
              listIssued={getOrganizerIssuedCertificates}
              revoke={revokeOrganizerCertificate}
              resend={resendOrganizerCertificate}
            />
          ) : (
            <p className="text-sm" style={{ color: ORG.muted }}>Select an event sport to configure its certificates.</p>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
