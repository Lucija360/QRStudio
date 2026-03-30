using QRStudio.Models;

namespace QRStudio.Services;

public interface IQRCodeService
{
    /// <summary>
    /// Generates a QR code PNG and returns it as a base64 string.
    /// If a logo is supplied (base64), it is composited into the center.
    /// </summary>
    Task<QRGenerateResponse> GenerateAsync(QRGenerateRequest request);

    /// <summary>
    /// Generates a vCard QR code plus per-platform social media QR codes.
    /// </summary>
    Task<ContactQRResponse> GenerateContactAsync(ContactQRRequest request);
}
