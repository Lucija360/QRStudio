# Feature Specification: Social Media QR Codes with Blob Storage & Sharing

**Feature Branch**: `007-social-qr-blob-share`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Extend the contact form to provide generating of QR Codes additionally to the vCard also QR Codes that point to the URLs of social networks of the user. The user can click on checkbox for the social media for which the QR Code should be created. If user enters the URL (i.e. LinkedIn, Instagram etc.) the QR Code with the URL of the social media is created. When Generate button is clicked, all QR Codes are created at the page. Once QR Codes are created, all data entered by the user is saved to the file persisted at the blob storage account. The name of the file is randomly chosen with extension JSON. The saved JSON persists all data entered by the user at the contact card generating page. At the bottom of the page, a share button is shown that enables sharing the URL of the JSON file. Also a delete button is shown, which enables the user to delete the file for GDPR reasons."

## User Scenarios & Testing

### User Story 1 — Generate QR Codes (Priority: P1)

As a user in Contact mode, I want to enter my contact data and URLs for my social media profiles (LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok) and have the system generate individual QR codes for each one alongside my vCard QR code, so that people can quickly follow me on any platform by scanning the corresponding code.
Optionally, I have in Contact mode the option to upload previously downloaded text file that contains a JSON with all already entered data.

**Why this priority**: This is the core feature — without the ability to enter social media URLs and generate per-platform QR codes, no other stories (persistence, sharing, deletion) have meaning.

**Independent Test**: Switch to Contact mode → fill in name and phone → enter a LinkedIn URL → check the LinkedIn checkbox → click Generate → a vCard QR code appears AND a separate LinkedIn QR code appears below it. Scan the LinkedIn QR code → it opens the LinkedIn profile URL.

**Acceptance Scenarios**:

1. **Given** the user is in Contact mode, **When** they look at the contact form below the existing fields, **Then** a "Social Media" section is visible with input fields for LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, and TikTok, each with a corresponding checkbox.
2. **Given** the Social Media section is visible, **When** the user enters a valid URL into the LinkedIn field, **Then** the LinkedIn checkbox becomes checked automatically.
3. **Given** a social media URL is entered and its checkbox is checked, **When** the user clicks Generate, **Then** a QR code encoding the URL for that social network is displayed on the page alongside the vCard QR code.
4. **Given** the user has entered URLs for multiple social networks (e.g., LinkedIn and Instagram) and both checkboxes are checked, **When** the user clicks Generate, **Then** a separate QR code is generated for each checked social network, plus the vCard QR code — all visible on the results area.
5. **Given** a social media URL is entered but the user unchecks its checkbox, **When** the user clicks Generate, **Then** no QR code is generated for that social network.
6. **Given** the user enters an invalid URL into a social media field, **When** the user clicks Generate, **Then** an inline validation error appears for that field and no QR code is generated for it; other valid QR codes are still generated.
7. **Given** no social media URLs are entered, **When** the user clicks Generate, **Then** only the vCard QR code is generated (existing behaviour unchanged).
8. **Given** The user is in Contact Mode.  **Then** Upload Button is shown on the top of the view which enables user to upload previously downloaded text file with JSON that contains all previously entered data.
9. **Given** QR codes are generated successfully. **Then** Buttons Save, Delete, Copy, Share as VCF, Share by-link and Download are shown after QR Codes are generated. Near to Save button Access Code textbox appears -> "Enter an access code to save your data". Button Save is enabled, when access code is entered. The code can be any character minimum 4 and maximum 6 characters. Buttons Delete, Copy and Share by-link are enabled after saving.
10. **Given** QR codes are generated successfully. **Then** Button/Icon save is disabled while user is typing the access code. Button/icon save is enabled after user has entered a valid access code. User starts typing again, button/icon save is disabled.

### User Story 2 — Save Contact Data to Blob Storage (Priority: P1)

As a user, after generating QR codes I want to be able to **save/persist** the generated data to cloud storage by providing an access code that I must remember. The JSON file name contains the user's name, an index number, and a GUID-like suffix. If multiple users have the same name, indexes are used. Once saved, buttons Copy and Share are enabled. Button download and save are always enabled.  

**Why this priority**: Persistence to blob storage is a prerequisite for the share, copy and delete features. Without saving, there is nothing to share, copy or delete. It is co-equal with US1.

**Independent Test**: Fill in contact fields and social media URLs → click Generate → QR codes appear. Near to Save button is enabled after user has entered a valid access code. When clicked icon save → create a JSON file in storage, verify a JSON file has been created in blob storage containing all entered data plus the hash of the access code. After save other buttons are enabled.

**Acceptance Scenarios**:

1. **Given** QR codes are generated successfully. **Then** buttons and access code text field appear.
2. **Given** QR codes are generated successfully.**When** When the user enters a valid access code and clicks Save, **Then** a JSON file is saved to blob storage containing all form data and the hash of the access code (the plaintext code is never stored) and QR Codes are not stored — only user-entered data.
3. **Given** QR codes are generated successfully, and user clicked on save. **When** the JSON file is saved, **Then** the file name is derived from the user's contact name plus a short random suffix (e.g., `jane-doe-x7k2.json`). If that name already exists, a sequential index is appended (e.g., `jane-doe-x7k2-1.json`).
4. **Given** User didn't click on save, **When** QRCodes are shown or generated, **Then** no JSON file is persisted to blob storage. The QR codes remain displayed and the user can still download the TXT file. The Copy, Share and Delete buttons are not shown. 
5. **Given** the save operation succeeds, **When** the page updates, **Then** a confirmation notice appears briefly indicating data has been saved, and the Copy, Share and Delete buttons appear.
6. **Given** the save operation fails (e.g., storage unavailable), **When** the error occurs, **Then** the QR codes are still displayed, but a warning/error message appears indicating that data could not be saved. User can close the message.
7. **Given** the user generates QR codes multiple times, **When** each generation completes, **Then** a new save prompt appears. If the user saves again, the previous JSON file is auto-deleted and a new one is created.

