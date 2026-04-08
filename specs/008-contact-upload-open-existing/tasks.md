# Tasks: Contact Tab Upload & Open Existing

**Input**: Design documents from `/specs/008-contact-upload-open-existing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: No new project setup needed — all changes are in existing files. This phase handles the shared DTO additions that multiple stories depend on.

- [X] T001 Add `FindByNameRequest` DTO to Models/BlobModels.cs with `[Required]` firstName, `[Required]` lastName, and `[Required] [StringLength(6, MinimumLength = 4)]` accessCode properties
- [X] T002 Add `FindByNameResponse` DTO to Models/BlobModels.cs with success, contactData, fileName, deleteToken, and errorMessage properties

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend service and API endpoint that US3 (Open Existing) depends on. Must complete before US3 implementation.

**⚠ CRITICAL**: User Story 3 cannot begin until this phase is complete. User Stories 1, 2, and 4 have no dependency on this phase.

- [X] T003 Add `FindByNamePrefixAsync(string firstName, string lastName)` method signature to Services/IBlobStorageService.cs returning `Task<IReadOnlyList<(string FileName, BlobJsonDocument Document)>>`
- [X] T004 Implement `FindByNamePrefixAsync` in Services/BlobStorageService.cs using `GetBlobsAsync` with sanitized `{firstName}-{lastName}-` prefix, reading each matching blob document, filtering out expired entries
- [X] T005 Add `POST /api/blob/find` endpoint in Controllers/BlobController.cs: validate ModelState, apply rate limiting via `IRateLimitService`, call `FindByNamePrefixAsync`, iterate results and verify access code via `IAccessCodeService.VerifyCode`, return `FindByNameResponse` with generic error message on failure

**Checkpoint**: `POST /api/blob/find` endpoint is functional and can be tested via curl/Postman

---

## Phase 3: User Story 1 — Remove Drop Button (Priority: P1) 🎯 MVP

**Goal**: Remove the "Drop" button and its handler from the save prompt so only "Save" remains.

**Independent Test**: Generate a contact QR code → save prompt appears → only "Save" button visible, no "Drop" button.

### Implementation for User Story 1

- [X] T006 [P] [US1] Remove the `<button class="btn btn--ghost" id="drop-blob-btn">Drop</button>` element from the save-prompt actions in Views/Home/Index.cshtml
- [X] T007 [P] [US1] Update the save-prompt description text in Views/Home/Index.cshtml from "Enter an access code to save and share your contact data. Or drop to skip saving." to "Enter an access code to save and share your contact data."
- [X] T008 [US1] Remove the `dropBlobBtn` DOM reference and its `click` event listener from wwwroot/js/site.js

**Checkpoint**: Generate a contact QR → save prompt shows only "Save" button with updated description text

---

## Phase 4: User Story 2 — Move Upload to Top of Contact Tab (Priority: P1) 🎯 MVP

**Goal**: Relocate the Upload button from the output/result area to the top of the Contact tab for immediate access.

**Independent Test**: Switch to Contact tab → "Upload" button visible at top → click it → select a .txt file → all form fields populate.

### Implementation for User Story 2

- [X] T009 [US2] Add Upload button HTML at the top of the `.contact-block` div in Views/Home/Index.cshtml: a `<div class="contact-actions">` containing `<button class="btn btn--outline" id="upload-contact-btn">Upload</button>` and a hidden `<input type="file" id="upload-contact-file" accept=".txt,.json">` with adjacent `<p class="field-error" id="upload-contact-error">`, positioned above the photo-upload zone
- [X] T010 [US2] Remove the old `#upload-restore-section` div (containing `#upload-txt-btn` and `#upload-txt-file`) from the output-result area in Views/Home/Index.cshtml
- [X] T011 [US2] Add CSS for `.contact-actions` row in wwwroot/css/site.css: flex row with gap, margin-bottom to separate from photo upload below
- [X] T012 [US2] Update wwwroot/js/site.js: add DOM references for `upload-contact-btn`, `upload-contact-file`, `upload-contact-error`; wire `upload-contact-btn` click to trigger `upload-contact-file.click()`; move existing upload-txt-file `change` handler logic to `upload-contact-file` change handler; remove old `upload-txt-btn`/`upload-txt-file`/`upload-txt-error` references and the old `uploadTxtFile` change listener; remove the `showSection` logic that showed `upload-restore-section`

**Checkpoint**: Contact tab shows Upload button at top; clicking it opens file picker; selecting a valid .txt file populates all contact fields; old Upload TXT button in result area is gone

---

## Phase 5: User Story 3 — Open Existing Contact via Popup (Priority: P2)

**Goal**: Add "Open Existing" button that opens a modal popup with First Name, Last Name, Access Code fields to retrieve a server-saved contact.

**Independent Test**: Click "Open Existing" → popup appears → fill 3 fields → click "Open" → contact form populated from server.

### Implementation for User Story 3

