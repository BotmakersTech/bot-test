import api from "../../../shared/api/Base";

/** Shared axios-error-to-message extraction, typed rather than `any`-cast at each call site. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// =====================================================
// SHARED TYPES — mirrors the backend certificate DTOs exactly.
// Admin/Organizer certificate API files import from here rather than
// redeclaring the same shapes (same pattern as sportMedia.api.ts importing
// from eventMedia.api.ts).
// =====================================================

export type CertificateProvider = "BOTLEAGUE" | "ORGANISER";
export type CertificateTemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CertificateCategory = "PARTICIPATION" | "WINNER" | "RUNNER_UP" | "SECOND_RUNNER_UP" | "SPECIAL";
export type EligibilityRule = "ALL_REGISTERED" | "RANK_EQUALS" | "MANUAL_SELECT";
export type IssueMode = "AUTO_ON_FINALIZE" | "MANUAL_TRIGGER";
export type CertificateTypeStatus = "ACTIVE" | "DISABLED";
export type GenerationJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED";
export type IssuedCertificateStatus = "ACTIVE" | "REVOKED" | "SUPERSEDED";

export type PlaceholderKey =
  | "PARTICIPANT_NAME"
  | "TEAM_NAME"
  | "ROBOT_NAME"
  | "EVENT_NAME"
  | "EVENT_SPORT"
  | "COMPETITION_CATEGORY"
  | "POSITION"
  | "RANK"
  | "INSTITUTE_NAME"
  | "ORGANIZER_NAME"
  | "CERTIFICATE_ID"
  | "DATE"
  | "VERIFICATION_URL"
  | "QR_CODE";

export const PLACEHOLDER_LABELS: Record<PlaceholderKey, string> = {
  PARTICIPANT_NAME: "Participant Name",
  TEAM_NAME: "Team Name",
  ROBOT_NAME: "Robot Name",
  EVENT_NAME: "Event Name",
  EVENT_SPORT: "Event Sport",
  COMPETITION_CATEGORY: "Competition Category",
  POSITION: "Position",
  RANK: "Rank",
  INSTITUTE_NAME: "Institute Name",
  ORGANIZER_NAME: "Organizer Name",
  CERTIFICATE_ID: "Certificate ID",
  DATE: "Date",
  VERIFICATION_URL: "Verification URL",
  QR_CODE: "QR Code",
};

export const CATEGORY_LABELS: Record<CertificateCategory, string> = {
  PARTICIPATION: "Participation",
  WINNER: "Winner",
  RUNNER_UP: "Runner-Up",
  SECOND_RUNNER_UP: "Second Runner-Up",
  SPECIAL: "Special",
};

export interface TemplatePlaceholderPosition {
  key: PlaceholderKey;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: "LEFT" | "CENTER" | "RIGHT";
  maxWidth?: number;
  bold?: boolean;
  sizePx?: number; // QR_CODE only
}

export interface CertificateTemplate {
  id: string;
  provider: CertificateProvider;
  ownerUserId: string | null;
  name: string;
  backgroundUrl: string;
  pageWidthPx: number;
  pageHeightPx: number;
  placeholderMap: TemplatePlaceholderPosition[];
  status: CertificateTemplateStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCertificateTemplateRequest {
  name: string;
  backgroundAssetKey: string;
  pageWidthPx: number;
  pageHeightPx: number;
  placeholderMap: TemplatePlaceholderPosition[];
}

export interface UpdateCertificateTemplateRequest {
  name?: string;
  placeholderMap?: TemplatePlaceholderPosition[];
  status?: CertificateTemplateStatus;
}

export interface CertificateType {
  id: string;
  eventSportId: string;
  provider: CertificateProvider;
  category: CertificateCategory;
  label: string;
  templateId: string;
  templateName?: string;
  eligibilityRule: EligibilityRule;
  eligibilityRank: number | null;
  issueMode: IssueMode;
  status: CertificateTypeStatus;
  numberPrefix: string;
  numberFormat: string;
  validityYears: number | null;
  verificationEnabled: boolean;
  qrEnabled: boolean;
  signatureEnabled: boolean;
  issuedCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCertificateTypeRequest {
  category: CertificateCategory;
  label: string;
  templateId: string;
  eligibilityRule: EligibilityRule;
  eligibilityRank?: number;
  issueMode?: IssueMode;
  numberPrefix?: string;
  numberFormat?: string;
  validityYears?: number;
  verificationEnabled?: boolean;
  qrEnabled?: boolean;
  signatureEnabled?: boolean;
}

export type UpdateCertificateTypeRequest = Partial<CreateCertificateTypeRequest> & { status?: CertificateTypeStatus };

export interface ManualRecipientRequest {
  recipientUserId?: string;
  recipientName?: string;
  teamId?: string;
  robotId?: string;
  robotName?: string;
  positionRank?: number;
}

export interface CertificateGenerationJob {
  id: string;
  certificateTypeId: string;
  status: GenerationJobStatus;
  totalRecipients: number;
  succeededCount: number;
  failedCount: number;
  errorSummary: string | null;
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  certificateTypeId: string;
  certificateLabel?: string;
  category?: string;
  recipientUserId: string | null;
  recipientName: string;
  teamId: string | null;
  teamName: string | null;
  robotId: string | null;
  robotName: string | null;
  eventId: string;
  eventName?: string;
  eventSportId: string;
  eventSportName?: string;
  positionSnapshot: number | null;
  pdfUrl: string;
  imageUrl: string;
  qrUrl: string | null;
  verificationUrl: string;
  status: IssuedCertificateStatus;
  revokedReason?: string | null;
  revokedAt?: string | null;
  issuedAt: string;
}

export interface PublicVerificationResponse {
  result: "VALID" | "REVOKED" | "NOT_FOUND";
  certificateNumber: string;
  recipientName?: string;
  teamName?: string;
  robotName?: string;
  eventName?: string;
  eventSportName?: string;
  category?: string;
  label?: string;
  positionSnapshot?: number;
  imageUrl?: string;
  issuedAt?: string;
}

// =====================================================
// SHARED UPLOAD HELPER — template backgrounds only (PNG/JPEG).
// basePath is "/admin/certificates" or "/organizer/certificates"; both
// backend controllers expose an identical upload-url endpoint shape.
// No separate "confirm" step: the returned key is passed straight into
// createTemplate()'s backgroundAssetKey field.
// =====================================================

export const MAX_TEMPLATE_BYTES = 25 * 1024 * 1024;

export const validateTemplateFile = (file: File): string | null => {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    return "Certificate templates must be a PNG or JPEG image";
  }
  if (file.size > MAX_TEMPLATE_BYTES) {
    return "File is too large — the limit is 25MB";
  }
  return null;
};

export const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };
    img.src = url;
  });
};

export const uploadCertificateTemplateBackground = async (
  basePath: "/admin/certificates" | "/organizer/certificates",
  file: File
): Promise<{ fileUrl: string; key: string }> => {
  try {
    const uploadRes = await api.post(`${basePath}/templates/upload-url`, null, {
      params: { fileType: file.type, fileSize: file.size },
    });
    const { uploadUrl, fileUrl, key } = uploadRes.data;
    if (!uploadUrl || !key) {
      throw new Error("Invalid upload URL response from server");
    }

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Upload to storage failed");
    }

    return { fileUrl, key };
  } catch (error: unknown) {
    throw new Error(extractErrorMessage(error, "Certificate template upload failed"), { cause: error });
  }
};

// =====================================================
// PUBLIC VERIFICATION — no auth
// =====================================================

export const verifyCertificate = async (certificateNumber: string): Promise<PublicVerificationResponse> => {
  const res = await api.get(`/certificates/verify/${encodeURIComponent(certificateNumber)}`);
  return res.data;
};

// =====================================================
// PARTICIPANT — "My Certificates"
// =====================================================

export const getMyCertificates = async (): Promise<IssuedCertificate[]> => {
  const res = await api.get("/certificates/me");
  return res.data;
};

export const getMyCertificate = async (issuedCertificateId: string): Promise<IssuedCertificate> => {
  const res = await api.get(`/certificates/me/${issuedCertificateId}`);
  return res.data;
};
