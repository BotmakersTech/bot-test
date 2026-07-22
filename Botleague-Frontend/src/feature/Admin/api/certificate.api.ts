import api from "../../../shared/api/Base";
import type {
  CertificateTemplate,
  CreateCertificateTemplateRequest,
  UpdateCertificateTemplateRequest,
  CertificateType,
  CreateCertificateTypeRequest,
  UpdateCertificateTypeRequest,
  CertificateGenerationJob,
  IssuedCertificate,
  ManualRecipientRequest,
} from "../../Certificates/api/certificate.api";

const BASE = "/admin/certificates";

// ── Templates ──────────────────────────────────────────────────────────

export const getAdminTemplates = async (): Promise<CertificateTemplate[]> => {
  const res = await api.get(`${BASE}/templates`);
  return res.data;
};

export const createAdminTemplate = async (req: CreateCertificateTemplateRequest): Promise<CertificateTemplate> => {
  const res = await api.post(`${BASE}/templates`, req);
  return res.data;
};

export const updateAdminTemplate = async (
  templateId: string,
  req: UpdateCertificateTemplateRequest
): Promise<CertificateTemplate> => {
  const res = await api.patch(`${BASE}/templates/${templateId}`, req);
  return res.data;
};

export const archiveAdminTemplate = async (templateId: string): Promise<void> => {
  await api.delete(`${BASE}/templates/${templateId}`);
};

// ── Certificate types ─────────────────────────────────────────────────

export const getAdminCertificateTypes = async (eventSportId: string): Promise<CertificateType[]> => {
  const res = await api.get(`${BASE}/sports/${eventSportId}/types`);
  return res.data;
};

export const createAdminCertificateType = async (
  eventSportId: string,
  req: CreateCertificateTypeRequest
): Promise<CertificateType> => {
  const res = await api.post(`${BASE}/sports/${eventSportId}/types`, req);
  return res.data;
};

export const updateAdminCertificateType = async (
  typeId: string,
  req: UpdateCertificateTypeRequest
): Promise<CertificateType> => {
  const res = await api.patch(`${BASE}/types/${typeId}`, req);
  return res.data;
};

// ── Generation ─────────────────────────────────────────────────────────

export const triggerAdminGeneration = async (
  typeId: string,
  manualRecipients?: ManualRecipientRequest[]
): Promise<CertificateGenerationJob> => {
  const res = await api.post(`${BASE}/types/${typeId}/generate`, { manualRecipients });
  return res.data;
};

export const getAdminGenerationJobs = async (typeId: string): Promise<CertificateGenerationJob[]> => {
  const res = await api.get(`${BASE}/types/${typeId}/jobs`);
  return res.data;
};

export const getAdminGenerationJob = async (jobId: string): Promise<CertificateGenerationJob> => {
  const res = await api.get(`${BASE}/jobs/${jobId}`);
  return res.data;
};

// ── Issued certificates ───────────────────────────────────────────────

export const getAdminIssuedCertificates = async (typeId: string): Promise<IssuedCertificate[]> => {
  const res = await api.get(`${BASE}/types/${typeId}/issued`);
  return res.data;
};

export const revokeAdminCertificate = async (issuedCertificateId: string, reason: string): Promise<void> => {
  await api.post(`${BASE}/issued/${issuedCertificateId}/revoke`, { reason });
};
