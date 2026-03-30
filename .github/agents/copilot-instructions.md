# QRStudio Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-28

## Active Technologies
- N/A (stateless; all data in memory per request) (002-vcf-contact-qr)
- C# / .NET 8 LTS + QRCoder 1.6.x, SixLabors.ImageSharp 3.x / Drawing 2.x, Azure.Storage.Blobs (new) (007-social-qr-blob-share)
- Azure Blob Storage (public container, JSON files with TTL) (007-social-qr-blob-share)
- C# / .NET 8 LTS + ASP.NET Core MVC, QRCoder 1.6.x, SixLabors.ImageSharp 3.x / Drawing 2.x, Azure.Storage.Blobs 12.27.x (007-social-qr-blob-share)
- Azure Blob Storage (public container `qrstudio-contacts`) (007-social-qr-blob-share)

- C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3 + QRCoder 1.6.0, SixLabors.ImageSharp 3.1.12, SixLabors.ImageSharp.Drawing 2.1.7 (001-ui-rebrand-share)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3: Follow standard conventions

## Recent Changes
- 007-social-qr-blob-share: Added C# / .NET 8 LTS + ASP.NET Core MVC, QRCoder 1.6.x, SixLabors.ImageSharp 3.x / Drawing 2.x, Azure.Storage.Blobs 12.27.x
- 007-social-qr-blob-share: Added C# / .NET 8 LTS + QRCoder 1.6.x, SixLabors.ImageSharp 3.x / Drawing 2.x, Azure.Storage.Blobs (new)
- 003-vcard-profile-photo: Added C# / .NET 8.0 (ASP.NET Core MVC); Vanilla JavaScript ES2020+; CSS3 + QRCoder 1.6.0, SixLabors.ImageSharp 3.1.12, SixLabors.ImageSharp.Drawing 2.1.7


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
