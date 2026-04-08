# Research: Contact Tab Upload & Open Existing

**Feature**: 008-contact-upload-open-existing  
**Date**: 2026-03-31

## R1: Blob Lookup by First Name + Last Name + Access Code

### Problem

The spec assumes the system can look up a contact by first name + last name + access code. However, blob filenames are generated with random 4-character suffixes (e.g., `jane-doe-a7x2.json`), so the client cannot derive the filename from user-provided names alone.

### Decision

Add a new `FindByNamePrefixAsync` method to `IBlobStorageService` that lists blobs matching the `{firstName}-{lastName}` prefix, then iterates candidates to verify the access code. Expose this via a new `POST /api/blob/find` endpoint.

### Rationale

- Azure Blob Storage supports `GetBlobsByHierarchyAsync` with a prefix filter, which efficiently narrows candidates to only blobs matching the name pattern.
- Since blob names follow the pattern `{first}-{last}-{suffix}.json`, the prefix `{first}-{last}-` will match all blobs for that name pair.
- For each candidate blob, read the document and verify the access code hash. Return the first match.
- This avoids adding a database/index layer (Simplicity First principle) while leveraging Azure Blob Storage's existing prefix listing capability.

### Alternatives Considered

1. **Store filename in a separate index (Table Storage / CosmosDB)**: Rejected — adds a new dependency and storage layer, violating Simplicity First. Overkill for the expected scale.
2. **Include filename in the downloaded TXT file**: This helps Upload (local restore) but not Open Existing (server lookup from scratch). The TXT file already contains enough data for local restore.
3. **Use deterministic filenames (no random suffix)**: Would create collisions for people with the same name. The current random suffix design is correct.

---

## R2: Upload Button Relocation

### Problem

The Upload TXT button currently lives in the output/result area (`#upload-restore-section`) and is only visible after generating a QR code. The spec requires it at the top of the Contact tab, available before any generation.

### Decision

Move the Upload button to a new section at the top of `.contact-block`, before the photo upload zone. Reuse the existing `uploadTxtFile` change handler logic and `uploadTxtError` element. Remove the old `#upload-restore-section` from the output area.

### Rationale

- Existing upload logic (JSON.parse, field population) is already complete and tested.
- Moving it to the input side (before form fields) matches the user's mental model: "load data first, then edit/generate."
- The hidden file input + button trigger pattern is already used (same as logo upload and photo upload).

### Alternatives Considered

1. **Duplicate the button (keep both locations)**: Rejected — two upload buttons would confuse users and violate Simplicity First.
2. **Add Upload to the mode selector bar**: Rejected — the mode selector is URL/Contact toggle only; adding actions there breaks the visual hierarchy.

---

## R3: Modal/Popup Pattern for Open Existing

### Problem

The spec requires a popup/modal for the "Open Existing" form. The codebase has no true modal overlay pattern — existing panels (save-prompt, share-panel) are inline elements toggled with `hidden`.

### Decision

Implement a proper modal overlay using the existing CSS variable system and animation pattern. The modal consists of:
- A semi-transparent backdrop overlay (`position: fixed; inset: 0`)
- A centered dialog card using the existing `.save-prompt` styling conventions
- Dismiss on backdrop click, Escape key (reuse share-panel's `keydown` pattern), or explicit close button

### Rationale

- Vanilla CSS + JS implementation (no framework needed, per constitution).
- The backdrop click + Escape dismiss pattern already exists in the share-panel code and can be adapted.
- A proper overlay prevents interaction with the form beneath, which is important since the popup fields overlap semantically with the main contact form.

### Alternatives Considered

1. **Inline expandable section (like save-prompt)**: Rejected — the spec explicitly says "popup" and the three fields would clutter the tab layout if always visible.
2. **Browser `dialog` element**: Valid option and semantically correct, but older browser support is inconsistent. The custom overlay approach is more aligned with existing codebase patterns.

---

## R4: Drop Button Removal Impact

### Problem

Removing the "Drop" button from the save prompt changes the post-generation workflow. Currently users can either Save or Drop. With Drop removed, a user who doesn't want to save has no explicit dismiss action for the prompt.

### Decision

Remove the Drop button and its JS handler. The save prompt description text changes from "Enter an access code to save and share your contact data. Or drop to skip saving." to "Enter an access code to save and share your contact data." The prompt can still be implicitly dismissed by switching to URL mode, navigating away, or generating a new QR code.

### Rationale

- The user explicitly requested Drop removal.
- The prompt is informational — it doesn't block interaction. Users can simply ignore it.
- Generating a new QR code or switching modes already hides the prompt via existing `hideSavePrompt()` calls.

### Alternatives Considered

1. **Replace Drop with a "Close" / "Dismiss" button**: Not requested. The prompt doesn't block anything, so an explicit close isn't necessary.
2. **Auto-hide the prompt after a timeout**: Adds complexity without clear benefit. Rejected.

---

## R5: Security Considerations for Find Endpoint

### Problem

A `POST /api/blob/find` endpoint that searches by name could be abused for enumeration (discovering which names have saved contacts).

### Decision

- Apply the existing `IRateLimitService` to the find endpoint using the same IP-based rate limiting pattern as the verify endpoint.
- Require all three fields (firstName, lastName, accessCode) before performing any blob search — never return results based on name alone.
- Return a generic "not found" error whether the name doesn't exist or the access code is wrong (prevent enumeration).
- The access code is verified server-side using the existing `IAccessCodeService.VerifyCode` method.

### Rationale

- Same security posture as the existing verify endpoint.
- Generic error messages prevent attackers from distinguishing "name exists but wrong code" from "name doesn't exist."
- Rate limiting prevents brute-force access code guessing.

### Alternatives Considered

1. **No rate limiting**: Rejected — leaves the endpoint open to enumeration and brute force.
2. **CAPTCHA**: Overkill for this scale, adds external dependency, violates constitution.
