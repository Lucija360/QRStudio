# Implementation Plan: vCard Profile Photo

**Branch**: `003-vcard-profile-photo` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-vcard-profile-photo/spec.md`

## Summary

Extend the Contact mode with a profile photo upload area. The user can upload an image (PNG, JPG, WebP ≤2 MB), preview it as a circular thumbnail, and toggle an "Include photo in QR code" checkbox. When included, the client-side JS converts the image to a small JPEG thumbnail (96×96 px) via canvas, Base64-encodes it, and appends a `PHOTO;ENCODING=b;TYPE=JPEG:{data}` property to the vCard 3.0 string. Progressive quality reduction (0.7→0.5→0.3→0.1) ensures the vCard fits within QR capacity for the selected ECC level. The server-side `Content` field's `StringLength` annotation must be raised from 2048 to 4096 to accommodate the photo payload — the only server-side change required.

## Technical Context

**Language/Version**: C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3  
**Primary Dependencies**: QRCoder 1.6.0, SixLabors.ImageSharp 3.1.12, SixLabors.ImageSharp.Drawing 2.1.7  
**Storage**: N/A (stateless; all data in memory per request)  
**Testing**: Manual visual/interaction audit (no automated test framework currently)  
**Target Platform**: Web — modern browsers (Chrome, Edge, Firefox, Safari) on desktop & mobile  
**Project Type**: Web application (ASP.NET Core MVC with vanilla JS frontend)  
**Performance Goals**: Photo upload → preview < 500ms; auto-downscale + generate < 2s  
**Constraints**: No new NuGet dependencies; no Node.js/bundler toolchain; no external CDN; one server-side annotation change (StringLength 2048→4096)  
**Scale/Scope**: Single-page app; 4 files changed (QRModels.cs, Index.cshtml, site.css, site.js)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First | PASS | All changes address stated requirements (FR-001–FR-015). No new NuGet dependencies. Single MVC solution preserved. Photo conversion is ~40 lines of canvas JS. |
| II | Self-Contained Server-Side Processing | PASS | Server is unchanged in logic — it receives a string and encodes it into a QR code. Photo conversion/resizing happens entirely client-side via HTML Canvas. No outbound network calls. No temp files. |
| III | Clean Separation of Concerns | PASS | Frontend handles photo upload, canvas resize, Base64 encoding, and vCard assembly. The only server change is a data-annotation limit increase on the Content field (Models/QRModels.cs). Controllers and Services remain untouched. |
| IV | Input Validation and Security | PASS with justification | The `StringLength(2048)` on `Content` must increase to `StringLength(4096)` to accommodate vCard+photo payloads. This is a one-line annotation change, preserves boundary validation, and the new limit is still bounded. Client validates file type and 2MB size. See Complexity Tracking. |
| V | Responsive and Minimal Frontend | PASS | Vanilla JS and CSS only. Photo upload reuses the existing upload-zone pattern. Circular preview and checkbox stack responsively. Canvas API is built into all target browsers. |

**Gate result: PASS** — all 5 principles satisfied (Principle IV has one justified deviation). Proceed to Phase 0.

**Post-Design Re-evaluation (Phase 1 complete)**: All 5 gates remain PASS. Research decisions (R-001–R-005) confirm: no new NuGet dependencies, client-side canvas JPEG resize only, zero controller/service changes, vanilla JS + CSS only, one justified annotation change (StringLength 2048→4096) documented in Complexity Tracking. Data model introduces no new server entities — only extends client-side state with `photoBase64` and `includePhoto` variables following existing IIFE patterns. No contracts needed (no new external interfaces). No violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/003-vcard-profile-photo/
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
├── Models/
│   └── QRModels.cs               # StringLength(2048) → StringLength(4096) on Content field
│
├── Views/
│   └── Home/
│       └── Index.cshtml          # Photo upload zone (above name fields in contact block),
│                                 # circular preview, remove button, "Include photo" checkbox
│
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Photo upload circle, preview styles, checkbox layout,
│   │                             # responsive rules for photo area
│   └── js/
│       └── site.js               # Photo file handling, canvas resize/compress to JPEG,
│                                 # progressive quality reduction, vCard PHOTO property assembly,
│                                 # include-photo toggle logic
│
├── Controllers/                  # NO CHANGES
├── Services/                     # NO CHANGES
└── Program.cs                    # NO CHANGES
```

**Structure Decision**: Existing ASP.NET Core MVC layout is preserved. Changes span 4 files: 1 model (one-line annotation), 1 Razor view, 1 CSS file, 1 JS file. No new files, no new directories, no new dependencies. Same pattern as spec 001 and 002, with a single justified server-side annotation change.

## Complexity Tracking

> Constitution Principle IV requires one justified deviation.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `StringLength(2048)` → `StringLength(4096)` on `QRGenerateRequest.Content` | A 96×96 JPEG at quality 0.7 produces ~5–8 KB of Base64 data. Combined with typical contact fields (~200–500 bytes), the vCard can reach ~3000–3500 characters — exceeding the current 2048 limit. | Keeping 2048 would force photo thumbnails to be so aggressively compressed (sub-40px or quality <0.1) that they become unrecognisable. 4096 provides sufficient headroom while still enforcing a bounded limit. |
| Canvas used for client-side JPEG compression (Principle II literal reading: "no client-side canvas rendering") | Canvas is used solely for photo pre-processing (resize/compress to JPEG), not for QR code or logo rendering. The server still performs all QR generation. This is analogous to the existing `fileToBase64()` pattern — a client-side file preparation utility, not a rendering pipeline bypass. Principle II's intent (server-side QR rendering) is preserved. | Sending raw image bytes to server for processing: adds latency, bandwidth cost, and a new server-side dependency (violates Principle I). |
