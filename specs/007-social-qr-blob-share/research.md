# Research: Social Media QR Codes with Blob Storage & Sharing

**Feature**: 007-social-qr-blob-share | **Date**: 2026-03-28 (updated)

## R1: Azure Blob Storage SDK — Per-Blob TTL/Expiration

### Question
How to implement per-blob expiration (TTL) in Azure Blob Storage from .NET?

### Findings

**`Set Blob Expiry` REST API** (and `BlobClient.SetExpiryAsync()` in SDK) is **only available on hierarchical namespace-enabled accounts** (Azure Data Lake Storage Gen2). Standard Blob Storage accounts do not support this operation.

**Alternatives for standard Blob Storage:**

| Approach | Pros | Cons |
|----------|------|------|
| A. Lifecycle management policies | Native Azure feature; no app code for cleanup | Account-level rules only; filters by last-modified/creation time or blob index tags; not per-blob configurable at upload time |
| B. Store expiry in JSON + application-level check | Simple; works on all account types; per-blob granularity | Blobs remain in storage until manually cleaned; no automatic deletion |
| C. Blob index tags + lifecycle management | Per-blob tag sets expiry group; lifecycle rule targets tag | Requires blob index tags (available on GPv2); rule granularity is daily |
| D. HNS-enabled (Data Lake Gen2) account | Native `SetExpiryAsync()` per blob | Changes storage account type; may affect existing deployments |

### Decision
**Option B + C hybrid**: Store the expiry timestamp inside the JSON file. The application checks expiry on every view page access and returns "no longer available" if expired (FR-029). For actual blob cleanup, use **blob index tags** with a lifecycle management policy rule targeting the tag. At upload time, set a blob index tag like `ExpiresOn=2026-04-02` and configure a lifecycle management policy to delete blobs where the tag date has passed.

If blob index tags are unavailable (e.g., development/emulator), the application-level check alone is sufficient — expired blobs simply stay in storage until manually purged. This keeps the application simple (Constitution Principle I) and avoids background workers (Constitution Principle II).

### Rationale
- No background workers needed (constitution compliant)
- Works on standard GPv2 accounts (most common)
- Graceful degradation: app-level check is the primary gate; lifecycle policy is cleanup
- Per-blob granularity via tag + stored timestamp

### Alternatives Considered
- Data Lake Gen2 `SetExpiryAsync()`: rejected because it requires HNS-enabled account
- Azure Functions timer for cleanup: rejected by constitution (no background workers/message queues)
- Lifecycle by last-modified only: insufficient — all blobs would share the same expiry window

---

## R2: SHA-256 + Salt Hashing in .NET 8

### Question
Best practice for hashing a user-provided access code with per-file salt in .NET 8?

### Findings

.NET 8 provides `System.Security.Cryptography.SHA256` and `RandomNumberGenerator` built into the framework — no additional NuGet packages needed.

**Recommended approach:**
```csharp
using System.Security.Cryptography;
using System.Text;

// Generate salt
byte[] salt = RandomNumberGenerator.GetBytes(16); // 128-bit salt

// Hash code with salt
byte[] codeBytes = Encoding.UTF8.GetBytes(accessCode);
byte[] saltedInput = new byte[salt.Length + codeBytes.Length];
Buffer.BlockCopy(salt, 0, saltedInput, 0, salt.Length);
Buffer.BlockCopy(codeBytes, 0, saltedInput, salt.Length, codeBytes.Length);
byte[] hash = SHA256.HashData(saltedInput);

// Store as base64
string saltBase64 = Convert.ToBase64String(salt);
string hashBase64 = Convert.ToBase64String(hash);
```

**Alternative considered: PBKDF2 / bcrypt / Argon2**
- These are designed for password storage with configurable work factors
- For this use case (a simple access code, not a login password, no credential database), SHA-256 + salt is sufficient and aligns with FR-012a
- If the threat model evolves, PBKDF2 via `Rfc2898DeriveBytes` is available in the BCL

