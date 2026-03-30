# Tasks: Social Media QR Codes with Blob Storage & Sharing

**Input**: Design documents from `/specs/007-social-qr-blob-share/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: Not requested in this feature specification — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialisation, configuration, shared model files

- [x] T001 Verify `Azure.Storage.Blobs` NuGet package reference exists in QRStudio.csproj (already listed per plan.md — confirm or add if missing)
- [x] T002 [P] Add `BlobStorage` configuration section (ConnectionString, ContainerName) to appsettings.json and appsettings.Development.json (Azurite: `UseDevelopmentStorage=true`, container: `qrstudio-contacts`)
- [x] T003 [P] Add `TtlCleanup` configuration section (IntervalMinutes: 60, Enabled: true) to appsettings.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and models that ALL user stories depend on — blob storage, access code hashing, multi-QR generation, rate limiting, TTL cleanup

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Extend DTOs in Models/ContactDataModels.cs — add or verify SocialMediaEntry, ContactQRRequest, ContactQRResponse, SocialMediaQRResult, and ContactDataPayload with data annotations per data-model.md
- [x] T005 [P] Extend DTOs in Models/BlobModels.cs — add BlobJsonDocument, SaveRequest, SaveResponse, DeleteRequest, VerifyCodeRequest, VerifyCodeResponse, ChangeCodeRequest, and ReadContactResponse with data annotations (access code StringLength 4–6 per FR-012a) per data-model.md
- [x] T006 [P] Add UpdateAsync (overwrite blob JSON) and ResetTtlAsync (update index tags with new expiry) to IBlobStorageService interface in Services/IBlobStorageService.cs
- [x] T007 Implement UpdateAsync and ResetTtlAsync in Services/BlobStorageService.cs — UpdateAsync re-uploads JSON blob; ResetTtlAsync sets blob index tag `ExpiresOn` to new computed date
- [x] T008 [P] Implement GenerateFileName logic in Services/BlobStorageService.cs — sanitise contact name to lowercase alphanumeric + hyphens, append 4-char random alphanumeric suffix, check ExistsAsync for collision, append sequential index if needed (FR-011)
- [x] T009 [P] Add GenerateContactAsync method signature to IQRCodeService interface in Services/IQRCodeService.cs — accept ContactQRRequest, return ContactQRResponse
- [x] T010 Implement GenerateContactAsync in Services/QRCodeService.cs — build vCard string from contact fields, generate vCard QR via QRCoder, iterate enabled social media entries to generate per-platform QR codes, return ContactQRResponse
- [x] T011 [P] Create IRateLimitService interface (IsRateLimited, RecordFailedAttempt) in Services/IRateLimitService.cs
- [x] T012 Implement RateLimitService in Services/RateLimitService.cs — ConcurrentDictionary keyed by `{ip}:{filename}`, prune entries older than 60s on access, return true when count ≥ 5 (FR-038)
- [x] T013 [P] Create TtlCleanupService as IHostedService in Services/TtlCleanupService.cs — PeriodicTimer with configurable interval from TtlCleanup:IntervalMinutes, list blobs with ExpiresOn tag, delete expired blobs (FR-037)
- [x] T014 Register IRateLimitService (singleton), TtlCleanupService (hosted service), and BlobServiceClient in DI container in Program.cs — read BlobStorage and TtlCleanup config sections

**Checkpoint**: Foundation ready — all services registered, hashing works, blob CRUD works, multi-QR generation works, rate limiting active, TTL cleanup scheduled

---

## Phase 3: User Story 1 — Enter Social Media URLs and Generate QR Codes (Priority: P1) 🎯 MVP

**Goal**: Users can enter social media URLs, check/uncheck platforms, and generate per-platform QR codes alongside the vCard QR code. Action buttons and access code field appear after generation.

**Independent Test**: Switch to Contact mode → fill in name + phone → enter LinkedIn URL → checkbox auto-checks → click Generate → vCard QR + LinkedIn QR appear → scan LinkedIn QR → opens profile URL. Buttons appear with correct enabled/disabled states per FR-010.

### Implementation for User Story 1

- [x] T015 [US1] Add POST /api/qr/generate-contact endpoint in Controllers/QRController.cs — accept ContactQRRequest, validate model state, delegate to IQRCodeService.GenerateContactAsync, return ContactQRResponse
- [x] T016 [US1] Add Social Media section HTML (7 platform input fields with corresponding checkboxes for LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok) below existing contact fields in Views/Home/Index.cshtml
- [x] T017 [P] [US1] Add CSS for social media section layout (responsive grid, 375px mobile, labelled inputs with checkboxes) in wwwroot/css/site.css
- [x] T018 [US1] Add action buttons HTML (Save, Delete, Copy, Share as VCF, Share by-link, Download), access code text field with label "Enter an access code to save your data", and retention period dropdown (1 day, 7 days default, 1 month, 1 year, forever) to results area in Views/Home/Index.cshtml (FR-010, FR-010b)
- [x] T019 [US1] Add QR code results grid HTML — vCard QR card displayed first, followed by social media QR cards with platform name labels, responsive grid layout in Views/Home/Index.cshtml (FR-009)
- [x] T020 [P] [US1] Add CSS for QR code results grid (responsive cards, platform labels) and action buttons (enabled/disabled/hidden states) in wwwroot/css/site.css
- [x] T021 [US1] Add JavaScript: auto-check checkbox when URL entered, auto-uncheck when URL cleared, auto-prepend `https://` to URLs missing a scheme (FR-003, FR-004, FR-005) in wwwroot/js/site.js
- [x] T022 [US1] Add JavaScript: inline URL validation per social media field — well-formed URL check with per-field error messages (FR-006) in wwwroot/js/site.js
- [x] T023 [US1] Add JavaScript: collect contact + social media form data, call POST /api/qr/generate-contact via Fetch API, render vCard QR + social media QR grid in results area (FR-007, FR-008, FR-009) in wwwroot/js/site.js
- [x] T024 [US1] Add JavaScript: after successful QR generation, show action buttons with correct enabled/disabled state per FR-010 matrix — Save enabled (when code valid), Share as VCF enabled, Download enabled; Delete/Copy/Share by-link disabled until saved in wwwroot/js/site.js
- [x] T025 [US1] Add JavaScript: enable/disable Save button based on access code input length (min 4, max 6 chars); disable while typing, enable when valid length reached (US1 scenario 10, FR-012a) in wwwroot/js/site.js