---

### User Story 3 — Sharing Contact Data (Priority: P2)

As a user, after generating my QR codes, I want to share the JSON file URL or to download the JSON file as a text file. This is defined by two User Stories: *User Story 3a* and *User Story 3b* and *User Story 3c*. User Story 3d defines upload of the contact data.

### User Story 3a — Download/Share Contact Data as Downloadable Text File 
As a user, after generating my QR codes, I want to download/share a TXT file containing all my entered contact data (as JSON), so that I can save it locally, share it with others, and later upload it back to the application to restore my data. I can select form available sharing apps to share the TXT file with JSON content without access code hash.

**Why this priority**: Sharing/exporting adds significant value by enabling offline portability of the contact data. It depends on US1 (generating QR codes) and US2 (blob persistence) being in place first.

**Independent Test**: Generate QR codes (data is saved to blob storage) → a Download button appears at the bottom of the page → click Download → a TXT file containing the JSON data is available for share across shared apps on the user's device. Open the file (if downloaded) → it contains all entered contact and social media data in JSON format.

**Acceptance Scenarios**:

1. **Given** QR codes have been generated and the JSON file has been saved to blob storage, **When** the user looks at the bottom of the results area, **Then** a Share button is visible.
2. **Given** the Share button is visible, **When** the user clicks it, **Then** a TXT file containing the JSON content of all entered data is downloaded to the user's device.
3. **Given** the TXT file has been downloaded, **When** the user opens it, **Then** it contains valid JSON with all contact fields, social media URLs, checkbox states, and QR customisation settings. The TXT file MUST NOT contain the access code or its hash.
4. **Given** no QR codes have been generated yet, **When** the user looks at the results area, **Then** no any button is visible.

---

### User Story 3b — Copy URL of Saved JSON File 

As a user, after generating my QR codes, I want to copy the URL of the page to my clipboard so that I can share it with others and anyone with the link can open it in the application and see all my QR codes and contact data rendered on a view page.

**Why this priority**: URL sharing is the primary way to distribute the contact card to others. It complements the TXT download (US3) by enabling share-by-link in addition to share-by-file. It depends on US2 (blob persistence) and US6 (view page).

**Independent Test**: Generate QR codes → a Copy button appears → click it → the application's view-page URL (not the raw blob URL) is copied to the clipboard with a confirmation toast. Send the link to another person → they open it → the application renders all QR codes and contact data.

**Acceptance Scenarios**:

1. **Given** QR codes have been generated and the JSON file has been saved, **When** the user looks at the bottom of the results area, **Then** a Copy button is visible alongside the Share (download) and Delete buttons.
2. **Given** the Copy button is visible, **When** the user clicks it, **Then** the application's view-page URL for the saved JSON file is copied to the clipboard and a brief confirmation toast appears ("Link copied to clipboard").
3. **Given** the shared URL is opened by another person, **When** the page loads, **Then** it renders the view page described in US6 with all QR codes and contact data.
4. **Given** no QR codes have been generated yet, **When** the user looks at the results area, **Then** no Copy button is visible.


### User Story 3c — Share VCF contact card 

As a user, after generating my QR codes, I want to share the data as VCF contact card embedded into QR Code.
The 'Share' Button appears near to VCF Contact Card QR Code. 

**Why this priority**: Additionally to presenting the QR Code to the user directly, sharing the VCF file is the primary way to distribute the contact card to others.  It does not depends on (blob persistence). The card can be shared via available sharing apps and immediately dropped = not saved.

**Independent Test**: Generate QR codes → a Share button appears → click it → the application's the VCF card is attached to sharing apps as VCF-file. Send the VCF file to another person → they open it → the application of another person shows contact data.

**Acceptance Scenarios**:

1. **Given** QR codes have been generated, **When** the user looks at Contact Card QR-Code **Then** a Share button is visible near to the QR Code that representing the contact data..
2. **Given** the Share button is visible, **When** the user clicks it, **Then** the VCF file is created and user can chose from available sharing apps to share it as a file.
3. **Given** the shared VCF file is opened by another person, **When** the responsible app loads, **Then** it it shows all contact data.
4. **Given** no QR codes have been generated yet, **When** the user looks at the results area, **Then** no Share button is visible.

---

### User Story 3d — Upload Saved Data to Restore Contact Form (Priority: P2)

As a user, I want to upload a previously downloaded TXT file back to the application, so that all my contact data is restored into the form fields and I can re-generate my QR codes without re-entering everything. After uploading, I can download the restored data again or save/persist it to blob storage by providing an access code.

**Why this priority**: Upload/restore completes the data portability loop — without it, the exported TXT file is only useful for manual reference. It is tightly coupled with US3 and should be delivered together.

**Independent Test**: Open the application → click an Upload/Restore button → select a previously downloaded TXT file → all contact fields and social media URLs are populated from the file → click Generate → QR codes are created → the save prompt appears → enter a code and save → data persisted to blob.

