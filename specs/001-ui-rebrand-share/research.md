# Research — UI Rebrand & Share

**Feature**: `001-ui-rebrand-share` | **Date**: 2026-03-22

---

## R-001: Web Share API — Browser Support & Behaviour

**Context**: FR-008 requires native sharing via `navigator.share()`.

**Decision**: Use Web Share API (`navigator.share`) with feature detection; show fallback panel when unavailable.

**Rationale**:
- `navigator.share` is supported in Chrome 89+, Edge 89+, Safari 15+, and all modern mobile browsers (Android Chrome, iOS Safari).
- Desktop Firefox does **not** support it (as of 2025). Windows desktop Chrome supports it since Chrome 89.
- The API requires a **user gesture** (click event handler) — cannot be called programmatically.
- Sharing files (images) requires `navigator.canShare({ files: [...] })` — supported in Chrome 92+, Safari 15.4+. Older browsers only support `url` + `title` + `text`.
- **Strategy**: Attempt `navigator.share({ files: [pngFile], title, text })`. If `canShare` is false for files, fall back to `navigator.share({ url, title })` with a data-URL or the page URL. If `navigator.share` is entirely absent, show the fallback panel.

**Alternatives considered**:
- Always show custom panel (rejected — native share is better UX on mobile).
- Third-party share library (rejected — constitution Principle I & V: no new dependencies, vanilla JS only).

---

## R-002: Share Fallback Panel — URL Schemes per Channel

**Context**: FR-009/FR-010 require a fallback panel with 9 share channels.

**Decision**: Use well-known URL schemes to open each app/service in a new tab/window.

**Channels & URL Templates**:

| Channel | URL Pattern | Notes |
|---------|-------------|-------|
| Email | `mailto:?subject={title}&body={text}%0A{url}` | Universal; opens default mail client |
| WhatsApp | `https://wa.me/?text={encodedText}` | Works on mobile & desktop |
| Telegram | `https://t.me/share/url?url={url}&text={text}` | Deep-links to Telegram app or web |
| Instagram | No direct share URL; use `navigator.clipboard.writeText` + toast "Paste in Instagram" | Instagram has no URL-scheme for sharing content from external apps |
| X (Twitter) | `https://x.com/intent/tweet?text={text}&url={url}` | Intent URL, opens X compose |
| Facebook | `https://www.facebook.com/sharer/sharer.php?u={url}` | Standard sharer endpoint |
| LinkedIn | `https://www.linkedin.com/sharing/share-offsite/?url={url}` | Official share URL |
| Threema | `https://threema.id/compose?text={text}` | Opens Threema app if installed |
| Copy link | `navigator.clipboard.writeText(url)` + visual confirmation | Last item per FR-010 |

**Rationale**:
- URL schemes are client-side only (no server calls) — satisfies constitution Principle II.
- `encodeURIComponent` on all user-provided text prevents injection into URL templates.
- Instagram limitation: no inbound share URL exists. The pragmatic approach is to copy the link and instruct the user. This is standard across web apps.

**Alternatives considered**:
- Server-side share proxy (rejected — Principle II: self-contained).
- Embed share SDKs per platform (rejected — Principle V: no external scripts/CDN).

---

## R-003: Combined Logo Design — daenet + QR Studio

**Context**: FR-002 requires a new SVG logo combining daenet and QR Studio geometry.

**Decision**: Create a single inline SVG that merges the daenet logo's triangle/geometric motif with the existing QR Studio grid-of-modules icon.

