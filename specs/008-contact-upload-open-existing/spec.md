# Feature Specification: Contact Tab Upload & Open Existing

**Feature Branch**: `008-contact-upload-open-existing`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: User description: "Remove the Drop Button. Move the Upload button on top of Contact tab to enable uploading existing contact data previously saved via Download. Add a new Open Existing button that opens a popup with FirstName, LastName, Access Code fields and an Open button. Provide an info icon explaining the feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Drop Button (Priority: P1)

As a user on the Contact tab, I no longer see the "Drop" button in the save/drop prompt after generating a contact QR code. The save prompt only shows the "Save" button and access code input. This simplifies the workflow by removing the option to discard contact data without saving.

**Why this priority**: Removing the Drop button is the simplest change and eliminates a confusing action that could lead to accidental data loss.

**Independent Test**: Generate a contact QR code and verify the save prompt no longer contains a "Drop" button. Only the "Save" button and access code input are visible.

**Acceptance Scenarios**:

1. **Given** a user has generated a contact QR code, **When** the save prompt appears, **Then** there is no "Drop" button visible
2. **Given** a user is on the save prompt, **When** they look at the available actions, **Then** only "Save" is available as an action button

---

### User Story 2 - Move Upload Button to Top of Contact Tab (Priority: P1)

As a user on the Contact tab, I see an "Upload" button positioned at the top of the Contact tab (above the photo upload and contact form fields). When I click "Upload", I can select a previously downloaded contact data file (TXT/JSON) to restore all contact fields. This allows me to quickly reload saved contact data without manually re-entering fields.

**Why this priority**: Moving Upload to the top of the Contact tab makes it the first action users see, enabling a fast workflow for returning users who previously saved their contact data via the Download button.

**Independent Test**: Switch to the Contact tab and verify the Upload button appears at the top. Click it, select a previously downloaded TXT file, and confirm all contact fields are populated.

**Acceptance Scenarios**:

1. **Given** a user switches to the Contact tab, **When** the tab renders, **Then** an "Upload" button is visible at the top, above the photo upload and contact form fields
2. **Given** a user clicks the Upload button, **When** they select a valid previously-downloaded contact data file, **Then** all contact form fields are populated with the data from the file
3. **Given** a user clicks the Upload button, **When** they select an invalid or corrupted file, **Then** an error message is displayed and no fields are modified
4. **Given** a user has already entered some contact data, **When** they upload a file, **Then** the existing fields are overwritten with the uploaded data

---

### User Story 3 - Open Existing Contact via Popup (Priority: P2)

As a user on the Contact tab, I see an "Open Existing" button. When I click it, a popup/modal dialog appears with three input fields: First Name, Last Name, and Access Code. After filling in all three fields, I click "Open" inside the popup to retrieve and load a previously saved contact from the server. This enables users to access their cloud-saved contact data from any device.

**Why this priority**: This feature adds a new retrieval path (server-side lookup) that complements the file-based Upload. It depends on the existing save/access-code infrastructure and is slightly more complex.

**Independent Test**: Click "Open Existing", fill in First Name, Last Name, and Access Code in the popup, click "Open", and verify the contact form is populated with the retrieved data.

**Acceptance Scenarios**:

1. **Given** a user is on the Contact tab, **When** they click "Open Existing", **Then** a popup/modal dialog appears with First Name, Last Name, and Access Code input fields plus an "Open" button
2. **Given** the popup is open, **When** the user fills in all three fields and clicks "Open", **Then** the system looks up the matching contact and populates the contact form with the retrieved data
3. **Given** the popup is open, **When** the user submits with a non-matching combination, **Then** an error message is shown inside the popup indicating no matching contact was found
4. **Given** the popup is open, **When** the user leaves any of the three fields empty and clicks "Open", **Then** validation errors are shown for the empty fields
5. **Given** the popup is open, **When** the user clicks outside the popup or presses Escape, **Then** the popup closes without making any changes

---

### User Story 4 - Info Icon for Open Existing (Priority: P3)

