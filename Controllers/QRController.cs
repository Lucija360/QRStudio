using Microsoft.AspNetCore.Mvc;
using QRStudio.Models;
using QRStudio.Services;

namespace QRStudio.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QRController : ControllerBase
{
    private readonly IQRCodeService _qrService;

    public QRController(IQRCodeService qrService)
    {
        _qrService = qrService;
    }

    /// <summary>
    /// POST /api/qr/generate
    /// Accepts JSON body matching QRGenerateRequest.
    /// Returns PNG as base64 JSON response.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(QRGenerateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Generate([FromBody] QRGenerateRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(new QRGenerateResponse
            {
                Success = false,
                ErrorMessage = string.Join(" ", errors)
            });
        }

        var result = await _qrService.GenerateAsync(request);

        if (!result.Success)
            return UnprocessableEntity(result);

        return Ok(result);
    }
}
