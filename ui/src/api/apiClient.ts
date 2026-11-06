import axios, { isAxiosError } from "axios";

// All API calls go through this client so they hit the configured backend
// Same-origin "/api" by default (Next rewrites or Vercel routes forward it to the API).
// Set NEXT_PUBLIC_API_URL only when the API is hosted on a different origin.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const TOKEN_KEY = "token";

const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("x-auth-token", token);
  }
  return config;
});

/** Normalised error thrown by every API helper */
export class ApiError extends Error {
  readonly status?: number;
  readonly errors?: string[];
  /** Machine-readable reason from the API, e.g. "captcha_required" */
  readonly code?: string;

  constructor(message: string, status?: number, errors?: string[], code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data;
    const status = error.response?.status;
    if (data && typeof data === "object") {
      const body = data as { message?: string; msg?: string; errors?: string[]; code?: string };
      return new ApiError(
        body.message || body.msg || "Request failed",
        status,
        body.errors,
        body.code,
      );
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

/** Message to show for a failed request or mutation (TanStack Query errors are ApiErrors). */
export const errorMessage = (error: unknown, fallback: string): string =>
  (error instanceof Error && error.message) || fallback;