### Decision
Use `SHA256.HashData()` with a 16-byte `RandomNumberGenerator` salt. Store both salt and hash as base64 strings in the JSON file. No additional dependencies needed (BCL only — Constitution Principle I/III).

### Rationale
- Built into .NET 8 BCL — no new NuGet dependency
- Sufficient for access code verification (not a password database)
- Simple, auditable implementation

---

## R3: Azure.Storage.Blobs SDK — Upload, Download, Delete, Exists

### Question
What Azure.Storage.Blobs SDK operations are needed and what are best practices?

### Findings

**NuGet package**: `Azure.Storage.Blobs` (latest stable: 12.x)

**Key operations needed:**

| Operation | SDK Method | Notes |
|-----------|-----------|-------|
| Upload JSON | `BlobClient.UploadAsync(BinaryData, overwrite)` | Set `ContentType = "application/json"` via `BlobUploadOptions.HttpHeaders` |
| Download JSON | `BlobClient.DownloadContentAsync()` | Returns `BlobDownloadResult.Content` as `BinaryData` |
| Delete blob | `BlobClient.DeleteIfExistsAsync()` | Idempotent; returns bool |
| Check exists | `BlobClient.ExistsAsync()` | For sequential index collision check |
| Set tags | `BlobClient.SetTagsAsync()` | For lifecycle-based expiry (`ExpiresOn` tag) |
| List by prefix | `BlobContainerClient.GetBlobsAsync(prefix:)` | Alternative for collision check |

**Connection configuration:**
```csharp
// appsettings.json
{
  "BlobStorage": {
    "ConnectionString": "...",
    "ContainerName": "qrstudio-data"
  }
}

// DI registration
builder.Services.AddSingleton(sp => {
    var config = sp.GetRequiredService<IConfiguration>();
    var connStr = config["BlobStorage:ConnectionString"];
    return new BlobServiceClient(connStr);
});
```

**Public access**: Set container access level to `BlobContainerPublicAccessType.Blob` at creation time. This makes individual blobs readable by URL without authentication, while container listing is still private.

### Decision
Use `Azure.Storage.Blobs` v12.x. Register `BlobServiceClient` as singleton via DI. Wrap all blob operations in `IBlobStorageService` (Constitution Principle III). Use `BlobClient.ExistsAsync()` for sequential name collision checks. Set `ContentType` to `application/json`. Handle `RequestFailedException` for graceful degradation (FR-022).

---

## R4: Multi-QR Generation API Design

### Question
How to extend the existing single-QR API to support generating multiple QR codes (vCard + N social media URLs) efficiently?

### Findings

**Current state**: `POST /api/qr/generate` accepts a single `QRGenerateRequest` with one `Content` string and returns one `QRGenerateResponse` with one `ImageBase64`.

**Options:**

| Approach | Description |
|----------|-------------|
| A. Batch endpoint | New `POST /api/qr/generate-batch` accepting array of requests, returning array of responses |
| B. Client-side loop | Frontend calls existing `/api/qr/generate` once per QR code (vCard + each social media) |
| C. New composite endpoint | New `POST /api/qr/generate-contact` accepting full contact data + social URLs, returning all QR codes in one response |

### Decision
**Option C — Composite endpoint**: Create `POST /api/qr/generate-contact` that accepts a `ContactQRRequest` (contact fields, social media entries, customisation settings) and returns a `ContactQRResponse` containing the vCard QR image + an array of social media QR images. This:
- Reduces HTTP round-trips (1 request instead of N+1)
- Keeps the server in control of vCard construction
- Allows the save prompt to happen after one response
- Does not break the existing `/api/qr/generate` endpoint (backward compatible)

### Rationale
- Constitution Principle I: single endpoint is simpler than client orchestration
- Constitution Principle II: all processing server-side
- Constitution Principle III: controller delegates to service; no QR logic in controller

---

## R5: Delete Token Strategy

### Question
How to generate and validate delete tokens securely without a database?

### Findings

