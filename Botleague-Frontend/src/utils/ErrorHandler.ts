import { AxiosError } from "axios";

export const getErrorMessage = (error: unknown): string => {

    if (error instanceof AxiosError) {
        return error.response?.data?.error || error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Unexpected error occurred";
};