import api from "../../../../shared/api/Base";

export const uploadTeamLogo = async (
  teamId: string,
  file: File
) => {

  try {

    // =====================================
    // STEP 1 → GET PRESIGNED URL
    // =====================================

    const uploadRes = await api.post(

      `/teams/upload/${teamId}/logo`,

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

    // =====================================
    // STEP 2 → UPLOAD FILE TO STORAGE
    // =====================================

    const uploadFileRes = await fetch(
      uploadUrl,
      {
        method: "PUT",

        headers: {
          "Content-Type": file.type,
        },

        body: file,
      }
    );

    if (!uploadFileRes.ok) {

      throw new Error(
        "Upload to storage failed"
      );
    }

    // =====================================
    // STEP 3 → SAVE FILE URL IN BACKEND
    // =====================================

    await api.post(

      `/teams/logo`,

      {
        key,
      },    

      {
        withCredentials: true,
      }
    );

    // =====================================
    // FINAL RESPONSE
    // =====================================

    return {
      fileUrl,
      key,
    };

  } catch (error: unknown) {

    console.error(
      "Upload error:",
      error
    );

    const errorMessage =
      (error as any)?.response?.data?.message ||
      "Upload failed";

    throw new Error(
      errorMessage,
      { cause: error }
    );
  }
};