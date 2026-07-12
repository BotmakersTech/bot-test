import api from "../../../shared/api/Base";

export type EventMediaSlot = "THUMBNAIL" | "TEASER_1" | "TEASER_2";

export interface UploadMediaResult {
  fileUrl: string;
  key: string;
}

// Mirrors the backend's upload.max-size-bytes / upload.video-max-size-bytes defaults.
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export function validateMediaFile(file: File): string | null {
  const isVideo = file.type.startsWith("video");
  const isImage = file.type.startsWith("image");
  if (!isVideo && !isImage) {
    return "Only image and video files are allowed.";
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return `File is too large. Max ${isVideo ? "500MB" : "50MB"} allowed.`;
  }
  return null;
}

export const uploadEventMedia = async (
  eventId: string,
  slot: EventMediaSlot,
  file: File
): Promise<UploadMediaResult> => {
  const validationError = validateMediaFile(file);
  if (validationError) throw new Error(validationError);

  try {
    const uploadRes = await api.post(
      `/Events/${eventId}/media/${slot}/upload-url`,
      null,
      { params: { fileType: file.type, fileSize: file.size } }
    );

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

    await api.post(`/Events/${eventId}/media/${slot}`, {
      key,
      fileType: file.type,
    });

    return { fileUrl, key };
  } catch (error: unknown) {
    const errorMessage =
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      "Event media upload failed";
    throw new Error(errorMessage, { cause: error });
  }
};

export const clearEventMedia = async (eventId: string, slot: EventMediaSlot): Promise<void> => {
  await api.delete(`/Events/${eventId}/media/${slot}`);
};
