# Quickstart: Contact Tab Upload & Open Existing

**Feature**: 008-contact-upload-open-existing  
**Date**: 2026-03-31

## Prerequisites

- .NET 8 SDK
- Azure Storage account (or Azurite for local development)
- `appsettings.Development.json` configured with blob storage connection string

## Build & Run

```powershell
cd c:\dev\daenet\QRStudio
dotnet restore
dotnet run
```

Navigate to `https://localhost:5001` (or the configured port).

## Feature Verification

### 1. Remove Drop Button

1. Switch to **Contact** tab
2. Fill in at least First Name and Last Name
3. Click **Generate**
4. Observe the save prompt — it should show only the "Save" button and access code field
5. The "Drop" button should NOT appear

### 2. Upload Button at Top

1. Switch to **Contact** tab
2. The **Upload** button should be visible at the top of the tab, above the photo area
3. Click **Upload** and select a previously downloaded `.txt` contact file
4. All form fields should populate with the file's data

### 3. Open Existing Contact

1. First, save a contact: fill form, generate, enter access code, click Save
2. Note the first name, last name, and access code used
3. Clear the form (switch to URL tab and back to Contact)
4. Click **Open Existing** button at the top of the Contact tab
5. In the popup, enter the first name, last name, and access code
6. Click **Open**
7. The popup should close and all form fields should populate with the saved contact data

### 4. Info Icon

1. On the Contact tab, hover over the ⓘ icon next to "Open Existing"
2. A tooltip should appear: "You can open existing contact card — provide first name, last name and access code"

## Files Changed

| File | Change |
|------|--------|
| `Models/BlobModels.cs` | Add `FindByNameRequest`, `FindByNameResponse` DTOs |
| `Services/IBlobStorageService.cs` | Add `FindByNamePrefixAsync` method signature |
| `Services/BlobStorageService.cs` | Implement prefix search using `GetBlobsByHierarchyAsync` |
| `Controllers/BlobController.cs` | Add `POST /api/blob/find` endpoint |
| `Views/Home/Index.cshtml` | Remove Drop button, move Upload to contact-block top, add Open Existing button + modal HTML |
| `wwwroot/css/site.css` | Add modal backdrop, open-existing-modal, info-icon styles |
| `wwwroot/js/site.js` | Add modal logic, refactor upload handler, remove drop handler |