**Acceptance Scenarios**:

1. **Given** the user is in Contact mode, **When** they look at the contact form, **Then** an Upload/Restore button is visible that allows selecting a TXT file. Button is on top of the page above all contact fields.
2. **Given** the user clicks Upload/Restore and selects a valid TXT file (containing JSON), **When** the file is processed, **Then** all contact fields, social media URLs, and checkbox states are populated from the file data.
3. **Given** the file has been uploaded and fields are populated, **When** the user clicks Generate, **Then** QR codes are generated , allowing the user to persist, copy and share the data with a new access code. If the file with the same name exists, remove it.
4. **Given** the user selects an invalid file (not valid JSON or missing expected fields), **When** the file is processed, **Then** an error message appears indicating the file could not be read and no fields are changed. User must close the message to proceed.
5. **Given** the user has already entered some data into the form, **When** they upload a TXT file, **Then** the existing form data is replaced with the data from the file. The data which is not replaced, remains.

---
### User Story 3e — Share by Link 

As a user, after generating my QR codes, I want to share the saved JSON as a URL (link).
The 'Share as link' Button appears near to Contact Card QR Code additionally to button 'Share as VCF'.

**Why this priority**: Additionally to presenting the QR Code to the user directly, sharing the link is the primary way to distribute the contact card to others or to myself or others.The link can be shared via available sharing apps and immediately opened without saving if the JSON was previously saved.

**Independent Test**: Generate QR codes → a Share button appears → click it → the application's link is attached to sharing apps. Send the link to another person → they open it → the application of another person shows contact data. When opening the shared link the data is shown in readonly mode. 

**Acceptance Scenarios**:

1. **Given** QR codes have been generated, **When** the user looks at Contact Card QR-Code **Then** a Share by-link button is visible near to the QR Code that representing the contact data.
2. **Given** the Share by-link button is visible, **When** the user clicks it, **Then** a shareable URL is created and user can chose from available sharing apps to share it as a link.
3. **Given** the shared link is opened by another person, **When** the responsible app loads, **Then** it shows all contact data.
---


### User Story 4 — Delete Contact Data for GDPR Compliance (Priority: P2)

As a user, after generating my QR codes, I want to delete my saved contact data file from cloud storage, so that I can exercise my right to data erasure under GDPR.

**Why this priority**: GDPR compliance is essential for any feature that persists personal data. Once storage is in place (US2), users must have the ability to remove their data. It is co-equal with sharing but can be tested independently.

**Independent Test**: Generate QR codes (data is saved) → a Delete button appears at the bottom of the page → click Delete → a confirmation dialog appears → confirm → the JSON file is deleted from blob storage → the Delete and Share buttons disappear → a notice confirms the data has been deleted. Note, delete button appears after the data is successfully saved.

**Acceptance Scenarios**:

1. **Given** QR codes have been generated and the JSON file has been saved, **When** the user looks at the bottom of the results area, **Then** a Delete button is visible alongside the Share button.
2. **Given** the Delete button is visible, **When** the user clicks it, **Then** a confirmation dialog appears asking "Are you sure you want to permanently delete your saved contact data?"
3. **Given** the confirmation dialog is shown, **When** the user confirms deletion, **Then** the JSON file is removed from blob storage and the Delete and all other buttons instead Save are disabled.
4. **Given** the deletion succeeds, **When** the page updates, **Then** a confirmation notice appears: "Your contact data has been deleted."
5. **Given** the confirmation dialog is shown, **When** the user cancels, **Then** no deletion occurs and the buttons remain visible.
6. **Given** the deletion fails (e.g., file already deleted or storage unavailable), **When** the error occurs, **Then** an error message appears indicating the data could not be deleted and suggesting the user try again later.
7. **Given** the file has been deleted, **When** someone tries to access the previously shared URL, **Then** they receive a "not found" response.

---

### User Story 5 — Social Media QR Codes Display with Platform Branding (Priority: P3)

As a user, I want each social media QR code to be visually labelled with the platform name and icon so that I can easily distinguish which code is for which platform on the generated results page. 

**Why this priority**: This is a usability enhancement. The core functionality works without branding labels, but with multiple QR codes, visual identification improves the user experience significantly.

**Independent Test**: Generate QR codes for LinkedIn and Instagram → each QR code card in the results area shows the platform name (e.g., "LinkedIn", "Instagram") and a recognisable icon above or beside the QR code image.

**Acceptance Scenarios**:

1. **Given** QR codes have been generated for one or more social networks, **When** the user views the results area, **Then** each social media QR code card displays the platform name as a heading.
2. **Given** QR codes are displayed, **When** the user views a social media QR code card, **Then** a recognisable icon or logo for that platform is displayed alongside the platform name.
3. **Given** multiple social media QR codes are generated, **When** the user views the results, **Then** the QR codes are arranged in a responsive grid layout, with the vCard QR code displayed prominently first.

---

### User Story 6 — View Page: Render QR Codes from Shared JSON URL (Priority: P1)

As a recipient of a shared link, I want to navigate to a URL in the application that immediately loads the saved JSON file and displays all contact data and QR codes in read-only mode. Optionally, I can enter an access code and press Enter to unlock full mode with all creator buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download). The creator of the data uses this page to view, manage, and optionally change the access code. To recap, after loading the JSON file User Story 1 is executed.

**Why this priority**: This is what makes the shared URL useful — without a view page, the shared link only serves raw JSON. The view page turns sharing into a complete, self-contained contact card experience. It is P1 because it is essential for the share-by-link flow (US3b) to deliver value.

