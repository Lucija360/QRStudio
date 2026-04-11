using System.ComponentModel.DataAnnotations;

namespace QRStudio.Models;

public class QRGenerateRequest
{
    [Required(ErrorMessage = "A URL or text is required.")]
    [StringLength(4096, ErrorMessage = "Input must not exceed 4096 characters.")]
    public string Content { get; set; } = string.Empty;

    /// <summary>Size of the QR code in pixels (module size).</summary>
    [Range(5, 20, ErrorMessage = "Size must be between 5 and 20.")]
    public int PixelsPerModule { get; set; } = 10;

    /// <summary>Foreground hex color (e.g. #1a1a2e)</summary>
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "DarkColor must be a valid hex color (e.g. #1a2b3c).")]
    public string DarkColor { get; set; } = "#0d0d0d";

    /// <summary>Background hex color</summary>
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "LightColor must be a valid hex color (e.g. #ffffff).")]
    public string LightColor { get; set; } = "#ffffff";

    /// <summary>Error correction level: L, M, Q, H</summary>
    [RegularExpression(@"^[LMQHlmqh]$", ErrorMessage = "ErrorCorrectionLevel must be L, M, Q, or H.")]
    public string ErrorCorrectionLevel { get; set; } = "H";

    /// <summary>Optional base64-encoded logo image</summary>
    public string? LogoBase64 { get; set; }

    /// <summary>Logo size relative to QR code (0.0 – 0.30)</summary>
    [Range(0.05, 0.30, ErrorMessage = "Logo size ratio must be between 0.05 and 0.30.")]
    public double LogoSizeRatio { get; set; } = 0.22;
}

public class QRGenerateResponse
{
    public bool Success { get; set; }
    public string? ImageBase64 { get; set; }   // PNG base64
    public string? ErrorMessage { get; set; }
}
