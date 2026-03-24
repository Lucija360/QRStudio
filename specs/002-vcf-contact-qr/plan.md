# Implementation Plan: VCF Contact QR Code

**Branch**: `002-vcf-contact-qr` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-vcf-contact-qr/spec.md`

## Summary

Add a Contact mode alongside the existing URL mode in QR Studio. A segmented control (pill toggle) lets the user switch between entering a URL or filling in contact details (name, phone, email, organisation, job title, website). In Contact mode, the client-side JS assembles a vCard 3.0 string from the form fields and sends it as the `Content` field to the existing `/api/qr/generate` endpoint. The server encodes it into a QR code like any other text — **no server-side changes required**. Scanning the resulting QR code on a mobile device prompts the user to save the contact.

## Technical Context

**Language/Version**: C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3  
**Primary Dependencies**: QRCoder 1.6.0, SixLabors.ImageSharp 3.1.12, SixLabors.ImageSharp.Drawing 2.1.7  
**Storage**: N/A (stateless; all data in memory per request)  
**Testing**: Manual visual/interaction audit (no automated test framework currently)  
**Target Platform**: Web — modern browsers (Chrome, Edge, Firefox, Safari) on desktop & mobile  
**Project Type**: Web application (ASP.NET Core MVC with vanilla JS frontend)  
**Performance Goals**: Mode switch < 200ms; QR generation from form fill to visible result < 5s  
**Constraints**: No new NuGet dependencies; no Node.js/bundler toolchain; no external CDN at runtime; no server-side changes  
**Scale/Scope**: Single-page app, single controller, ~3 files changed (Index.cshtml, site.css, site.js)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First | PASS | All changes address stated requirements (FR-001–FR-015). No new NuGet dependencies. Single MVC solution preserved. vCard assembly is ~30 lines of JS string concatenation. |
| II | Self-Contained Server-Side Processing | PASS | Server is unchanged — it receives a string and encodes it. vCard composition happens client-side. No outbound network calls added. |
| III | Clean Separation of Concerns | PASS | No server-side logic changes. All modifications are in Views (Razor), CSS, and JS — frontend layer only. Models, Controllers, Services untouched. |
| IV | Input Validation and Security | PASS | Client-side validation for required name, email format, phone format. The existing server-side Content validation (Required, MaxLength 2048) naturally applies to the vCard string. No new API inputs. |
| V | Responsive and Minimal Frontend | PASS | Vanilla JS and CSS only. No frameworks or bundlers. Contact form stacks vertically on mobile (FR-014). Appropriate input types (tel, email) for mobile keyboards. |

**Gate result: PASS** — all 5 principles satisfied. Proceed to Phase 0.

**Post-Design Re-evaluation (Phase 1 complete)**: All 5 gates remain PASS. Research decisions (R-001–R-005) confirm: no new dependencies, client-side vCard assembly only, zero server-side changes, CSS-only layout transitions, inline validation without external libraries. No violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-vcf-contact-qr/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new APIs or external interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
QRStudio/
├── Views/
│   └── Home/
│       └── Index.cshtml          # Mode selector (pill toggle), contact form HTML,
│                                 # updated placeholder text for Contact mode
│
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Segmented control styles, contact form layout,
│   │                             # field validation states, mobile responsive rules
│   └── js/
│       └── site.js               # Mode switching logic, vCard 3.0 assembly,
│                                 # contact form validation, meta strip update
│
├── Controllers/                  # NO CHANGES
├── Models/                       # NO CHANGES
├── Services/                     # NO CHANGES
└── Program.cs                    # NO CHANGES
```

**Structure Decision**: Existing ASP.NET Core MVC layout is preserved. All changes are frontend-only: 1 Razor view, 1 CSS file, 1 JS file. No new files, no new directories, no new dependencies. Identical pattern to spec 001.

## Complexity Tracking

> No constitution violations detected. All changes stay within existing project structure and technology constraints.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
