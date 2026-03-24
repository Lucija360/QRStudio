# Quickstart — VCF Contact QR Code

**Feature**: `002-vcf-contact-qr` | **Branch**: `002-vcf-contact-qr`

---

## Prerequisites

- .NET 8 SDK
- A modern browser (Chrome, Edge, Firefox, or Safari)
- A mobile device with a camera for QR scanning verification

## Run the project

```powershell
cd C:\dev\daenet\QRStudio
dotnet restore
dotnet run
```

Open https://localhost:5001 (or the port shown in console output).

## Verify this feature

After the changes from this feature branch are applied, verify each area:

### 1. Mode Selector

- A **segmented control** (pill toggle) with "URL" and "Contact" options appears at the top of the sidebar.
- **"URL"** is highlighted by default on page load.
- Clicking "Contact" switches the active highlight smoothly (≤200ms).
- Clicking back to "URL" restores the URL input.

### 2. Contact Form

- In Contact mode, a form appears with 7 fields: **First Name**, **Last Name**, **Phone**, **Email**, **Organisation**, **Job Title**, **Website**.
- First Name and Last Name are on the same row (desktop). All fields stack vertically on mobile.
- Phone field shows a phone dial pad on mobile.
- Email field shows an email keyboard on mobile (@ key visible).
- A full-width **Generate** button is at the bottom of the form.

### 3. Generate Contact QR Code

1. Switch to **Contact** mode.
2. Enter at least a first name (e.g., "Jane") and a phone number (e.g., "+49 123 456 7890").
3. Click **Generate**.
4. A QR code appears in the output area.
5. The **meta strip** below the QR code shows "**Jane**" (the full name) and the **ECC badge** (e.g., "ECC H").
6. **Scan** the QR code with a mobile phone — the device should prompt to **add the contact** to the address book.

### 4. Full Contact Data

1. Fill in **all** fields: First Name, Last Name, Phone, Email, Organisation, Job Title, Website.
2. Click Generate.
3. Scan with a mobile phone — all fields should appear in the contact import prompt.

### 5. Validation

- **Empty name**: Clear both First Name and Last Name, click Generate → error "Please enter a first name or last name."
- **Invalid email**: Enter "notanemail" in Email, click Generate → error "Please enter a valid email address."
- **Invalid phone**: Enter "abc" in Phone, click Generate → error "Phone may only contain digits, spaces, dashes, and +."
- **Valid data**: Fill valid name + phone, click Generate → no errors, QR code appears.

### 6. Mode Switching

- Enter a URL in URL mode, switch to Contact mode, switch back to URL mode → the URL is still there.
- Enter contact data in Contact mode, switch to URL mode, switch back to Contact mode → the contact data is still there.
- Customisation settings (colours, size, ECC, logo) are unchanged after any mode switch.
- The output area resets to the placeholder when switching modes.

### 7. Output Actions

- In Contact mode, after generating a QR code:
  - **Download PNG** → saves a PNG file.
  - **Copy** → copies the QR image to clipboard.
  - **Share** → native share sheet or fallback panel works.

### 8. Responsive

- Resize to ≤768px width → sidebar stacks above the output area (existing behaviour).
- Contact form fields stack vertically including First Name / Last Name.
- All controls remain usable on a 375px-width viewport.

### 9. Edge Cases

- Fill only optional fields (e.g., only Organisation) with no name → validation error appears.
- Refresh the page → all contact fields are empty (no persistence).
- Placeholder text in Contact mode reads "Fill in contact details and generate."

## Files changed

| File | Change |
|------|--------|
| `Views/Home/Index.cshtml` | Mode selector (pill toggle), contact form HTML, updated placeholder |
| `wwwroot/css/site.css` | Segmented control styles, contact form layout, validation states |
| `wwwroot/js/site.js` | Mode switching, vCard 3.0 assembly, contact validation, meta strip logic |
