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