As a user, I see an info icon near the "Open Existing" button. When I hover over (or tap on mobile) the info icon, a tooltip displays: "You can open existing contact card — provide first name, last name and access code." This helps users understand the purpose of the Open Existing feature.

**Why this priority**: Discoverability enhancement — the core functionality works without it, but it helps new users understand the feature.

**Independent Test**: Verify the info icon is visible next to "Open Existing". Hover over it and confirm the tooltip text appears.

**Acceptance Scenarios**:

1. **Given** the Contact tab is visible, **When** the user looks at the "Open Existing" button area, **Then** an info icon (ⓘ) is displayed near the button
2. **Given** the info icon is visible, **When** the user hovers over it (desktop) or taps it (mobile), **Then** a tooltip appears with the text "You can open existing contact card — provide first name, last name and access code"
3. **Given** the tooltip is visible, **When** the user moves the cursor away, **Then** the tooltip disappears

---

### Edge Cases

- What happens when the user uploads a file that was downloaded from a different version of the application with a different data format?
- What happens when the user tries to "Open Existing" with correct first/last name but wrong access code?
- What happens when the server is unreachable while trying to open an existing contact?
- What happens when multiple saved contacts share the same first name and last name but have different access codes?
- What happens when the popup is open and the user navigates away from the Contact tab?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the "Drop" button from the save prompt that appears after generating a contact QR code
- **FR-002**: System MUST display an "Upload" button at the top of the Contact tab, positioned above the photo upload area and all contact form fields
- **FR-003**: The Upload button MUST allow users to select and load a previously downloaded contact data file (TXT/JSON format)
- **FR-004**: When a valid file is uploaded, the system MUST populate all corresponding contact form fields with the data from the file
- **FR-005**: When an invalid file is uploaded, the system MUST display an error message without modifying existing form fields
- **FR-006**: System MUST provide an "Open Existing" button on the Contact tab
- **FR-007**: When "Open Existing" is clicked, system MUST display a popup/modal with First Name, Last Name, and Access Code input fields and an "Open" button
- **FR-008**: All three fields (First Name, Last Name, Access Code) MUST be required — the system MUST validate that none are empty before submitting
- **FR-009**: When the user clicks "Open" with valid inputs, the system MUST look up the matching contact on the server using the provided first name, last name, and access code combination
- **FR-010**: If a matching contact is found, the system MUST close the popup and populate the contact form with the retrieved data
- **FR-011**: If no matching contact is found, the system MUST display an error message inside the popup
- **FR-012**: The popup MUST be dismissible by clicking outside it, pressing Escape, or via a close/cancel control
- **FR-013**: System MUST display an info icon (ⓘ) near the "Open Existing" button with a tooltip: "You can open existing contact card — provide first name, last name and access code"

### Key Entities

- **Saved Contact**: A previously saved contact data record, identified by the combination of first name, last name, and access code. Contains all contact form fields (phone, email, organisation, job title, website, social media links, photo reference)
- **Contact Data File**: A downloadable/uploadable file (TXT/JSON) containing serialized contact form data, used for local backup and restore

## Assumptions

- The existing Download TXT functionality already produces a file format that the Upload feature can parse
- The existing server-side storage and access code infrastructure (used by the Save feature) supports lookup by first name + last name + access code combination
- The Access Code field in the Open Existing popup uses the same validation rules as the existing access code input (4–6 characters)
- The Upload button replaces the current Upload TXT button that is located in the output/result area — it is being moved, not duplicated
- The "Open Existing" and "Upload" buttons are only visible when the Contact tab is active

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can restore previously saved contact data from a downloaded file in under 10 seconds (click Upload, select file, fields populated)
- **SC-002**: Users can retrieve a cloud-saved contact via Open Existing in under 15 seconds (click button, fill 3 fields, click Open, fields populated)
- **SC-003**: 95% of users who attempt to upload a valid contact file see their form fields correctly populated on the first attempt
- **SC-004**: The info tooltip is discoverable — users who hover over the info icon see the explanatory text within 1 second
- **SC-005**: No user accidentally loses entered contact data due to the removal of the Drop button
