# Tasks: vCard Profile Photo

**Input**: Design documents from `/specs/003-vcard-profile-photo/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story (US1, US2, US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files or independent code sections)
- **[US#]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Server-side annotation change that unblocks photo-in-vCard payloads

- [x] T001 Increase `StringLength(2048)` to `StringLength(4096)` on `Content` property in Models/QRModels.cs
- [x] T002 Verify project builds cleanly with `dotnet build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared HTML structure and CSS that all user stories depend on

**⚠️ CRITICAL**: US1–US3 cannot begin until this phase is complete.

- [x] T003 Add photo upload zone HTML (`.photo-upload` container, placeholder, preview `<img>`, remove button, hidden file input, checkbox, error `<p>`) above the name fields in the `.contact-block` in Views/Home/Index.cshtml
- [x] T004 [P] Add base CSS for `.photo-upload` zone (circular shape, placeholder layout, drag-over state) in wwwroot/css/site.css
- [x] T005 [P] Add CSS for `.photo-upload__preview` (circular clip, object-fit cover), `.photo-upload__remove` button, and `.photo-upload__options` checkbox row in wwwroot/css/site.css
- [x] T006 [P] Add responsive CSS rules for the photo upload area at ≤768px viewport in wwwroot/css/site.css

**Checkpoint**: HTML structure and styles in place — JS behaviour can now be wired.

---

## Phase 3: User Story 1 — Upload Profile Photo (Priority: P1) 🎯 MVP

**Goal**: User can upload a photo, see a circular preview, and remove it.

**Independent Test**: Switch to Contact mode → click photo area → select image → circular preview appears. Click remove → placeholder restored.

### Implementation

- [x] T007 [US1] Add DOM references for photo upload elements (`photo-upload-zone`, `photo-placeholder`, `photo-preview`, `remove-photo`, `photo-file`, `photo-error`) in wwwroot/js/site.js
- [x] T008 [US1] Add `photoBase64` state variable (initially `null`) in the IIFE scope in wwwroot/js/site.js
- [x] T009 [US1] Implement `handlePhotoFile(file)` function — validate file type (PNG/JPG/WebP) and size (≤2 MB), read as data URL, set `photoBase64`, show circular preview, hide placeholder, show remove button; show inline error on invalid file in wwwroot/js/site.js
- [x] T010 [US1] Wire click-to-browse on `photo-upload-zone` (trigger `photo-file` input click) and `change` event on `photo-file` input to call `handlePhotoFile()` in wwwroot/js/site.js
- [x] T011 [US1] Wire drag-and-drop events (`dragover`, `dragleave`, `drop`) on `photo-upload-zone` to call `handlePhotoFile()` with the dropped file in wwwroot/js/site.js
- [x] T012 [US1] Implement remove-photo click handler — clear `photoBase64`, hide preview, show placeholder, reset file input, hide checkbox and error in wwwroot/js/site.js

**Checkpoint**: Photo upload, preview, drag-drop, and remove all functional. US1 independently testable.

---

## Phase 4: User Story 2 — Include/Exclude Photo Toggle (Priority: P1)

**Goal**: Checkbox controls whether the photo is embedded in the generated vCard.

**Independent Test**: Upload photo → checkbox visible and checked → uncheck → Generate → scan → no photo. Re-check → Generate → scan → photo appears.

### Implementation

- [x] T013 [US2] Add DOM references for `include-photo` checkbox and `photo-options` container in wwwroot/js/site.js
- [x] T014 [US2] Add `includePhoto` state variable (initially `true`) and wire checkbox `change` event to update it in wwwroot/js/site.js
- [x] T015 [US2] Show/hide the `photo-options` container (checkbox row) when photo is uploaded/removed in wwwroot/js/site.js
- [x] T016 [US2] Implement `compressPhotoToBase64(imageSrc, size, quality)` utility — create canvas at target dimensions, draw image, export JPEG blob, convert to raw Base64 string (strip data URI prefix) in wwwroot/js/site.js
- [x] T017 [US2] Update `assembleVCard()` to accept an optional `photoBase64Raw` parameter and append `PHOTO;ENCODING=b;TYPE=JPEG:{data}` line before `END:VCARD` when provided in wwwroot/js/site.js
- [x] T018 [US2] Update the `generate()` function contact branch — when `photoBase64 !== null` and `includePhoto === true`, call `compressPhotoToBase64()` at 96×96/quality 0.7, pass result to `assembleVCard()`, then validate length in wwwroot/js/site.js

