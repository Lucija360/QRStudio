# Feature Specification: VCF Contact QR Code

**Feature Branch**: `002-vcf-contact-qr`  
**Created**: 2026-03-23  
**Status**: Clarified  
**Input**: User description: "Provide an additional option for generating the QR code with the contact data as a VCF card or similar that can be scanned and request user on mobile devices to import it to the contacts on the phone. Now user can chose to generate the QRCode with URL."

## User Scenarios & Testing

### User Story 1 — Mode Selection: URL vs Contact (Priority: P1)

As a user, I want to choose between generating a QR code from a URL (existing behaviour) or from contact information, so that I can use QR Studio for both web links and digital business cards.

**Why this priority**: Without the mode switch, the contact feature cannot be accessed. This is the entry point for all new functionality and must preserve backward compatibility with the existing URL mode.

**Independent Test**: Load the homepage — a mode selector (URL / Contact) is visible. Selecting URL shows the existing URL input. Selecting Contact shows a contact form. Switching between modes preserves the customisation settings (colours, size, ECC, logo).

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the user sees the sidebar, **Then** a segmented control (pill toggle) with "URL" and "Contact" options is visible, with "URL" highlighted by default.
2. **Given** the mode is "URL", **When** the user switches to "Contact", **Then** the URL input is hidden and a contact form with name, phone, email, and other fields is shown.
3. **Given** the mode is "Contact", **When** the user switches back to "URL", **Then** the contact form is hidden and the URL input reappears with any previously entered URL preserved.
4. **Given** the user switches modes, **When** they inspect the customisation panel (colours, size, ECC, logo), **Then** all customisation values remain unchanged.

---

### User Story 2 — Generate Contact QR Code (Priority: P1)

As a user, I want to fill in my contact details and generate a QR code that encodes a vCard, so that anyone who scans the code with their phone is prompted to save my contact information.

**Why this priority**: This is the core value of the feature — generating the actual contact QR code. Without it the Contact mode is useless.

**Independent Test**: Switch to Contact mode, fill in at least a name and one contact method (phone or email), click Generate, and verify a QR code appears. Scan the QR code with a mobile phone camera and confirm the device offers to add the contact.

**Acceptance Scenarios**:

1. **Given** Contact mode is active and the user has entered a first name and phone number, **When** they click Generate, **Then** a QR code is rendered that encodes a valid vCard 3.0 string.
2. **Given** Contact mode is active and the user has filled in all fields (first name, last name, phone, email, organisation, job title, website), **When** they click Generate, **Then** the QR code encodes all provided fields in the vCard.
3. **Given** Contact mode is active and no fields are filled in, **When** the user clicks Generate, **Then** a validation error appears requesting at least a name.
4. **Given** a contact QR code is generated, **When** a user scans it with a standard mobile QR scanner (iOS Camera, Android built-in), **Then** the device prompts to add the contact to the phone's address book.
5. **Given** a contact QR code is generated, **When** the user clicks Download PNG, Copy, or Share, **Then** all existing output actions work identically to URL mode.

---

### User Story 3 — Contact Form Validation & UX (Priority: P2)

As a user, I want clear feedback when I enter invalid contact data, so that I can fix mistakes before generating an incorrect QR code.

**Why this priority**: Validation ensures data quality. The feature works without sophisticated validation (US2 covers basic "name required"), but good UX demands field-level feedback on obviously incorrect input.

**Independent Test**: In Contact mode, enter invalid data (e.g., letters in the phone field, malformed email) and click Generate — appropriate field-level error messages appear.

**Acceptance Scenarios**:

1. **Given** Contact mode is active, **When** the user submits with an empty name field, **Then** an error message appears on the name field indicating it is required.
2. **Given** Contact mode is active and the user enters an email value, **When** the email format is obviously invalid (no "@"), **Then** a validation hint appears on the email field.
3. **Given** Contact mode is active, **When** the user enters a phone number with letters, **Then** a validation hint appears on the phone field.
4. **Given** Contact mode is active and the user fills valid data, **When** they click Generate, **Then** no validation errors appear and the QR code is generated.

---

### Edge Cases

- What happens when the contact data produces a vCard string exceeding the QR code byte-mode limit (~2,953 bytes at ECC L)? The system must show a user-friendly error suggesting the user reduce the amount of data or lower the error correction level.
- What happens when the user switches from Contact to URL mode after generating a contact QR code? The output area resets to the placeholder state.
- What happens if the user fills only optional fields (e.g., only organisation, no name)? Validation requires at least a first name or last name.
- What happens when special characters are entered (accented characters, CJK script)? The vCard is UTF-8 encoded and QRCoder handles multi-byte content.

## Clarifications

### Session 2026-03-23

