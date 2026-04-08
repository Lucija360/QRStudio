# Implementation Plan: Social Media QR Codes with Blob Storage & Sharing

**Branch**: `007-social-qr-blob-share` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-social-qr-blob-share/spec.md`

## Summary

Extend the existing QRStudio contact form to support social media QR code generation (LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok), persist all entered data to Azure Blob Storage as JSON with access-code protection, and provide a full sharing/portability workflow: save with access code, copy shareable view-page URL, share VCF contact card, share by link, download TXT, upload/restore TXT, delete for GDPR, and a read-only view page with optional access-code unlock. Includes a background TTL cleanup worker and rate limiting on code verification.

## Technical Context

**Language/Version**: C# / .NET 8 LTS  
**Primary Dependencies**: ASP.NET Core MVC, QRCoder 1.6.x, SixLabors.ImageSharp 3.x / Drawing 2.x, Azure.Storage.Blobs 12.27.x  
**Storage**: Azure Blob Storage (public container `qrstudio-contacts`)  
**Testing**: Manual / browser-based (no automated test framework in project)  
**Target Platform**: Web (server-rendered Razor views + vanilla JS)  
**Project Type**: Web application (MVC)  
**Performance Goals**: QR generation + blob save < 3s; view page load + QR render < 5s (SC-003, SC-009)  
**Constraints**: Vanilla JS only, no SPA frameworks or bundlers, no CDN; single ASP.NET Core project; offline QR gen (no SaaS APIs)  
**Scale/Scope**: Single-user sessions; public blob; ~7 social platforms; 1 MVC solution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First — no speculative features, single MVC solution | ✅ PASS | Feature directly implements stated requirements. Single project remains. No new projects or microservices. |
| I | New NuGet dependencies justified | ✅ PASS | No new NuGet packages required. All dependencies (`Azure.Storage.Blobs`, `QRCoder`, `SixLabors.ImageSharp`) already present. |
| II | Server-side QR generation only | ✅ PASS | All QR generation stays in `QRCodeService` using QRCoder + ImageSharp server-side. No client-side canvas rendering. |
| II | No outbound network calls at runtime (except blob storage) | ✅ PASS | Blob storage is an explicit project dependency already configured. No new external SaaS APIs. |
| II | No temp files on disk | ✅ PASS | All processing uses in-memory streams. VCF generation returns bytes. |
| III | Business logic in Services/ behind interfaces | ✅ PASS | New logic goes into existing `IBlobStorageService`/`BlobStorageService`, `IAccessCodeService`/`AccessCodeService`, and `IQRCodeService`/`QRCodeService`. New `ITtlCleanupService` if background worker needed. |
| III | Controllers only validate + delegate | ✅ PASS | `BlobController` and `ViewController` remain thin. New endpoints follow existing pattern. |
| III | Models are plain DTOs | ✅ PASS | Existing `BlobModels.cs`, `ContactDataModels.cs` extended with data annotations only. |
| III | Views have no inline C# beyond tag helpers | ✅ PASS | Razor views use tag helpers; interactivity via vanilla JS in `wwwroot/js/site.js`. |
| IV | Input validation at API boundary | ✅ PASS | Data annotations on all request models. Access code length 4–6 chars validated. URL validation on social media fields. |
| IV | Access code hashed with salt (SHA-256) | ✅ PASS | `AccessCodeService` already implements salted SHA-256 hashing. |
| IV | Error responses omit internals | ✅ PASS | Existing pattern returns `{ success, errorMessage }` only. |
| IV | Rate limiting on code verification | ⚠️ NEEDS JUSTIFICATION | FR-038 requires per-IP rate limiting. Will use in-memory `ConcurrentDictionary` — no new package, no middleware library. Simplest viable approach. |
| V | Vanilla JS + CSS only | ✅ PASS | All new UI in Razor views + vanilla JS. Web Share API is browser-native. |
| V | Responsive on desktop + mobile | ✅ PASS | CSS grid/flexbox for QR code grid. 375px minimum viewport. |
| V | Fetch API for all AJAX | ✅ PASS | Existing pattern in `site.js`. |

**Gate Result**: ✅ PASS — All principles satisfied. Rate limiting uses in-memory approach (no new dependencies).

## Project Structure

### Documentation (this feature)

```text
specs/007-social-qr-blob-share/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
QRStudio/
├── Controllers/
│   ├── HomeController.cs          # Existing — no changes
│   ├── QRController.cs            # Existing — no changes
│   ├── BlobController.cs          # MODIFY — add rate limiting to verify, add TTL reset on save
│   └── ViewController.cs          # MODIFY — add read endpoint for JSON data
├── Models/
│   ├── BlobModels.cs              # MODIFY — access code validation (4–6 chars)
│   ├── ContactDataModels.cs       # Existing — no changes (SocialMediaEntry, ContactQRRequest already present)
│   ├── QRModels.cs                # Existing — no changes
│   └── ErrorViewModel.cs          # Existing — no changes
├── Services/
│   ├── IQRCodeService.cs          # Existing — no changes
│   ├── QRCodeService.cs           # Existing — no changes
│   ├── IBlobStorageService.cs     # MODIFY — add UpdateAsync, add ResetTtlAsync
│   ├── BlobStorageService.cs      # MODIFY — implement UpdateAsync, ResetTtlAsync
│   ├── IAccessCodeService.cs      # Existing — no changes
│   ├── AccessCodeService.cs       # Existing — no changes
│   ├── IRateLimitService.cs       # NEW — rate limiting interface
│   ├── RateLimitService.cs        # NEW — in-memory per-IP rate limiting
│   ├── ITtlCleanupService.cs      # NEW — TTL cleanup interface (optional, can be IHostedService)
│   └── TtlCleanupService.cs       # NEW — Background hosted service for TTL expired blob cleanup
├── Views/
│   ├── Home/
│   │   └── Index.cshtml           # MODIFY — add social media section, upload button, action buttons
│   ├── View/
│   │   └── Index.cshtml           # MODIFY — add read-only/full mode, access code field, action buttons
│   └── Shared/
│       └── _Layout.cshtml         # Existing — no changes expected
├── wwwroot/
│   ├── css/
│   │   └── site.css               # MODIFY — social media grid, button styles, responsive layout
│   └── js/
│       └── site.js                # MODIFY — social media UI logic, save/delete/copy/share/upload/download
├── Program.cs                     # MODIFY — register rate limit + TTL cleanup services
└── appsettings.json               # MODIFY — add TtlCleanup config section
```

**Structure Decision**: Single ASP.NET Core MVC project. All changes within existing directory structure. 4 new service files (IRateLimitService, RateLimitService, ITtlCleanupService, TtlCleanupService). No new project, no microservices, no background workers outside `IHostedService`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `IHostedService` for TTL cleanup (FR-037) | FR-037 mandates hourly expired blob cleanup | Manual deletion only would leave orphaned files; `IHostedService` is built-in ASP.NET Core, no new packages |
| In-memory rate limiting (FR-038) | FR-038 mandates 5 attempts/IP/file/minute | Constitution says no new NuGet — `ConcurrentDictionary` is built-in .NET; no external middleware library needed |