**Independent Test**: Copy the view-page URL from the Copy button → open it in a new browser tab → the page immediately displays all contact data and QR codes in read-only mode with Copy, Share as VCF, and Share by-link buttons → enter the correct access code and press Enter → the page transitions to full mode with all creator buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download) → the access code is shown and can be changed → scan any QR code → it works correctly.

**Acceptance Scenarios**:

1. **Given** a valid view-page URL (e.g., `/view/{filename}`), **When** a user navigates to it, **Then** the application displays all data in read-only mode with Copy, Share as VCF, and Share by-link buttons (see FR-032, FR-035e) plus a visible input field for the access code. 
2. **Given** the view page is displayed in read-only mode, **When** the user enters the correct access code and presses Enter, **Then** the application verifies the code against the stored hash and transitions the page to full mode, enabling all creator buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download).
3. **Given** the code entry form is shown, **When** the user enters an incorrect code, **Then** an error message appears ("Invalid access code") content stays visible and buttons appear as defined by read-only mode.
4. **Given** the view page has rendered after successful code entry showing all buttons, **When** the user looks at the page, **Then** the access code they entered is displayed in a visible (editable) field, allowing them to change it. Clicking on Save will save changed code and all other data.
5. **Given** the user changes the access code on the view page and confirms, **When** the update is processed, **Then** the server computes a new hash and updates the stored JSON file. The old code no longer works.
6. **Given** the JSON file is loaded successfully, **When** the view page renders, **Then** all contact details (name, phone, email, organisation, job title, website) are displayed as formatted text (not editable form fields).
7. **Given** the JSON file contains social media URLs with checked checkboxes, **When** the view page renders, **Then** a vCard QR code is generated from the contact fields AND a separate QR code is generated for each checked social media URL, all displayed in the same responsive grid layout as the main generation page.
8. **Given** the JSON file contains QR customisation settings (colours, module size, ECC level), **When** QR codes are generated on the view page, **Then** the customisation settings from the JSON are applied to all generated QR codes.
9. **Given** the JSON file has expired (TTL) or been deleted, **When** a user navigates to the view-page URL, **Then** a friendly error page is displayed: "This contact card is no longer available."
10. **Given** the URL references a file name that never existed, **When** a user navigates to it, **Then** a 404 "not found" page is displayed.
11. **Given** the view page has loaded in full mode (correct access code entered), **When** the user looks at the page, **Then** a Download button is available that allows downloading the TXT file (same as US3a Share), enabling the recipient to save the data locally or upload it into their own session. The downloaded TXT file does NOT contain the access code or hash. Note: the Download button is only available in full mode, not in read-only mode (see FR-032).

---
### User Story 7 - open shared link 

After user shared the link (UC3e) another user can open the page with the contact data saved behind the link.
Note - This user story shares the same page '/view/{filename}' as User Story 6. It represents another use-case inside the same user story.

**Why this priority**: Sharing the link is the standard way to distribute the contact card to others or to myself. The link can be shared via available sharing apps and immediately opened without saving if the JSON was previously saved. After opening the page all data is rendered as read-only with Copy, Share as VCF, and Share by-link buttons. The field 'access code' appears, which can be optionally entered. If the user doesn't know the code, nothing happens — the page stays in read-only mode. If the user enters the correct code and presses Enter, all creator buttons as in previously defined stories appear.

**Independent Test**: Another user opens the URL the application shows contact data. When opening the shared link the data is shown in readonly mode. 

**Acceptance Scenarios**:

1. **Given** Link is clicked, **When** the user opens the link **Then** Contact data is shown in read-only mode.
2. **Given** Link is clicked, **When** the user opens the link and enters the correct access code **Then** Contact data is shown as in US1.
---

### Edge Cases

- What happens when the user enters a social media URL without the scheme (e.g., "linkedin.com/in/janedoe")? The system auto-prepends `https://` before generating the QR code.
- What happens when the user checks a social media checkbox but leaves the URL field empty? The checkbox is unchecked automatically and no QR code is generated for that platform.
- What happens when the user refreshes the page after generating? All QR codes and form data are cleared (no client-side persistence), and the Share/Delete buttons disappear. The previously saved JSON file remains in blob storage until it expires per the selected retention period. The user can restore their data by uploading the previously downloaded TXT file (but must provide a new access code to re-persist).
- What happens when the user generates multiple times in a session? The previous JSON file is automatically deleted and a new one is created after the user enters a new access code via the save prompt. The Share and Delete buttons always reference the single active file. No orphaned files accumulate.
- What happens when blob storage is not configured or unreachable? QR codes are still generated and displayed. A warning is shown that data could not be saved. Share and Delete buttons are not displayed.
- What happens when the user deletes data and then clicks Generate again? A new JSON file is created and new Share/Delete buttons appear for the new file.
- What happens when the user enters the same URL in two different social media fields? Both QR codes are generated independently — they are simply URL QR codes and the system does not enforce uniqueness across fields.
- What happens when someone navigates to a view-page URL for a file that has expired (TTL)? A friendly message is displayed: "This contact card is no longer available."
- What happens when the user selects "forever" retention? The file persists indefinitely in blob storage until explicitly deleted via the Delete button or by an administrator.
- What happens when the view-page URL contains an invalid or non-existent file name? A 404 "not found" page is displayed.
- What happens when the view page is accessed on a mobile device? The view page is fully responsive and all QR codes are scannable.
- What happens when someone downloads the TXT file from the view page? The downloaded file does NOT contain the access code, its hash, or the delete token. The recipient can upload the TXT file into their own session to populate the form, but must provide a new access code if they want to persist it.

