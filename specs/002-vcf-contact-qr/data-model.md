# Data Model — VCF Contact QR Code

**Feature**: `002-vcf-contact-qr` | **Date**: 2026-03-23

---

> This feature is **frontend-only** — no server-side model changes. The data model
> describes the client-side entities, DOM state, and JS data structures introduced
> or modified by this feature.

## Existing Entities (unchanged)

### QRGenerateRequest (C# DTO — Models/QRModels.cs)

| Field | Type | Constraints |
|-------|------|-------------|
| Content | string | Required, MaxLength(2048) |
| PixelsPerModule | int | Range(5, 20) |
| DarkColor | string | Hex colour |
| LightColor | string | Hex colour |
| ErrorCorrectionLevel | string | L / M / Q / H |
| LogoBase64 | string? | Nullable, data URI |
| LogoSizeRatio | double | Range(0.05, 0.30) |

**No changes** — the vCard string is sent as the `Content` field. The server treats it as opaque text.

### QRGenerateResponse (C# DTO — Models/QRModels.cs)

| Field | Type |
|-------|------|
| Success | bool |
| ImageBase64 | string? |
| ErrorMessage | string? |

**No changes.**

---

## New Client-Side Entities

### QRMode (JS conceptual enum)

Represents the active input mode. Tracked as a string variable in the IIFE scope.

| Value | Description |
|-------|-------------|
| `'url'` | URL input mode (existing behaviour, default on page load) |
| `'contact'` | Contact form mode (new) |

**Runtime**: `let currentMode = 'url';`

### ContactFormData (JS conceptual structure)

The set of fields in the contact form. These are not stored in a JS object — they live in the DOM `<input>` elements and are read at generate-time.

| Field | DOM ID | Input Type | Required | Validation |
|-------|--------|-----------|----------|------------|
| firstName | `contact-first-name` | text | Conditional* | Non-empty (if lastName is also empty) |
| lastName | `contact-last-name` | text | Conditional* | Non-empty (if firstName is also empty) |
| phone | `contact-phone` | tel | No | `/^[+\d\s\-()]+$/` if non-empty |
| email | `contact-email` | email | No | Must contain "@" if non-empty |
| organisation | `contact-org` | text | No | None |
| jobTitle | `contact-title` | text | No | None |
| website | `contact-website` | url | No | None |

*At least one of firstName or lastName must be non-empty (FR-004).

### VCardString (JS assembled string)

The vCard 3.0 text composed from ContactFormData before sending to the API.

**Structure** (line endings are `\r\n`):

```
BEGIN:VCARD
VERSION:3.0
N:{lastName};{firstName};;;
FN:{displayName}
[TEL;TYPE=CELL:{phone}]       ← only if phone is non-empty
[EMAIL:{email}]                ← only if email is non-empty
[ORG:{organisation}]           ← only if organisation is non-empty
[TITLE:{jobTitle}]             ← only if jobTitle is non-empty
[URL:{website}]                ← only if website is non-empty
END:VCARD
```

**Rules**:
- `displayName` = `[firstName, lastName].filter(Boolean).join(' ')` — always present since at least one name is required.
- `N` field always present: `lastName;firstName;;;` (empty strings are fine in vCard 3.0).
- Lines in `[brackets]` above are conditionally included only when the field has content.
- Special characters in field values: vCard 3.0 requires escaping commas and semicolons with backslash (`\,` and `\;`). Newlines in values must be escaped as `\n`.

**Maximum length**: Varies by ECC level (see R-002 in research.md). Client checks length before API call.

| ECC Level | Max Bytes |
|-----------|-----------|
| L | 2,953 |
| M | 2,331 |
| Q | 1,663 |
| H | 1,273 |

---

## DOM Structure Changes

### Sidebar Body — New Mode Selector (inserted before url-block)

```
New:
  .mode-selector
    input[type=radio]#mode-url (hidden, checked)
    label[for=mode-url].mode-selector__option "URL"
    input[type=radio]#mode-contact (hidden)
    label[for=mode-contact].mode-selector__option "Contact"
```

### URL Block (unchanged structure, visibility toggled)

```
Existing (no HTML changes):
  .url-block                    ← hidden when mode === 'contact'
    .section-label "Content"
    .field-group
      .field-label "URL"
      .input-row
        input#qr-content
        button#generate-btn
      p#content-error
```

### Contact Block (new, sibling after url-block)

```
New:
  .contact-block               ← hidden when mode === 'url' (default)
    .section-label "Content"
    .field-row
      .field-group.field-group--half
        label "First Name"
        input#contact-first-name
        p.field-error#first-name-error
      .field-group.field-group--half
        label "Last Name"
        input#contact-last-name
        p.field-error#last-name-error
    .field-group
      label "Phone"
      input#contact-phone
      p.field-error#phone-error
    .field-group
      label "Email"
      input#contact-email
      p.field-error#email-error
    .field-group
      label "Organisation"
      input#contact-org
    .field-group
      label "Job Title"
      input#contact-title
    .field-group
      label "Website"
      input#contact-website
    button#generate-contact-btn (same style as #generate-btn)
    p.field-error#vcard-length-error
```

### Generate Button

**Design decision**: The Contact block gets its own Generate button (full-width, below the form fields) rather than sharing the URL block's inline button. This is more natural for a multi-field form — the user fills fields top-to-bottom, then clicks Generate at the bottom.

### Output Area — Meta Strip (modified behaviour, same DOM)

```
Existing DOM (unchanged):
  .qr-card__meta
    span#qr-meta-url          ← JS sets this to full name in contact mode
    span#qr-meta-ecc          ← unchanged

JS behaviour change:
  Contact mode: qr-meta-url shows "Jane Doe" (composed full name)
  URL mode:     qr-meta-url shows truncated URL (existing behaviour)
```

### Placeholder Text (modified)

```
Existing:
  .ph-label "Enter a URL and generate"

Modified (JS-driven):
  URL mode:     "Enter a URL and generate"
  Contact mode: "Fill in contact details and generate"
```

---

## State Transitions

```
Page Load
  → currentMode = 'url'
  → url-block visible, contact-block hidden
  → output: placeholder ("Enter a URL and generate")

User clicks "Contact" tab
  → currentMode = 'contact'
  → url-block hidden, contact-block visible
  → output: placeholder ("Fill in contact details and generate")
  → customisation settings unchanged

User clicks "URL" tab
  → currentMode = 'url'
  → url-block visible, contact-block hidden
  → output: placeholder ("Enter a URL and generate")
  → contact form values preserved in DOM (hidden)

User clicks Generate (contact mode)
  → validate fields → if errors, show inline errors, abort
  → assemble vCard string → check length vs ECC limit
  → POST to /api/qr/generate with vCard as Content
  → on success: show result, meta strip = full name + ECC badge
  → on failure: show error section

User clicks Generate (URL mode)
  → existing behaviour unchanged
```

---

## Validation Flow

```
Generate clicked (contact mode)
  │
  ├── Clear all field errors
  │
  ├── Check: firstName OR lastName non-empty?
  │   └── No → show error on first-name field, abort
  │
  ├── Check: phone non-empty AND fails /^[+\d\s\-()]+$/?
  │   └── Yes → show error on phone field, abort
  │
  ├── Check: email non-empty AND missing "@"?
  │   └── Yes → show error on email field, abort
  │
  ├── Assemble vCard string
  │
  ├── Check: vcardString.length > maxBytes[eccLevel]?
  │   └── Yes → show vcard-length-error, abort
  │
  └── Call API with vCard as Content
```