**Design approach**:
- The existing QR Studio logo is an inline SVG (32×32 viewBox) with 3 large rounded rects (position finders) + 4 small rects (data modules) + 3 inner rects (finder eyes). This is the QR code archetype.
- daenet's visual identity uses a triangular/geometric shape. Combine this by:
  - Keeping the QR modules grid structure as the primary shape.
  - Incorporating a triangular accent element (referencing daenet's logo) into one of the finder positions or as an overlay.
- The logo remains an **inline SVG** in the Razor view — no external image file needed, no additional HTTP request.
- Uses `currentColor` for theming consistency.

**Rationale**: Constitution Principle I (simplicity) — single inline SVG, no image assets, no logo file to serve. Principle V — no external resources.

**Alternatives considered**:
- External `logo.svg` file (rejected — adds an HTTP request; inline is simpler).
- PNG/raster logo (rejected — doesn't scale, larger footprint).

---

## R-004: CSS Transitions & Animations

**Context**: FR-005 requires hover/focus transitions ≤200ms; FR-006 requires click feedback.

**Decision**: Leverage the existing `--transition: 150ms cubic-bezier(.4,0,.2,1)` CSS variable. Add:

1. **Hover states**: `transform: translateY(-1px)` + `box-shadow` elevation on interactive elements (buttons, cards).
2. **Focus rings**: `box-shadow: 0 0 0 3px rgba(24,24,27,.09)` (already present on inputs; extend to buttons).
3. **Click/active feedback**: `transform: scale(0.97)` on `:active` for buttons (existing `translateY(1px)` is fine; can enhance with subtle scale).
4. **Share panel entrance**: `@keyframes slideUp` from `translateY(8px), opacity:0` → `translateY(0), opacity:1` over 200ms.
5. **Result card**: Already has `fadeUp` animation — retain as-is.

**Rationale**: All ≤200ms, using existing CSS infrastructure. No JS animation libraries needed.

**Alternatives considered**:
- JS-driven animations with requestAnimationFrame (rejected — CSS transitions are sufficient and more performant).
- Animation library like Animate.css (rejected — Principle V, no external dependencies).

---

## R-005: Responsive Layout — Mobile/Tablet Breakpoints

**Context**: FR-007 requires columns to stack on mobile ≤768px.

**Decision**: Adjust the existing `@media (max-width: 740px)` breakpoint to `768px` and add a tablet breakpoint.

**Breakpoints**:
- `≤768px`: Single-column stack (sidebar on top, output below). Sidebar loses sticky positioning, becomes auto-height.
- `769px–1024px` (optional): Reduce `--sidebar-w` to `320px` for narrow tablets.
- `>1024px`: Full desktop layout as-is (`--sidebar-w: 360px`).

**Current state**: The existing CSS already has `@media (max-width: 740px)` that stacks columns. Adjustment is minimal — change `740px` → `768px`, ensure share panel works in stacked layout.

**Rationale**: Minimal change. The existing responsive foundation is solid.

---

## R-006: Share Button Placement & QR Image Data for Sharing

**Context**: FR-008 requires a Share button that appears only after QR generation.

**Decision**:
- Add a **Share button** in the `.output-actions` row alongside Download and Copy.
- The button uses a standard share icon (arrow-from-box SVG).
- The JS share handler accesses the already-rendered `qrImage.src` (data URI) to create a `File` object for Web Share API or to encode into share text for fallback channels.
- The share panel (fallback) appears as an absolutely-positioned overlay anchored to the output-actions area, with a semi-transparent backdrop on mobile.

**Data flow**:
1. User clicks Share → check `navigator.share` + `navigator.canShare({ files })`.
2. If file sharing supported: convert data URI to Blob → File → `navigator.share({ files: [file], title })`.
3. If only URL sharing: `navigator.share({ title, text, url: window.location.href })`.
4. If no Web Share API: show fallback panel with channel buttons. Each channel button constructs its URL from `window.location.href` (or current QR content URL).

---

## R-007: "Free" Badge Removal

**Context**: FR-014 (from clarification Q3) — remove the badge entirely.

**Decision**: Delete the `<span class="brand__badge">Free</span>` element and its `.brand__badge` CSS rule.

**Rationale**: Spec clarification confirmed removal. Trivial change.

---

## Summary of Technical Decisions

| # | Topic | Decision |
|---|-------|----------|
| R-001 | Web Share API | Feature-detect `navigator.share`; file sharing via `canShare`; fallback panel |
| R-002 | Share channels | 9 channels via URL schemes (client-side only); Instagram = copy + toast |
| R-003 | Combined logo | Inline SVG merging QR grid + daenet triangle motif |
| R-004 | Transitions | CSS `--transition` variable (150ms); `@keyframes slideUp` for panel |
| R-005 | Responsive | Breakpoint at 768px (up from 740px); tablet at 1024px |
| R-006 | Share button | In `.output-actions` row; data URI → Blob → File for native share |
| R-007 | Badge removal | Delete HTML element + CSS rule |
