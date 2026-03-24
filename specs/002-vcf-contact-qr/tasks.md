# Tasks: VCF Contact QR Code

**Input**: Design documents from `/specs/002-vcf-contact-qr/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not included — no automated test framework; verification via manual quickstart.md scenarios.

**Organization**: Tasks grouped by user story (US1, US2, US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths included in each description

---

## Phase 1: Setup

**Purpose**: No new project scaffolding needed — existing ASP.NET Core MVC project is used as-is. No new files, directories, or dependencies. All changes are in 3 existing files (Index.cshtml, site.css, site.js). This phase is empty.

**Checkpoint**: No setup tasks required. Proceed to Foundational phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the mode selector (pill toggle) UI and CSS that all user stories depend on. The toggle must exist before Contact form or vCard generation can be implemented.

**CRITICAL**: Must complete before user story work to provide the URL/Contact switching mechanism.

- [X] T001 Add the mode selector HTML structure (`.mode-selector` with two radio inputs `#mode-url` and `#mode-contact`, paired labels `.mode-selector__option`) above the `.url-block` inside `.sidebar-body` in Views/Home/Index.cshtml
- [X] T002 [P] Add CSS styles for `.mode-selector` (pill container with border-radius, border, flex layout), `.mode-selector__option` labels (padding, cursor, transition), and active state (`.mode-selector__option--active` with accent background/foreground) in wwwroot/css/site.css
- [X] T003 [P] Add responsive CSS for `.mode-selector` at `@media (max-width: 768px)` ensuring the toggle remains full-width and tappable on mobile in wwwroot/css/site.css
- [X] T004 Add the mode switching JS logic: listen to radio `change` events on `#mode-url` / `#mode-contact`, set `currentMode` variable, toggle `hidden` attribute on `.url-block` and `.contact-block`, update `.mode-selector__option--active` class, call `showSection('placeholder')` to reset output, and update placeholder text in wwwroot/js/site.js

