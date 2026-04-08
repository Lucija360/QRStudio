# API Contracts: Social Media QR Codes with Blob Storage & Sharing

**Feature**: 007-social-qr-blob-share | **Date**: 2026-03-28 (updated)

---

## 1. Generate Contact QR Codes

**Endpoint**: `POST /api/qr/generate-contact`  
**Purpose**: Generate vCard QR code + individual social media QR codes in one request.

### Request

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1-555-0123",
  "email": "jane@example.com",
  "organisation": "Acme Corp",
  "jobTitle": "Engineer",
  "website": "https://jane.dev",
  "photoBase64": "iVBORw0KGgo...",
  "socialMedia": [
    { "platform": "LinkedIn", "url": "https://linkedin.com/in/janedoe", "enabled": true },
    { "platform": "GitHub", "url": "https://github.com/janedoe", "enabled": true },
    { "platform": "Instagram", "url": "", "enabled": false }
  ],
  "pixelsPerModule": 10,
  "darkColor": "#0d0d0d",
  "lightColor": "#ffffff",
  "errorCorrectionLevel": "H",
  "logoBase64": null,
  "logoSizeRatio": 0.22
}
```

### Response — 200 OK

```json
{
  "success": true,
  "vCardImageBase64": "iVBORw0KGgo...",
  "socialMediaQRCodes": [
    { "platform": "LinkedIn", "imageBase64": "iVBORw0KGgo...", "url": "https://linkedin.com/in/janedoe" },
    { "platform": "GitHub", "imageBase64": "iVBORw0KGgo...", "url": "https://github.com/janedoe" }
  ],
  "errorMessage": null
}
```

### Response — 400 Bad Request

```json
{
  "success": false,
  "vCardImageBase64": null,
  "socialMediaQRCodes": [],
  "errorMessage": "FirstName is required."
}
```

### Notes
- Only platforms with `enabled: true` and a non-empty `url` produce QR codes
- Existing `POST /api/qr/generate` remains unchanged (backward-compatible)

---

## 2. Save Contact Data to Blob Storage

**Endpoint**: `POST /api/blob/save`  
**Purpose**: Persist form data as JSON to Azure Blob Storage with access code protection.

### Request

```json
{
  "contactData": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "email": "jane@example.com",
    "organisation": "Acme Corp",
    "jobTitle": "Engineer",
    "website": "https://jane.dev",
    "photoBase64": "iVBORw0KGgo...",
    "socialMedia": [
      { "platform": "LinkedIn", "url": "https://linkedin.com/in/janedoe", "enabled": true }
    ],
    "pixelsPerModule": 10,
    "darkColor": "#0d0d0d",
    "lightColor": "#ffffff",
    "errorCorrectionLevel": "H",
    "logoBase64": null,
    "logoSizeRatio": 0.22,
    "retentionPeriod": "7d"
  },
  "accessCode": "mySecret123"
}
```

### Response — 200 OK

```json
{
  "success": true,
  "fileName": "jane-doe-x7k2.json",
  "deleteToken": "a3FkbGZqa2xkc2Zqa2xkZmprbGRzZmpsa2Rz...",
  "viewUrl": "/view/jane-doe-x7k2",
  "errorMessage": null
}
```

### Response — 400 Bad Request

```json
{
  "success": false,
  "fileName": null,
  "deleteToken": null,
  "viewUrl": null,
  "errorMessage": "AccessCode is required."
}
```

### Server-Side Behaviour
1. Generate filename: `{firstname}-{lastname}` → lowercase, strip non-alphanumeric → append random 4-char alphanumeric suffix (always) → check uniqueness → append sequential numeric index if name+suffix collision (FR-011)
2. Generate 16-byte salt, SHA-256 hash `salt + accessCode`
3. Generate 32-byte delete token (base64url)
4. Compute `expiresAt` from `retentionPeriod` (null if "forever")
5. Upload `BlobJsonDocument` to container
6. Set blob index tags: `expiresAt={ISO8601}`, `retention={period}`
7. If user had a previously saved blob, auto-delete it

---

## 3. Delete Contact Data from Blob Storage

**Endpoint**: `DELETE /api/blob/{filename}`  
**Purpose**: GDPR deletion — permanently remove a stored JSON file.

### Request

**URL**: `/api/blob/jane-doe-x7k2.json`  
**Body**:

```json
{
  "deleteToken": "a3FkbGZqa2xkc2Zqa2xkZmprbGRzZmpsa2Rz..."
}
```

### Response — 200 OK

```json
{
  "success": true,
  "errorMessage": null
}
```

### Response — 403 Forbidden

```json
{
  "success": false,
  "errorMessage": "Invalid delete token."
}
```

### Response — 404 Not Found

```json
{
  "success": false,
  "errorMessage": "File not found."
}
```

### Notes
- Token comparison is constant-time to prevent timing attacks
- Blob is permanently deleted — no soft-delete

---

## 4. Verify Access Code (View Page)

**Endpoint**: `POST /api/blob/verify`  
**Purpose**: Validate access code and return contact data for the view page.

### Request

```json
{
  "fileName": "jane-doe-x7k2.json",
  "accessCode": "mySecret123"
}
```

### Response — 200 OK (code valid)

```json
{
  "success": true,
  "contactData": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "email": "jane@example.com",
    "organisation": "Acme Corp",
    "jobTitle": "Engineer",
    "website": "https://jane.dev",
    "photoBase64": null,
    "socialMedia": [
      { "platform": "LinkedIn", "url": "https://linkedin.com/in/janedoe", "enabled": true }
    ],
    "pixelsPerModule": 10,
    "darkColor": "#0d0d0d",
    "lightColor": "#ffffff",
    "errorCorrectionLevel": "H",
    "logoBase64": null,
    "logoSizeRatio": 0.22,
    "retentionPeriod": "7d"
  },
  "deleteToken": "a3FkbGZqa2xkc2Zqa2xkZmprbGRzZmpsa2Rz...",
  "errorMessage": null
}
```

### Response — 200 OK (code invalid)

```json
{
  "success": false,
  "contactData": null,
  "errorMessage": "Invalid access code."
}
```

### Response — 404 Not Found

```json
{
  "success": false,
  "contactData": null,
  "errorMessage": "File not found or expired."
}
```

### Notes
- Returns 200 even if code is wrong (prevents enumeration of valid filenames by differentiating 404 vs 403)
- Server checks `expiresAt` and returns 404 if expired
- Hash comparison is constant-time

---

## 5. Change Access Code

**Endpoint**: `POST /api/blob/change-code`  
**Purpose**: Allow user to update the access code on the view page.

### Request

```json
{
  "fileName": "jane-doe-x7k2.json",
  "currentCode": "mySecret123",
  "newCode": "newSecret456"
}
```

### Response — 200 OK

```json
{
  "success": true,
  "errorMessage": null
}
```

### Response — 200 OK (current code invalid)

```json
{
  "success": false,
  "errorMessage": "Invalid current access code."
}
```

### Server-Side Behaviour
1. Download blob, verify `currentCode` against stored hash/salt
2. Generate new 16-byte salt, SHA-256 hash `newSalt + newCode`
3. Update `AccessCodeHash` and `AccessCodeSalt` in document
4. Re-upload blob (overwrite)

---

## 6. View Page (Razor)

**Route**: `GET /view/{slug}`  
**Controller**: `ViewController.Index(string slug)`

### Behaviour
1. Razor renders shell page with slug embedded — no server-side blob fetch
2. On page load, JavaScript calls `GET /api/blob/read/{slug}` (§7) to fetch contact data
3. JavaScript renders contact info as formatted read-only text + calls `POST /api/qr/generate-contact` to generate QR codes
4. Page displays in **read-only mode** with Copy, Share as VCF, and Share by-link buttons (FR-032, FR-035e)
5. Access code input field is shown; user optionally enters code and presses Enter
6. JavaScript calls `POST /api/blob/verify` — on success, page transitions to **full mode**: all buttons enabled (Save, Delete, Copy, Share as VCF, Share by-link, Download), editable access code field shown, "Change Access Code" section becomes available
7. Download TXT button (full mode only) exports `ContactDataPayload` without security fields

### No Server-Side Data Exposure
- The Razor action does NOT load blob data — it only renders the page shell
- Read-only data flows through `GET /api/blob/read` (unauthenticated, §7)
- Full data (including deleteToken) flows through `POST /api/blob/verify` (authenticated, §4)

---

## 7. Read Contact Data (Read-Only View)

**Endpoint**: `GET /api/blob/read/{filename}`  
**Purpose**: Fetch contact data for read-only view page rendering. No authentication required.

### Response — 200 OK

```json
{
  "success": true,
  "contactData": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "email": "jane@example.com",
    "organisation": "Acme Corp",
    "jobTitle": "Engineer",
    "website": "https://jane.dev",
    "photoBase64": null,
    "socialMedia": [
      { "platform": "LinkedIn", "url": "https://linkedin.com/in/janedoe", "enabled": true }
    ],
    "pixelsPerModule": 10,
    "darkColor": "#0d0d0d",
    "lightColor": "#ffffff",
    "errorCorrectionLevel": "H",
    "logoBase64": null,
    "logoSizeRatio": 0.22,
    "retentionPeriod": "7d"
  },
  "errorMessage": null
}
```

### Response — 404 Not Found

```json
{
  "success": false,
  "contactData": null,
  "errorMessage": "This contact card is no longer available."
}
```

### Security
- Does **NOT** return `accessCodeHash`, `accessCodeSalt`, or `deleteToken`
- Checks `expiresAt` — returns 404 if expired
- Used by view page JS on initial load for read-only rendering

---

## Rate Limiting (FR-038)

- `POST /api/blob/verify` is rate-limited to **5 failed attempts per IP per file per minute**
- After limit exceeded: HTTP 429 (Too Many Requests)
- Response body: `{ "success": false, "errorMessage": "Too many attempts. Please wait and try again." }`
- Implementation: in-memory `ConcurrentDictionary` in `RateLimitService` (no new NuGet)

---

## Button Visibility Matrix

| Button | After Generate (no save) | After Save | View (read-only) | View (full mode) |
|--------|--------------------------|------------|-------------------|-------------------|
| Save | ✅ Enabled | ✅ Enabled | ❌ Hidden | ✅ Enabled |
| Delete | ❌ Disabled | ✅ Enabled | ❌ Hidden | ✅ Enabled |
| Copy | ❌ Disabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| Share as VCF | ✅ Enabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| Share by-link | ❌ Disabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| Download | ✅ Enabled | ✅ Enabled | ❌ Hidden | ✅ Enabled |

---

## TXT Export Format

File name: `{firstname}-{lastname}-contact.txt` (FR-015)  
Content: JSON matching `ContactDataPayload` structure.  
**Excludes**: `accessCodeHash`, `accessCodeSalt`, `deleteToken`, `expiresAt`, `createdAt`, `version`.

---

## Configuration

```json
{
  "BlobStorage": {
    "ConnectionString": "...",
    "ContainerName": "qrstudio-contacts"
  },
  "TtlCleanup": {
    "IntervalMinutes": 60,
    "Enabled": true
  }
}
```