**Checkpoint**: US1 complete — social media QR codes generate alongside vCard, form interactions work, buttons appear with correct states

---

## Phase 4: User Story 2 — Save Contact Data to Blob Storage (Priority: P1) 🎯 MVP

**Goal**: After generating QR codes, user saves data with an access code. JSON file persisted to blob storage with hashed code, delete token, and TTL. Post-save buttons become enabled.

**Independent Test**: Generate QR codes → enter access code (4–6 chars) → Save button enables → click Save → JSON file created in blob with hashed code → confirmation shown → Delete/Copy/Share by-link buttons become enabled. Re-generate → previous file auto-deleted.

### Implementation for User Story 2

- [x] T026 [US2] Add POST /api/blob/save endpoint in Controllers/BlobController.cs — validate model state, hash access code via IAccessCodeService (SHA-256 + 16-byte salt), generate 32-byte delete token, compute expiresAt from retention period, call IBlobStorageService.SaveAsync, set blob index tags (ExpiresOn), reset TTL on re-save (FR-036), return SaveResponse with fileName/deleteToken/viewUrl
- [x] T027 [US2] Add JavaScript: call POST /api/blob/save with ContactDataPayload + accessCode + retentionPeriod, store deleteToken/fileName/viewUrl in module-scope variables, show success confirmation, enable post-save buttons (Delete, Copy, Share by-link per FR-010a, FR-014) in wwwroot/js/site.js
- [x] T028 [US2] Add JavaScript: on re-generate, auto-delete previous file by calling DELETE /api/blob/{currentFileName} with stored deleteToken before new save; ignore failures (FR-021) in wwwroot/js/site.js
- [x] T029 [US2] Add JavaScript: detect blob storage unavailability (save returns error), show warning message, keep QR codes displayed, hide save-dependent buttons (FR-013, FR-022) in wwwroot/js/site.js

