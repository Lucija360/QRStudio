# Quickstart: Social Media QR Codes with Blob Storage & Sharing

**Feature**: 007-social-qr-blob-share | **Date**: 2026-03-28 (updated)

---

## Prerequisites

- .NET 8 SDK
- Azure Storage Account (or Azurite for local development)

## 1. Add NuGet Package

```bash
dotnet add package Azure.Storage.Blobs
```

## 2. Configure App Settings

Add to `appsettings.json`:

```json
{
  "BlobStorage": {
    "ConnectionString": "UseDevelopmentStorage=true",
    "ContainerName": "qrstudio-contacts"
  },
  "TtlCleanup": {
    "IntervalMinutes": 60,
    "Enabled": true
  }
}
```

For production, replace with your Azure Storage connection string. Use User Secrets or environment variables — never commit real connection strings.

```bash
dotnet user-secrets set "BlobStorage:ConnectionString" "DefaultEndpointsProtocol=https;AccountName=..."
```

## 3. Configure Azurite (Local Development)

Install Azurite:

```bash
npm install -g azurite
```

Start Azurite:

```bash
azurite --silent --location .azurite --debug .azurite/debug.log
```

`UseDevelopmentStorage=true` connects to Azurite automatically.

## 4. Run the Application

```bash
dotnet run
```

The app starts at `https://localhost:5001` (or the port in `launchSettings.json`).

## 5. New Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/qr/generate-contact` | Generate vCard + social media QR codes |
| POST | `/api/blob/save` | Save contact data with access code |
| GET | `/api/blob/read/{filename}` | Read contact data (read-only, no auth) |
| DELETE | `/api/blob/{filename}` | Delete stored contact data (GDPR) |
| POST | `/api/blob/verify` | Verify access code, return data + delete token |
| POST | `/api/blob/change-code` | Change access code |
| GET | `/view/{slug}` | View page (Razor shell) |

## 6. New Files (Implementation)

```
Controllers/
  BlobController.cs          # Blob save/delete/verify/change-code/read APIs
  ViewController.cs          # GET /view/{slug} Razor page
Models/
  ContactDataModels.cs       # ContactQRRequest, ContactDataPayload, SocialMediaEntry, etc.
  BlobModels.cs              # SaveRequest/Response, DeleteRequest, VerifyCode*, ChangeCode*, ReadContactResponse
Services/
  IBlobStorageService.cs     # Interface for blob operations
  BlobStorageService.cs      # Azure.Storage.Blobs implementation
  IAccessCodeService.cs      # Interface for hashing/verification
  AccessCodeService.cs       # SHA-256 + salt implementation
  IRateLimitService.cs       # NEW: Interface for rate limiting
  RateLimitService.cs        # NEW: In-memory per-IP rate limiting
  TtlCleanupService.cs       # NEW: IHostedService for expired blob cleanup
Views/
  Home/
    Index.cshtml             # Contact form (social media section, upload, action buttons)
  View/
    Index.cshtml             # View page (read-only + full mode)
wwwroot/
  js/site.js                 # Extended with save/delete/copy/share/upload/download/view logic
  css/site.css               # Extended with social media grid, button styles
```

## 7. Architecture Notes

- **Access code**: SHA-256 hash with 16-byte random salt. Code is never stored in plaintext.
- **Delete token**: 32-byte random, base64url-encoded. Returned once at save time.
- **Retention / TTL**: Application checks `expiresAt` timestamp at access time. Background `TtlCleanupService` (`IHostedService`) runs hourly (configurable) to delete expired blobs.
- **Rate limiting**: `POST /api/blob/verify` is rate-limited to 5 failed attempts/IP/file/minute. Returns HTTP 429 on excess. In-memory `ConcurrentDictionary` — no external dependencies.
- **View page**: Razor renders page shell; JavaScript calls `/api/blob/read/{filename}` for read-only data, then optionally `/api/blob/verify` with access code for full mode.
- **TXT export**: Serialises `ContactDataPayload` only (excludes hash, salt, delete token, timestamps).

## 8. Testing Flow

1. Fill in contact form + social media URLs
2. Click Generate → QR codes appear
3. Save prompt → enter access code, select retention → Save
4. Copy the share link (`/view/jane-doe-x7k2`)
5. Open share link in incognito → enter access code → see contact + QR codes
6. On view page, change access code → old code stops working
7. Delete via delete token → blob removed