- What happens when someone enters an incorrect access code on the view page? An error message "Invalid access code" is shown. The page remains in read-only mode — contact data and QR codes stay visible but creator buttons do not appear. The user can retry.
- What happens when someone makes too many failed access code attempts? After 5 failed attempts per file per minute from the same IP, the server returns HTTP 429 (Too Many Requests). The user must wait before retrying.
- What happens when the user changes the access code on the view page? The server computes a new hash with a new salt and updates the JSON file. The old code immediately stops working. Anyone who previously knew the old code must use the new one.

## Clarifications

### Session 2026-03-25

- Q: How should the saved JSON files be accessible? (public blob, time-limited signed URLs, or app-proxied access) → A: Public blob container — files are directly accessible by anyone who has the URL; no expiration.
- Q: Should the JSON file include the generated QR code images? → A: Input data only — JSON stores form fields, URLs, checkbox states, and settings; no QR images are stored.
- Q: What should happen to previously generated JSON files when the user generates again? → A: Auto-delete the previous file when a new one is created; only one active file per session. The file name should encode the username (contact name) so it is identifiable.
- Q: How should the delete operation be protected from unauthorized access? → A: Delete token — the server returns a unique delete token when saving the file; the client must present this token to authorize deletion.
- Q: What should happen to the saved JSON file when the user can no longer delete it (e.g., after a page refresh)? → A: Short TTL — files auto-expire quickly (e.g., 24 hours). The application provides a share option that exports a TXT file containing the JSON data. The user can save this file locally and later upload it back to the application to restore all entered data.

### Session 2026-03-26

- Q: What should the blob storage TTL (auto-expiration) duration be? → A: User-configurable. The user selects a retention period at generation time from: 1 day, 7 days, 1 month, 1 year, or forever.
- Q: How should file name uniqueness be handled when multiple users have the same name? → A: Sequential index — `jane-doe.json`, `jane-doe-1.json`, `jane-doe-2.json`; the server checks for existing names before saving.
- Q: How should the application mitigate discoverability of personal data in the public blob container given sequential human-readable names? → A: Append a short random suffix after the contact name (e.g., `jane-doe-x7k2.json`). Sequential indexing still applies if the same name+suffix combination collides.
- Q: Should the delete token be included in the exported TXT/JSON file so deletion remains possible after a session restore? → A: ~~Yes — include the delete token in the JSON. Both the blob file and downloaded TXT contain the token, enabling deletion after upload/restore.~~ **Superseded by Access Code Model revision (below)**: The delete token is stored in the blob JSON file but is NOT included in TXT exports. TXT exports contain only portable contact data (see FR-015, FR-031). Deletion after session loss requires the user to have noted the delete token during the original session.
- Q: Should the view page expose a Delete button, allowing anyone with the shared link to delete the contact card? → A: The view page opens in read-only mode (no Delete button). The Delete button appears only after the creator enters the correct access code and presses Enter (full mode). Anyone without the code cannot delete.

### Session 2026-03-28

- Q: How should the system protect against brute-force access code guessing on the view page? → A: Server-side rate limiting — max 5 attempts per IP per file per minute; return HTTP 429 after.

### Access Code Model (added 2026-03-26)

The persistence and view-page access model was revised to introduce a user-provided access code:
- After generating QR codes, the user is prompted to **Save** (with an access code).
- The access code is hashed (SHA-256 ); only the hash is stored in the JSON file in blob storage.
- The TXT export does NOT contain the access code or its hash — it is purely portable data.
- The view page (`/view/{filename}`) is open in read-only mode. User is required the to enter the access code to enable creator buttons.
- After successful code entry, the code is displayed on the view page and can be changed by the user. Creator buttons are shown.
- Changing the code re-hashes with a new salt and updates the blob; the old code is immediately invalidated.

## Requirements

### Functional Requirements

