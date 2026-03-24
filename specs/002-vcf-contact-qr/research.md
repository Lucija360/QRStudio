# Research — VCF Contact QR Code

**Feature**: `002-vcf-contact-qr` | **Date**: 2026-03-23

---

## R-001: vCard 3.0 Format — Structure & Compatibility

**Context**: FR-005 requires composing a vCard 3.0 string on the client side.

**Decision**: Use vCard 3.0 (RFC 2426) with UTF-8 charset declarations for maximum cross-device compatibility.

**Rationale**:
- vCard 3.0 is universally supported by iOS (all versions), Android (4.0+), and all major contact apps.
- vCard 4.0 (RFC 6350) exists but has inconsistent support on older Android devices and some enterprise apps.
- vCard 2.1 is legacy and lacks proper UTF-8 support.
- The minimal vCard 3.0 structure:

```
BEGIN:VCARD
VERSION:3.0
N:{lastName};{firstName};;;
FN:{firstName} {lastName}
TEL;TYPE=CELL:{phone}
EMAIL:{email}
ORG:{organisation}
TITLE:{jobTitle}
URL:{website}
END:VCARD
```

- Empty/omitted fields simply omit the corresponding line (no blank `TEL:` lines).
- Line endings MUST be `\r\n` (CRLF) per RFC 2426.
- The `N` field uses semicolons to separate: `lastName;firstName;middleName;prefix;suffix`. We populate only the first two.
- The `FN` (Formatted Name) field is **required** in vCard 3.0 — it's the display name shown on phones.

**Alternatives considered**:
- vCard 4.0 (rejected — inconsistent Android support; no benefit for our simple use case).
- MECARD format (rejected — limited to name/phone/email; no org/title/website support; less widely recognized than vCard).
- Server-side vCard assembly (rejected — Constitution Principle II; unnecessary since the server treats content as opaque text).

---

## R-002: QR Code Capacity for vCard Content

**Context**: Edge case from spec — vCard string could exceed QR code character limits.

**Decision**: Validate vCard string length on the client before sending to the server. Show a user-friendly error if it exceeds the limit for the selected ECC level.

**QR Code capacity (alphanumeric, Version 40)**:

| ECC Level | Max Characters (binary/byte mode) |
|-----------|----------------------------------|
| L | 2,953 bytes |
| M | 2,331 bytes |
| Q | 1,663 bytes |
| H | 1,273 bytes |

**Practical analysis**:
- A maximal vCard with all 7 fields fully filled (firstName: 50, lastName: 50, phone: 20, email: 50, org: 100, title: 50, website: 100 chars) → ~520 characters including vCard boilerplate.
- This is well within even ECC H (1,273 bytes).
- Overflow is theoretically possible only with extremely long values. The existing server-side `Content` field has a 2,048-character limit (data annotation), which already caps the input.
- **Implementation**: Check `vcardString.length > maxForEcc[selectedLevel]` before calling the API. Use the byte-mode limits above. If exceeded, show inline error: "Contact data is too long for the selected error correction level. Try removing some fields or lowering the error correction level."

**Alternatives considered**:
- Relying solely on server-side error (rejected — poor UX; client-side check is instant and informative).
- Splitting into multiple QR codes (rejected — out of scope; Constitution Principle I).

---

## R-003: Segmented Control (Pill Toggle) — UI Pattern

**Context**: FR-001 requires a segmented control for URL/Contact mode switching.

**Decision**: Build a custom CSS segmented control using radio buttons with styled labels, matching the existing design system.

**Design approach**:
- Two `<input type="radio">` elements (visually hidden) paired with `<label>` elements inside a rounded container.
- The active label receives the `.active` class via JS on change, which makes it visually highlighted (dark background, light text) matching `--accent` / `--accent-fg`.
- The container has `border-radius: var(--radius-sm)` and `border: 1px solid var(--border)` to form the pill shape.
- Transition between states uses `var(--transition)` (150ms) for smooth background/color changes.
- The toggle sits at the top of the sidebar-body, above the existing content blocks.

**Rationale**:
- Radio buttons provide native keyboard navigation (arrow keys) and screen reader support for free.
- No new dependencies — pure CSS + minimal JS event listener.
- Consistent with the existing `.btn` and `.input` styling patterns.