- [X] T013 [US3] Add the "Open Existing" button HTML inside `.contact-actions` row (next to Upload button) in Views/Home/Index.cshtml: `<button class="btn btn--outline" id="open-existing-btn">Open Existing</button>`
- [X] T014 [US3] Add the modal overlay HTML at the end of Views/Home/Index.cshtml (before closing `</main>`): a `<div class="modal-backdrop" id="open-existing-backdrop" hidden>` containing `<div class="modal-dialog open-existing-modal">` with header "Open Existing Contact", three field groups (First Name input `id="oe-first-name"`, Last Name input `id="oe-last-name"`, Access Code input `id="oe-access-code" type="password" minlength="4" maxlength="6"`), an error `<p class="field-error" id="oe-error">`, and an "Open" button `id="oe-submit-btn"` with spinner
- [X] T015 [US3] Add CSS for `.modal-backdrop` (position fixed, inset 0, background rgba(0,0,0,0.4), display flex, align-items center, justify-content center, z-index 1000) and `.modal-dialog` (background var(--surface), border, border-radius, padding, max-width 400px, width 90%, animation slideUp) in wwwroot/css/site.css
- [X] T016 [US3] Add modal open/close logic in wwwroot/js/site.js: `open-existing-btn` click shows backdrop; backdrop click (outside dialog) hides it; Escape key hides it; clear fields and error on open
- [X] T017 [US3] Add form submission logic in wwwroot/js/site.js: `oe-submit-btn` click validates all 3 fields non-empty, shows validation errors if empty; if valid, shows spinner, calls `POST /api/blob/find` with `{ firstName, lastName, accessCode }` via fetch; on success, close modal and call the existing contact-field-population function (`populateContactFields` or inline logic) to fill the form; on failure, show `oe-error` with the server error message; on network error, show generic error; hide spinner when done
- [X] T018 [US3] Extract the existing upload-file field-population logic in wwwroot/js/site.js into a reusable `populateContactForm(data)` function that both the Upload handler (T012) and the Open Existing handler (T017) call, to avoid duplicating the field-setting code

**Checkpoint**: "Open Existing" button visible; clicking it opens modal; filling fields and clicking "Open" retrieves contact from server and populates form; wrong credentials show error inside modal; Escape/backdrop click dismiss modal

---

## Phase 6: User Story 4 — Info Icon for Open Existing (Priority: P3)

**Goal**: Add an info icon near the "Open Existing" button with tooltip explaining the feature.

**Independent Test**: Hover over ⓘ icon → tooltip text appears.

### Implementation for User Story 4

- [X] T019 [US4] Add an info icon `<span class="info-icon" title="You can open existing contact card — provide first name, last name and access code">ⓘ</span>` next to the "Open Existing" button in the `.contact-actions` row in Views/Home/Index.cshtml
- [X] T020 [US4] Add CSS for `.info-icon` in wwwroot/css/site.css: inline-flex, cursor help, color var(--text-subtle), font-size 0.85rem, position relative; add a CSS-only tooltip using `::after` pseudo-element on hover (or rely on native `title` attribute for simplicity consistent with existing patterns)

**Checkpoint**: Info icon visible next to "Open Existing"; hovering shows tooltip text

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation across all stories

- [X] T021 Verify the Contact tab hides Upload and Open Existing buttons when URL mode is active in wwwroot/js/site.js — ensure the `.contact-block[hidden]` attribute correctly hides the new `.contact-actions` row
- [X] T022 Ensure mobile responsiveness: test `.contact-actions` row wraps properly on narrow viewports in wwwroot/css/site.css (flex-wrap: wrap or stack vertically below a breakpoint)
- [X] T023 Run quickstart.md verification steps for all 4 user stories to confirm end-to-end functionality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (DTOs) — BLOCKS User Story 3 only
- **Phase 3 (US1)**: No dependencies on other phases — can start immediately
- **Phase 4 (US2)**: No dependencies on Phase 2 — can start immediately
- **Phase 5 (US3)**: Depends on Phase 2 (find endpoint) and Phase 4 (shared `populateContactForm` function from T018)
- **Phase 6 (US4)**: Depends on Phase 5 (Open Existing button must exist for info icon placement)
- **Phase 7 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (Remove Drop)**: Independent — no dependencies on any other story
- **US2 (Move Upload)**: Independent — no dependencies on any other story
- **US3 (Open Existing)**: Depends on Foundational phase (API endpoint) + T018 from US2 (shared populate function)
- **US4 (Info Icon)**: Depends on US3 (needs Open Existing button to exist)

### Within Each User Story

- HTML changes before JS changes (DOM elements must exist before JS references them)
- CSS can be done in parallel with HTML (different files)
- Backend changes (Phase 2) before frontend consumer (Phase 5)

### Parallel Opportunities

- **T006 + T007**: Both are HTML-only edits in the same file but different sections — marked [P]
- **T001 + T002**: Independent DTO additions in same file — but sequential is safer for file edits
- **Phase 3 (US1) ∥ Phase 4 (US2)**: Entirely independent user stories, can proceed in parallel
- **Phase 3 (US1) ∥ Phase 2 (Foundational)**: US1 has no dependency on backend changes
- **T013 + T015**: HTML and CSS are in different files — can be parallel
- **T019 + T020**: HTML and CSS are in different files — can be parallel

---

## Parallel Example: US1 + US2 Concurrent

```
Phase 1: T001 → T002                           (sequential, same file)
                  ├── Phase 2: T003 → T004 → T005   (sequential, backend)
                  ├── Phase 3: T006, T007 → T008     (US1, parallel HTML then JS)
                  └── Phase 4: T009 → T010 → T011, T012 → T018  (US2)
Phase 5: T013 → T014 → T015, T016 → T017       (US3, after Phase 2 + T018)
Phase 6: T019, T020                             (US4, after Phase 5)
Phase 7: T021 → T022 → T023                    (Polish, after all)
```

---

## Implementation Strategy

### MVP Scope

User Story 1 (Remove Drop) + User Story 2 (Move Upload) = **Phase 3 + Phase 4**. These two P1 stories deliver immediate value with zero backend changes and can be deployed independently.

### Incremental Delivery

1. **Increment 1 (MVP)**: US1 + US2 — Remove Drop button, move Upload to top. Pure frontend changes. Ship immediately.
2. **Increment 2**: US3 — Open Existing popup with backend find endpoint. Requires Phase 1 + Phase 2 first.
3. **Increment 3**: US4 — Info icon. Trivial addition after US3.
4. **Increment 4**: Polish pass across all stories.