**Checkpoint**: US2 complete — Save persists JSON with hashed code to blob, re-generate auto-deletes previous file, graceful degradation works

---

## Phase 5: User Story 6 + User Story 7 — View Page: Read-Only & Full Mode (Priority: P1) 🎯 MVP

**Goal**: Recipients open a view-page URL and immediately see all contact data + QR codes in read-only mode with limited buttons. Optionally, enter access code to unlock full mode with all creator buttons. Code can be changed. US7 shares the same `/view/{filename}` page.

**Independent Test**: Copy view URL → open in new tab → contact data + QR codes render immediately in read-only mode with Copy/Share as VCF/Share by-link buttons → enter correct access code + press Enter → page transitions to full mode with all buttons → change access code → old code rejected, new code works.

### Implementation for User Story 6 + 7

- [x] T030 [US6] Modify ViewController Index action to accept `slug` string parameter and return Razor view shell in Controllers/ViewController.cs
- [x] T031 [US6] Add GET /api/blob/read/{filename} endpoint in Controllers/BlobController.cs — fetch blob JSON, check expiresAt vs UTC now, return ReadContactResponse with ContactDataPayload (exclude accessCodeHash, accessCodeSalt, deleteToken per contracts §7), return 404 if expired/missing (FR-029, FR-030, FR-035)
- [x] T032 [US6] Add POST /api/blob/verify endpoint in Controllers/BlobController.cs — check rate limit via IRateLimitService (return 429 if exceeded per FR-038), read blob, verify code via IAccessCodeService, return VerifyCodeResponse with ContactDataPayload + deleteToken on success, "Invalid access code" on failure (FR-025b)
- [x] T033 [US6] Add POST /api/blob/change-code endpoint in Controllers/BlobController.cs — verify current code, generate new 16-byte salt, re-hash new code with SHA-256, update blob JSON via IBlobStorageService.UpdateAsync, confirm change (FR-026b)
- [x] T034 [US6] Update view page Razor template with: read-only contact card layout, access code input field with Enter-key submission, QR grid placeholder, action buttons area (read-only set + full set), change-code section (hidden until full mode) in Views/View/Index.cshtml
- [x] T035 [P] [US6] Add CSS for view page: formatted contact card text, QR grid, read-only vs full mode toggle via CSS classes, access code field, change-code section in wwwroot/css/site.css
- [x] T036 [US6] Add JavaScript: on page load, call GET /api/blob/read/{slug} via Fetch API, render contact data as formatted non-editable text (FR-035a), call POST /api/qr/generate-contact with returned data to generate QR codes, display in grid, show read-only buttons only (Copy, Share as VCF, Share by-link per FR-032, FR-035e) in wwwroot/js/site.js
- [x] T037 [US6] Add JavaScript: access code entry with Enter key submission, call POST /api/blob/verify, on success transition to full mode via CSS class toggle — show all buttons (Save, Delete, Copy, Share as VCF, Share by-link, Download), display editable access code field (FR-025a, FR-025b, FR-026, FR-026a, FR-035c) in wwwroot/js/site.js
- [x] T038 [US6] Add JavaScript: change access code form — validate new code (4–6 chars), call POST /api/blob/change-code with current + new code, show confirmation or error (FR-026b) in wwwroot/js/site.js
- [x] T039 [US6] Handle expired/deleted/non-existent blobs in view page — display "This contact card is no longer available" (FR-029) or 404 page (FR-030) in Controllers/BlobController.cs and Views/View/Index.cshtml
- [x] T040 [US6] Add JavaScript: handle HTTP 429 rate limit response — show "Too many attempts. Please wait and try again." message (FR-038) in wwwroot/js/site.js

**Checkpoint**: US6+US7 complete — view page renders read-only on load, access code unlocks full mode, code change works, expired/missing files handled, rate limiting enforced

---

## Phase 6: User Story 3a — Download Contact Data as Text File (Priority: P2)

**Goal**: Users can download a TXT file containing their contact data in JSON format, excluding all security fields

**Independent Test**: Generate + Save → click Download → file `jane-doe-contact.txt` downloads → open → valid JSON with all contact + social media data, no access code/hash/salt/deleteToken

