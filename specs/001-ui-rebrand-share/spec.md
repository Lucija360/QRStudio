# Feature Specification: UI Rebrand & Share

**Feature Branch**: `001-ui-rebrand-share`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "Change text Url or plain text to Url. Instead of the text on button Generate use appropriate icon. Design of the page should be modern and responsive. Provide fancy transitions on clicks and hover. Mobile should also be supported. Change the Name from QRStudio to daenet QR Studio. Replace the logo with some new logo. Combine the geometry of the Logo of daenet gmbh with existing logo of the QR Studio. Implement a share button. When clicked the generated image can be shared via Email, Instagram, Telegram, WhatsApp, Threema and other important standard apps."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rebranded Identity (Priority: P1)

A visitor opens daenet QR Studio in a browser and immediately sees the updated branding: the application title reads "daenet QR Studio" in the header, the browser tab title reflects the new name, and a new logo combining daenet GmbH geometric elements with the existing QR-module icon is displayed in the sidebar header.

**Why this priority**: Brand identity is visible on every page load and affects all subsequent interactions. Without this change, every other visual enhancement still shows the old name.

**Independent Test**: Load the homepage and confirm the title, tab text, and logo match the new daenet QR Studio branding.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** a user navigates to the homepage, **Then** the sidebar header displays "daenet QR Studio" with the new combined logo and no "Free" badge.
2. **Given** the application is running, **When** a user views the browser tab, **Then** the tab title reads "daenet QR Studio".
3. **Given** a mobile viewport (≤ 768 px), **When** the user opens the page, **Then** the logo and title remain legible and correctly laid out.

---

### User Story 2 - Modern UI with Transitions (Priority: P2)

A user interacts with the page and experiences a polished, modern interface. The content input label now reads "URL" instead of "URL or plain text". The Generate button shows an icon (e.g. a right-arrow or QR-code symbol) instead of the word "Generate". All interactive elements (buttons, color pickers, sliders, upload zone) respond with smooth transition animations on hover and click. The layout is fully responsive — sidebar collapses or stacks on mobile while remaining usable.

**Why this priority**: The visual polish and interaction refinements define the overall user experience; completing branding first (P1) ensures the visual context is set before refining interaction details.

**Independent Test**: Open the page on desktop and mobile, interact with every control and verify smooth animations, the updated label, and the icon-only generate button.

**Acceptance Scenarios**:

1. **Given** the homepage is loaded, **When** the user views the content input field, **Then** the label reads "URL" (not "URL or plain text").
2. **Given** the homepage is loaded, **When** the user views the generate button, **Then** it displays a recognisable icon without the word "Generate", and retains an accessible tooltip or aria-label.
3. **Given** any interactive element (button, color picker, select, slider, upload zone), **When** the user hovers, **Then** a smooth visual transition (colour shift, scale, shadow, or glow) plays within 200 ms.
4. **Given** any button, **When** the user clicks, **Then** a press/ripple feedback animation plays.
5. **Given** a viewport width ≤ 768 px, **When** viewing the page, **Then** the sidebar content stacks above the output area, all controls remain accessible, and no horizontal scrolling is required.
6. **Given** a viewport width between 769 px and 1024 px (tablet), **When** viewing the page, **Then** the layout adapts proportionally with usable control sizes.

---

### User Story 3 - Share Generated QR Code (Priority: P3)

After generating a QR code, the user wants to share the resulting image with others. A "Share" button appears alongside the existing Download and Copy buttons. Tapping Share opens a share panel or the native OS share sheet (when available) listing sharing options: Email, Instagram, Telegram, WhatsApp, Threema, X (Twitter), Facebook, and LinkedIn. On devices that support the Web Share API, the native share sheet is presented. On devices without Web Share API support, a fallback panel with direct links/intents is shown.

**Why this priority**: Sharing depends on a generated QR code existing and on the UI being finalized (P1 + P2); it is an additive feature that does not change existing functionality.

**Independent Test**: Generate a QR code, click Share, and confirm each sharing channel either opens the correct app intent or composes the correct link.

**Acceptance Scenarios**:

1. **Given** no QR code has been generated yet, **When** the user views the output area, **Then** no Share button is visible.
2. **Given** a QR code has been generated, **When** the user views the output actions, **Then** a Share button with an appropriate share icon is visible alongside Download and Copy.
3. **Given** the device supports the Web Share API, **When** the user clicks Share, **Then** the native OS share sheet opens with the QR image attached as a PNG file.
4. **Given** the device does not support the Web Share API, **When** the user clicks Share, **Then** a fallback panel appears listing: Email, Instagram, Telegram, WhatsApp, Threema, X (Twitter), Facebook, LinkedIn, and Copy link.
5. **Given** the fallback panel is open, **When** the user selects Email, **Then** the default mail client opens with the QR image attached or linked.
6. **Given** the fallback panel is open, **When** the user selects WhatsApp, **Then** the WhatsApp share intent opens with the QR image.
7. **Given** the fallback panel is open, **When** the user selects any channel, **Then** the appropriate app or web intent opens within 1 second.
8. **Given** a mobile viewport, **When** the user taps Share, **Then** the native share sheet is preferred (most mobile browsers support Web Share API).

---

### Edge Cases

