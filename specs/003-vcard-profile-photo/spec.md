# Feature Specification: vCard Profile Photo

**Feature Branch**: `003-vcard-profile-photo`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Extend the vCard generation with the possibility to upload a profile photo. User can choose if to generate the QR code with photo or without."

## User Scenarios & Testing

### User Story 1 — Upload Profile Photo (Priority: P1)

As a user in Contact mode, I want to upload a profile photo that will be embedded in the vCard, so that when someone scans my QR code their phone shows my photo alongside my contact details.

**Why this priority**: Uploading and previewing the photo is the prerequisite for all other stories. Without an image attached, the "include photo" toggle has nothing to act on.

**Independent Test**: Switch to Contact mode → click the photo upload area → select an image → a circular preview of the photo appears in the contact form. Remove the photo → the upload area returns to its default state.

**Acceptance Scenarios**:

1. **Given** the user is in Contact mode, **When** they look at the contact form, **Then** a photo upload area is visible above the name fields with a placeholder icon and "Add photo" label.
2. **Given** the photo upload area is visible, **When** the user clicks it and selects a valid image (PNG, JPG, or WebP, ≤2 MB), **Then** a circular thumbnail preview of the image replaces the placeholder.
3. **Given** a photo preview is shown, **When** the user clicks the remove button on the preview, **Then** the photo is removed and the placeholder upload area is restored.
4. **Given** the user is in Contact mode, **When** they drag and drop an image onto the photo upload area, **Then** the photo is accepted and previewed, same as file picker selection.
5. **Given** the user selects a file that is not an image or exceeds 2 MB, **When** the upload is processed, **Then** an inline error message appears (e.g., "Please select a valid image file" or "Image must be smaller than 2 MB") and no preview is shown.

---

### User Story 2 — Include/Exclude Photo Toggle (Priority: P1)

As a user, I want to choose whether my profile photo is included in the generated QR code, so that I can control the QR code size and complexity.

**Why this priority**: Photos significantly increase the vCard payload size and may push the QR code beyond its capacity limit. Users must have an explicit opt-in so they can generate lightweight QR codes when desired.

**Independent Test**: Upload a photo → a checkbox "Include photo in QR code" appears below the preview → uncheck it → Generate → scan the QR code → no photo is shown in the contact import. Re-check it → Generate → scan → photo appears.

**Acceptance Scenarios**:

1. **Given** a photo has been uploaded, **When** the user views the contact form, **Then** an "Include photo in QR code" checkbox appears below the photo preview, checked by default.
2. **Given** no photo is uploaded, **When** the user views the contact form, **Then** the "Include photo in QR code" checkbox is not visible.
3. **Given** a photo is uploaded and the checkbox is checked, **When** the user clicks Generate, **Then** the vCard contains a `PHOTO` property with the image data and the resulting QR code is scannable.
4. **Given** a photo is uploaded and the checkbox is unchecked, **When** the user clicks Generate, **Then** the vCard does NOT contain a `PHOTO` property, producing a smaller QR code.
5. **Given** a photo is uploaded and the checkbox is checked, **When** the user removes the photo, **Then** the checkbox disappears and the next generation will not contain a photo.

---

### User Story 3 — Photo Size Warning & Auto-Downscale (Priority: P2)

As a user, I want the system to warn me or automatically handle the case when the photo makes the vCard too large for QR encoding, so that I am not blocked from generating a working QR code.

**Why this priority**: A raw photo can easily be hundreds of KB, far exceeding QR capacity. Without handling this, the feature would fail silently or frustrate users. However, the basic happy path (US1+US2) can work with very small images even without this story.

**Independent Test**: Upload a large photo with "Include photo" checked → attempt Generate → the system automatically downscales the image to fit within the QR limit, or displays a clear warning about the size limit if it still cannot fit.

**Acceptance Scenarios**:

1. **Given** a photo is uploaded and "Include photo" is checked, **When** the user clicks Generate and the resulting vCard (including Base64-encoded photo) exceeds the QR byte limit for the selected ECC level, **Then** the system automatically downscales and compresses the photo (reducing resolution and compression quality) to fit within the limit.
2. **Given** auto-downscale is attempted, **When** the photo still cannot fit within the limit even at minimum quality, **Then** the system shows an error message: "Photo is too large to include at the current error correction level. Try unchecking 'Include photo' or lowering the error correction level."
3. **Given** auto-downscale succeeds, **When** the QR code is generated, **Then** the QR code is scannable and the contact import on a phone shows the photo (possibly at reduced quality).
4. **Given** the selected ECC level is L (maximum capacity), **When** the vCard without photo is ~500 bytes, **Then** the remaining capacity is available for the Base64-encoded photo data.

---

### Edge Cases

- What happens when the user uploads a very small image (e.g., 16×16 pixels)? The system accepts it as-is; no minimum resolution is enforced.
- What happens when the user switches from Contact to URL mode after uploading a photo? The photo is preserved so it is still available when switching back to Contact mode.
- What happens when the user uploads a photo, unchecks "Include photo", and clicks Generate? The vCard is generated without the photo property — identical to the no-photo flow.
- What happens when the user uploads a new photo while one is already previewed? The new photo replaces the old one and the preview updates immediately.
- What happens when the photo is embedded but the QR code is scanned on an older device? vCard 3.0 `PHOTO` fields with Base64-encoded JPEG are widely supported on iOS 9+ and Android 5+. Older devices may ignore the photo but still import the contact text fields.
- What happens when the user refreshes the page while a photo is uploaded? The photo is cleared (no persistence), consistent with existing behaviour.

