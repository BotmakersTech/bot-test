import api from "../../../shared/api/Base";
import { toAvatarSentinel } from "../constants/avatars";

/**
 * Selects a predefined avatar as the profile picture. Reuses the exact same
 * save endpoint the upload flow's step 3 already calls — a predefined avatar
 * isn't a file, so there's nothing to presign/upload, just persist the
 * sentinel key ("avatar:<key>") in the same field a real upload's storage
 * key would occupy.
 */
export const selectAvatar = async (avatarKey: string) => {
  await api.post(
    "/profile/photo",
    { fileUrl: toAvatarSentinel(avatarKey) },
    { withCredentials: true }
  );
  return toAvatarSentinel(avatarKey);
};

export const uploadProfileImage = async (file: File) => {
    
  try {
    // =========================
    // STEP 1 → GET PRESIGNED URL
    // =========================
    const uploadRes = await api.post(
      `/profile/upload`,
      null, // no body
      {
        params: {
          fileType: file.type,
          fileSize: file.size,
        },
        withCredentials: true, // ✅ correct for axios
      }
    );
// const normalizedType =  file.type === "image/jpg" ? "image/jpeg" : file.type;
    const { uploadUrl, fileUrl, key } = uploadRes.data;

    // =========================
    // STEP 2 → UPLOAD TO R2 (still fetch)
    // =========================
    const uploadFileRes = await fetch(uploadUrl, {
      method: "PUT",
     
      body: file,
    });

    if (!uploadFileRes.ok) {
      throw new Error("Upload to storage failed");
    }

    // =========================
    // STEP 3 → SAVE IN BACKEND (axios)
    // =========================
    await api.post(
      "/profile/photo",
      {
        fileUrl: key, // ✅ only key
      },
      {
        withCredentials: true,
      }
    );

    return { fileUrl, key };
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errorMessage = (error as any)?.response?.data?.message || "Upload failed";
    throw new Error(errorMessage, { cause: error });
  }
};