### Implementation for User Story 3a

- [x] T041 [P] [US3a] Add JavaScript: generate TXT content from ContactDataPayload (exclude accessCodeHash, accessCodeSalt, deleteToken, expiresAt, createdAt, version), serialise as JSON, create Blob, trigger download with filename `{firstname}-{lastname}-contact.txt` (FR-015) in wwwroot/js/site.js
- [x] T042 [US3a] Wire Download button click handler on main page results area to TXT generation function in wwwroot/js/site.js
- [x] T043 [US3a] Wire Download button on view page (full mode only, hidden in read-only per FR-031, FR-032) to same TXT generation function in wwwroot/js/site.js

**Checkpoint**: US3a complete — TXT download works from both main page and view page (full mode), excludes security fields

---

## Phase 7: User Story 3b — Copy URL of Saved JSON File (Priority: P2)

**Goal**: Users can copy the application's view-page URL to the clipboard with a toast confirmation

**Independent Test**: Generate + Save → click Copy → URL `{app-base-url}/view/{slug}` copied to clipboard → toast "Link copied to clipboard" appears → paste URL → it points to view page

### Implementation for User Story 3b

- [x] T044 [US3b] Add JavaScript: Copy button click handler — copy stored viewUrl to clipboard via navigator.clipboard.writeText, show confirmation toast "Link copied to clipboard" (FR-015d, FR-015e) in wwwroot/js/site.js

**Checkpoint**: US3b complete — Copy button copies view-page URL to clipboard with toast

---

## Phase 8: User Story 3c — Share VCF Contact Card (Priority: P2)

**Goal**: Users can share a VCF (vCard) contact card via native sharing or direct download, independent of blob persistence

**Independent Test**: Generate QR codes → "Share as VCF" button appears near vCard QR → click → native share dialog with VCF file attached → share to another app → recipient sees contact data. On desktop without Web Share API → VCF file downloads directly.

### Implementation for User Story 3c

- [x] T045 [US3c] Add JavaScript: generate vCard 3.0 string from contact fields (FN, N, TEL, EMAIL, ORG, TITLE, URL — no social media URLs per FR-033b), create Blob with MIME type `text/vcard` in wwwroot/js/site.js
- [x] T046 [US3c] Add JavaScript: "Share as VCF" button click handler — feature-detect navigator.canShare, invoke navigator.share with VCF file, fall back to direct download via anchor element with download attribute if Web Share API unsupported (FR-033a, FR-033d) in wwwroot/js/site.js
- [x] T047 [US3c] Wire "Share as VCF" button on view page (visible in both read-only and full mode per FR-033c, FR-032, FR-035e) to same VCF sharing function in wwwroot/js/site.js

**Checkpoint**: US3c complete — VCF sharing works on main page and view page (both modes), with fallback to download

---

## Phase 9: User Story 3d — Upload Saved Data to Restore Contact Form (Priority: P2)

**Goal**: Users can upload a previously downloaded TXT file to restore all form fields

**Independent Test**: Open app → click Upload → select valid TXT file → all contact + social media fields populate → click Generate → QR codes created → save prompt appears → enter code and save → data persisted to blob

### Implementation for User Story 3d

- [x] T048 [US3d] Add Upload/Restore button and hidden file input at top of contact form (above all fields per US3d scenario 1) in Views/Home/Index.cshtml
- [x] T049 [US3d] Add JavaScript: Upload button triggers hidden file input, FileReader reads selected file, parse JSON, validate expected fields (firstName, lastName present), populate all contact fields + social media URLs + checkbox states from parsed data, replace existing values (FR-015a, FR-015b) in wwwroot/js/site.js
- [x] T050 [US3d] Add JavaScript: handle invalid file (not valid JSON or missing expected fields) — show error message "File could not be read", leave form unchanged (FR-015c) in wwwroot/js/site.js

**Checkpoint**: US3d complete — upload populates form, invalid files show error, user can regenerate and re-persist

---

## Phase 10: User Story 3e — Share by Link (Priority: P2)

**Goal**: Users can share the view-page URL via native sharing or clipboard copy