**Checkpoint**: Generate produces QR codes with or without embedded photo based on checkbox. US2 independently testable.

---

## Phase 5: User Story 3 — Photo Size Warning & Auto-Downscale (Priority: P2)

**Goal**: System progressively reduces photo quality/dimensions to fit within QR capacity, or shows clear error.

**Independent Test**: Upload large photo + ECC High → Generate → system auto-compresses to fit, or shows error if impossible.

### Implementation

- [x] T019 [US3] Implement `tryCompressPhotoForQR(imageSrc, assembleVCardFn, eccLevel)` — progressive two-dimensional reduction loop: for sizes [96, 64, 48] × qualities [0.7, 0.5, 0.3, 0.1], call `compressPhotoToBase64()`, assemble full vCard, check byte length against `maxBytesForEcc[eccLevel]`; return `{ success, vcard }` or `{ success: false }` in wwwroot/js/site.js
- [x] T020 [US3] Update the `generate()` function contact branch — replace the single compress call (T018) with `tryCompressPhotoForQR()` when photo is included; on failure show error in `#photo-error`: "Photo is too large to include at the current error correction level. Try unchecking 'Include photo' or lowering the error correction level." in wwwroot/js/site.js
- [x] T021 [US3] Ensure the existing `validateVCardLength()` check is bypassed/updated when photo is included (the progressive function already checks capacity) in wwwroot/js/site.js

**Checkpoint**: Auto-downscale works across all ECC levels. Graceful error on impossible fits. US3 independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, preservation, and final validation

- [x] T022 Ensure `photoBase64` is preserved across URL ↔ Contact mode switches (not cleared by `switchMode()`) in wwwroot/js/site.js
- [x] T023 [P] Verify that existing Contact mode functionality (form fields, validation, generate without photo, meta strip) has zero regressions
- [x] T024 [P] Run `dotnet build` to confirm zero warnings and zero errors
- [x] T025 Run quickstart.md validation — verify all 11 test areas from specs/003-vcard-profile-photo/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — photo upload basics
- **Phase 4 (US2)**: Depends on Phase 3 (needs photo state and `handlePhotoFile` to exist)
- **Phase 5 (US3)**: Depends on Phase 4 (needs `compressPhotoToBase64` and vCard assembly with photo)
- **Phase 6 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US2 (P1)**: Depends on US1 — needs `photoBase64` state and `handlePhotoFile()` to build upon
- **US3 (P2)**: Depends on US2 — needs `compressPhotoToBase64()` and `assembleVCard()` with photo parameter

### Within Each User Story

- DOM references before event handlers
- State variables before functions that use them
- Utility functions before integration into `generate()`

### Parallel Opportunities

- T004, T005, T006 (all CSS tasks in Phase 2) can run in parallel — different style blocks in same file
- T023, T024 (regression check and build check in Phase 6) can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
Sequence:  T003 (HTML)
Parallel:  T004 + T005 + T006 (CSS — independent style blocks)
```

## Parallel Example: Phase 6 (Polish)

```
Sequence:  T022 (mode switch preservation)
Parallel:  T023 + T024 (regression + build)
Sequence:  T025 (quickstart validation — depends on all above)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T006)
3. Phase 3: US1 (T007–T012)
4. **STOP and VALIDATE**: Upload photo, see preview, remove — works independently

### Incremental Delivery

1. Setup + Foundational → Structure ready
2. US1 → Photo upload works → Validate independently
3. US2 → Generate with/without photo → Validate independently
4. US3 → Auto-downscale + error → Validate independently
5. Polish → Regression-free, build passes, quickstart verified

### Suggested MVP Scope

**US1 + US2** (Phases 1–4): Users can upload a photo, toggle inclusion, and generate QR codes with embedded photos. This covers the core user request. US3 (auto-downscale) adds robustness but is P2.