**Checkpoint**: Pill toggle visible on page load with "URL" active. Clicking "Contact" toggles active state (Contact block doesn't exist yet so no form shown, but URL block hides). Clicking "URL" restores URL block. Output resets on each switch.

---

## Phase 3: User Story 1 — Mode Selection: URL vs Contact (Priority: P1) MVP

**Goal**: Complete the mode switching experience — add the Contact form HTML so switching between URL and Contact modes shows/hides the appropriate input area while preserving customisation settings and entered data.

**Independent Test**: Load homepage — pill toggle visible with "URL" active. Switch to "Contact" — URL input hides, contact form with 7 fields appears. Switch back to "URL" — contact form hides, URL input reappears with any previously entered URL preserved. Customisation settings unchanged across switches.

### Implementation for User Story 1

- [X] T005 [US1] Add the contact form HTML block (`.contact-block` with `hidden` attribute): section label "Content", `.field-row` containing two `.field-group--half` divs for First Name (`#contact-first-name`) and Last Name (`#contact-last-name`) with `.field-error` paragraphs, full-width field groups for Phone (`#contact-phone`, type=tel), Email (`#contact-email`, type=email), Organisation (`#contact-org`), Job Title (`#contact-title`), Website (`#contact-website`, type=url), each with labels and placeholders per R-004, a full-width Generate button (`#generate-contact-btn`), and a `#vcard-length-error` paragraph — inserted as a sibling after `.url-block` in Views/Home/Index.cshtml
- [X] T006 [P] [US1] Add CSS styles for `.contact-block` (matching `.url-block` surface-2 styling), `.field-row` (flex row with gap for name pair), `.field-group--half` (50% width), `.field-error` (colour var(--danger), font-size .75rem, hidden by default), and `#generate-contact-btn` (full-width primary button) in wwwroot/css/site.css
- [X] T007 [P] [US1] Add responsive CSS for `.contact-block` at `@media (max-width: 768px)`: `.field-row` stacks vertically (flex-direction: column), `.field-group--half` becomes full-width, and appropriate input types trigger correct mobile keyboards in wwwroot/css/site.css
- [X] T008 [US1] Add JS DOM references for all contact form elements (`#contact-first-name`, `#contact-last-name`, `#contact-phone`, `#contact-email`, `#contact-org`, `#contact-title`, `#contact-website`, `#generate-contact-btn`, all `.field-error` elements, `#vcard-length-error`) and wire the generate-contact-btn click to the existing generate flow in wwwroot/js/site.js
- [X] T009 [US1] Update the placeholder text logic: when mode switches to 'contact', set `.ph-label` text to "Fill in contact details and generate"; when mode switches to 'url', restore "Enter a URL and generate" in wwwroot/js/site.js

**Checkpoint**: US1 complete. Mode selector fully functional. Both URL and Contact forms toggle correctly. Data preserved in each hidden form. Customisations unchanged. Placeholder text updates per mode.

---

## Phase 4: User Story 2 — Generate Contact QR Code (Priority: P1)

**Goal**: Assemble a vCard 3.0 string from the contact form fields and submit it as the Content payload to generate a scannable contact QR code. Update the meta strip to show the contact's full name.

**Independent Test**: Switch to Contact mode → fill in at least a first name and one contact method → click Generate → QR code appears → meta strip shows the full name and ECC badge → scan with mobile phone → device prompts to add contact.

### Implementation for User Story 2

- [X] T010 [US2] Implement the `assembleVCard()` function in wwwroot/js/site.js: read values from all contact form inputs, escape commas/semicolons/newlines per vCard 3.0 spec, conditionally include TEL/EMAIL/ORG/TITLE/URL lines only when non-empty, compose the full `BEGIN:VCARD...END:VCARD` string with `\r\n` line endings, and return the string
- [X] T011 [US2] Implement vCard length validation in wwwroot/js/site.js: define a `maxBytesForEcc` map (`{L: 2953, M: 2331, Q: 1663, H: 1273}`), use `new TextEncoder().encode(vcardString).length` to measure actual UTF-8 byte length, check against the selected ECC level before API call, show `#vcard-length-error` with message if exceeded
- [X] T012 [US2] Integrate contact mode into the existing `generate()` function in wwwroot/js/site.js: when `currentMode === 'contact'`, call `assembleVCard()` to get the content string, check vCard length, then call the existing API with the vCard string as Content (reusing the same fetch/POST logic)
- [X] T013 [US2] Update the meta strip display logic in wwwroot/js/site.js: after successful generation, if `currentMode === 'contact'`, set `qrMetaUrl.textContent` to `[firstName, lastName].filter(Boolean).join(' ')` instead of calling `truncateUrl()`

**Checkpoint**: US2 complete. Contact QR codes generate successfully. vCard 3.0 string is well-formed. Meta strip shows full name. Download, Copy, Share actions work. QR is scannable on iOS and Android.

---

## Phase 5: User Story 3 — Contact Form Validation & UX (Priority: P2)

**Goal**: Add field-level inline validation for the contact form: require at least one name field, validate email format and phone characters, display clear error messages.

**Independent Test**: In Contact mode — submit empty form → name error shown. Enter letters in phone → phone error shown. Enter invalid email → email error shown. Fix all errors → QR generates successfully.

### Implementation for User Story 3

- [X] T014 [US3] Implement the `validateContactForm()` function in wwwroot/js/site.js: clear all `.field-error` elements, check firstName OR lastName non-empty (show `#first-name-error` "Please enter a first name or last name." if both empty), check phone matches `/^[+\d\s\-()]+$/` if non-empty (show `#phone-error` "Phone may only contain digits, spaces, dashes, and +."), check email contains "@" if non-empty (show `#email-error` "Please enter a valid email address."), return boolean
- [X] T015 [US3] Wire `validateContactForm()` into the generate flow in wwwroot/js/site.js: before calling `assembleVCard()`, run validation — if it returns false, abort generation; if true, proceed to vCard assembly and API call
- [X] T016 [P] [US3] Add CSS styles for `.field-error` visible state (unhide, colour `var(--danger)`, font-size `.75rem`, margin-top `.25rem`) and input error state (`.input--error` with border-color `var(--danger)`) in wwwroot/css/site.css

**Checkpoint**: US3 complete. All validation scenarios from quickstart.md pass. Error messages appear inline below their respective fields. Errors clear on next Generate attempt.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration verification and cleanup across all stories.

- [X] T017 [P] Verify all FR requirements (FR-001 through FR-015, FR-012b) are satisfied by running through quickstart.md verification scenarios — explicitly confirm: customisation options (colours, size, ECC, logo) work in Contact mode (FR-008), and all contact fields are empty after page refresh (FR-015)
- [X] T018 Verify that existing URL-mode functionality has zero regressions: URL input, generate, download, copy, share all work as before in Views/Home/Index.cshtml and wwwroot/js/site.js

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty — no setup needed
- **Foundational (Phase 2)**: No dependencies — start immediately. BLOCKS all user stories (mode selector must exist)
- **US1 (Phase 3)**: Depends on Phase 2 completion (needs mode toggle functioning)
- **US2 (Phase 4)**: Depends on US1 (Phase 3) completion (needs contact form HTML and DOM refs)
- **US3 (Phase 5)**: Depends on US2 (Phase 4) completion (validation gates the generate flow)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — adds the contact form HTML and toggle wiring
- **US2 (P1)**: Depends on US1 — needs the contact form inputs in the DOM to read values and assemble vCard
- **US3 (P2)**: Depends on US2 — validation wraps around the generate flow introduced in US2

### Within Each Phase

- HTML changes (Index.cshtml) before CSS styling (site.css) — markup must exist for styles to target
- CSS (site.css) in parallel for independent rule blocks
- JS logic (site.js) after HTML elements are defined (DOM refs must resolve)

### Parallel Opportunities

- T002 + T003: Both CSS for mode selector — different rule blocks
- T006 + T007: Both CSS for contact form — different rule blocks (layout vs responsive)
- T005 + T006 + T007: HTML and CSS can partially overlap since CSS targets known class names
- T010 + T011: vCard assembly and length validation are independent functions
- US1 CSS tasks parallel with each other; US3 CSS parallel with US3 JS

---

## Parallel Example: Foundational Phase

```text
# Mode selector HTML first:
T001: Add mode selector HTML in Index.cshtml

# Then CSS and JS in parallel (HTML exists):
T002: Mode selector base CSS in site.css
T003: Mode selector responsive CSS in site.css
T004: Mode switching JS in site.js
```

---

## Parallel Example: User Story 1

```text
# Contact form HTML first:
T005: Add contact form HTML in Index.cshtml

# Then CSS tasks in parallel:
T006: Contact form layout CSS in site.css
T007: Contact form responsive CSS in site.css

# Then JS (needs DOM elements):
T008: Contact form DOM refs and wiring in site.js
T009: Placeholder text logic in site.js
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 2: Foundational (mode selector toggle)
2. Complete Phase 3: User Story 1 (contact form appears on toggle)
3. Complete Phase 4: User Story 2 (vCard generation works)
4. **STOP and VALIDATE**: Test end-to-end — mode switch, fill form, generate, scan QR
5. Deploy/demo if ready — basic contact QR code generation is fully usable

### Incremental Delivery

1. Foundational → Mode selector visible and toggle works
2. Add US1 → Contact form appears when Contact mode selected
3. Add US2 → QR codes generate with vCard content → **Deploy (MVP!)**
4. Add US3 → Field-level validation polish → Deploy (complete feature)
5. Polish → Full verification pass

---

## Notes

- [P] tasks = different files or independent CSS rule blocks, no dependencies
- [Story] label maps task to specific user story for traceability
- No server-side changes — all tasks are in Index.cshtml, site.css, site.js
- No new files or directories created
- No new NuGet or JS dependencies
- Commit after each phase to maintain clean checkpoints
- Stop at any checkpoint to validate story independently
