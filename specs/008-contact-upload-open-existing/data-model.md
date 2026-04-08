# Data Model: Contact Tab Upload & Open Existing

**Feature**: 008-contact-upload-open-existing  
**Date**: 2026-03-31

## Entities

### BlobJsonDocument (existing — no changes)

The existing blob document stored in Azure Blob Storage. No schema changes required.

| Field | Type | Description |
|-------|------|-------------|
| firstName | string | Contact first name |
| lastName | string | Contact last name |
| phone | string? | Phone number |
| email | string? | Email address |
| organisation | string? | Company/organisation |
| jobTitle | string? | Job title |
| website | string? | Website URL |
| photoBase64 | string? | Base64-encoded profile photo |
| socialMedia | SocialMediaEntry[] | Array of social media links |
| pixelsPerModule | int | QR code module size (default: 10) |
| darkColor | string | QR foreground color (default: #0d0d0d) |
| lightColor | string | QR background color (default: #ffffff) |
| errorCorrectionLevel | string | QR ECC level (default: H) |
| logoBase64 | string? | Base64-encoded logo overlay |
| logoSizeRatio | double | Logo size as ratio (default: 0.22) |
| retentionPeriod | string | TTL period (default: 7d) |
| accessCodeHash | string | Hashed access code |
| accessCodeSalt | string | Salt for access code hash |
| deleteToken | string | Token for delete operations |
| expiresAt | string? | ISO 8601 expiration timestamp |
| createdAt | string | ISO 8601 creation timestamp |
| version | int | Schema version (default: 1) |

### ContactDataPayload (existing — no changes)

The DTO used in API requests/responses. Contains all user-facing fields without security fields.

### Contact Data File (existing format — no changes)

The JSON file produced by "Download TXT" and consumed by "Upload". Same shape as `ContactDataPayload` (camelCase JSON).

## New DTOs

### FindByNameRequest (new)

Request body for `POST /api/blob/find`.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| firstName | string | Required | First name to search for |
| lastName | string | Required | Last name to search for |
| accessCode | string | Required, 4–6 chars | Access code to verify against matched blobs |

### FindByNameResponse (new)

Response body from `POST /api/blob/find`.

| Field | Type | Description |
|-------|------|-------------|
| success | bool | Whether a matching contact was found and access code verified |
| contactData | ContactDataPayload? | Contact data (only if success=true) |
| fileName | string? | Blob filename (needed for subsequent update/delete operations) |
| deleteToken | string? | Delete token (only if success=true) |
| errorMessage | string? | Error description (only if success=false) |

## New Service Method

### IBlobStorageService.FindByNamePrefixAsync

```
Task<IReadOnlyList<(string FileName, BlobJsonDocument Document)>> FindByNamePrefixAsync(string firstName, string lastName)
```

Returns all blob documents whose filename starts with the sanitized `{firstName}-{lastName}-` prefix. The controller then iterates results to verify the access code.

## Relationships

```
FindByNameRequest --[POST /api/blob/find]--> BlobController
  --> IBlobStorageService.FindByNamePrefixAsync(firstName, lastName)
    --> returns matching BlobJsonDocuments
  --> IAccessCodeService.VerifyCode(accessCode, doc.Hash, doc.Salt)
    --> if match found: return FindByNameResponse(success=true, contactData)
    --> if no match: return FindByNameResponse(success=false, errorMessage)
```

## State Transitions

### Open Existing Popup States

```
Closed --> [click "Open Existing"] --> Open (empty form)
Open (empty form) --> [fill fields + click "Open"] --> Loading
Loading --> [match found] --> Closed (form populated)
Loading --> [no match] --> Open (error displayed)
Loading --> [server error] --> Open (error displayed)
Open --> [Escape / backdrop click / Cancel] --> Closed (no changes)
```

### Upload Flow States

```
Contact tab visible --> [click "Upload"] --> File picker open
File picker open --> [select valid file] --> Fields populated
File picker open --> [select invalid file] --> Error displayed
File picker open --> [cancel] --> No change
```