**Alternatives considered**:
- `<select>` dropdown (rejected — less discoverable; segmented control is better UX for 2 options).
- Tab component (rejected — semantically wrong; these aren't tab panels with persistent content).
- Third-party toggle library (rejected — Constitution Principle V; vanilla JS only).

---

## R-004: Contact Form Field Types & Mobile UX

**Context**: FR-003 and FR-014 require a contact form usable on mobile viewports.

**Decision**: Use semantic HTML input types for each field to trigger appropriate mobile keyboards.

**Field mapping**:

| Field | Input Type | Placeholder | Mobile Keyboard |
|-------|-----------|-------------|-----------------|
| First Name | `text` | "Jane" | Standard |
| Last Name | `text` | "Doe" | Standard |
| Phone | `tel` | "+49 123 456 7890" | Phone dial pad |
| Email | `email` | "jane@example.com" | Email keyboard (@ visible) |
| Organisation | `text` | "Acme Corp" | Standard |
| Job Title | `text` | "Software Engineer" | Standard |
| Website | `url` | "https://example.com" | URL keyboard |

**Layout**:
- First Name + Last Name on the same row (50/50 split) on desktop; stack vertically on mobile (≤768px).
- All other fields full-width, stacked vertically.
- The form lives inside a `.contact-block` container styled identically to the existing `.url-block` (surface-2 background, border, radius, padding).

**Rationale**: Semantic input types improve mobile UX significantly (phone shows numpad, email shows @ key). Constitution Principle V requires mobile usability.

**Alternatives considered**:
- All `type="text"` (rejected — loses mobile keyboard optimization).
- Multi-step form/wizard (rejected — overcomplicated for 7 fields; Constitution Principle I).

---

## R-005: Client-Side Validation Strategy

**Context**: FR-012 (duplicate numbering in spec — the validation one) requires inline field-level validation.

**Decision**: Validate on form submit (Generate click), not on blur, to avoid premature error noise. Show/hide error messages per field.

**Validation rules**:

| Field | Rule | Error Message |
|-------|------|---------------|
| First Name + Last Name | At least one must be non-empty | "Please enter a first name or last name." |
| Email | If non-empty, must contain "@" | "Please enter a valid email address." |
| Phone | If non-empty, must match `/^[+\d\s\-()]+$/` | "Phone may only contain digits, spaces, dashes, and +." |
| All others | No validation (optional, free-text) | — |

**Implementation**:
- Each field has a sibling `<p class="field-error" hidden>` element (same pattern as existing `#content-error`).
- On Generate click: clear all errors → run validators → if any fail, show errors and abort → if all pass, assemble vCard and call API.
- Error appearance uses the existing `.field-error` class (`color: var(--danger); font-size: .75rem`).

**Rationale**: 
- Validate-on-submit matches the existing URL input pattern (error shown only after clicking Generate).
- Lenient phone validation accommodates international formats (Principle I — avoid over-engineering).
- Email validation checks only for "@" presence — full RFC 5322 regex is overkill for a "hint" (spec says "obviously invalid").

**Alternatives considered**:
- Real-time validation on blur (rejected — inconsistent with existing UX; premature errors annoy users).
- HTML5 `required` + `pattern` attributes (rejected — browser-native validation bubbles are ugly and not customizable to match design system).
- External validation library (rejected — Constitution Principle V).

---

## R-006: Meta Strip Display for Contact QR Codes

**Context**: FR-012 (the meta strip one) requires showing the contact's full name + ECC badge instead of the raw vCard string.

**Decision**: When in Contact mode, set `qrMetaUrl.textContent` to the composed full name (e.g., "John Doe") instead of calling `truncateUrl()`.

**Implementation**:
- In the `generate()` function, after a successful response:
  - If mode === 'contact': `qrMetaUrl.textContent = [firstName, lastName].filter(Boolean).join(' ')`
  - If mode === 'url': `qrMetaUrl.textContent = truncateUrl(content)` (existing behavior)
- ECC badge remains unchanged (`qrMetaEcc.textContent = eccMap[eccValue]`).

**Rationale**: Simple string concatenation, no new DOM elements needed. Reuses existing meta strip layout.

---

## R-007: Mode Switching — State Preservation & Output Reset

**Context**: FR-010 requires preserving data in each mode when switching. FR-011 requires resetting the output area.

**Decision**: Keep both form sections in the DOM; toggle visibility via `hidden` attribute. Store no state externally — the DOM inputs themselves hold the values.

**Implementation**:
- Both `.url-block` and `.contact-block` exist in the HTML at all times.
- When switching to Contact: `urlBlock.hidden = true; contactBlock.hidden = false`
- When switching to URL: `contactBlock.hidden = true; urlBlock.hidden = false`
- On any mode switch: call `showSection('placeholder')` to reset the output area.
- No localStorage, no sessionStorage, no JS state objects — field values are preserved in the DOM `<input>` elements naturally.

**Rationale**: 
- Toggling `hidden` is the simplest approach (Constitution Principle I).
- DOM inputs retain their values when hidden — no serialization/deserialization needed.
- FR-015 says no persistence across page refreshes — already satisfied since we store nothing.
- Output reset on switch matches spec: "output area resets to the placeholder state."

**Alternatives considered**:
- Remove/re-create DOM nodes on switch (rejected — destroys entered values; requires state management).
- CSS `display:none` via class toggle (rejected — `[hidden]` is already styled with `display:none !important` in the existing CSS reset).
