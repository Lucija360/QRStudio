using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using QRStudio.Models;
using QRStudio.Services;

namespace QRStudio.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlobController : ControllerBase
{
    private readonly IBlobStorageService _blobService;
    private readonly IAccessCodeService _accessCodeService;
    private readonly IRateLimitService _rateLimitService;

    public BlobController(IBlobStorageService blobService, IAccessCodeService accessCodeService, IRateLimitService rateLimitService)
    {
        _blobService = blobService;
        _accessCodeService = accessCodeService;
        _rateLimitService = rateLimitService;
    }

    /// <summary>
    /// POST /api/blob/save
    /// Saves contact data to blob storage with hashed access code.
    /// Returns fileName, deleteToken, viewUrl.
    /// </summary>
    [HttpPost("save")]
    [ProducesResponseType(typeof(SaveResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Save([FromBody] SaveRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new SaveResponse
            {
                Success = false,
                ErrorMessage = string.Join(" ", errors)
            });
        }

        var (hash, salt) = _accessCodeService.HashCode(request.AccessCode);
        var deleteToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var fileName = await _blobService.GenerateFileName(
            request.ContactData.FirstName,
            request.ContactData.LastName);

        var expiresAt = CalculateExpiry(request.ContactData.RetentionPeriod);

        var document = new BlobJsonDocument
        {
            FirstName = request.ContactData.FirstName,
            LastName = request.ContactData.LastName,
            Phone = request.ContactData.Phone,
            Email = request.ContactData.Email,
            Organisation = request.ContactData.Organisation,
            JobTitle = request.ContactData.JobTitle,
            Website = request.ContactData.Website,
            PhotoBase64 = request.ContactData.PhotoBase64,
            SocialMedia = request.ContactData.SocialMedia,
            PixelsPerModule = request.ContactData.PixelsPerModule,
            DarkColor = request.ContactData.DarkColor,
            LightColor = request.ContactData.LightColor,
            ErrorCorrectionLevel = request.ContactData.ErrorCorrectionLevel,
            LogoBase64 = request.ContactData.LogoBase64,
            LogoSizeRatio = request.ContactData.LogoSizeRatio,
            RetentionPeriod = request.ContactData.RetentionPeriod,
            AccessCodeHash = hash,
            AccessCodeSalt = salt,
            DeleteToken = deleteToken,
            ExpiresAt = expiresAt?.ToString("O"),
            CreatedAt = DateTimeOffset.UtcNow.ToString("O"),
            Version = 1
        };

        await _blobService.SaveAsync(fileName, document);

        if (expiresAt.HasValue)
        {
            await _blobService.SetTagsAsync(fileName, new Dictionary<string, string>
            {
                ["expiresAt"] = expiresAt.Value.ToString("O")
            });
        }

        return Ok(new SaveResponse
        {
            Success = true,
            FileName = fileName,
            DeleteToken = deleteToken,
            ViewUrl = $"/view/{fileName}"
        });
    }

    /// <summary>
    /// GET /api/blob/read/{filename}
    /// Returns contact data for read-only view (no authentication required).
    /// Excludes security fields (accessCodeHash, accessCodeSalt, deleteToken).
    /// </summary>
    [HttpGet("read/{filename}")]
    [ProducesResponseType(typeof(ReadContactResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Read(string filename)
    {
        var document = await _blobService.ReadAsync(filename);
        if (document == null)
        {
            return NotFound(new ReadContactResponse
            {
                Success = false,
                ErrorMessage = "This contact card is no longer available."
            });
        }

        if (!string.IsNullOrEmpty(document.ExpiresAt) &&
            DateTimeOffset.TryParse(document.ExpiresAt, out var expiry) &&
            expiry < DateTimeOffset.UtcNow)
        {
            return NotFound(new ReadContactResponse
            {
                Success = false,
                ErrorMessage = "This contact card is no longer available."
            });
        }

        return Ok(new ReadContactResponse
        {
            Success = true,
            ContactData = new ContactDataPayload
            {
                FirstName = document.FirstName,
                LastName = document.LastName,
                Phone = document.Phone,
                Email = document.Email,
                Organisation = document.Organisation,
                JobTitle = document.JobTitle,
                Website = document.Website,
                PhotoBase64 = document.PhotoBase64,
                SocialMedia = document.SocialMedia,
                PixelsPerModule = document.PixelsPerModule,
                DarkColor = document.DarkColor,
                LightColor = document.LightColor,
                ErrorCorrectionLevel = document.ErrorCorrectionLevel,
                LogoBase64 = document.LogoBase64,
                LogoSizeRatio = document.LogoSizeRatio,
                RetentionPeriod = document.RetentionPeriod
            }
        });
    }

    /// <summary>
    /// POST /api/blob/verify
    /// Verifies access code and returns contact data if correct.
    /// </summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyCodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Verify([FromBody] VerifyCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new VerifyCodeResponse
            {
                Success = false,
                ErrorMessage = string.Join(" ", errors)
            });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var rateLimitKey = $"{ip}:{request.FileName}";

        if (_rateLimitService.IsRateLimited(rateLimitKey))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new VerifyCodeResponse
            {
                Success = false,
                ErrorMessage = "Too many attempts. Please wait and try again."
            });
        }

        var document = await _blobService.ReadAsync(request.FileName);
        if (document == null)
        {
            return NotFound(new VerifyCodeResponse
            {
                Success = false,
                ErrorMessage = "Contact not found or has expired."
            });
        }

        if (!string.IsNullOrEmpty(document.ExpiresAt) &&
            DateTimeOffset.TryParse(document.ExpiresAt, out var expiry) &&
            expiry < DateTimeOffset.UtcNow)
        {
            return NotFound(new VerifyCodeResponse
            {
                Success = false,
                ErrorMessage = "This contact link has expired."
            });
        }

        if (!_accessCodeService.VerifyCode(request.AccessCode, document.AccessCodeHash, document.AccessCodeSalt))
        {
            _rateLimitService.RecordFailedAttempt(rateLimitKey);
            return Ok(new VerifyCodeResponse
            {
                Success = false,
                ErrorMessage = "Incorrect access code."
            });
        }

        return Ok(new VerifyCodeResponse
        {
            Success = true,
            DeleteToken = document.DeleteToken,
            ContactData = new ContactDataPayload
            {
                FirstName = document.FirstName,
                LastName = document.LastName,
                Phone = document.Phone,
                Email = document.Email,
                Organisation = document.Organisation,
                JobTitle = document.JobTitle,
                Website = document.Website,
                PhotoBase64 = document.PhotoBase64,
                SocialMedia = document.SocialMedia,
                PixelsPerModule = document.PixelsPerModule,
                DarkColor = document.DarkColor,
                LightColor = document.LightColor,
                ErrorCorrectionLevel = document.ErrorCorrectionLevel,
                LogoBase64 = document.LogoBase64,
                LogoSizeRatio = document.LogoSizeRatio,
                RetentionPeriod = document.RetentionPeriod
            }
        });
    }

