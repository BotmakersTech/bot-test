import { useEffect, useState } from "react";
import { getAllEvents, type AdminEventResponse } from "../api/admin.api";
import {
  getAdminTemplates,
  createAdminTemplate,
  updateAdminTemplate,
  archiveAdminTemplate,
  getAdminCertificateTypes,
  createAdminCertificateType,
  updateAdminCertificateType,
  triggerAdminGeneration,
  getAdminGenerationJobs,
  getAdminIssuedCertificates,
  revokeAdminCertificate,
} from "../api/certificate.api";
import type { CertificateTemplate } from "../../Certificates/api/certificate.api";
import TemplateManager from "../../Certificates/components/TemplateManager";
import CertificateTypeManager from "../../Certificates/components/CertificateTypeManager";
import PageWrapper from "../../Organizer/components/PageWrapper";
import { ORG } from "../../Organizer/theme/organizerTheme";

export default function AdminCertificatesPage() {
  const [tab, setTab] = useState<"templates" | "types">("templates");
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [events, setEvents] = useState<AdminEventResponse[]>([]);
  const [eventSportId, setEventSportId] = useState("");

  const refreshTemplates = () => {
    getAdminTemplates().then(setTemplates).catch(() => {});
  };

  useEffect(() => {
    refreshTemplates();
    getAllEvents().then((ev) => {
      setEvents(ev);
      const firstWithSport = ev.find((e) => (e.sports?.length ?? 0) > 0);
      if (firstWithSport?.sports?.[0]) setEventSportId(firstWithSport.sports[0].id);
    }).catch(() => {});
  }, []);

  const activeTemplates = templates.filter((t) => t.status === "ACTIVE");

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: ORG.blueHeading, fontFamily: ORG.fontHeading }}>Certificates</h1>
          <p className="text-sm mt-0.5" style={{ color: ORG.muted }}>BotLeague-issued certificate templates and per-sport certificate configuration</p>
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
          uploadBasePath="/admin/certificates"
          listTemplates={getAdminTemplates}
          createTemplate={createAdminTemplate}
          updateTemplate={updateAdminTemplate}
          archiveTemplate={archiveAdminTemplate}
          templates={templates}
          onChanged={refreshTemplates}
        />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Event Sport</label>
            <select
              value={eventSportId}
              onChange={(e) => setEventSportId(e.target.value)}
              className="w-full max-w-md rounded-lg px-3 py-2 text-sm ring-1"
              style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}
            >
              {events.map((ev) => (
                <optgroup key={ev.id} label={ev.eventName}>
                  {(ev.sports ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.sportName || s.sport}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {eventSportId ? (
            <CertificateTypeManager
              eventSportId={eventSportId}
              activeTemplates={activeTemplates}
              listTypes={getAdminCertificateTypes}
              createType={createAdminCertificateType}
              updateType={updateAdminCertificateType}
              triggerGeneration={triggerAdminGeneration}
              listJobs={getAdminGenerationJobs}
              listIssued={getAdminIssuedCertificates}
              revoke={revokeAdminCertificate}
            />
          ) : (
            <p className="text-sm" style={{ color: ORG.muted }}>Select an event sport to configure its certificates.</p>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
