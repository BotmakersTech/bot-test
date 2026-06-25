import api from "../../../shared/api/Base";

export interface UploadEventImageResult {
    fileUrl: string;
    key: string;
}

export const uploadEventImage = async (
    eventId: string,
    file: File
): Promise<UploadEventImageResult> => {

    try {

        // =====================================================
        // 1) GET PRESIGNED URL
        // =====================================================

        const uploadRes = await api.post(
            `/Events/${eventId}/upload-url`,
            null,
            {
                params: {
                    fileType: file.type,
                    fileSize: file.size,
                },
            }
        );

        const { uploadUrl, fileUrl, key } = uploadRes.data;

        // Defensive check: surfaces a clear error if UploadResponse
        // uses different field names than expected.
        if (!uploadUrl || !key) {
            throw new Error("Invalid upload URL response from server");
        }

        // =====================================================
        // 2) UPLOAD FILE TO R2 (presigned PUT)
        // =====================================================

        const uploadFileRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type, // must match the signed content-type
            },
            body: file,
        });

        if (!uploadFileRes.ok) {
            throw new Error("Upload to storage failed");
        }

        // =====================================================
        // 3) SAVE KEY ON THE EVENT ROW
        // =====================================================

        await api.post(
            `/Events/${eventId}/media`,
            {
                key,
                fileType: file.type,
            }
        );

        return { fileUrl, key };

    } catch (error: unknown) {

        console.error("Event image upload error:", error);

        const errorMessage =
            (error as any)?.response?.data?.message ||
            (error as Error)?.message ||
            "Event image upload failed";

        throw new Error(errorMessage, { cause: error });
    }
};