Since delete tokens are stored in the JSON file itself (and returned to the client), the token must be:
1. Unpredictable (cryptographically random)
2. Verifiable without a separate database (the blob file IS the store of record)

**Approach**: Generate a 32-byte cryptographically random token using `RandomNumberGenerator.GetBytes(32)`, encode as base64url. Store in the JSON file. On delete request, the server reads the JSON, compares the token, and deletes if matching.

**Flow**:
1. Client calls `POST /api/blob/save` → server generates token, stores in JSON, returns token to client
2. Client calls `DELETE /api/blob/{filename}` with `Authorization: Bearer {token}` header or `{ "deleteToken": "..." }` body
3. Server reads JSON from blob, compares token, deletes blob if match

### Decision
Use `RandomNumberGenerator.GetBytes(32)` → base64url. Token stored in JSON file and returned in save response. Delete endpoint validates by reading blob and comparing. Simple, no external dependencies, no database.

---

## R6: View Page Architecture

### Question
How should the view page code challenge work given the MVC architecture?

### Findings

**Two-phase rendering**:
1. `GET /view/{filename}` → renders a page with just a code entry form (no server-side data fetching yet)
2. `POST /view/{filename}/verify` or client-side `fetch('/api/view/{filename}/verify', { code })` → server reads JSON, compares hash, returns data if valid
3. Client renders QR codes from returned data using same JS logic

**Alternative**: Server-side verification with form POST → full page reload with data. Simpler but less modern.

### Decision
**Hybrid approach**: 
- `GET /view/{filename}` renders a Razor view with a code entry form
- Client JS calls `POST /api/blob/verify` with `{ filename, accessCode }` → server returns JSON data (minus code hash + delete token) if valid, 403 if invalid
- Client JS then calls `POST /api/qr/generate-contact` with returned data to get QR images, OR server returns pre-generated QR images in the verify response
- For code change: `POST /api/blob/change-code` with `{ filename, currentCode, newCode }`

This keeps the view page as a Razor view (consistent with existing architecture) while using Fetch API for the interactive code verification (Constitution Principle V).

---

## R7: In-Memory Rate Limiting for Access Code Verification (FR-038)

### Question
How to implement per-IP, per-file rate limiting (5 attempts/min) without adding NuGet packages (Constitution Principle I)?

### Decision
Use `ConcurrentDictionary<string, List<DateTimeOffset>>` keyed by `"{ip}:{filename}"`. On each verification request, prune entries older than 60 seconds, then check count ≥ 5. Return HTTP 429 if exceeded. Register as singleton `IRateLimitService`.

### Rationale
Built-in .NET APIs only. No external libraries. Sufficient for single-instance deployment. Memory usage is bounded because entries auto-expire on access.

### Alternatives Considered
- `Microsoft.AspNetCore.RateLimiting` (built-in middleware) — Too coarse: works at endpoint level, not per-IP-per-file granularity without complex partition key configuration.
- Redis-based distributed limiting — Violates Constitution II (no outbound calls) and I (new dependency).
- `MemoryCache` with sliding expiration — Possible but `ConcurrentDictionary` is simpler for timestamp list tracking.

---

## R8: Background TTL Cleanup of Expired Blob Files (FR-037)

### Question
How to implement hourly cleanup of expired JSON files from blob storage?

### Decision
Implement `IHostedService` with `PeriodicTimer`. On each tick, list all blobs via `GetBlobsByHierarchyAsync()`, read the `expiresAt` tag for each blob, and delete blobs where `expiresAt < DateTimeOffset.UtcNow`. Interval configurable via `appsettings.json` under `TtlCleanup:IntervalMinutes` (default: 60).

### Rationale
`IHostedService` is built-in ASP.NET Core infrastructure. No new NuGet packages. Tags are already set on blobs at save time by `BlobController.Save`. No need for Azure Functions or external schedulers.

### Alternatives Considered
- Azure Functions Timer Trigger — Separate project, violates Constitution I (single MVC solution).
- Azure Blob Lifecycle Management policies — Azure portal config, not application-controlled; cannot enforce "forever" option per-file granularly.
- No cleanup (manual only) — Violates FR-037.

