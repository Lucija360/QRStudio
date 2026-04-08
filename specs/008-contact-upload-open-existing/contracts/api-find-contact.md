# API Contract: Find Contact by Name

**Feature**: 008-contact-upload-open-existing  
**Date**: 2026-03-31

## New Endpoint

### POST /api/blob/find

Searches for a saved contact by first name + last name prefix, then verifies the access code against all matching blobs. Returns the contact data if exactly one match is found and the access code is correct.

#### Request

```http
POST /api/blob/find
Content-Type: application/json
```

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "accessCode": "1234"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| firstName | string | Yes | Non-empty |
| lastName | string | Yes | Non-empty |
| accessCode | string | Yes | 4–6 characters |

#### Response — Success (200 OK)

```json
{
  "success": true,
  "fileName": "jane-doe-a7x2.json",
  "deleteToken": "abc123...",
  "contactData": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+49 123 456 7890",
    "email": "jane@example.com",
    "organisation": "Acme Corp",
    "jobTitle": "Software Engineer",
    "website": "https://example.com",
    "photoBase64": "data:image/png;base64,...",
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
  }
}
```

#### Response — Not Found (200 OK, success=false)

Returned when no blob matches the name prefix, the access code is wrong for all matching blobs, or all matching blobs are expired.

```json
{
  "success": false,
  "errorMessage": "No matching contact found. Please check your name and access code."
}
```

#### Response — Validation Error (400 Bad Request)

```json
{
  "success": false,
  "errorMessage": "First name is required. Access code must be between 4 and 6 characters."
}
```

#### Response — Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "errorMessage": "Too many attempts. Please wait and try again."
}
```

#### Security Notes

- Rate limiting applied per IP address using existing `IRateLimitService`
- Generic error message regardless of whether name exists or access code is wrong (prevents enumeration)
- Access code verified server-side via `IAccessCodeService.VerifyCode`
- Expired blobs are excluded from results

---

## Modified Endpoints

No existing endpoints are modified. The existing `POST /api/blob/save`, `GET /api/blob/read/{filename}`, `POST /api/blob/verify`, `POST /api/blob/change-code`, and `DELETE /api/blob/{filename}` remain unchanged.

---

## UI Contracts

### Upload Button (Contact Tab Top)

- **Element**: `<button>` with class `btn btn--outline` and id `upload-contact-btn`
- **Position**: First element inside `.contact-block`, above photo upload zone
- **Behavior**: Triggers hidden `<input type="file">` with `accept=".txt,.json"`
- **Feedback**: Error message in adjacent `<p class="field-error">` on parse failure

### Open Existing Button (Contact Tab Top)

- **Element**: `<button>` with class `btn btn--outline` and id `open-existing-btn`
- **Position**: Adjacent to Upload button (same row)
- **Info icon**: `<span>` with class `info-icon` and `title` attribute for tooltip
- **Behavior**: Opens modal overlay

### Open Existing Modal

- **Backdrop**: `<div>` with class `modal-backdrop`, `position: fixed; inset: 0`
- **Dialog**: `<div>` with class `modal-dialog open-existing-modal`
- **Fields**: First Name (`<input>`), Last Name (`<input>`), Access Code (`<input type="password">`)
- **Actions**: "Open" button (primary), implicit close via backdrop click / Escape
- **Feedback**: Error message `<p class="field-error">` inside modal on failure
- **Loading state**: "Open" button shows spinner during API call (reuse `btn__spinner` pattern)
