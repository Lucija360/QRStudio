# Quickstart — vCard Profile Photo

**Feature**: `003-vcard-profile-photo` | **Branch**: `003-vcard-profile-photo`

---

## Prerequisites

- .NET 8 SDK
- A modern browser (Chrome, Edge, Firefox, or Safari)
- A mobile device with a camera for QR scanning verification
- A sample photo file (PNG, JPG, or WebP, any resolution, ≤2 MB)

## Run the project

```powershell
cd C:\dev\daenet\QRStudio
dotnet restore
dotnet run
```

Open https://localhost:5001 (or the port shown in console output).

## Verify this feature

After the changes from this feature branch are applied, verify each area:

### 1. Photo Upload Area

- Switch to **Contact** mode.
- A **circular photo upload area** with a placeholder icon and "Add photo" label appears above the name fields.
- Click the area → a file picker opens filtered to images.
- Select a valid image (PNG, JPG, or WebP, ≤2 MB) → a **circular preview** of the image replaces the placeholder.
- A small **✕ remove button** appears on the preview.

### 2. Drag and Drop

- Drag an image file from the desktop onto the photo upload area.
- The area highlights (drag-over state).
- Drop the file → the photo is accepted and previewed, same as file picker.

### 3. Remove Photo

- With a photo previewed, click the **✕ remove button**.
- The photo is removed and the placeholder icon + "Add photo" label is restored.
- The "Include photo in QR code" checkbox disappears.

### 4. Include Photo Toggle

- Upload a photo → an **"Include photo in QR code"** checkbox appears below the preview, **checked by default**.
- Uncheck the checkbox.
- Click Generate → scan the QR code → the phone imports the contact **without** a photo.
- Check the checkbox again.
- Click Generate → scan the QR code → the phone imports the contact **with** a photo.

### 5. Generate with Photo

1. Switch to Contact mode.
2. Upload a photo with "Include photo" checked.
3. Enter a name (e.g., "Jane Doe") and phone (e.g., "+49 123 456 7890").
4. Click **Generate**.
5. A QR code appears in the output area.
6. Scan with a mobile phone → the device prompts to add the contact **with the photo visible**.

### 6. Auto-Downscale

1. Upload a large, high-resolution photo (e.g., 4000×4000 JPEG).
2. Set ECC to **High** (smallest capacity).
3. Click Generate.
4. The system should automatically compress the photo to fit, and the QR code should be scannable.
5. If the photo still cannot fit, an error message appears: *"Photo is too large to include at the current error correction level. Try unchecking 'Include photo' or lowering the error correction level."*

### 7. File Validation

- Upload a non-image file (e.g., .txt, .pdf) → error: "Please select a valid image file."
- Upload an image >2 MB → error: "Image must be smaller than 2 MB."
- No preview is shown for rejected files.

### 8. Mode Switching Preservation

- Upload a photo in Contact mode.
- Switch to URL mode → the photo is not visible (URL block is shown).
- Switch back to Contact mode → the photo preview is still there, checkbox state preserved.

### 9. Existing Functionality

- All existing Contact mode fields (name, phone, email, org, title, website) work as before.
- Contact validation (empty name, invalid email/phone) still works.
- URL mode is completely unaffected.
- Logo upload still works independently of the profile photo.
- Download, Copy, and Share actions work with photo-embedded QR codes.

### 10. Responsive

- Resize to ≤768px (or use a mobile device).
- The photo upload area, preview, and checkbox are fully usable without horizontal scrolling.
- The photo area stacks naturally above the name fields.

### 11. Server-Side Limit

- The `Content` field now accepts up to 4096 characters (was 2048).
- A vCard with a small embedded photo should be accepted by the server.
- Content exceeding 4096 characters returns a 400 Bad Request with a clear error message.
