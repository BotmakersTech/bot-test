import api from "../../../shared/api/Base";

export const uploadRobotImage = async (
  robotId: string,
  file: File
) => {

  try {

    // =========================
    // STEP 1 → GET PRESIGNED URL
    // =========================

    const uploadRes = await api.post(
      `/robots/${robotId}/upload-url`,
      null,
      {
        params: {
          fileType: file.type,
          fileSize: file.size,
        },
        withCredentials: true,
      }
    );

    const {
      uploadUrl,
      fileUrl,
      key,
    } = uploadRes.data;

    // =========================
    // STEP 2 → UPLOAD TO R2
    // =========================

    const uploadFileRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadFileRes.ok) {
      throw new Error("Upload to storage failed");
    }

    // =========================
    // STEP 3 → SAVE IN BACKEND
    // =========================

    await api.post(
      `/robots/${robotId}/media`,
      {
        fileUrl: key,
        fileType: file.type,
      },
      {
        withCredentials: true,
      }
    );

    return {
      fileUrl,
      key,
    };

  } catch (error: unknown) {

    console.error(
      "Robot image upload error:",
      error
    );

    const errorMessage =
      (error as any)?.response?.data?.message ||
      "Robot image upload failed";

    throw new Error(errorMessage, {
      cause: error,
    });
  }
};