using QRCoder;
using QRStudio.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace QRStudio.Services;

public sealed class QRCodeService : IQRCodeService
{
    private readonly ILogger<QRCodeService> _logger;

    public QRCodeService(ILogger<QRCodeService> logger)
    {
        _logger = logger;
    }

    public async Task<QRGenerateResponse> GenerateAsync(QRGenerateRequest request)
    {
        try
        {
            var ecLevel = ParseEcLevel(request.ErrorCorrectionLevel);

            // Generate raw QR bitmap
            using var qrGenerator = new QRCodeGenerator();
            using var qrData      = qrGenerator.CreateQrCode(request.Content, ecLevel);
            using var qrCode      = new PngByteQRCode(qrData);

            var darkRgba  = HexToRgba(request.DarkColor);
            var lightRgba = HexToRgba(request.LightColor);

            byte[] qrBytes = qrCode.GetGraphic(
                pixelsPerModule: request.PixelsPerModule,
                darkColorRgba:   darkRgba,
                lightColorRgba:  lightRgba,
                drawQuietZones:  true);

            // Load into ImageSharp 
            using var qrImage = Image.Load<Rgba32>(qrBytes);

            // Composite logo if provided
            if (!string.IsNullOrWhiteSpace(request.LogoBase64))
            {
                await CompositeLogoAsync(qrImage, request.LogoBase64, request.LogoSizeRatio);
            }

            // Encode to PNG
            using var ms = new MemoryStream();
            await qrImage.SaveAsync(ms, new PngEncoder());
            var base64 = Convert.ToBase64String(ms.ToArray());

            return new QRGenerateResponse { Success = true, ImageBase64 = base64 };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "QR generation failed for content: {Content}", request.Content);
            return new QRGenerateResponse
            {
                Success = false,
                ErrorMessage = "Failed to generate QR code. Please check your input and try again."
            };
        }
    }

    #region Private Helepers

    private async Task<string?> GenerateQRBase64(string content, ContactQRRequest request)
    {
        var qrRequest = new QRGenerateRequest
        {
            Content = content,
            PixelsPerModule = request.PixelsPerModule,
            DarkColor = request.DarkColor,
            LightColor = request.LightColor,
            ErrorCorrectionLevel = request.ErrorCorrectionLevel,
            LogoBase64 = request.LogoBase64,
            LogoSizeRatio = request.LogoSizeRatio
        };

        var result = await GenerateAsync(qrRequest);
        return result.Success ? result.ImageBase64 : null;
    }

    public async Task<ContactQRResponse> GenerateContactAsync(ContactQRRequest request)
    {
        try
        {
            // Build vCard string
            var vcard = BuildVCard(request);
            var vcardImage = await GenerateQRBase64(vcard, request);

            if (vcardImage == null)
            {
                return new ContactQRResponse
                {
                    Success = false,
                    ErrorMessage = "Failed to generate vCard QR code."
                };
            }

            // Generate social media QR codes
            var socialResults = new List<SocialMediaQRResult>();
            foreach (var entry in request.SocialMedia)
            {
                if (!entry.Enabled || string.IsNullOrWhiteSpace(entry.Url))
                    continue;

                var url = entry.Url.Trim();
                if (!url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                    !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    url = "https://" + url;
                }

                var image = await GenerateQRBase64(url, request);
                if (image != null)
                {
                    socialResults.Add(new SocialMediaQRResult
                    {
                        Platform = entry.Platform,
                        ImageBase64 = image,
                        Url = url
                    });
                }
            }

            return new ContactQRResponse
            {
                Success = true,
                VCardImageBase64 = vcardImage,
                SocialMediaQRCodes = socialResults.ToArray()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Contact QR generation failed");
            return new ContactQRResponse
            {
                Success = false,
                ErrorMessage = "Failed to generate contact QR codes. Please check your input and try again."
            };
        }
    }

    private static string BuildVCard(ContactQRRequest request)
    {
        var lines = new List<string>
        {
            "BEGIN:VCARD",
            "VERSION:3.0",
            $"N:{EscapeVCard(request.LastName)};{EscapeVCard(request.FirstName)};;;",
            $"FN:{EscapeVCard($"{request.FirstName} {request.LastName}".Trim())}"
        };

        if (!string.IsNullOrWhiteSpace(request.Phone))
            lines.Add($"TEL;TYPE=CELL:{EscapeVCard(request.Phone)}");
        if (!string.IsNullOrWhiteSpace(request.Email))
            lines.Add($"EMAIL:{EscapeVCard(request.Email)}");
        if (!string.IsNullOrWhiteSpace(request.Organisation))
            lines.Add($"ORG:{EscapeVCard(request.Organisation)}");
        if (!string.IsNullOrWhiteSpace(request.JobTitle))
            lines.Add($"TITLE:{EscapeVCard(request.JobTitle)}");
        if (!string.IsNullOrWhiteSpace(request.Website))
            lines.Add($"URL:{EscapeVCard(request.Website)}");
        if (!string.IsNullOrWhiteSpace(request.PhotoBase64))
        {
            var photoData = request.PhotoBase64.Contains(',')
                ? request.PhotoBase64.Split(',')[1]
                : request.PhotoBase64;
            lines.Add($"PHOTO;ENCODING=b;TYPE=JPEG:{photoData}");
        }

        lines.Add("END:VCARD");
        return string.Join("\r\n", lines);
    }

    private static string EscapeVCard(string value)
    {
        return value
            .Replace("\\", "\\\\")
            .Replace(";", "\\;")
            .Replace(",", "\\,")
            .Replace("\n", "\\n");
    }

    private static async Task CompositeLogoAsync(
        Image<Rgba32> qrImage,
        string logoBase64,
        double logoSizeRatio)
    {
        // Strip potential data-URI prefix 
        var base64Data = logoBase64.Contains(',')
            ? logoBase64.Split(',')[1]
            : logoBase64;

        byte[] logoBytes = Convert.FromBase64String(base64Data);

        using var logoImage = Image.Load<Rgba32>(logoBytes);

        // Compute target logo dimensions
        int maxLogoSize = (int)(Math.Min(qrImage.Width, qrImage.Height) * logoSizeRatio);
        int logoW = maxLogoSize;
        int logoH = maxLogoSize;

        double aspectRatio = (double)logoImage.Width / logoImage.Height;
        if (aspectRatio > 1)
            logoH = (int)(logoW / aspectRatio);
        else
            logoW = (int)(logoH * aspectRatio);

        logoImage.Mutate(ctx => ctx.Resize(logoW, logoH));

        // Draw white backing behind the logo
        int padding = Math.Max(4, (int)(maxLogoSize * 0.12));
        int bgW     = logoW + padding * 2;
        int bgH     = logoH + padding * 2;
        int bgX     = (qrImage.Width  - bgW) / 2;
        int bgY     = (qrImage.Height - bgH) / 2;

        var backingRect = new RectangularPolygon(bgX, bgY, bgW, bgH);

        qrImage.Mutate(ctx =>
        {
            ctx.Fill(Color.White, backingRect);

            int logoX = (qrImage.Width  - logoW) / 2;
            int logoY = (qrImage.Height - logoH) / 2;
            ctx.DrawImage(logoImage, new Point(logoX, logoY), opacity: 1f);
        });

        await Task.CompletedTask;
    }

    private static QRCodeGenerator.ECCLevel ParseEcLevel(string level) =>
        level.ToUpperInvariant() switch
        {
            "L" => QRCodeGenerator.ECCLevel.L,
            "M" => QRCodeGenerator.ECCLevel.M,
            "Q" => QRCodeGenerator.ECCLevel.Q,
            _   => QRCodeGenerator.ECCLevel.H
        };

    /// <summary>Converts a hex color string (#RRGGBB or #RRGGBBAA) to a 4-byte RGBA array.</summary>
    private static byte[] HexToRgba(string hex)
    {
        hex = hex.TrimStart('#');
        if (hex.Length == 6) hex += "FF"; 
        return
        [
            Convert.ToByte(hex[0..2], 16),
            Convert.ToByte(hex[2..4], 16),
            Convert.ToByte(hex[4..6], 16),
            Convert.ToByte(hex[6..8], 16),
        ];
    }

    #endregion
}
