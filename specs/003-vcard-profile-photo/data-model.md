# Data Model — vCard Profile Photo

**Feature**: `003-vcard-profile-photo` | **Date**: 2026-03-24

---

> This feature is **primarily frontend** with one server-side annotation change.
> The data model describes the server-side model change, new client-side entities,
> DOM state, and JS data structures introduced or modified.

## Modified Server-Side Entity

### QRGenerateRequest (C# DTO — Models/QRModels.cs)

| Field | Type | Constraints | Change |
|-------|------|-------------|--------|
| Content | string | Required, **StringLength(4096)** | **CHANGED**: was StringLength(2048) |
| PixelsPerModule | int | Range(5, 20) | unchanged |
| DarkColor | string | Hex colour | unchanged |
| LightColor | string | Hex colour | unchanged |
| ErrorCorrectionLevel | string | L / M / Q / H | unchanged |
| LogoBase64 | string? | Nullable, data URI | unchanged |
| LogoSizeRatio | double | Range(0.05, 0.30) | unchanged |

**Why the change**: vCard strings with an embedded Base64 JPEG photo (PHOTO property) can reach ~3000–3500 characters. The previous 2048 limit is insufficient. 4096 provides headroom for the largest practical photo payloads while maintaining server-side protection. See R-004 in research.md.

### QRGenerateResponse (C# DTO — Models/QRModels.cs)

No changes.

---

## New Client-Side Entities

### ProfilePhotoState (JS conceptual structure)

Tracks the uploaded profile photo in the IIFE scope. Not stored as a named object — uses individual variables.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `photoBase64` | string \| null | `null` | Base64 data URI of the original uploaded image (full resolution) |
| `includePhoto` | bool | `true` | Whether to embed the photo in the vCard (checkbox state) |

**Lifecycle**:
- Set when user uploads a file via the photo upload zone
- Cleared when user clicks the photo remove button
- Cleared on page refresh (no persistence — consistent with existing behaviour)
- Preserved across URL ↔ Contact mode switches

### PhotoThumbnailResult (JS conceptual structure)

Returned by the progressive compression function. Not stored as a named object — used as a transient return value.

| Field | Type | Description |
|-------|------|-------------|
| `base64Data` | string | Raw Base64 string of the compressed JPEG (no data URI prefix) |
| `dimensions` | number | Pixel width/height of the produced thumbnail (e.g. 96, 64, 48) |
| `quality` | number | JPEG quality used (e.g. 0.7, 0.5, 0.3, 0.1) |

### VCardString — Extended with PHOTO property

The vCard 3.0 text composed from ContactFormData, now optionally including a PHOTO property.

**Structure** (line endings are `\r\n`):

```
BEGIN:VCARD
VERSION:3.0
N:{lastName};{firstName};;;
FN:{displayName}
[TEL;TYPE=CELL:{phone}]
[EMAIL:{email}]
[ORG:{organisation}]
[TITLE:{jobTitle}]
[URL:{website}]
[PHOTO;ENCODING=b;TYPE=JPEG:{base64data}]   ← NEW: only if photo uploaded AND checkbox checked
END:VCARD
```

**Rules** (additions to spec-002 rules):
- The PHOTO line is inserted before `END:VCARD` only when `photoBase64 !== null` AND `includePhoto === true`
- `{base64data}` is the raw Base64 string (no data URI prefix, no line folding)
- The PHOTO property uses `ENCODING=b` (vCard 3.0 standard) and `TYPE=JPEG`
- The photo is always converted to JPEG regardless of upload format (PNG, WebP)

---

## DOM Structure Changes

### Contact Block — New Photo Upload Area (inserted above name fields)

```
New (at top of .contact-block, before .field-row containing name fields):
  .photo-upload
    .photo-upload__zone#photo-upload-zone
      .photo-upload__placeholder#photo-placeholder
        svg (camera/person icon)
        span "Add photo"
      img.photo-upload__preview#photo-preview (hidden, circular)
      button.photo-upload__remove#remove-photo (hidden) "✕"
      input[type=file]#photo-file (accept="image/png,image/jpeg,image/webp", hidden)
    .photo-upload__options#photo-options (hidden)
      label
        input[type=checkbox]#include-photo (checked)
        span "Include photo in QR code"
    p.field-error#photo-error (hidden)
```

### Existing Elements (unchanged structure)

- `.mode-selector` — no changes
- `.url-block` — no changes
- `.contact-block` — existing fields (name, phone, email, org, title, website, generate button, vcard-length-error) remain; photo upload is prepended above name fields
- `.customise-block` — no changes
- `.upload-block` (logo) — no changes
- Output area — no changes

---

## State Transitions

### Photo Upload State Machine

```
[No Photo]
  ├── user uploads valid file → [Photo Previewed]
  └── user uploads invalid file → show error → [No Photo]

[Photo Previewed]
  ├── user clicks remove → [No Photo]
  ├── user uploads new file → [Photo Previewed] (replace)
  ├── user unchecks "Include photo" → [Photo Previewed, Excluded]
  ├── user clicks Generate (checkbox checked) → [Compressing]
  └── user clicks Generate (checkbox unchecked) → generate without photo

[Photo Previewed, Excluded]
  ├── user checks "Include photo" → [Photo Previewed]
  ├── user clicks remove → [No Photo]
  └── user clicks Generate → generate without photo

[Compressing]
  ├── fits within QR capacity → generate QR code
  └── no combination fits → show error ("Photo too large...")
```

### Mode Switching (updated from spec-002)

```
URL → Contact: photoBase64 is preserved (if any); photo preview remains
Contact → URL: photoBase64 is preserved (if any); photo upload zone hidden with URL block
```

---

## Validation Rules (additions)

| Rule | Location | Behaviour |
|------|----------|-----------|
| File type must be PNG, JPG, or WebP | Client (JS) | Reject with inline error |
| File size ≤ 2 MB | Client (JS) | Reject with inline error |
| vCard + photo ≤ QR capacity | Client (JS) | Progressive reduce; error if impossible |
| Content ≤ 4096 chars | Server (data annotation) | 400 Bad Request |

---

## Byte Budget Analysis

For reference — maximum available bytes for the PHOTO Base64 payload, assuming 400-byte contact data:

| ECC Level | Total Capacity | Contact (~400 B) | PHOTO Header (~30 B) | Available for Base64 |
|-----------|---------------|-------------------|-----------------------|---------------------|
| L         | 2953          | 400               | 30                    | ~2520               |
| M         | 2331          | 400               | 30                    | ~1900               |
| Q         | 1663          | 400               | 30                    | ~1230               |
| H         | 1273          | 400               | 30                    | ~840                |
