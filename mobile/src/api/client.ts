import { create, isAxiosError } from "axios";

// The TransitX API (with /api). Built into the app from EXPO_PUBLIC_API_URL; see .env.example.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5000/api";

/** The public website, for links the app opens or shares */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";

const apiClient = create({ baseURL: API_URL, timeout: 15000 });

/** Normalised error thrown by every API helper (same shape as the website's) */
export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    const status = error.response?.status;
    if (data && typeof data === "object") {
      const body = data as { message?: string; msg?: string; code?: string };
      return new ApiError(body.message || body.msg || "Request failed", status, body.code);
    }
    return new ApiError(
      status && status >= 500
        ? "Server error. Please try again later."
        : "Could not reach the server. Check your connection.",
      status,
    );
  }
  return new ApiError(error instanceof Error ? error.message : "Unexpected error");
};

/** Awaits an axios request and returns its data, throwing an ApiError on failure. */
export const call = async <T>(request: Promise<{ data: T }>): Promise<T> => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export default apiClient;