## Requirements

### Functional Requirements

- **FR-001**: The contact form MUST include a photo upload area positioned above the name fields, accepting PNG, JPG, and WebP images up to 2 MB.
- **FR-002**: The photo upload area MUST support both click-to-browse and drag-and-drop interactions, consistent with the existing logo upload pattern.
- **FR-003**: When a valid photo is selected, the system MUST display a circular thumbnail preview of the image within the upload area.
- **FR-004**: The user MUST be able to remove an uploaded photo via a remove button on the preview, restoring the upload area to its default state.
- **FR-005**: When a photo is uploaded, an "Include photo in QR code" checkbox MUST appear below the photo preview, checked by default.
- **FR-006**: When no photo is uploaded, the "Include photo in QR code" checkbox MUST NOT be visible.
- **FR-007**: When the checkbox is checked and the user generates a QR code, the vCard string MUST include a `PHOTO` property with the image data encoded as Base64 JPEG.
- **FR-008**: When the checkbox is unchecked, the vCard string MUST NOT include a `PHOTO` property, regardless of whether a photo is uploaded.
- **FR-009**: Before including the photo in the vCard, the system MUST convert the uploaded image to JPEG and resize it to a thumbnail (starting at 96×96 px, falling back to 64×64 and 48×48 per FR-010) to minimise the encoded data size.
- **FR-010**: If the resulting vCard (including the Base64-encoded photo) exceeds the QR byte limit for the selected ECC level, the system MUST progressively reduce compression quality to attempt to fit.
- **FR-011**: If the photo cannot fit within the QR limit even at minimum quality, the system MUST display a clear error message suggesting the user uncheck "Include photo" or lower the ECC level.
- **FR-012**: The uploaded photo MUST be preserved when switching between URL and Contact modes, consistent with existing field preservation behaviour.
- **FR-013**: The uploaded photo MUST NOT persist across page refreshes, consistent with the no-persistence principle.
- **FR-014**: The photo upload area and "Include photo" checkbox MUST be fully usable on mobile viewports.
- **FR-015**: All existing Contact mode functionality (form fields, validation, vCard generation without photo, meta strip display) MUST remain fully operational.

### Key Entities

- **Profile Photo**: A user-uploaded image (PNG, JPG, or WebP) that is converted to a Base64-encoded JPEG thumbnail and optionally embedded in the vCard `PHOTO` property.
- **Include Photo Flag**: A boolean client-side state (checkbox) controlling whether the photo is embedded in the generated vCard.
- **vCard PHOTO Property**: The vCard 3.0 field `PHOTO;ENCODING=b;TYPE=JPEG:{base64data}` appended to the vCard string when the flag is enabled and a photo is present.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can upload a photo, preview it, and generate a contact QR code with the embedded photo in under 45 seconds, measured from entering Contact mode to a visible QR code on screen.
- **SC-002**: 100% of generated QR codes with embedded photos are scannable by iOS Camera (iOS 15+) and Android's built-in scanner (Android 10+), and the phone displays the contact photo upon import.
- **SC-003**: The photo upload interaction (select file → preview visible) completes in under 500ms on a modern mid-range device (e.g., 2020+ laptop or smartphone with 4+ GB RAM).
- **SC-004**: When auto-downscale is needed, the compression process completes in under 2 seconds.
- **SC-005**: The photo upload area and checkbox are fully reachable and usable on a 375px-wide viewport without horizontal scrolling.
- **SC-006**: Existing Contact mode functionality (form fields, validation, generate without photo) has zero regressions.

## Assumptions

- **Client-side JPEG conversion**: All uploaded images (PNG, WebP) are converted to JPEG on the client side using a canvas element for resizing and compression. This avoids server-side changes.
- **Small thumbnail dimensions**: A 96×96 pixel JPEG at quality 0.7 produces roughly 5–8 KB of Base64 data (4–6 KB raw × 4/3 Base64 ratio), which exceeds QR capacity at all ECC levels. The progressive quality reduction algorithm (FR-010) downscales dimensions (96→64→48 px) and quality (0.7→0.1) until the vCard fits. At 64×64/Q0.5 (~2–3.3 KB Base64), most ECC L/M payloads fit. At 48×48/Q0.3 (~0.9–1.3 KB), even ECC H payloads fit. This balances photo recognisability with QR size constraints.
- **Minimal server-side change**: The photo is embedded in the vCard string as Base64 text. The server continues to treat the Content field as opaque text. The only server-side change required is increasing the `StringLength` annotation on `Content` from 2048 to 4096 to accommodate vCard + Base64 photo payloads. No new API endpoints, controllers, services, or dependencies are needed.
- **vCard 3.0 PHOTO encoding**: Uses `PHOTO;ENCODING=b;TYPE=JPEG:{base64data}` format per RFC 2426, which is widely supported by iOS and Android contact import.
- **Progressive quality reduction**: When the vCard exceeds the QR byte limit, the system reduces JPEG quality in steps (e.g., 0.7 → 0.5 → 0.3 → 0.1) and retries until it fits or reaches the minimum threshold.
- **No crop UI**: The photo is resized proportionally to fit the thumbnail dimensions (cover/centre behaviour via canvas). A crop/rotate UI would add significant complexity and is deferred to a future iteration.