- **FR-001**: The contact form MUST include a "Social Media" section below the existing contact fields, containing labelled input fields for: LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, and TikTok.
- **FR-002**: Each social media field MUST have a corresponding checkbox that controls whether a QR code is generated for that platform.
- **FR-003**: When the user enters a valid URL into a social media field, the corresponding checkbox MUST be checked automatically.
- **FR-004**: When the user checks a checkbox but the corresponding URL field is empty, the checkbox MUST be unchecked automatically and no QR code generated for that platform.
- **FR-005**: When the user enters a URL without a scheme (e.g., "linkedin.com/in/jane"), the system MUST auto-prepend `https://` before generating the QR code.
- **FR-006**: Social media URLs MUST be validated as well-formed URLs before generating QR codes; invalid URLs MUST produce an inline error on the respective field.
- **FR-007**: When the user clicks Generate, the system MUST produce a separate QR code for each social media platform whose checkbox is checked and whose URL is valid, in addition to the existing vCard QR code.
- **FR-008**: Each social media QR code MUST encode only the URL of the respective platform.
- **FR-009**: The results area MUST display the vCard QR code prominently first, followed by social media QR codes in a responsive grid layout, each labelled with the platform name.
- **FR-010**: When Generate is clicked and QR codes are successfully created, the system MUST display all creator's action buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download) and an access code text field near the Save button. After generation of QR Codes save button becomes enabled.
Following buttons are enabled independent if the JSON file is saved or not: Save, Share as VCF and Download.
Following buttons are enabled after the JSON is saved (or JSON previously saved) Delete, Copy, and Share by-link.
- **FR-010a**: When the user clicks Save with a valid access code, the system MUST save all form data (contact fields, social media URLs, checkbox states, customisation settings, and selected retention period) plus the hash of the access code as a JSON file to the cloud storage account. Upon successful save, the Delete, Copy, and Share by-link buttons MUST become enabled (Share as VCF is already enabled independently per FR-033c).
- **FR-010b**: The contact form MUST include a retention period selector (dropdown or radio group) with the options: 1 day, 7 days, 1 month, 1 year, and forever. The default selection MUST be 7 days.
- **FR-010c**: When saving the JSON file to cloud storage, the system MUST set the file's expiration (TTL) according to the user's selected retention period. Files with "forever" selected MUST NOT have an expiration policy applied.
- **FR-011**: The JSON file name MUST be derived from the user's contact name in sanitised form followed by a short random alphanumeric suffix (4 characters, e.g., `jane-doe-x7k2.json`). If a file with that name already exists in blob storage, the system MUST append a sequential numeric index (e.g., `jane-doe-x7k2-1.json`) until an unused name is found. The random suffix makes file names practically unguessable in the public blob container.
- **FR-012**: The JSON file MUST contain all input data entered by the user on the contact card page, including: first name, last name, phone, email, organisation, job title, website, each social media URL, checkbox states, QR customisation settings (colours, module size, ECC level), the selected retention period, the delete token, and the **hash** of the access code (plus salt). The JSON MUST NOT contain the plaintext access code. The JSON MUST NOT include generated QR code images.
- **FR-012a**: The access code MUST be hashed using SHA-256 with a per-file 16-byte cryptographically random salt before storage. Only the hash and salt are persisted; the plaintext code is never written to storage. The access code MUST be at least 4 characters and maximum 6 long; empty or over-length codes MUST be rejected at the API boundary.
- **FR-013**: If the save operation fails, the QR codes MUST still be displayed, but a warning message MUST appear indicating that data could not be saved.
- **FR-014**: After QR codes are generated and data is saved (user chose Save), buttons Delete, Copy, Share as VCF, Share by-link and Download MUST appear enabled at the bottom of the results area. *(See FR-010 for the complete button visibility matrix.)*
- **FR-015**: When the user clicks the Download button, the system MUST trigger a download of a TXT file containing the JSON content of all entered data (contact fields, social media URLs, checkbox states, QR customisation settings). The TXT file MUST NOT include the access code, its hash, or the delete token. The file name SHOULD match the blob file name but with a `.txt` extension; 
The file name MUST be `{firstname}-{lastname}-contact.txt`.
- **FR-015a**: The contact form MUST include an Upload/Restore button that allows the user to upload a previously downloaded TXT file.
- **FR-015b**: When a valid TXT file is uploaded, the system MUST parse the JSON content and populate all contact fields, social media URLs, and checkbox states from the file data, replacing any existing form values. Since the TXT file does not contain an access code or delete token, the user must re-generate and provide a new access code to persist the restored data.
- **FR-015c**: If the uploaded file is invalid (not valid JSON or missing expected fields), the system MUST display an error message and leave the form unchanged.
- **FR-015d**: When the user clicks the Copy button, the system MUST copy the application's view-page URL (e.g., `{app-base-url}/view/{filename}`) to the clipboard and display a brief confirmation toast ("Link copied to clipboard").
- **FR-015e**: The copied URL MUST point to the application's view page (not the raw blob URL), so that the JSON data is rendered with QR codes when opened.
- **FR-016**: *(Merged into FR-014 — see FR-014 for button visibility rules.)*
- **FR-017**: When the user clicks the Delete button, a confirmation dialog MUST appear before the file is deleted from cloud storage.
- **FR-017a**: The delete operation MUST require a valid delete token that was returned by the server when the file was originally saved. Requests without a valid token MUST be rejected.
- **FR-017b**: When the server saves a JSON file, it MUST generate a unique delete token associated with that file and return it to the client. The delete token MUST be stored inside the JSON file in blob storage (for server-side validation). The delete token MUST NOT be included in TXT exports (see FR-015, FR-031). The client MUST store this token in memory for use with the Delete button.
- **FR-018**: Upon successful deletion, the Delete and Share buttons MUST disappear and a confirmation notice MUST be displayed.
- **FR-019**: After deletion, the previously shared URL MUST return a "not found" response.
- **FR-020**: If the deletion fails, an error message MUST appear suggesting the user try again later.
- **FR-021**: When the user clicks Generate and a previous JSON file exists for the current session, the system MUST auto-delete the previous file before saving the new one. Only one active JSON file per session is maintained. The Share and Delete buttons MUST reference the current active file.
- **FR-022**: If cloud storage is not configured or unreachable, QR codes MUST still be generated successfully and the Share/Delete buttons MUST NOT be displayed.
- **FR-023**: All existing Contact mode functionality (vCard generation, photo upload, form fields, validation) MUST remain fully operational.
- **FR-024**: The social media section, Share button, and Delete button MUST be fully usable on mobile viewports (375px width minimum).
- **FR-025**: The application MUST provide a view page accessible at a URL pattern (e.g., `/view/{filename}`) that accepts a JSON file name as a route parameter.
The JSON file content is by default rendered in read-only mode with only Copy, Share as VCF, and Share by-link buttons (see FR-032), plus an access code input field. *(Recipient perspective: see FR-035–FR-035e.)*
- **FR-025a**: When the view page is loaded, the application MUST provide an input field for the access code entry. The field is optional. The user enters the code and presses Enter to submit it for validation. *(See also FR-035b.)*
- **FR-025b**: When the contact data are shown from the previously saved JSON file in read-only mode (**FR-025a**) and the user enters the correct access code, buttons become available and enabled.
To validate the access code server MUST verify the entered code by hashing it and comparing it to the stored hash in the JSON file. If the hashes do not match, the server MUST respond with an error ("Invalid access code") and the page remains read-only without creator buttons. *(See also FR-035c, FR-035d.)*
- **FR-026**: When the view page is loaded, the application MUST fetch the corresponding JSON file from blob storage and render all contact details as formatted, non-editable text in read-only mode. After the user enters the correct access code and presses Enter, the page MUST transition to full mode with all creator buttons enabled.
- **FR-026a**: After successful code verification, the view page MUST display the access code (as entered by the user) in an editable field, allowing the user to change it.
- **FR-026b**: When the user changes the access code on the view page and confirms, the server MUST compute a new hash (with a new salt), update the JSON file in blob storage, and confirm the change. The old code MUST no longer be accepted.
- **FR-027**: The view page MUST generate and display all QR codes (vCard + social media) from the JSON data, using the same QR generation logic and customisation settings stored in the JSON.
- **FR-028**: The view page MUST display QR codes in the same responsive grid layout as the main generation page, with platform branding labels and icons.
- **FR-029**: If the JSON file has expired or been deleted, the view page MUST display a friendly error message: "This contact card is no longer available."
- **FR-030**: If the file name in the URL does not correspond to any existing file, the view page MUST return a 404 "not found" response.
- **FR-031**: In full mode (after correct access code entry), the view page MUST include a Download button that allows the viewer to download the contact data as a TXT file (same format as FR-015), enabling data portability for the recipient. The downloaded TXT file MUST NOT contain the access code, its hash, or the delete token. In read-only mode, the Download button is NOT visible (see FR-032).
- **FR-032**: In read-only mode (no valid access code entered), the view page MUST show only the following buttons: Copy, Share as VCF, and Share by-link. Buttons Save, Delete, and Download MUST NOT be visible. This is consistent with **FR-035e**.


