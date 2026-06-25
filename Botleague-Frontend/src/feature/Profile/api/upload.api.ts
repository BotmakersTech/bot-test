import api from "../../../shared/api/Base";

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