**Independent Test**: Generate + Save → "Share by-link" button appears near vCard QR → click → native share dialog with view-page URL → share to another app → recipient opens link → view page renders data. On desktop without Web Share API → URL copied to clipboard with toast.

### Implementation for User Story 3e

- [x] T051 [US3e] Add JavaScript: "Share by-link" button click handler — feature-detect navigator.canShare, invoke navigator.share with view-page URL and title, fall back to clipboard copy via navigator.clipboard.writeText + toast "Link copied to clipboard" if Web Share API unsupported (FR-034a, FR-034d) in wwwroot/js/site.js
- [x] T052 [US3e] Wire "Share by-link" button on view page (visible in both read-only and full mode per FR-034, FR-032, FR-035e) to same link sharing function in wwwroot/js/site.js

**Checkpoint**: US3e complete — link sharing works on main page (after save) and view page (both modes), with fallback

---

## Phase 11: User Story 4 — Delete Contact Data for GDPR Compliance (Priority: P2)

**Goal**: Users can permanently delete their saved JSON file from blob storage

**Independent Test**: Generate + Save → Delete button enabled → click Delete → confirmation dialog → confirm → JSON file removed from blob → Delete/Copy/Share by-link buttons disabled → shared URL returns 404

### Implementation for User Story 4

- [x] T053 [US4] Add DELETE /api/blob/{filename} endpoint in Controllers/BlobController.cs — accept DeleteRequest body with deleteToken, constant-time comparison against stored token, call IBlobStorageService.DeleteAsync, return success or 403/404 (FR-017, FR-017a, FR-017b)
- [x] T054 [US4] Add JavaScript: Delete button click → confirmation dialog "Are you sure you want to permanently delete your saved contact data?" → on confirm call DELETE /api/blob/{filename} with stored deleteToken → on success disable Delete/Copy/Share by-link buttons, show confirmation notice "Your contact data has been deleted" (FR-017, FR-018, FR-019) in wwwroot/js/site.js
- [x] T055 [US4] Add JavaScript: handle delete failure (storage unavailable, file already deleted, invalid token) — show error message suggesting retry later (FR-020) in wwwroot/js/site.js

**Checkpoint**: US4 complete — deletion works with token auth, buttons update correctly, shared URL returns 404 after deletion

---

## Phase 12: User Story 5 — Social Media QR Codes Display with Platform Branding (Priority: P3)

**Goal**: Each social media QR code card shows the platform name and a recognisable icon

**Independent Test**: Generate QR codes for LinkedIn + Instagram → each card shows platform name heading + icon → responsive grid layout → vCard QR displayed first

### Implementation for User Story 5

- [x] T056 [P] [US5] Add platform icon SVGs (inline or CSS-embedded) for LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok in wwwroot/css/site.css or Views/Home/Index.cshtml
- [x] T057 [US5] Update QR code card rendering to include platform icon + platform name heading above each QR code image on main page in wwwroot/js/site.js (FR-009)
- [x] T058 [US5] Apply same platform branding (icon + name heading) to view page QR grid in wwwroot/js/site.js (FR-028)

**Checkpoint**: US5 complete — all QR codes have platform branding on both main page and view page

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Validation, responsiveness, regression checks, and performance verification across all user stories

