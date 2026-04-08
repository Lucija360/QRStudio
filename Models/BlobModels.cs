using System.ComponentModel.DataAnnotations;

namespace QRStudio.Models;

public class BlobJsonDocument
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

    // Security fields
    public string AccessCodeHash { get; set; } = string.Empty;
    public string AccessCodeSalt { get; set; } = string.Empty;
    public string DeleteToken { get; set; } = string.Empty;
    public string? ExpiresAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
}

public class SaveRequest
{
    [Required]
    public ContactDataPayload ContactData { get; set; } = new();

    [Required(ErrorMessage = "Access code is required.")]
    [StringLength(6, MinimumLength = 4, ErrorMessage = "Access code must be between 4 and 6 characters.")]
    public string AccessCode { get; set; } = string.Empty;
}

public class SaveResponse
{
    public bool Success { get; set; }
    public string? FileName { get; set; }
    public string? DeleteToken { get; set; }
    public string? ViewUrl { get; set; }
    public string? ErrorMessage { get; set; }
}

public class DeleteRequest
{
    [Required(ErrorMessage = "Delete token is required.")]
    public string DeleteToken { get; set; } = string.Empty;
}

public class VerifyCodeRequest
{
    [Required(ErrorMessage = "File name is required.")]
    public string FileName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Access code is required.")]
    [StringLength(6, MinimumLength = 4, ErrorMessage = "Access code must be between 4 and 6 characters.")]
    public string AccessCode { get; set; } = string.Empty;
}

public class VerifyCodeResponse
{
    public bool Success { get; set; }
    public ContactDataPayload? ContactData { get; set; }
    public string? DeleteToken { get; set; }
    public string? ErrorMessage { get; set; }
}

public class ChangeCodeRequest
{
    [Required(ErrorMessage = "File name is required.")]
    public string FileName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Current code is required.")]
    [StringLength(6, MinimumLength = 4, ErrorMessage = "Current code must be between 4 and 6 characters.")]
    public string CurrentCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "New code is required.")]
    [StringLength(6, MinimumLength = 4, ErrorMessage = "New code must be between 4 and 6 characters.")]
    public string NewCode { get; set; } = string.Empty;
}

public class ReadContactResponse
{
    public bool Success { get; set; }
    public ContactDataPayload? ContactData { get; set; }
    public string? ErrorMessage { get; set; }
}

public class FindByNameRequest
{
    [Required(ErrorMessage = "First name is required.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Access code is required.")]
    [StringLength(6, MinimumLength = 4, ErrorMessage = "Access code must be between 4 and 6 characters.")]
    public string AccessCode { get; set; } = string.Empty;
}

public class FindByNameResponse
{
    public bool Success { get; set; }
    public ContactDataPayload? ContactData { get; set; }
    public string? FileName { get; set; }
    public string? DeleteToken { get; set; }
    public string? ErrorMessage { get; set; }
}
