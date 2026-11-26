/**
 * ArcheOn Design Studio — API Client
 *
 * Central HTTP client for the backend API. Base URL is read from environment.
 * Handles JWT token injection, FormData multipart uploads, and error typing.
 *
 * Usage:
 *   import { apiFetch, loginApi, logoutApi, getStoredUser } from "@/lib/api";
 *   const res = await apiFetch("/api/approvals");
 */

export type ApiErrorKind = "network" | "unauthorized" | "forbidden" | "bad-request" | "server" | "unknown";

export class ApiError extends Error {
  public readonly status: number;
  public readonly kind: ApiErrorKind;
  public readonly body?: unknown;

  constructor(message: string, status: number, kind: ApiErrorKind, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.body = body;
  }
}

export class AuthError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 401, "unauthorized", body);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 403, "forbidden", body);
    this.name = "ForbiddenError";
  }
}

const TOKEN_KEY = "archeon_auth_token";
const REFRESH_TOKEN_KEY = "archeon_refresh_token";
const USER_KEY = "archeon_user";

// Single-flight refresh promise so concurrent 401s never race or wipe a valid session
let refreshInFlight: Promise<{ token: string | null; revoked: boolean }> | null = null;

async function performSingleFlightRefresh(
  baseUrl: string,
): Promise<{ token: string | null; revoked: boolean }> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return { token: null, revoked: true };

  refreshInFlight = (async () => {
    try {
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAuthSession(data.token, data.refreshToken, getStoredUser() || undefined);
        return { token: data.token as string, revoked: false };
      }
      // Before wiping the persistent device session, verify if the access token itself is still accepted
      const currentToken = getAuthToken();
      if (currentToken && (refreshRes.status === 401 || refreshRes.status === 403)) {
        try {
          const meRes = await fetch(`${baseUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (meRes.ok) {
            return { token: currentToken, revoked: false };
          }
        } catch {
          return { token: null, revoked: false };
        }
      }
      // Only treat explicit 401/403 from both refresh & /api/users/me as revoked session
      return { token: null, revoked: refreshRes.status === 401 || refreshRes.status === 403 };
    } catch (err) {
      // Network/offline errors must NOT wipe the persistent device session
      console.warn("Silent token refresh attempt failed:", err);
      return { token: null, revoked: false };
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export interface StoredUser {
  username: string;
  role: string;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, refreshToken?: string, user?: StoredUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `archeon_auth_token=${encodeURIComponent(token)}; path=/; max-age=31536000; SameSite=Lax`;
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      document.cookie = `archeon_refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error("Failed to persist auth session", err);
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = "archeon_auth_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "archeon_refresh_token=; path=/; max-age=0; SameSite=Lax";
  } catch (err) {
    console.error("Failed to clear auth session", err);
  }
}

/** Resolve the API base URL. Prefer NEXT_PUBLIC_API_BASE_URL in client bundles. */
export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
    }
    return "http://localhost:8080";
  }
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/$/, "");
  }
  return "http://localhost:8080";
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request body — JSON-stringified automatically unless FormData. */
  body?: unknown;
  /** Expect a JSON response. Always true by default. */
  expectingJson?: boolean;
}

/**
 * Core JWT-aware fetch wrapper.
 *
 * - Normalises JSON responses
 * - Automatically attaches Bearer token if user is signed in
 * - Safely handles FormData without overriding multipart boundaries
 * - Throws typed errors for 401 / 403 / network failures
 */
export async function apiFetch(
  input: string | URL,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  // Set JSON content-type only if not FormData
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  } else if (isFormData) {
    // Crucial: Delete any Content-Type header so the browser generates the multipart boundary
    headers.delete("Content-Type");
  }

  // Automatically attach Bearer token if available and not explicitly provided
  if (!headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Compute the full URL.
  const baseUrl = resolveApiBaseUrl();
  let url: URL;
  if (typeof input === "string") {
    const trimmed = input.startsWith("http") ? input : `${baseUrl}${input.startsWith("/") ? "" : "/"}${input}`;
    url = new URL(trimmed);
  } else {
    url = input;
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: isFormData
      ? (init.body as FormData)
      : init.body
      ? typeof init.body === "string"
        ? init.body
        : JSON.stringify(init.body)
      : undefined,
  });

  // Handle 401: token missing or expired.
  if (response.status === 401) {
    const isAuthRoute = typeof input === "string" && input.includes("/api/auth/");
    if (isAuthRoute) {
      const body = await response.json().catch(() => ({}));
      const message =
        body && typeof body === "object" && ("message" in body || "error" in body)
          ? String((body as any).message || (body as any).error)
          : "Invalid credentials. Please verify your username and password.";
      throw new AuthError(message, body);
    }

    const { token: refreshedToken, revoked } = await performSingleFlightRefresh(baseUrl);
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      return fetch(url, {
        ...init,
        headers,
        body: isFormData
          ? (init.body as FormData)
          : init.body
          ? typeof init.body === "string"
            ? init.body
            : JSON.stringify(init.body)
          : undefined,
      });
    }
    if (revoked) {
      clearAuthSession();
    }
    throw new AuthError("Session expired or unauthorized. Please log in again.", await response.json().catch(() => ({})));
  }

  // Handle 403: authenticated but not allowed.
  if (response.status === 403) {
    throw new ForbiddenError("Access denied. You do not have permission to perform this action.", await response.json().catch(() => ({})));
  }

  // Handle non-2xx responses as application errors.
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Ignore JSON parse failures.
    }
    const map: Record<number, ApiErrorKind> = {
      400: "bad-request",
      404: "bad-request",
      405: "bad-request",
      409: "bad-request",
      422: "bad-request",
      500: "server",
      502: "server",
      503: "server",
    };
    throw new ApiError(
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${response.status}`,
      response.status,
      map[response.status] ?? "unknown",
      body,
    );
  }

  return response;
}

export async function loginApi(username: string, password: string): Promise<{
  token: string;
  refreshToken?: string;
  username: string;
  role: string;
}> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });

  const data = await res.json();
  const token = data.token;
  const refreshToken = data.refreshToken;
  const user: StoredUser = {
    username: data.username || username,
    role: data.role || "ROLE_CLIENT",
  };

  setAuthSession(token, refreshToken, user);
  return { token, refreshToken, username: user.username, role: user.role };
}

export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
      });
    }
  } catch {
    // Best-effort logout on server
  } finally {
    clearAuthSession();
  }
}

export interface InvitationValidationResult {
  valid: boolean;
  status: string; // PENDING, EXPIRED, REVOKED, ACCEPTED, INVALID
  email?: string;
  recipientName?: string;
  targetRole?: string;
  expiresAt?: string;
  message?: string;
}

export async function validateInvitationApi(token: string): Promise<InvitationValidationResult> {
  const baseUrl = resolveApiBaseUrl();
  const url = new URL("/api/invitations/validate", baseUrl);
  if (token) {
    url.searchParams.set("token", token);
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Cache-Control": "no-cache",
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    return {
      valid: false,
      status: errorBody.status || "INVALID",
      message: errorBody.error || errorBody.message || "Invitation is invalid or unrecognized",
    };
  }
  return res.json();
}

export interface AcceptInvitationPayload {
  token: string;
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  message: string;
  user: {
    id: string;
    username: string;
    role: string;
    fullName?: string;
    email: string;
    phone?: string;
    clientId?: string;
    vendorId?: string;
  };
}

export async function acceptInvitationApi(payload: AcceptInvitationPayload): Promise<AcceptInvitationResult> {
  const baseUrl = resolveApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/invitations/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = body?.error || body?.message || `Activation failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return body;
}
