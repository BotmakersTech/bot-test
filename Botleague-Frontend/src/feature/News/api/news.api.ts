import api from "../../../shared/api/Base";
import type { PagedResponse } from "../../Notifications/api/notification.api";

export interface NewsResponse {
  id: string;
  title: string;
  body: string;
  createdBy?: string;
  targetAgeCategories: string[];
  targetSports: string[];
  attachmentUrl?: string;
  attachmentKey?: string;
  attachmentFileType?: string;
  isPinned: boolean;
  isArchived: boolean;
  recipientCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NewsRequest {
  title: string;
  body: string;
  targetAgeCategories?: string[];
  targetSports?: string[];
  isPinned?: boolean;
  attachmentKey?: string;
  attachmentUrl?: string;
  attachmentFileType?: string;
}

export interface NewsUpdateRequest {
  isPinned?: boolean;
  isArchived?: boolean;
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

export const createNews = async (req: NewsRequest): Promise<NewsResponse> => {
  const res = await api.post("/news", req);
  return res.data;
};

export const listNewsAdmin = async (page = 0, size = 20): Promise<PagedResponse<NewsResponse>> => {
  const res = await api.get("/news", { params: { page, size } });
  return res.data;
};

export const updateNews = async (id: string, req: NewsUpdateRequest): Promise<NewsResponse> => {
  const res = await api.patch(`/news/${id}`, req);
  return res.data;
};

export const deleteNews = async (id: string): Promise<void> => {
  await api.delete(`/news/${id}`);
};

export const getNewsUploadUrl = async (
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
  const res = await api.post("/news/upload-url", null, { params: { fileType, fileSize } });
  return res.data;
};

/** Uploads the file to storage and returns the key/url to attach to a NewsRequest. */
export const uploadNewsAttachment = async (
  file: File
): Promise<{ attachmentUrl: string; attachmentKey: string; attachmentFileType: string }> => {
  const { uploadUrl, fileUrl, key } = await getNewsUploadUrl(file.type, file.size);
  const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!putRes.ok) throw new Error("Upload to storage failed");
  return { attachmentUrl: fileUrl, attachmentKey: key, attachmentFileType: file.type };
};

// ── Any authenticated user ──────────────────────────────────────────────────

export const getNewsDetail = async (id: string): Promise<NewsResponse> => {
  const res = await api.get(`/news/${id}`);
  return res.data;
};

export const getNewsFeed = async (page = 0, size = 20): Promise<PagedResponse<NewsResponse>> => {
  const res = await api.get("/news/feed", { params: { page, size } });
  return res.data;
};
