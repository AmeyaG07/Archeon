/**
 * ArcheOn Design Studio — API Client
 *
 * Central HTTP client for the backend API. Base URL is read from environment.
 *
 * Usage:
 *   import { apiFetch } from "@/lib/api";
 *   const res = await apiFetch("/api/approvals/config");
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

/** Resolve the API base URL. Prefer NEXT_PUBLIC_API_BASE_URL in client bundles. */
export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client bundle: use the public env var baked at build time.
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
    }
    // Fallback for dev: match the previous hardcoded localhost behaviour.
    return "http://localhost:8080";
  }
  // Server-side: prefer a server-only var if present (not in this codebase).
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/$/, "");
  }
  // Fallback: localhost (only if no server env var is set).
  return "http://localhost:8080";
}

const BASE_URL = resolveApiBaseUrl();

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request body — will be JSON-stringified automatically. */
  body?: unknown;
  /** Expect a JSON response. Always true by default. */
  expectingJson?: boolean;
}

/**
 * Core JWT-aware fetch wrapper.
 *
 * - Normalises JSON responses
 * - Throws typed errors for 401 / 403 / network failures
 */
export async function apiFetch(
  input: string | URL,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  // Always JSON unless explicitly overridden (e.g. file download).
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Compute the full URL.
  let url: URL;
  if (typeof input === "string") {
    const trimmed = input.startsWith("http") ? input : `${BASE_URL}${input.startsWith("/") ? "" : "/"}${input}`;
    url = new URL(trimmed);
  } else {
    url = input;
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body: init.body instanceof FormData ? init.body : init.body ? JSON.stringify(init.body) : undefined,
  });

  // Handle 401: token missing or expired.
  if (response.status === 401) {
    throw new AuthError("Session expired. Please log in again.", await response.json().catch(() => ({})));
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
