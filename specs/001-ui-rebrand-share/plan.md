# Implementation Plan: UI Rebrand & Share

**Branch**: `001-ui-rebrand-share` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ui-rebrand-share/spec.md`

## Summary

Rebrand the application from "QR Studio" to "daenet QR Studio" with a new combined SVG logo, modernise the UI with CSS transition animations and a QR-code icon on the Generate button, ensure full mobile/tablet responsiveness, and add a Share button that uses the Web Share API (with a 9-channel fallback panel) to share the generated QR image.

## Technical Context

**Language/Version**: C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3  
**Primary Dependencies**: QRCoder 1.6.0, SixLabors.ImageSharp 3.1.12, SixLabors.ImageSharp.Drawing 2.1.7  
**Storage**: N/A (stateless; all data in memory per request)  
**Testing**: Manual visual/interaction audit (no automated test framework currently)  
**Target Platform**: Web — modern browsers (Chrome, Edge, Firefox, Safari) on desktop & mobile  
**Project Type**: Web application (ASP.NET Core MVC with vanilla JS frontend)  
**Performance Goals**: QR generation from URL entry to visible result < 5s desktop, < 8s mobile  
**Constraints**: No new NuGet dependencies; no Node.js/bundler toolchain; no external CDN at runtime; client-side only for sharing  
**Scale/Scope**: Single-page app, single controller, ~4 files changed (HTML, CSS, JS, Layout)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First | PASS | All changes address stated requirements (FR-001–FR-014). No new NuGet dependencies. Single MVC solution preserved. |
| II | Self-Contained Server-Side Processing | PASS | QR generation remains server-side. Sharing is client-side JS using existing base64 data — no outbound server calls added. |
| III | Clean Separation of Concerns | PASS | No server-side logic changes. All modifications are in Views (Razor), CSS, and JS — frontend layer only. |
| IV | Input Validation and Security | PASS | No new API inputs. Share URLs constructed from well-known URL templates with encoded parameters. No user input injected into share URLs unsafely. |
| V | Responsive and Minimal Frontend | PASS | Vanilla JS and CSS only. No frameworks or bundlers. Mobile/tablet responsiveness explicitly covered by FR-007. |

**Gate result: PASS** — all 5 principles satisfied. Proceed to Phase 0.

**Post-Design Re-evaluation (Phase 1 complete)**: All 5 gates remain PASS. Research decisions (R-001–R-007) confirm: no new dependencies, client-side sharing only via URL schemes with `encodeURIComponent`, zero server-side changes, CSS-only animations. No violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-rebrand-share/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
QRStudio/
├── Views/
│   ├── Home/
│   │   └── Index.cshtml          # Rebrand header, new logo SVG, icon button,
│   │                             # share button + fallback panel HTML
│   └── Shared/
│       └── _Layout.cshtml        # Tab title update
│
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Transition animations, responsive breakpoints,
│   │                             # share panel styles, brand updates
│   └── js/
│       └── site.js               # Share button logic (Web Share API + fallback),
│                                 # debounce for rapid clicks
│
├── Controllers/                  # NO CHANGES
├── Models/                       # NO CHANGES
├── Services/                     # NO CHANGES
└── Program.cs                    # NO CHANGES
```

**Structure Decision**: Existing ASP.NET Core MVC layout is preserved. All changes are frontend-only: 2 Razor views, 1 CSS file, 1 JS file. No new files, no new directories, no new dependencies.

## Complexity Tracking

> No constitution violations detected. All changes stay within existing project structure and technology constraints. Table left empty intentionally.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
