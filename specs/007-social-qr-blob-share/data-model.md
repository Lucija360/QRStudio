# Data Model: Social Media QR Codes with Blob Storage & Sharing

**Feature**: 007-social-qr-blob-share | **Date**: 2026-03-28 (updated)

## Entities

### SocialMediaEntry

Represents a single social media platform URL and its enabled state.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| Platform | string | Required; one of: LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok | Platform identifier |
| Url | string | Well-formed URL; max 2048 chars; auto-prepend `https://` if no scheme | User-entered profile URL |
| Enabled | bool | — | Whether to generate a QR code for this platform |

### ContactQRRequest (API input)

Extends the generation flow to include contact fields + social media. Sent to `POST /api/qr/generate-contact`.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| FirstName | string | Required; max 100 | Contact first name |
| LastName | string | Required; max 100 | Contact last name |
| Phone | string | Optional; max 30 | Phone number |
| Email | string | Optional; valid email; max 254 | Email address |
| Organisation | string | Optional; max 200 | Organisation name |
| JobTitle | string | Optional; max 200 | Job title |
| Website | string | Optional; valid URL; max 2048 | Personal/company website |
| PhotoBase64 | string? | Optional; max ~1MB base64 | Profile photo for vCard |
| SocialMedia | SocialMediaEntry[] | 0–7 entries | Social media URLs and enable flags |
| PixelsPerModule | int | 5–20; default 10 | QR module pixel size |
| DarkColor | string | Hex color; default #0d0d0d | QR foreground colour |
| LightColor | string | Hex color; default #ffffff | QR background colour |
| ErrorCorrectionLevel | string | L/M/Q/H; default H | QR error correction level |
| LogoBase64 | string? | Optional | Logo overlay for QR codes |
| LogoSizeRatio | double | 0.05–0.30; default 0.22 | Logo size relative to QR |

### ContactQRResponse (API output)

Returned by `POST /api/qr/generate-contact`.

| Field | Type | Description |
|-------|------|-------------|
| Success | bool | Whether generation succeeded |
| VCardImageBase64 | string? | vCard QR code PNG as base64 |
| SocialMediaQRCodes | SocialMediaQRResult[] | Per-platform QR results |
| ErrorMessage | string? | Error description if failed |

### SocialMediaQRResult

| Field | Type | Description |
|-------|------|-------------|
| Platform | string | Platform name (e.g., "LinkedIn") |
| ImageBase64 | string | QR code PNG as base64 |
| Url | string | The URL encoded in the QR code |

### SaveRequest (API input)

Sent to `POST /api/blob/save`.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| ContactData | ContactDataPayload | Required | All form data to persist |
| AccessCode | string | Required; min 4, max 6 chars (FR-012a) | User-chosen access code (plaintext — hashed server-side) |

### ContactDataPayload

The portable data object — this is what goes into the TXT export (minus security fields).

| Field | Type | Description |
|-------|------|-------------|
| FirstName | string | Contact first name |
| LastName | string | Contact last name |
| Phone | string? | Phone number |
| Email | string? | Email address |
| Organisation | string? | Organisation name |
| JobTitle | string? | Job title |
| Website | string? | Personal/company website |
| PhotoBase64 | string? | Profile photo base64 |
| SocialMedia | SocialMediaEntry[] | Social media entries |
| PixelsPerModule | int | QR module pixel size |
| DarkColor | string | QR foreground colour |
| LightColor | string | QR background colour |
| ErrorCorrectionLevel | string | QR ECC level |
| LogoBase64 | string? | Logo overlay base64 |
| LogoSizeRatio | double | Logo size ratio |
| RetentionPeriod | string | Selected retention period |

### BlobJsonDocument

The full JSON document stored in Azure Blob Storage. Superset of `ContactDataPayload` with security fields.