- What happens when the user clicks Share but the QR image data is no longer available (e.g., page state was lost)? The Share button should be disabled or hidden, and no error should be thrown.
- How does the system handle a browser that blocks popups when opening share intents? The fallback panel links should use direct navigation (`href`) rather than `window.open()` where possible.
- What happens if the generated QR code image is very large (max module size + logo)? Sharing should still work; the image is transmitted as-is without re-encoding.
- What happens when the user rapidly clicks Share multiple times? Only one share sheet or one fallback panel should appear; duplicate invocations are ignored.
- What if the user has not granted clipboard permissions? The Share feature should not depend on clipboard access; it uses file sharing or URL-based intents.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application name MUST be changed from "QR Studio" to "daenet QR Studio" (lowercase "d") in all visible locations: sidebar header, browser tab title, and any meta tags. The canonical casing "daenet" MUST be used consistently — never "Daenet" or "DAENET".
- **FR-002**: The sidebar logo MUST be replaced with a new SVG logo that combines geometric elements from the daenet GmbH brand identity with the existing QR-module grid icon.
- **FR-003**: The content input field label MUST read "URL" instead of "URL or plain text".
- **FR-004**: The Generate button MUST display a QR-code icon (grid-of-modules motif) instead of the word "Generate", and MUST include an accessible text alternative (tooltip: "Generate QR code" and aria-label).
- **FR-005**: All interactive elements (buttons, inputs, selects, upload zone) MUST display smooth CSS transition animations on hover (colour, shadow, or scale change) completing within 200 ms.
- **FR-006**: All buttons MUST display a tactile click/press animation (scale, ripple, or opacity shift) on activation.
- **FR-007**: The page layout MUST be fully responsive: sidebar stacks above output on viewports ≤ 768 px; controls remain usable on tablet viewports (769–1024 px); no horizontal scrollbar appears at any supported width.
- **FR-008**: A Share button MUST appear in the output actions area after a QR code is successfully generated; it MUST NOT appear before generation.
- **FR-009**: On devices supporting the Web Share API, clicking Share MUST invoke the native share sheet with the QR image as a shareable PNG file.
- **FR-010**: On devices without Web Share API support, clicking Share MUST open a fallback panel listing at minimum: Email, Instagram, Telegram, WhatsApp, Threema, X (Twitter), Facebook, LinkedIn, and a "Copy link" option as the final entry.
- **FR-011**: Each fallback sharing channel MUST open the corresponding app intent or web URL, passing the QR code image or a reference to it.
- **FR-012**: The fallback share panel MUST be dismissible by clicking outside it or pressing Escape.
- **FR-013**: The Share button and share panel MUST be fully usable on mobile viewports.
- **FR-014**: The existing "Free" badge in the sidebar header MUST be removed as part of the rebrand.

### Key Entities

- **QR Result Image**: The generated PNG (as base64 data-URI); shared across Download, Copy, and Share actions. Key attributes: base64 content, original input URL, dimensions.
- **Share Channel**: A target application for sharing (e.g., WhatsApp, Email). Attributes: display name, icon, intent URL template, supported content types (image file vs. URL).

## Assumptions

- The daenet GmbH logo geometry is publicly available and can be referenced for combining with the existing QR icon. The new combined logo will be created as an inline SVG in the sidebar header.
- "Standard apps" beyond the six explicitly named (Email, Instagram, Telegram, WhatsApp, Threema) are interpreted as X (Twitter), Facebook, and LinkedIn — the most widely used sharing targets on the web.
- The Web Share API (navigator.share) with file support is the preferred sharing mechanism; level-2 file sharing is available in modern Chromium and Safari browsers.
- Where the Web Share API is not available, fallback share links use well-known URL schemes (mailto:, whatsapp://, tg://, etc.) or web-based intent URLs (e.g., https://wa.me/).
- Instagram does not support direct image sharing via URL schemes on the web; the fallback for Instagram will prompt the user to download the image and open Instagram, or use the native share sheet on mobile which can target Instagram directly.
- No server-side changes are required for sharing; all sharing logic is client-side via the existing base64 image data.

## Clarifications

### Session 2026-03-22

- Q: What is the exact casing of the brand name? → A: "daenet QR Studio" (lowercase "d", matching daenet GmbH brand identity).
- Q: Which icon should replace the "Generate" button text? → A: QR-code icon (grid of modules) — domain-specific and immediately communicates "generate QR".
- Q: Should the existing "Free" badge remain after rebranding? → A: Remove it entirely — the daenet brand speaks for itself.
- Q: Should the fallback share panel include a generic "Copy link" option? → A: Yes — include a "Copy link" option at the end of the channel list as a universal fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visible "QR Studio" references are replaced with "daenet QR Studio" — verified by a text search across all rendered views.
- **SC-002**: The new combined logo is visible and renders correctly at the sidebar header size on all supported viewports (mobile, tablet, desktop).
- **SC-003**: Users can generate a QR code from URL entry to visible result in under 5 seconds on desktop and under 8 seconds on mobile (perception test — includes transition time).
- **SC-004**: Every interactive element exhibits a visible hover transition and click animation — verified by manual interaction audit of all controls.
- **SC-005**: The page renders without horizontal scrollbar at viewport widths of 320 px, 375 px, 768 px, 1024 px, and 1440 px.
- **SC-006**: After generating a QR code, the Share button is visible and functional; tapping it triggers either the native share sheet or the fallback panel within 1 second.
- **SC-007**: At least 7 of the 9 named sharing channels (including Copy link) successfully open the target app or compose a share intent when selected from the fallback panel.
- **SC-008**: 90% of users can successfully share a QR code on their first attempt without confusion (qualitative usability target).