#### US3c — Share VCF Contact Card

- **FR-033**: After QR codes have been generated, a "Share as VCF" button MUST appear near the vCard Contact Card QR code.
- **FR-033a**: When the user clicks the "Share as VCF" button, the system MUST generate a VCF (vCard) file containing all contact data (name, phone, email, organisati
on, job title, website) and invoke the device's native share dialog (Web Share API with the VCF file attached) so the user can choose from available sharing apps.
- **FR-033b**: The VCF file MUST NOT contain social media URLs, the access code, its hash, or the delete token — it contains only standard vCard contact fields.
- **FR-033c**: The "Share as VCF" button MUST be visible regardless of whether data has been saved to blob storage — sharing a VCF does not depend on persistence.
- **FR-033d**: If the device does not support the Web Share API with file sharing, the system MUST fall back to downloading the VCF file directly to the user's device.

#### US3e — Share by Link

- **FR-034**: After QR codes have been generated and data has been saved to blob storage, a "Share by-link" button MUST appear near the vCard Contact Card QR code, alongside the "Share as VCF" button.
- **FR-034a**: When the user clicks the "Share by-link" button, the system MUST invoke the device's native share dialog (Web Share API) with the application's view-page URL (e.g., `{app-base-url}/view/{filename}`) so the user can choose from available sharing apps to share it as a link.
- **FR-034b**: The shared URL MUST point to the application's view page (not the raw blob URL), so that the recipient sees the rendered contact data and QR codes.
- **FR-034c**: The "Share by-link" button MUST only be visible after the data has been successfully saved to blob storage. If the user has not saved, the button MUST NOT be displayed.
- **FR-034d**: If the device does not support the Web Share API, the system MUST fall back to copying the view-page URL to the clipboard with a confirmation toast ("Link copied to clipboard").

#### US7 — Open Shared Link (Read-Only View)

- **FR-035**: When a user opens a shared view-page URL (e.g., `/view/{filename}`), the application MUST immediately render all contact details and QR codes in **read-only mode** without requiring an access code. *(Creator perspective: see FR-025–FR-026b.)*
- **FR-035a**: In read-only mode, all contact data (name, phone, email, organisation, job title, website, social media URLs) MUST be displayed as formatted, non-editable text. All QR codes (vCard + social media) MUST be generated and displayed.
- **FR-035b**: In read-only mode, the page MUST display an access code input field. The field MUST be optional — if the user does not enter a code, the page remains in read-only mode with no additional functionality. *(See also FR-025a.)*
- **FR-035c**: When the user enters the access code and presses Enter, the system MUST validate the code by hashing it and comparing against the stored hash. If the code matches, the page MUST transition from read-only mode to full mode, enabling all buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download) as defined in US1 and US2. *(See also FR-025b.)*
- **FR-035d**: If the user enters an incorrect access code, the page MUST remain in read-only mode. Error is shown as defined by **FR-025b**.
- **FR-035e**: The read-only view page MUST include following buttons:  
Copy, Share as VCF, Share by-link. Buttons Save, Delete and Download are not visible.

- **FR-036**: Every time the JSON file with the contact data is saved, the TTL time of the file is reset to a chosen value **FR/010b**.

