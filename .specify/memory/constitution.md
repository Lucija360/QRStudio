<!--
  Sync Impact Report
  ==================================================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (5 principles)
    - Technology Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (Constitution Check
      section will be populated from these principles at plan time)
    - .specify/templates/spec-template.md ✅ compatible (no constitution-
      specific sections require modification)
    - .specify/templates/tasks-template.md ✅ compatible (task phases align
      with principle-driven workflow)
  Follow-up TODOs: none
  ==================================================
-->

# QRStudio Constitution

## Core Principles

### I. Simplicity First

- Every change MUST solve a stated requirement; speculative features
  are prohibited (YAGNI).
- The project MUST remain a single ASP.NET Core MVC solution with no
  microservice splits, background workers, or message queues unless a
  concrete, documented need arises.
- New NuGet dependencies MUST be justified in the PR description;
  prefer built-in framework capabilities over third-party packages.

**Rationale**: QRStudio is a focused, single-purpose utility.
Complexity has no place in a tool whose value is immediacy and ease
of use.

### II. Self-Contained Server-Side Processing

- All QR code generation and image compositing MUST execute on the
  server via QRCoder and SixLabors.ImageSharp; no client-side canvas
  rendering or external SaaS APIs are permitted.
- The application MUST function without outbound network calls at
  runtime (excluding NuGet restore at build time).
- Uploaded logo data MUST be processed entirely in memory; no
  temporary files on disk.

**Rationale**: Offline capability, predictable latency, and zero
third-party runtime dependencies ensure reliability and privacy.

### III. Clean Separation of Concerns

- Business logic MUST reside in `Services/` behind interfaces
  registered via dependency injection.
- Controllers MUST only perform request validation, service
  delegation, and response mapping — no image processing or QR
  logic in controllers.
- Models in `Models/` MUST be plain DTOs with data-annotation
  validation; they MUST NOT reference service or infrastructure
  types.
- Views and static assets (`wwwroot/`) MUST NOT contain inline
  C# logic beyond Razor tag helpers.

**Rationale**: Clear boundaries keep each layer independently
testable and replaceable.

### IV. Input Validation and Security

- All user-supplied input MUST be validated at the API boundary
  using data annotations and `ModelState` checks before reaching
  service code.
- Base64 logo payloads MUST be length-limited and decoded safely;
  failures MUST return a structured error, never an unhandled
  exception or stack trace.
- Error responses MUST omit internal details (stack traces, file
  paths); only user-friendly messages are permitted in API output.
- HTTPS MUST be enforced in non-development environments via HSTS.

**Rationale**: Even a simple utility is internet-facing; defense
at the boundary prevents injection, denial-of-service, and
information leakage.

### V. Responsive and Minimal Frontend

- The frontend MUST use vanilla JavaScript and CSS — no SPA
  frameworks, bundlers, or Node.js toolchains.
- UI MUST be usable on both desktop and mobile viewports.
- All API communication MUST use the Fetch API with JSON payloads
  and proper error handling (non-2xx responses displayed to user).
- Static assets MUST be served via ASP.NET Core `UseStaticFiles`;
  no CDN or external font/script references are required at runtime.

**Rationale**: A zero-build frontend keeps the project trivially
deployable with `dotnet run` and eliminates an entire class of
toolchain issues.

## Technology Constraints

| Layer | Required Technology | Version Lock |
|---|---|---|
| Runtime | ASP.NET Core MVC | .NET 8 LTS |
| QR generation | QRCoder | 1.6.x |
| Image processing | SixLabors.ImageSharp + Drawing | 3.x / 2.x |
| Frontend | Vanilla JS (ES2020+), custom CSS | N/A |
| IDE | VS 2022, VS Code, or `dotnet` CLI | Any |

- The project MUST target a single `net8.0` TFM.
- Nullable reference types MUST remain enabled.
- Implicit usings MUST remain enabled.

## Development Workflow

- **Build & Run**: `dotnet restore && dotnet run` MUST be sufficient
  to start the application from a clean clone.
- **Code Style**: Follow default .NET conventions; prefer `sealed`
  on service implementations that are not designed for inheritance.
- **Logging**: Use `ILogger<T>` for all diagnostic output; NEVER
  write to `Console` directly in production code.
- **Error Handling**: Catch exceptions at the service boundary and
  return structured `QRGenerateResponse` objects; controllers MUST
  NOT swallow exceptions silently.

## Governance

- This constitution supersedes ad-hoc conventions; all PRs and
  code reviews MUST verify compliance with the principles above.
- Any change that violates a principle MUST include an explicit
  justification and, if accepted, an amendment to this document.
- Amendments follow semantic versioning:
  - **MAJOR**: Principle removal or backward-incompatible redefinition.
  - **MINOR**: New principle or materially expanded guidance.
  - **PATCH**: Wording clarifications, typo fixes, non-semantic edits.
- Compliance reviews SHOULD occur at every PR; a quarterly read-
  through is recommended to prune stale guidance.

**Version**: 1.0.1 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-26