- [x] T059 [P] Validate all API endpoints return structured error responses (consistent `{ success, errorMessage }` JSON format) in Controllers/QRController.cs and Controllers/BlobController.cs
- [x] T060 [P] Verify input validation data annotations on all request DTOs — access code 4–6 chars, URL format, required fields in Models/ContactDataModels.cs and Models/BlobModels.cs
- [x] T061 Verify mobile responsiveness (375px minimum viewport) for social media section, QR grid, action buttons, access code field, and view page in wwwroot/css/site.css (FR-024)
- [x] T062 Run quickstart.md validation — verify NuGet packages, appsettings config, Azurite setup, all 7 endpoints responding per quickstart.md
- [x] T063 Verify existing Contact mode functionality has zero regressions (FR-023) — vCard generation, photo upload, form fields, validation all still work
- [x] T064 Validate performance targets — SC-003 (save < 3s) and SC-009 (view page load + QR gen < 5s) under normal conditions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001–T003) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (T004–T014)
- **US2 (Phase 4)**: Depends on Phase 2 + US1 (needs generate-contact endpoint and form)
- **US6+US7 (Phase 5)**: Depends on Phase 2 + US2 (needs blob save to exist)
- **US3a (Phase 6)**: Depends on US2 (needs save flow and ContactDataPayload structure)
- **US3b (Phase 7)**: Depends on US2 + US6 (needs viewUrl from save + view page to exist)
- **US3c (Phase 8)**: Depends on US1 (needs QR generation and contact data — independent of blob persistence per FR-033c)
- **US3d (Phase 9)**: Depends on US1 (needs form fields to populate)
- **US3e (Phase 10)**: Depends on US2 + US6 (needs viewUrl from save + view page to exist)
- **US4 (Phase 11)**: Depends on US2 (needs save flow for delete token)
- **US5 (Phase 12)**: Depends on US1 (needs QR card rendering to exist)
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) ──► Phase 2 (Foundational) ──┬──► US1 (Phase 3) ──► US2 (Phase 4) ──┬──► US6+US7 (Phase 5)
                                              │                                       ├──► US3a (Phase 6)
                                              │                                       ├──► US4 (Phase 11)
                                              │                                       │
                                              │                     US2 + US6 ────────┼──► US3b (Phase 7)
                                              │                                       │
                                              │                     US2 + US6 ────────┼──► US3e (Phase 10)
                                              │                                       │
                                              │                     US1 ──────────────┼──► US3c (Phase 8)
                                              │                                       │
                                              │                     US1 ──────────────┼──► US3d (Phase 9)
                                              │                                       │
                                              └──► US5 (Phase 12) ◄──── US1           │
                                                                                       │
                                                              All stories ────────────► Phase 13 (Polish)
```

### Within Each User Story

- Models / DTOs before services
- Services before controllers / endpoints
- Controllers before frontend (JS/CSS/Razor)
- Core implementation before integration and error handling

### Parallel Opportunities

**Phase 1**: T002, T003 can run in parallel (different config sections)
**Phase 2**: T004+T005 in parallel (different model files); T006+T008+T009 in parallel (different service interfaces); T011+T013 in parallel with T006–T010 (independent services)
**Phase 3 (US1)**: T017+T020 (CSS files) can run in parallel with T016+T018+T019 (HTML)
**Phase 5 (US6+US7)**: T035 (CSS) can run in parallel with T034 (HTML)
**Phase 6 (US3a)**: T041 can run in parallel (standalone function)
**Phase 8 (US3c)**: US3c can run in parallel with US3a if US1 is complete (independent of blob storage)
**Phase 9 (US3d)**: US3d can run in parallel with US3a if US1 is complete (independent of blob storage)
**Phase 12 (US5)**: T056 can run in parallel (SVG assets independent of JS)
**Phase 13**: T059, T060 can run in parallel (different files)

### Parallel Example: Phase 3 (US1)

```
# CSS tasks in parallel with HTML tasks:
T017 [P] [US1] CSS for social media section      ─┐
T020 [P] [US1] CSS for QR grid and buttons        ─┤── parallel (CSS file)
                                                    │
T016 [US1] Social Media section HTML              ─┤
T018 [US1] Action buttons + access code HTML       ─┤── parallel (Razor file)
T019 [US1] QR results grid HTML                   ─┘

# Then sequential JS tasks (all in same file):
T021 → T022 → T023 → T024 → T025
```

---

## Implementation Strategy

**MVP scope**: Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US6+US7)
After MVP, prioritise P2 stories in dependency order: US3a → US3b/US3c/US3d/US3e → US4, then P3: US5.

**Incremental delivery**:
1. **Increment 1 (MVP)**: US1 + US2 + US6/US7 — users can generate QR codes, save to blob, and view via shared link
2. **Increment 2**: US3a + US3b + US3c + US3d + US3e — full sharing and portability workflow
3. **Increment 3**: US4 — GDPR deletion
4. **Increment 4**: US5 — platform branding
5. **Increment 5**: Polish — validation, responsive, regression, performance
