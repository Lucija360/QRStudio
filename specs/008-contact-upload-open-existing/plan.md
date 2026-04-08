# Implementation Plan: Contact Tab Upload & Open Existing

**Branch**: `008-contact-upload-open-existing` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-contact-upload-open-existing/spec.md`

## Summary

Remove the "Drop" button from the contact save prompt, relocate the "Upload" button to the top of the Contact tab for fast file-based restore, and add an "Open Existing" popup that retrieves server-saved contacts by first name + last name + access code. Requires a new server-side search endpoint because blob filenames include random suffixes and cannot be derived from user input alone.

## Technical Context

**Language/Version**: C# / .NET 8.0 LTS (ASP.NET Core MVC)  
**Primary Dependencies**: QRCoder 1.6.x, SixLabors.ImageSharp 3.x, Azure.Storage.Blobs  
**Storage**: Azure Blob Storage (JSON documents in a single container)  
**Testing**: Manual browser testing (no automated test framework in project)  
**Target Platform**: Web (server-rendered MVC + vanilla JS/CSS frontend)  
**Project Type**: Web application (single ASP.NET Core MVC project)  
**Performance Goals**: < 2s response for blob lookup by name prefix  
**Constraints**: Vanilla JS only (no frameworks/bundlers per constitution), all processing server-side  
**Scale/Scope**: Single-user utility; moderate blob count per name prefix

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | All changes serve stated requirements. No new NuGet dependencies. Single project structure maintained. |
| II. Self-Contained Server-Side Processing | ✅ PASS | New lookup endpoint processes entirely server-side. No external SaaS APIs. File upload parsed client-side (JSON.parse) which is existing pattern. |
| III. Clean Separation of Concerns | ✅ PASS | New search logic in `Services/` behind `IBlobStorageService`. Controller only delegates. Modal HTML in Views, behavior in `site.js`. |
| IV. Input Validation and Security | ✅ PASS | New endpoint validates inputs via data annotations + ModelState. Access code verified before returning data. Rate limiting applied. |
| V. Responsive and Minimal Frontend | ✅ PASS | Vanilla JS + CSS only. Modal follows existing share-panel pattern. No new dependencies. |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/008-contact-upload-open-existing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
Controllers/
└── BlobController.cs        # Add FindByName endpoint
Models/
└── BlobModels.cs            # Add FindByNameRequest/Response DTOs
Services/
├── IBlobStorageService.cs   # Add FindByNamePrefixAsync method
└── BlobStorageService.cs    # Implement blob prefix search
Views/Home/
└── Index.cshtml             # Remove Drop btn, move Upload, add Open Existing + modal
wwwroot/
├── css/site.css             # Add modal overlay + open-existing styling
└── js/site.js               # Add modal logic, move upload handler, remove drop handler
```

**Structure Decision**: Single ASP.NET Core MVC project (existing structure). No new projects, folders, or architectural layers. Changes span 7 existing files plus 2 new DTOs in the existing models file.

## Complexity Tracking

No constitution violations — this section is intentionally empty.
