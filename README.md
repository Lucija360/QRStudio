# QR Studio

A clean, production-quality ASP.NET Core 8 web application for generating QR codes — with optional logo embedding, custom colors, and multiple error-correction levels.

---

## Features

- **Free QR generation** — no external API calls, all server-side via QRCoder
- **Logo / watermark overlay** — upload any PNG/JPG/SVG; it is composited into the QR center with a rounded white backing
- **Custom colors** - foreground and background hex pickers
- **Size control** — pixels-per-module slider (5 – 20 px)
- **Error correction** — L / M / Q / H levels
- **Download PNG** — one-click save
- **Copy to clipboard** — copy the PNG directly to clipboard
- **Responsive** — works on desktop and mobile

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | ASP.NET Core 8 MVC |
| QR generation | [QRCoder 1.6](https://github.com/codebude/QRCoder) |
| Image compositing | [SixLabors.ImageSharp](https://sixlabors.com/products/imagesharp/) + ImageSharp.Drawing |
| Frontend | Vanilla JS (ES2020), custom CSS, Google Fonts |

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Visual Studio 2022 **or** VS Code **or** `dotnet` CLI

### Run with CLI

```bash
cd QRStudio
dotnet restore
dotnet run
```

Then open `https://localhost:5001` (or the URL shown in the terminal).

### Run in Visual Studio

1. Open `QRStudio.csproj` (or the containing folder) in Visual Studio.
2. Press **F5** — packages restore automatically.
3. The browser launches at the configured HTTPS port.

---

## Project Structure

```
QRStudio/
├── Controllers/
│   ├── HomeController.cs      — Serves the SPA-style index page
│   └── QRController.cs        — POST /api/qr/generate  (JSON API)
│
├── Models/
│   └── QRModels.cs            — QRGenerateRequest / QRGenerateResponse
│
├── Services/
│   ├── IQRCodeService.cs      — Interface
│   └── QRCodeService.cs       — QRCoder + ImageSharp implementation
│
├── Views/
│   ├── Home/Index.cshtml      — Main UI
│   └── Shared/_Layout.cshtml  — HTML shell
│
├── wwwroot/
│   ├── css/site.css           — All styles (CSS variables, responsive)
│   └── js/site.js             — Fetch API, drag-drop, color pickers
│
├── Program.cs
└── QRStudio.csproj
```

---

## API Reference

### `POST /api/qr/generate`

**Request body** (`application/json`):

| Field | Type | Default | Description |
|---|---|---|---|
| `content` | string | — | **Required.** URL or text to encode |
| `pixelsPerModule` | int | 10 | Pixel size per module (5–20) |
| `darkColor` | string | `#0d0d0d` | Foreground hex color |
| `lightColor` | string | `#ffffff` | Background hex color |
| `errorCorrectionLevel` | string | `H` | L / M / Q / H |
| `logoBase64` | string? | null | Base64 data-URI of logo image |
| `logoSizeRatio` | double | 0.22 | Logo size as fraction of QR size (0.05–0.30) |

**Response** (`application/json`):

```json
{
  "success": true,
  "imageBase64": "<base64 PNG string>"
}
```

---

## License

MIT — free for personal and commercial use.
