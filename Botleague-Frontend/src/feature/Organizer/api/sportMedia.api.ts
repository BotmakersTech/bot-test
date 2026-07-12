import api from "../../../shared/api/Base";
import { validateMediaFile, type UploadMediaResult } from "./eventMedia.api";

export type SportMediaSlot = "THUMBNAIL" | "TEASER";

export const uploadSportMedia = async (
  eventId: string,
  sportId: string,
  slot: SportMediaSlot,
  file: File
): Promise<UploadMediaResult> => {
  const validationError = validateMediaFile(file);
  if (validationError) throw new Error(validationError);

  try {
    const uploadRes = await api.post(
      `/events/${eventId}/sports/${sportId}/media/${slot}/upload-url`,
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

    await api.post(`/events/${eventId}/sports/${sportId}/media/${slot}`, {
      key,
      fileType: file.type,
    });

    return { fileUrl, key };
  } catch (error: unknown) {
    const errorMessage =
      (error as any)?.response?.data?.message ||
      (error as Error)?.message ||
      "Sport media upload failed";
    throw new Error(errorMessage, { cause: error });
  }
};

export const clearSportMedia = async (
  eventId: string,
  sportId: string,
  slot: SportMediaSlot
): Promise<void> => {
  await api.delete(`/events/${eventId}/sports/${sportId}/media/${slot}`);
};
