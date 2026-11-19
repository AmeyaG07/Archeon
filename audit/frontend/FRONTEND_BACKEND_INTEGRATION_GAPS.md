# Frontend–Backend Integration Gaps

**Date:** November 18, 2026

## Confirmed Backend Facts

The backend source currently exposes `POST /api/auth/login` at `AuthController` with:

- Request: `{ "username": string, "password": string }`
- Response: `{ "token": string, "username": string, "role": string }`

It is stateless and reads authentication only from the `Authorization: Bearer <JWT>` header. It does not establish an HTTP-only browser session cookie, and no logout endpoint is present in the inspected controller.

## Blocking Authentication Gap

Next route layouts cannot securely enforce authorization with a JWT that only exists in browser storage. The previous frontend approach was removed because it depended on client-local storage, inferred JWT payload fields, a process-environment placeholder guard, and an unverified logout endpoint.

Before enabling protected portal routes, choose and implement one of these backend-supported contracts:

1. **HTTP-only session cookie:** backend login sets a secure, `HttpOnly`, `SameSite` cookie; Next middleware/server code validates the session or delegates to an authenticated backend session endpoint.
2. **BFF pattern:** Next route handlers own the secure cookie/session and proxy authenticated requests to the Spring backend.
3. **Client-rendered portal only:** browser stores/transports bearer credentials with documented security tradeoffs; server-rendered protection is not claimed.

The chosen design must include token expiry, refresh/re-authentication, logout/revocation semantics, CSRF protection where cookies are used, and route-to-role enforcement.

## Required API Contract Work

The frontend needs confirmed, documented schemas and authorization rules for:

- client projects, documents, notifications, profile, invoices, payment proof, and disputes;
- vendor projects, invoices, notifications, profile, payment history, disputes, and cash settlements;
- administrative summary data, projects, leads, clients, vendors, invoices, audit logs, approvals, and reports;
- document download authorization and content-disposition behavior;
- pagination, filtering, error envelopes, validation errors, and idempotency requirements.

## Finance and Settlement Safety Status

**Not production-ready.** Payment proof, disputes, approval workflow, finance reporting, and cash-settlement acknowledgment/rejection must not be considered enabled based on the present frontend.

Their integration requires accepted backend RBAC/resource-ownership checks, audit trails, idempotency/replay protections, file-upload validation and storage controls, concurrency handling, approval-separation invariants, and end-to-end authorization tests using real roles.

## Environment Configuration

`apiFetch` supports `NEXT_PUBLIC_API_BASE_URL` in the browser and `API_BASE_URL` on the server, with the inherited local-development fallback of `http://localhost:8080`. Production deployments must explicitly set the appropriate API base URL and backend CORS allowed origins.