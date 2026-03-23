# Data Model — UI Rebrand & Share

**Feature**: `001-ui-rebrand-share` | **Date**: 2026-03-22

---

> This feature is **frontend-only** — no server-side model changes. The data model
> describes the client-side entities, DOM state, and JS data structures introduced
> or modified by this feature.

## Existing Entities (unchanged)

### QRGenerateRequest (C# DTO — Models/QRModels.cs)

| Field | Type | Constraints |
|-------|------|-------------|
| Content | string | Required, MaxLength(2048) |
| PixelsPerModule | int | Range(5, 20) |
| DarkColor | string | Hex colour |
| LightColor | string | Hex colour |
| ErrorCorrectionLevel | string | L / M / Q / H |
| LogoBase64 | string? | Nullable, data URI |
| LogoSizeRatio | double | Range(0.05, 0.30) |

**No changes** — the API contract is unaffected by this feature.

### QRGenerateResponse (C# DTO — Models/QRModels.cs)

| Field | Type |
|-------|------|
| Success | bool |
| ImageBase64 | string? |
| ErrorMessage | string? |

**No changes.**

---

## New/Modified Client-Side Entities

### ShareChannel (JS conceptual entity)

Represents one sharing destination in the fallback panel.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique key: `email`, `whatsapp`, `telegram`, `instagram`, `x`, `facebook`, `linkedin`, `threema`, `copy` |
| label | string | Display name shown in the panel |
| icon | string (SVG) | Inline SVG markup for the channel icon |
| action | function | Handler: either opens URL scheme or copies to clipboard |

**Instances** (9 total, ordered per FR-009):

1. `email` — Email
2. `instagram` — Instagram
3. `telegram` — Telegram
4. `whatsapp` — WhatsApp
5. `threema` — Threema
6. `x` — X (Twitter)
7. `facebook` — Facebook
8. `linkedin` — LinkedIn
9. `copy` — Copy link

### ShareState (JS runtime state)

Tracks the share panel UI state within the existing IIFE.

| Variable | Type | Description |
|----------|------|-------------|
| sharePanelOpen | boolean | Whether the fallback share panel is currently visible |
| currentImageDataUri | string | data:image/png;base64,... from last successful generation (already stored as `qrImage.src`) |
| currentContentUrl | string | The URL/text entered by the user (already stored as `contentInput.value`) |

> These are JS variables within the existing IIFE scope — not new classes or modules.

---

## DOM Structure Changes

### Brand Header (modified)

```
Before:
  .brand
    .brand__icon > svg (QR grid)
    .brand__name > "QR" + em "Studio"
    .brand__badge > "Free"

After:
  .brand
    .brand__icon > svg (combined daenet+QR logo)
    .brand__name > "daenet " + em "QR Studio"
    (badge removed)
```

### URL Block (modified)

```
Before:
  .field-label > "URL or plain text"
  .btn > .btn__text "Generate"

After:
  .field-label > "URL"
  .btn > svg (QR-code icon) + .btn__spinner
```

### Output Actions (modified)

```
Before:
  .output-actions
    #download-png "Download PNG"
    #copy-btn "Copy"

After:
  .output-actions
    #download-png "Download PNG"
    #copy-btn "Copy"
    #share-btn "Share" (NEW)
  .share-panel (NEW, hidden by default)
    .share-panel__header > "Share QR Code" + close button
    .share-panel__grid
      .share-channel (×9) > icon + label
```

---

## State Transitions

### Share Panel Lifecycle

```
[Hidden] --( Share btn click )--> [Checking Web Share API]
  |                                        |
  |                        (API available)  |  (API unavailable)
  |                               |         |           |
  |                       [Native Share]    |    [Panel Visible]
  |                               |         |           |
  |                      (success/cancel)   |  (channel click / close / backdrop click)
  |                               |         |           |
  +<------------------------------+---------+---------->+
                            [Hidden]
```

### Brand Display (static, no transitions)

Single render at page load. No dynamic state changes.

---

## Validation Rules

No new validation — all inputs remain unchanged. Share actions use existing validated data (post-generation image and user-entered URL).

**Security note**: All share URL templates use `encodeURIComponent()` on user-provided content to prevent URL injection (see research.md R-002).