- Q: What UI pattern should the mode selector use? → A: Segmented control (pill toggle) — two side-by-side buttons in a rounded container, active one highlighted.
- Q: What should the QR card meta strip show for contact QR codes? → A: The contact's full name (e.g., "John Doe") and the ECC badge.
- Q: Should contact form data persist across page refreshes? → A: No persistence — contact fields start empty on page refresh, consistent with URL mode behaviour. No localStorage.

## Requirements

### Functional Requirements

- **FR-001**: The sidebar MUST display a segmented control (pill toggle) with "URL" and "Contact" options, allowing the user to switch between input modes. The active mode button is visually highlighted within a rounded container.
- **FR-002**: "URL" mode MUST be selected by default on page load, preserving the current behaviour as-is.
- **FR-003**: When "Contact" mode is selected, the system MUST display a contact form with the following fields: First Name, Last Name, Phone, Email, Organisation, Job Title, and Website.
- **FR-004**: At minimum, First Name or Last Name MUST be provided to generate a contact QR code; all other fields are optional.
- **FR-005**: The system MUST compose a vCard 3.0 formatted string from the contact fields on the client side.
- **FR-006**: The composed vCard string MUST be sent to the server as the `Content` field of the existing `QRGenerateRequest` payload.
- **FR-007**: The server-side QR generation MUST encode the vCard string into the QR code without any special processing — it treats the vCard text identically to any other string content.
- **FR-008**: All existing customisation options (foreground colour, background colour, module size, error correction level, logo/watermark) MUST apply equally to both URL and Contact modes.
- **FR-009**: The generated QR code MUST be scannable by standard mobile QR readers (iOS Camera app, Android built-in scanner) and prompt the user to save the contact when the vCard content is detected.
- **FR-010**: Switching between URL and Contact modes MUST preserve customisation settings and previously entered data in each respective mode.
- **FR-011**: The output area (QR image, Download, Copy, Share) MUST reset when the user switches modes.
- **FR-012**: When a contact QR code is generated, the QR card meta strip MUST display the contact's full name (composed from first name and last name) and the ECC level badge — not the raw vCard string.
- **FR-012b**: Field-level validation MUST provide inline error messages for: empty name (required), obviously malformed email (missing "@"), and non-numeric characters in phone.
- **FR-013**: If the vCard string exceeds the maximum encodable length for the selected error correction level, the system MUST display a clear error suggesting the user reduce data or lower the ECC level.
- **FR-014**: The contact form MUST be fully usable on mobile viewports (stacking fields vertically, appropriate input types for phone and email).
- **FR-015**: Contact form data MUST NOT persist across page refreshes. All fields start empty on page load, consistent with URL mode behaviour.

### Key Entities

- **QR Mode**: Enumeration with two values — "url" and "contact" — representing the active input mode. Exists only as client-side UI state.
- **Contact Data**: Structured set of fields (firstName, lastName, phone, email, organisation, jobTitle, website) entered by the user. Composed into a vCard 3.0 string on the client before submission.
- **vCard String**: The assembled `BEGIN:VCARD ... END:VCARD` text (vCard 3.0 format) that is sent as the content payload. The server treats this as opaque text.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can generate a contact QR code in under 30 seconds after switching to Contact mode and filling in name + phone.
- **SC-002**: 100% of generated contact QR codes are scannable by iOS Camera (iOS 15+) and Android's built-in QR scanner (Android 10+), prompting contact import.
- **SC-003**: Switching between URL and Contact modes completes in under 200ms with no visible layout jank.
- **SC-004**: All Contact form fields are reachable and usable on a 375px-wide viewport without horizontal scrolling.
- **SC-005**: Validation errors appear inline within 100ms of the user attempting to generate with invalid data.
- **SC-006**: Existing URL-mode functionality remains fully operational with zero regressions.

## Assumptions

- **vCard 3.0 format**: Chosen for maximum cross-device compatibility. Both iOS and Android natively parse vCard 3.0 from QR code content.
- **Client-side vCard composition**: The vCard string is assembled in JavaScript before sending to the server. This keeps the server-side QR service unchanged (it encodes whatever string it receives). Aligns with Constitution Principle II (self-contained server-side) — the server processes the string; the client just prepares it.
- **No new server-side endpoint**: The existing `/api/qr/generate` endpoint accepts any string content. No new API route or server-side model changes are required.
- **No address field**: A full postal address adds significant complexity (multi-line input, internationalisation). It can be added in a future iteration if needed.
- **Phone validation is lenient**: The phone field accepts digits, spaces, dashes, parentheses, and the "+" prefix. International formats vary too widely for strict validation.
- **UTF-8 encoding**: vCard content uses UTF-8. QRCoder handles multi-byte characters in the content string.
