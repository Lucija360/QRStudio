# Quickstart — UI Rebrand & Share

**Feature**: `001-ui-rebrand-share` | **Branch**: `001-ui-rebrand-share`

---

## Prerequisites

- .NET 8 SDK
- A modern browser (Chrome, Edge, Firefox, or Safari)

## Run the project

```powershell
cd C:\dev\daenet\QRStudio
dotnet restore
dotnet run
```

Open https://localhost:5001 (or the port shown in console output).

## Verify this feature

After the changes from this feature branch are applied, verify each area:

### 1. Branding

- The header shows **"daenet QR Studio"** (lowercase **d**, the rest as-is).
- The logo is a combined SVG (daenet + QR motif). No "Free" badge.
- The browser tab title reads **"daenet QR Studio"**.

### 2. Input area

- The label reads **"URL"** (not "URL or plain text").
- The Generate button shows a **QR-code grid icon** (no text).

### 3. Transitions

- Hover over any button → smooth shadow/elevation change (≤200ms).
- Click Generate → subtle press animation.
- QR result card appears with a slide-up fade animation.

### 4. Responsive

- Resize to ≤768px width → sidebar stacks above the output area.
- All controls remain usable on a 375px-width viewport (iPhone SE size).

### 5. Share

1. Generate a QR code from any valid URL.
2. Click the **Share** button in the output actions row.
3. **On mobile / supported browsers**: The native OS share sheet appears.
4. **On desktop Firefox or unsupported**: A fallback panel appears with 9 channel icons (Email, Instagram, Telegram, WhatsApp, Threema, X, Facebook, LinkedIn, Copy link).
5. Click a channel → it opens the appropriate sharing target.
6. Click "Copy link" → URL is copied and a "Copied!" confirmation appears.
7. Close the panel by clicking the X or clicking outside.
8. The Share button is **not visible** before any QR code is generated.

## Files changed

| File | Change |
|------|--------|
| `Views/Home/Index.cshtml` | Rebrand header, label, icon button, share button + panel HTML |
| `Views/Shared/_Layout.cshtml` | Update page title |
| `wwwroot/css/site.css` | Transitions, share panel styles, responsive breakpoint, badge removal |
| `wwwroot/js/site.js` | Share logic (Web Share API + fallback), channel handlers |