| Field | Type | Description |
|-------|------|-------------|
| *(all ContactDataPayload fields)* | — | All user-entered form data |
| AccessCodeHash | string | Base64-encoded SHA-256 hash of (salt + access code) |
| AccessCodeSalt | string | Base64-encoded 16-byte random salt |
| DeleteToken | string | Base64url-encoded 32-byte random token |
| ExpiresAt | string? | ISO 8601 UTC timestamp; null if retention = forever |
| CreatedAt | string | ISO 8601 UTC timestamp of creation |
| Version | int | Schema version (1 for initial release) |

> **TXT export** = `ContactDataPayload` serialised as JSON. Does NOT include `AccessCodeHash`, `AccessCodeSalt`, `DeleteToken`, `ExpiresAt`, `CreatedAt`, or `Version`.

### SaveResponse (API output)

Returned by `POST /api/blob/save`.

| Field | Type | Description |
|-------|------|-------------|
| Success | bool | Whether save succeeded |
| FileName | string? | Generated blob file name (e.g., `jane-doe-x7k2.json`) |
| DeleteToken | string? | Token for authorising deletion |
| ViewUrl | string? | Application view-page URL (e.g., `/view/jane-doe-x7k2`) |
| ErrorMessage | string? | Error description if failed |

### DeleteRequest (API input)

Sent to `DELETE /api/blob/{filename}`.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| DeleteToken | string | Required | Token from save response |

### VerifyCodeRequest (API input)

Sent to `POST /api/blob/verify`.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| FileName | string | Required | Blob file name |
| AccessCode | string | Required; min 4, max 6 chars (FR-012a) | User-entered access code |

### VerifyCodeResponse (API output)

| Field | Type | Description |
|-------|------|-------------|
| Success | bool | Whether code matched |
| ContactData | ContactDataPayload? | Form data (only if code valid) |
| ErrorMessage | string? | "Invalid access code" if failed |

### ChangeCodeRequest (API input)

Sent to `POST /api/blob/change-code`.

| Field | Type | Validation | Description |
|-------|------|-----------|-------------|
| FileName | string | Required | Blob file name |
| CurrentCode | string | Required; min 4, max 6 chars (FR-012a) | Current access code for verification |
| NewCode | string | Required; min 4, max 6 chars (FR-012a) | New access code |

### ReadContactResponse (new — API output)

Returned by `GET /api/blob/read/{filename}`. For read-only view page rendering.

| Field | Type | Description |
|-------|------|-------------|
| Success | bool | Whether file was found and not expired |
| ContactData | ContactDataPayload? | Form data (excludes security fields) |
| ErrorMessage | string? | Error if file not found or expired |

> This endpoint does NOT return `AccessCodeHash`, `AccessCodeSalt`, or `DeleteToken`. It is used by the view page to render read-only content without authentication.

## State Transitions

```
[Form Entry] --Generate--> [QR Codes Displayed] --Save Prompt-->
  ├── Save (with code) --> [Persisted] --> Share Link / Delete / Download TXT
  └── Drop             --> [Not Persisted] --> Download TXT only

[Persisted] --Delete--> [Deleted] (buttons disappear, file removed)
[Persisted] --Re-generate--> [Previous auto-deleted] --> [Save Prompt again]

[View Page URL] --Enter Code--> 
  ├── Correct --> [Rendered with QR codes + code change field + download]
  └── Incorrect --> [Error, retry]

[View Page] --Change Code--> [New hash stored, old code invalidated]
```

## Relationships

- `ContactQRRequest` → generates → `ContactQRResponse` (1:1)
- `SaveRequest` contains `ContactDataPayload` + `AccessCode` → produces → `BlobJsonDocument` (1:1)
- `BlobJsonDocument` = `ContactDataPayload` + security fields
- `SaveResponse` returns `DeleteToken` + `ViewUrl`
- `VerifyCodeRequest` verifies against `BlobJsonDocument.AccessCodeHash/Salt`
- TXT export = `ContactDataPayload` only (no security fields)
