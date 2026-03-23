# Tasks: UI Rebrand & Share

**Input**: Design documents from `/specs/001-ui-rebrand-share/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not included — no automated test framework; verification via manual quickstart.md scenarios.

**Organization**: Tasks grouped by user story (US1, US2, US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in each description

---

## Phase 1: Setup

**Purpose**: No new project scaffolding needed — existing ASP.NET Core MVC project is used as-is. This phase covers preparatory cleanup.

- [X] T001 Remove the "Free" badge HTML element (`<span class="brand__badge">Free</span>`) from Views/Home/Index.cshtml
- [X] T002 [P] Remove the `.brand__badge` CSS rule from wwwroot/css/site.css

**Checkpoint**: Badge removed from both HTML and CSS. Page loads without "Free" badge.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Responsive breakpoint adjustment that affects all user stories.

**CRITICAL**: Must complete before user story work to avoid merge conflicts in site.css.

- [X] T003 Update the responsive breakpoint from `max-width: 740px` to `max-width: 768px` in wwwroot/css/site.css
- [X] T004 Add a tablet breakpoint `@media (max-width: 1024px)` that reduces `--sidebar-w` to `320px` in wwwroot/css/site.css

**Checkpoint**: Layout stacks at 768px and sidebar narrows at 1024px. All existing functionality preserved.

---

## Phase 3: User Story 1 — Rebranded Identity (Priority: P1) MVP

**Goal**: Replace all "QR Studio" branding with "daenet QR Studio", new combined logo SVG, and updated tab title.

**Independent Test**: Load homepage — header shows "daenet QR Studio" with new logo, tab reads "daenet QR Studio", no "Free" badge.

### Implementation for User Story 1

- [X] T005 [US1] Update the browser tab title from "QR Studio" to "daenet QR Studio" in Views/Home/Index.cshtml (ViewData["Title"] line)
- [X] T006 [US1] Update the page `<title>` fallback in Views/Shared/_Layout.cshtml to read "daenet QR Studio"
- [X] T007 [US1] Replace the brand name text from `QR<em>Studio</em>` to `daenet <em>QR Studio</em>` in Views/Home/Index.cshtml
- [X] T008 [US1] Replace the existing inline SVG logo in `.brand__icon` with a new combined daenet+QR-grid SVG (32×32 viewBox, uses `currentColor`) in Views/Home/Index.cshtml
- [X] T009 [US1] Update the `.brand__name` CSS to accommodate the longer "daenet QR Studio" text (verify no overflow or wrapping) in wwwroot/css/site.css

**Checkpoint**: US1 complete. All branding reads "daenet QR Studio". New logo renders at all viewports. Tab title updated.

---

## Phase 4: User Story 2 — Modern UI with Transitions (Priority: P2)

**Goal**: Update input label to "URL", replace Generate button text with QR-code icon, add hover/click transitions to all interactive elements, ensure full mobile responsiveness.

**Independent Test**: Interact with every control on desktop and mobile — smooth hover animations, icon-only Generate button, "URL" label, no horizontal scroll at 320px.

### Implementation for User Story 2

- [X] T010 [US2] Change the content input label from "URL or plain text" to "URL" in Views/Home/Index.cshtml
- [X] T011 [US2] Replace the Generate button text with an inline QR-code grid SVG icon, add `aria-label="Generate QR code"` and `title="Generate QR code"`, keep the spinner in Views/Home/Index.cshtml
- [X] T012 [P] [US2] Add enhanced hover transitions to `.btn--primary`, `.btn--outline`, `.btn--ghost` (translateY + box-shadow elevation) in wwwroot/css/site.css
- [X] T013 [P] [US2] Add `:active` scale feedback (`transform: scale(0.97)`) to all `.btn` variants in wwwroot/css/site.css
- [X] T014 [P] [US2] Add hover transition effects to `.color-picker-wrap`, `.select`, `.upload-zone`, and `.range-input` thumb in wwwroot/css/site.css
- [X] T015 [P] [US2] Add focus-visible ring styles (`box-shadow: 0 0 0 3px`) to `.btn` and `.select` elements in wwwroot/css/site.css
- [X] T016 [US2] Verify mobile layout at 375px and 320px widths — ensure no horizontal scrollbar and all controls remain accessible (adjust padding/sizing if needed) in wwwroot/css/site.css

**Checkpoint**: US2 complete. Label reads "URL", Generate button is icon-only with tooltip, all elements have smooth hover/click transitions, responsive at all breakpoints.

---

## Phase 5: User Story 3 — Share Generated QR Code (Priority: P3)

**Goal**: Add Share button to output actions, implement Web Share API with file sharing, build 9-channel fallback panel with dismiss behaviour.

**Independent Test**: Generate a QR code → click Share → native sheet (if supported) or fallback panel with 9 channels appears → each channel opens correct intent → panel dismissible via X or outside click.

### Implementation for User Story 3

- [X] T017 [US3] Add the Share button HTML (with share icon SVG) to the `.output-actions` row after the Copy button in Views/Home/Index.cshtml
- [X] T018 [US3] Add the fallback share panel HTML structure (`.share-panel` with header, close button, 9 channel buttons with icons and labels) below `.output-actions` in Views/Home/Index.cshtml
- [X] T019 [P] [US3] Add CSS styles for the Share button (`.btn--outline` variant matching Download button) in wwwroot/css/site.css
- [X] T020 [P] [US3] Add CSS styles for the share panel: positioning, backdrop, grid layout for 9 channels, `@keyframes slideUp` entrance animation, dismiss transitions in wwwroot/css/site.css
- [X] T021 [P] [US3] Add responsive CSS for the share panel on mobile (full-width, bottom-sheet style at ≤768px) in wwwroot/css/site.css
- [X] T022 [US3] Add DOM refs for `#share-btn`, `.share-panel`, `.share-panel-close`, and all `.share-channel` elements in wwwroot/js/site.js
- [X] T023 [US3] Implement the `handleShare()` function: feature-detect `navigator.share` + `navigator.canShare`, convert data URI to Blob/File, attempt native share, fall back to showing panel in wwwroot/js/site.js
- [X] T024 [US3] Implement the 9 share channel handlers (Email mailto:, WhatsApp wa.me, Telegram t.me, Instagram copy+toast, X intent, Facebook sharer, LinkedIn share-offsite, Threema compose, Copy link) with `encodeURIComponent` on all user content in wwwroot/js/site.js
- [X] T025 [US3] Implement share panel dismiss logic: close on X button click, close on outside click, close on Escape key in wwwroot/js/site.js
- [X] T026 [US3] Add debounce guard to prevent multiple simultaneous share invocations on rapid clicks in wwwroot/js/site.js
- [X] T027 [US3] Wire up the Share button click handler and ensure the share button is only shown when `#output-result` is visible in wwwroot/js/site.js