- **FR-037**: The background running worker removes all TTL expired JSON files. The job is running every hour (configurable).

- **FR-038**: The server MUST enforce rate limiting on access code validation requests for the view page. A maximum of 5 failed attempts per IP address per file per minute MUST be allowed. After the limit is exceeded, the server MUST return HTTP 429 (Too Many Requests) and reject further validation attempts until the rate window resets.
### Key Entities

- **Social Media Entry**: A user-provided URL for a specific social platform (LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok) paired with a boolean flag (checkbox) controlling whether a QR code is generated for it.
- **Contact Data JSON File**: A cloud-stored JSON document containing all input data entered by the user — contact fields, social media URLs, checkbox states, and QR customisation settings. Named with a sanitised form of the user's contact name plus a short random suffix (e.g., `jane-doe-x7k2.json`), with a sequential numeric index appended on the rare collision (e.g., `jane-doe-x7k2-1.json`). Only one active file exists per session; re-generating auto-deletes the previous file.
- **QR Code Card**: A visual result element displaying a generated QR code image with a label (either "vCard" or the social platform name) in the results area.
- **View Page**: An application page (e.g., `/view/{filename}`) that immediately fetches a saved JSON file from blob storage and renders all contact details and QR codes in read-only mode. In read-only mode, only Copy, Share as VCF, and Share by-link buttons are shown. An optional access code field allows the creator to enter their code and press Enter to unlock full mode, which enables all buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download) and allows changing the access code.
- **Retention Period**: A user-selected duration (1 day, 7 days, 1 month, 1 year, or forever) that controls how long the JSON file persists in cloud storage before auto-expiration. Stored in the JSON file and applied as a blob TTL at save time.
- **Delete Token**: A unique server-generated token associated with a saved JSON file. Required to authorize deletion of the file. Stored inside the JSON file (but NOT included in TXT exports). Held in client-side memory during the active session.
- **Access Code**: A user-provided secret entered at save time to protect the persisted data. Only a salted hash of the code is stored in the JSON file in blob storage — the plaintext code is never persisted. Not required to view the page (read-only mode shows content without a code), but required to unlock full mode on the view page by entering the code and pressing Enter. After successful entry, the code is displayed in an editable field and can be changed. The access code and its hash are NOT included in TXT exports.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can fill in contact details, add at least one social media URL, and generate all QR codes in under 60 seconds from entering Contact mode.
- **SC-002**: 100% of generated social media QR codes are scannable and open the correct URL on iOS Camera (iOS 15+) and Android's built-in scanner (Android 10+).
- **SC-003**: The JSON file is successfully persisted to cloud storage within 3 seconds of clicking Save, for at least 99% of requests under normal operating conditions.
- **SC-004**: Users can download their contact data as a TXT file in 2 actions or fewer (click Share → file downloads).
- **SC-004a**: Users can restore contact data from a previously downloaded TXT file in 3 actions or fewer (click Upload → select file → form populated).
- **SC-005**: Users can delete their saved contact data in 3 actions or fewer (click Delete → confirm → done), and the file is removed from storage within 5 seconds.
- **SC-006**: After deletion, the shared URL returns a "not found" response, verifiable by attempting to access the URL.
- **SC-007**: The social media section, QR code grid, Share button, and Delete button are fully functional and usable on a 375px-wide viewport without horizontal scrolling.
- **SC-008**: Existing Contact mode functionality (vCard generation, photo upload, form fields, validation) has zero regressions.
- **SC-009**: When a recipient opens a shared view-page URL, the page loads and renders all QR codes within 5 seconds (including blob fetch + QR generation).
- **SC-010**: 100% of QR codes displayed on the view page are scannable and produce the correct output (vCard import or URL open).
- **SC-011**: The view page is fully functional and responsive on a 375px-wide viewport.

## Assumptions

- **Supported social platforms**: The initial release supports LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, and TikTok. Additional platforms can be added in future iterations by extending the social media field list.
- **Simple URL QR codes**: Social media QR codes are standard URL QR codes — no platform-specific deep linking or app integration is required.
- **Cloud storage configuration**: The application is assumed to have access to a configured cloud storage account (connection string or managed identity) provided via application settings. If not configured, the feature degrades gracefully (QR codes work; persistence, sharing, and deletion are disabled).
- **Public blob access**: The blob container is publicly accessible. JSON files are reachable by anyone who has the direct URL. The view page fetches the JSON data server-side and renders contact details and QR codes in read-only mode immediately. An optional access code entry (submitted via Enter) unlocks creator buttons (full mode). The random suffix in the file name (e.g., `jane-doe-x7k2.json`) makes files practically unguessable. Deletion is protected by a separate delete token (see FR-017a/b).
- **JSON file structure**: The JSON schema follows the form field structure directly. A `Version` integer field is included for future compatibility (initial value: 1); formal schema migration tooling is out of scope for this iteration.
- **File retention**: JSON file expiration is user-configurable at generation time. The user selects from: 1 day, 7 days (default), 1 month, 1 year, or forever. The selected TTL is applied to the blob when saving. Files set to "forever" do not expire and persist until explicitly deleted. The retention period is stored in the JSON so the view page can display it.
- **QR customisation applies to all codes**: The same customisation settings (colours, module size, ECC level) are applied to all generated QR codes (vCard + social media) in a single generation.
- **No batch download**: Users view and share QR codes on the page. A batch download (e.g., ZIP of all QR code images) is out of scope for this iteration.
