using System.ComponentModel.DataAnnotations;

namespace QRStudio.Models;

public class SocialMediaEntry
{
    [Required]
    [RegularExpression("^(LinkedIn|Instagram|Facebook|X/Twitter|YouTube|GitHub|TikTok)$",
        ErrorMessage = "Platform must be one of: LinkedIn, Instagram, Facebook, X/Twitter, YouTube, GitHub, TikTok.")]
    public string Platform { get; set; } = string.Empty;

    [StringLength(2048, ErrorMessage = "URL must not exceed 2048 characters.")]
    public string Url { get; set; } = string.Empty;

    public bool Enabled { get; set; }
}

public class ContactQRRequest
{
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100, ErrorMessage = "First name must not exceed 100 characters.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters.")]
    public string LastName { get; set; } = string.Empty;

    [StringLength(30, ErrorMessage = "Phone must not exceed 30 characters.")]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email address.")]
    [StringLength(254, ErrorMessage = "Email must not exceed 254 characters.")]
    public string? Email { get; set; }

    [StringLength(200, ErrorMessage = "Organisation must not exceed 200 characters.")]
    public string? Organisation { get; set; }

    [StringLength(200, ErrorMessage = "Job title must not exceed 200 characters.")]
    public string? JobTitle { get; set; }

    [StringLength(2048, ErrorMessage = "Website must not exceed 2048 characters.")]
    public string? Website { get; set; }

    public string? PhotoBase64 { get; set; }

    [MaxLength(7, ErrorMessage = "Maximum 7 social media entries allowed.")]
    public SocialMediaEntry[] SocialMedia { get; set; } = [];

    [Range(5, 20, ErrorMessage = "Module size must be between 5 and 20.")]
    public int PixelsPerModule { get; set; } = 10;

    public string DarkColor { get; set; } = "#0d0d0d";

    public string LightColor { get; set; } = "#ffffff";

    public string ErrorCorrectionLevel { get; set; } = "H";

    public string? LogoBase64 { get; set; }

    [Range(0.05, 0.30)]
    public double LogoSizeRatio { get; set; } = 0.22;
}

public class ContactQRResponse
{
    public bool Success { get; set; }
    public string? VCardImageBase64 { get; set; }
    public SocialMediaQRResult[] SocialMediaQRCodes { get; set; } = [];
    public string? ErrorMessage { get; set; }
}

public class SocialMediaQRResult
{
    public string Platform { get; set; } = string.Empty;
    public string ImageBase64 { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class ContactDataPayload
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Organisation { get; set; }
    public string? JobTitle { get; set; }
    public string? Website { get; set; }
    public string? PhotoBase64 { get; set; }
    public SocialMediaEntry[] SocialMedia { get; set; } = [];
    public int PixelsPerModule { get; set; } = 10;
    public string DarkColor { get; set; } = "#0d0d0d";
    public string LightColor { get; set; } = "#ffffff";
    public string ErrorCorrectionLevel { get; set; } = "H";
    public string? LogoBase64 { get; set; }
    public double LogoSizeRatio { get; set; } = 0.22;
    public string RetentionPeriod { get; set; } = "7d";
}