---

## R9: Web Share API for VCF and Link Sharing (FR-033a, FR-034a)

### Question
How to implement native sharing for VCF files and URLs via vanilla JS?

### Decision
Use `navigator.share()` API with file support for VCF sharing and URL sharing. Feature-detect `navigator.canShare` before invoking. Fall back to:
- VCF: Direct file download via `<a>` element with `download` attribute and `Blob` URL.
- Link: Copy to clipboard via `navigator.clipboard.writeText()` with toast notification.

### Rationale
Web Share API is supported on mobile browsers (Chrome Android, Safari iOS) which are the primary use case for QR sharing. Desktop support is limited but fallback handles it. No library needed — browser-native API. Constitution V compliant.

---

## R10: VCF (vCard) File Generation Client-Side (FR-033)

### Question
How to generate a VCF file from contact data without new dependencies?

### Decision
Build vCard 3.0 string in JavaScript:
```
BEGIN:VCARD
VERSION:3.0
N:{lastName};{firstName};;;
FN:{firstName} {lastName}
TEL;TYPE=WORK,VOICE:{phone}
EMAIL:{email}
ORG:{organisation}
TITLE:{jobTitle}
URL:{website}
END:VCARD
```
Generate as `Blob` in JS with MIME type `text/vcard`, attach to `navigator.share({ files: [vcfFile] })` or trigger download. VCF contains only standard contact fields — no social media URLs per FR-033b.

### Rationale
vCard 3.0 is simple enough to construct as a string. No library needed. Client-side avoids unnecessary server round-trip for pure string formatting.

---

## R11: Access Code Validation Length (FR-012a)

### Question
Spec says "minimum 4 and maximum 6 characters". Current model `SaveRequest.AccessCode` has `StringLength(128, MinimumLength = 1)`. How to align?

### Decision
Update `SaveRequest.AccessCode`, `VerifyCodeRequest.AccessCode`, and `ChangeCodeRequest.CurrentCode`/`NewCode` data annotations to `StringLength(6, MinimumLength = 4)`. Add client-side validation in JS to enable/disable Save button based on code length. Button disabled while typing, enabled when valid length reached (per US1 scenario 10).

### Rationale
Direct implementation of FR-012a. Data annotations provide server-side validation; JS provides UX feedback.

---

## R12: View Page Read-Only vs Full Mode Architecture

### Question
How should the view page handle two modes (read-only and full) within existing Razor + vanilla JS architecture?

### Decision
Single Razor view (`Views/View/Index.cshtml`). On load, JS calls a new `GET /api/blob/read/{slug}` endpoint to fetch contact data (returns data without security fields — no hash, no salt, no delete token). Page renders in read-only mode with QR codes + limited buttons (Copy, Share as VCF, Share by-link). Access code input field always visible. On Enter, JS calls `POST /api/blob/verify` — if successful, server returns full `ContactDataPayload` plus `deleteToken`, page transitions to full mode by toggling CSS classes to show all buttons.

### New Endpoint Needed
`GET /api/blob/read/{filename}` — returns contact data for read-only rendering (excludes `accessCodeHash`, `accessCodeSalt`, `deleteToken`). Different from `POST /api/blob/verify` which requires an access code and returns the delete token.

### Rationale
Server never exposes access code hash to client. Mode toggle is CSS/JS only — no page reload. Follows existing patterns in `site.js`.

---

## R13: Auto-Delete Previous File on Re-Generate (FR-021)

### Question
How to track "previous file" within a session to auto-delete on re-generate?

### Decision
Client-side JS holds `currentFileName` and `currentDeleteToken` in module-scope variables. When user clicks Save again, JS calls `DELETE /api/blob/{currentFileName}` with the delete token before calling `POST /api/blob/save`. If delete fails (already deleted), ignore and proceed with new save.

### Rationale
Session state is client-side only (no server sessions). Constitution V mandates vanilla JS, which can hold variables in script scope. No cookies or localStorage needed.