    /// <summary>
    /// POST /api/blob/change-code
    /// Changes the access code for a stored contact.
    /// </summary>
    [HttpPost("change-code")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeCode([FromBody] ChangeCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new { success = false, errorMessage = string.Join(" ", errors) });
        }

        var document = await _blobService.ReadAsync(request.FileName);
        if (document == null)
        {
            return NotFound(new { success = false, errorMessage = "Contact not found." });
        }

        if (!_accessCodeService.VerifyCode(request.CurrentCode, document.AccessCodeHash, document.AccessCodeSalt))
        {
            return Ok(new { success = false, errorMessage = "Current access code is incorrect." });
        }

        var (newHash, newSalt) = _accessCodeService.HashCode(request.NewCode);
        document.AccessCodeHash = newHash;
        document.AccessCodeSalt = newSalt;

        await _blobService.UpdateAsync(request.FileName, document);

        return Ok(new { success = true });
    }

    /// <summary>
    /// DELETE /api/blob/{filename}
    /// Deletes a stored contact using the delete token.
    /// </summary>
    [HttpDelete("{filename}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string filename, [FromBody] DeleteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { success = false, errorMessage = "Delete token is required." });
        }

        var document = await _blobService.ReadAsync(filename);
        if (document == null)
        {
            return NotFound(new { success = false, errorMessage = "Contact not found." });
        }

        if (!CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(request.DeleteToken),
                System.Text.Encoding.UTF8.GetBytes(document.DeleteToken)))
        {
            return BadRequest(new { success = false, errorMessage = "Invalid delete token." });
        }

        var deleted = await _blobService.DeleteAsync(filename);
        return Ok(new { success = deleted });
    }

    /// <summary>
    /// POST /api/blob/find
    /// Finds a contact by name prefix and verifies the access code.
    /// </summary>
    [HttpPost("find")]
    [ProducesResponseType(typeof(FindByNameResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Find([FromBody] FindByNameRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new FindByNameResponse
            {
                Success = false,
                ErrorMessage = string.Join(" ", errors)
            });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var rateLimitKey = $"{ip}:find:{request.FirstName}-{request.LastName}";

        if (_rateLimitService.IsRateLimited(rateLimitKey))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new FindByNameResponse
            {
                Success = false,
                ErrorMessage = "Too many attempts. Please wait and try again."
            });
        }

        var candidates = await _blobService.FindByNamePrefixAsync(request.FirstName, request.LastName);

        foreach (var (fileName, document) in candidates)
        {
            if (_accessCodeService.VerifyCode(request.AccessCode, document.AccessCodeHash, document.AccessCodeSalt))
            {
                return Ok(new FindByNameResponse
                {
                    Success = true,
                    FileName = fileName,
                    DeleteToken = document.DeleteToken,
                    ContactData = new ContactDataPayload
                    {
                        FirstName = document.FirstName,
                        LastName = document.LastName,
                        Phone = document.Phone,
                        Email = document.Email,
                        Organisation = document.Organisation,
                        JobTitle = document.JobTitle,
                        Website = document.Website,
                        PhotoBase64 = document.PhotoBase64,
                        SocialMedia = document.SocialMedia,
                        PixelsPerModule = document.PixelsPerModule,
                        DarkColor = document.DarkColor,
                        LightColor = document.LightColor,
                        ErrorCorrectionLevel = document.ErrorCorrectionLevel,
                        LogoBase64 = document.LogoBase64,
                        LogoSizeRatio = document.LogoSizeRatio,
                        RetentionPeriod = document.RetentionPeriod
                    }
                });
            }
        }

        _rateLimitService.RecordFailedAttempt(rateLimitKey);

        return Ok(new FindByNameResponse
        {
            Success = false,
            ErrorMessage = "No matching contact found or incorrect access code."
        });
    }

    private static DateTimeOffset? CalculateExpiry(string retentionPeriod)
    {
        return retentionPeriod switch
        {
            "1d" => DateTimeOffset.UtcNow.AddDays(1),
            "7d" => DateTimeOffset.UtcNow.AddDays(7),
            "1m" => DateTimeOffset.UtcNow.AddMonths(1),
            "1y" => DateTimeOffset.UtcNow.AddYears(1),
            "forever" => null,
            _ => DateTimeOffset.UtcNow.AddDays(7)
        };
    }
}
