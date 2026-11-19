# ArcheOn Design Studio — Phase 4.3 API Endpoint Inventory
## Document Management System (DMS) & Secure Storage Endpoints

**Phase:** 4.3 — Document Management  
**Branch:** `backend/phase4.3-document-management`  
**Base Commit:** `506d2eb2ba788c3cbeb59c119508b021466b4cef`  
**Date:** 2026-11-18  

---

### Endpoint Summary Table

| HTTP Method | Route | Controller Method | Authentication | Required Roles / Permissions | Ownership / Scope Enforcement | Description |
|:---|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/documents/upload` | `uploadDocument` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `CLIENT`, `VENDOR` | Clients restricted to `clientId`; Vendors must have `ACTIVE` project assignment; non-staff forced to `PUBLIC_CLIENT` | Upload new document with initial version (v1) |
| `GET` | `/api/documents` | `listDocuments` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `FINANCE_*`, `CLIENT`, `VENDOR` | Filtered by role and ownership: Client sees only their documents; Vendor sees only assigned project documents with explicit grants; Finance restricted to finance docs | List authorized documents with optional filtering |
| `GET` | `/api/documents/{id}` | `getDocumentById` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `FINANCE_*`, `CLIENT`, `VENDOR` | Dynamic BOLA evaluation: Client ownership, Vendor active assignment + grant, Finance/Legal compartmentalization | Retrieve single document metadata with current active version |
| `GET` | `/api/documents/{id}/download` | `downloadDocument` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `FINANCE_*`, `CLIENT`, `VENDOR` | Read authorization check; Quarantined documents restricted to `ADMIN`/`STAFF` | Stream file content bytes for active head version |
| `POST` | `/api/documents/{id}/versions` | `uploadVersion` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `CLIENT`, `VENDOR` | Write authorization check: Clients for `PUBLIC_CLIENT`; Vendors require `READ_WRITE` permission; Prohibited if document is `ARCHIVED` | Upload a new version (vN+1) to an existing document |
| `GET` | `/api/documents/{id}/versions` | `getDocumentVersions` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `FINANCE_*`, `CLIENT`, `VENDOR` | Read authorization check on target document | Retrieve version history list (numbers, filenames, sizes, hashes, uploaders) |
| `GET` | `/api/documents/{id}/versions/{versionNumber}/download` | `downloadDocumentVersion` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT`, `FINANCE_*`, `CLIENT`, `VENDOR` | Read authorization check on target document; Quarantined versions restricted to `ADMIN`/`STAFF` | Stream file content bytes for a specific version number |
| `PATCH` | `/api/documents/{id}/classification` | `updateClassification` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only; Prohibited on `ARCHIVED` documents | Change document security classification (`PUBLIC_CLIENT`, `INTERNAL_STAFF`, `CONFIDENTIAL_FINANCE`, `RESTRICTED_LEGAL`) |
| `POST` | `/api/documents/{id}/permissions` | `grantPermission` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only; Grantee validation: Vendor must have `ACTIVE` project assignment; Prohibited on `ARCHIVED` documents | Grant explicit document permission to vendor or client organization |
| `DELETE` | `/api/documents/{id}/permissions/{permissionId}` | `revokePermission` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only; Prohibited on `ARCHIVED` documents | Revoke an explicit document permission grant |
| `POST` | `/api/documents/{id}/archive` | `archiveDocument` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only | Transition document to `ARCHIVED` status (freezing all future mutations) |
| `POST` | `/api/documents/{id}/restore` | `restoreDocument` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only | Restore archived document back to `AVAILABLE` status |
| `POST` | `/api/documents/{id}/release-quarantine` | `releaseQuarantine` | Required (JWT) | `ADMIN` only | System Administrator only | Release quarantined document and all quarantined versions to `AVAILABLE`/`CLEARED` |
| `GET` | `/api/documents/{id}/audit` | `getDocumentAuditTrail` | Required (JWT) | `ADMIN`, `STAFF`, `PROJECT_MANAGER`, `PRINCIPAL_ARCHITECT` | Internal staff only | Retrieve chronological audit trail events for document lifecycle |

---

### Detailed Endpoint Specifications

#### 1. Upload Document (`POST /api/documents/upload`)
- **Content-Type:** `multipart/form-data`
- **Request Form Parts:**
  - `file`: Binary file stream (max 25MB). Whitelisted types: `.pdf`, `.dwg`, `.dxf`, `.png`, `.jpg`, `.jpeg`, `.xlsx`, `.csv`. Executables rejected immediately.
  - `title`: String (required, 1-255 chars).
  - `category`: String (required). One of: `CONTRACT`, `BLUEPRINT_DRAWING`, `SPECIFICATION`, `INVOICE_RECEIPT`, `SITE_PHOTO`, `LEGAL_PERMIT`, `OTHER`.
  - `description`: String (optional).
  - `securityClassification`: String (optional, default `INTERNAL_STAFF`).
  - `clientId`: UUID (optional).
  - `projectId`: UUID (optional).
- **Responses:**
  - `201 Created`: Returns `DocumentResponse` with metadata and version 1 details.
  - `400 Bad Request`: Disallowed extension, magic byte mismatch, size limit exceeded, invalid category/classification.
  - `403 Forbidden`: Unauthenticated, client attempting to assign someone else's `clientId`, vendor lacking active project assignment.

#### 2. Download File (`GET /api/documents/{id}/download` and `GET /api/documents/{id}/versions/{versionNumber}/download`)
- **Responses:**
  - `200 OK`: File byte stream (`InputStreamResource`) with response headers:
    - `Content-Disposition: attachment; filename="<original_filename>"`
    - `Content-Type: <verified_mime_type>`
    - `Content-Length: <file_size_bytes>`
    - `X-Checksum-SHA256: <sha256_hex_string>`
  - `403 Forbidden`: Unauthorized user, cross-client violation, terminated vendor access, non-finance user accessing `CONFIDENTIAL_FINANCE`, quarantined file accessed by non-admin.
  - `404 Not Found`: Document or version does not exist.