**Checkpoint**: US3 complete. Share button appears only after generation. Native share works on supported browsers. Fallback panel shows 9 channels. Panel dismisses correctly. No duplicate panels on rapid clicks.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, and cleanup across all stories.

- [X] T028 [P] Update the placeholder text in `.ph-label` from "Enter a URL and hit Generate" to "Enter a URL and generate" (or keep current if matching icon button) in Views/Home/Index.cshtml
- [X] T029 Verify all FR requirements (FR-001 through FR-014) are satisfied by running through quickstart.md verification scenarios
- [X] T030 Run text search across all views for any remaining "QR Studio" references that should be "daenet QR Studio"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (badge CSS removal avoids conflicts) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; independent of US1
- **US3 (Phase 5)**: Depends on Phase 2 completion; independent of US1 and US2 (Share button only appears in result state)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US2 (P2)**: Can start after Foundational (Phase 2) — no dependencies on US1 (different DOM regions)
- **US3 (P3)**: Can start after Foundational (Phase 2) — no dependencies on US1 or US2 (new DOM elements + new JS functions)

### Within Each User Story

- HTML changes before CSS styling (markup must exist for styles to target)
- CSS before JS where JS depends on new DOM elements having visible styling
- Implementation tasks in dependency order within each phase

### Parallel Opportunities

- T001 + T002: Badge removal in HTML and CSS — different files
- T003 + T004: Both in site.css but different rules — can be done together
- T012 + T013 + T014 + T015: All CSS transition enhancements — different selectors, same file but independent rules
- T019 + T020 + T021: Share panel CSS — independent rule blocks
- US1, US2, US3 can all proceed in parallel after Phase 2 (same files but non-overlapping regions)

---

## Parallel Example: User Story 2

```text
# Launch all CSS transition tasks together (different selectors):
T012: [P] [US2] Enhanced hover transitions for .btn variants
T013: [P] [US2] Active scale feedback for .btn
T014: [P] [US2] Hover effects for color-picker, select, upload-zone, range
T015: [P] [US2] Focus-visible ring styles for .btn, .select
```

## Parallel Example: User Story 3

```text
# Launch CSS tasks together (different rule blocks):
T019: [P] [US3] Share button styles
T020: [P] [US3] Share panel layout + animation styles
T021: [P] [US3] Share panel responsive styles
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (badge removal)
2. Complete Phase 2: Foundational (breakpoint adjustments)
3. Complete Phase 3: User Story 1 (rebrand)
4. **STOP and VALIDATE**: Load page, verify branding
5. Deploy/demo if ready — basic rebrand is live

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Rebrand) → Validate → Deploy (MVP — new identity is live)
3. Add US2 (Modern UI) → Validate → Deploy (polished interactions)
4. Add US3 (Share) → Validate → Deploy (sharing capability)
5. Polish → Final validation → Release

### Single Developer Strategy

Complete phases sequentially: 1 → 2 → 3 → 4 → 5 → 6. Each phase builds on the last and can be committed independently.

---

## Notes

- [P] tasks = different files or non-overlapping regions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
- All changes are frontend-only — no server-side code or API changes
- No automated tests — verify via quickstart.md manual scenarios
