# Research: vCard Profile Photo

**Feature**: 003-vcard-profile-photo  
**Date**: 2026-03-24  
**Status**: Complete

## R-001: Client-Side Canvas JPEG Resize & Compress

**Decision**: Use `HTMLCanvasElement.toBlob()` with `'image/jpeg'` MIME type and a quality parameter for thumbnail generation. Load the uploaded image into an `Image` element, draw to a canvas at the target pixel dimensions, export as JPEG blob, then convert to Base64 via `FileReader.readAsDataURL()`.

**Rationale**:
- `toBlob()` is preferred over `toDataURL()` — returns a Blob directly, reducing intermediate memory allocation
- Quality parameter range 0.0–1.0 is standard across all modern browsers (Chrome, Firefox, Safari, Edge)
- For a 96×96 JPEG at quality 0.7: expect 4–6 KB raw (varies by image entropy)
- Canvas JPEG export is supported in all target browsers; no polyfills needed
- The existing `fileToBase64()` utility in site.js already demonstrates the FileReader pattern

**Alternatives Considered**:
- `toDataURL()` directly: Simpler but creates large intermediate strings; less memory-efficient
- Server-side resizing with ImageSharp: Adds roundtrip latency, bandwidth cost, and violates the client-side processing goal
- WebP format: ~30% smaller than JPEG but vCard PHOTO property expects JPEG for broad device compatibility

## R-002: vCard 3.0 PHOTO Property Format

**Decision**: Use `PHOTO;ENCODING=b;TYPE=JPEG:{base64data}` per RFC 2426 §3.1.4. Omit line folding — emit the entire Base64 string on a single line after the property header.

**Rationale**:
- `ENCODING=b` is the vCard 3.0 standard shorthand for Base64 (not `ENCODING=BASE64`)
- `TYPE=JPEG` explicitly identifies the image format for all readers
- **Line folding**: RFC 2426 technically mandates folding at 75 characters, but both iOS (9+) and Android (5+) contact importers parse unfolded PHOTO properties without issue. QR code scanners also handle the raw string. Omitting folding saves ~1 byte per 75 characters of overhead and avoids complexity in the JS assembly
- iOS and Android display the contact photo upon import; older devices ignore the PHOTO property but import text fields successfully

**Alternatives Considered**:
- `ENCODING=BASE64` (spelled out): Less standard; some readers may not recognise the expanded form
- Full RFC-compliant line folding: Adds ~50+ bytes of CRLF+space overhead and JS complexity for no practical benefit in QR code context
- `PHOTO;VALUE=URI:http://...`: Requires hosted image; adds external dependency; incompatible with offline use
- vCard 4.0 (RFC 6350): Different syntax (`FMTTYPE`); less widely supported by phone contact importers

## R-003: QR Code Capacity vs. Base64 Photo Payload

**Decision**: Start with 96×96 pixels at quality 0.7 as the initial attempt, then progressively reduce dimensions and quality until the vCard fits within the QR byte limit for the selected ECC level. The fallback chain goes down to 48×48 at quality 0.1 before showing an error.

**Rationale** (capacity analysis):

| ECC Level | Max Bytes | Contact Fields (~) | Available for Photo |
|-----------|-----------|---------------------|---------------------|
| L (7%)   | 2953      | 200–500             | ~2450–2750          |
| M (15%)  | 2331      | 200–500             | ~1830–2130          |
| Q (25%)  | 1663      | 200–500             | ~1160–1460          |
| H (30%)  | 1273      | 200–500             | ~770–1070           |

Photo payload estimates (raw → Base64 at 4/3 ratio):

| Dimensions | Quality | Raw JPEG | Base64   | Fits ECC L? | Fits ECC H? |
|------------|---------|----------|----------|-------------|-------------|
| 96×96      | 0.7     | 4–6 KB   | 5.3–8 KB | ❌           | ❌           |
| 96×96      | 0.3     | 2–3 KB   | 2.7–4 KB | ⚠️ Tight     | ❌           |
| 64×64      | 0.7     | 2.5–4 KB | 3.3–5.3 KB | ⚠️ Tight  | ❌           |
| 64×64      | 0.5     | 1.5–2.5 KB | 2–3.3 KB | ✅        | ⚠️ Tight     |
| 48×48      | 0.5     | 1–1.5 KB | 1.3–2 KB | ✅          | ✅           |
| 48×48      | 0.3     | 0.7–1 KB | 0.9–1.3 KB | ✅        | ✅           |

- 96×96 at quality 0.7 is the ideal starting point for recognisable photos
- Progressive reduction ensures graceful degradation rather than abrupt failure
- The worst case (ECC H with many contact fields) requires 48×48 at low quality

**Alternatives Considered**:
- Fixed 48×48 always: Safe but unnecessarily sacrifices quality for ECC L users
- Always use ECC L: Sacrifices error correction; fragile QR codes in poor conditions
- Ignore capacity: Silent failures when QR generation exceeds limits

## R-004: Server-Side StringLength Annotation Change

**Decision**: Increase `[StringLength(2048)]` to `[StringLength(4096)]` on `QRGenerateRequest.Content`.

**Rationale**:
- Current 2048 limit: sufficient for vCard without photo (~200–500 bytes) plus URL mode content
- With photo: vCard body (~400 bytes) + Base64 JPEG (up to ~3000 bytes for 64×64 @ Q0.5) + PHOTO property header (~30 bytes) = ~3430 bytes — exceeds 2048
- 4096 provides headroom for the largest practical photo payloads while maintaining server-side protection
- No performance impact; validation is O(1) string length check
- Controller and service layers require zero changes — they treat Content as opaque text

**Alternatives Considered**:
- 8192: Unnecessarily large; no practical vCard reaches this size
- Remove limit entirely: Opens the door to denial-of-service via arbitrarily large payloads
- Dynamic limit per ECC level: Overcomplicates server logic; the QR capacity limit already caps effective content size on the client

## R-005: Progressive Quality Reduction Algorithm

**Decision**: Implement a two-dimensional progressive reduction — first reducing JPEG quality at the current thumbnail size, then dropping to a smaller dimension and retrying all quality levels. Measure the **full vCard byte length** (not just the photo) against QR capacity.

**Algorithm**:
```
for thumbnailSize in [96, 64, 48]:
  for quality in [0.7, 0.5, 0.3, 0.1]:
    photoBase64 = canvasCompress(image, thumbnailSize, quality)
    fullVCard = assembleVCardWithPhoto(contactFields, photoBase64)
    byteLength = new TextEncoder().encode(fullVCard).length
    if byteLength ≤ maxBytesForEcc[eccLevel]:
      return { success: true, vcard: fullVCard }
return { success: false, error: "Photo too large..." }
```

**Rationale**:
- Two dimensions (size + quality) provide up to 12 attempts before giving up
- Quality reduction alone is insufficient — a high-entropy image at 96×96 may stay large even at Q0.1
- Measuring the full vCard protects against edge cases (long names, many fields consuming capacity)
- The algorithm is synchronous per attempt (canvas.toBlob is async but fast at these sizes)
- Error threshold: if 48×48 at quality 0.1 still exceeds the limit, the photo is incompatible — show error suggesting unchecking "Include photo" or lowering ECC level

**Alternatives Considered**:
- Quality-only (no dimension change): Mathematically insufficient for high-entropy images
- Dimension-only (no quality change): Wastes visual quality unnecessarily
- User manual size/quality picker: Shifts burden to user; overly complex UI
- Server-side re-encode: Adds latency; duplicates effort; unnecessary roundtrip
