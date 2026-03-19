using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using QRStudio.Models;
using QRStudio.Services;

namespace QRStudio.Controllers;

public class HomeController : Controller
{
    private readonly IQRCodeService _qrService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(IQRCodeService qrService, ILogger<HomeController> logger)
    {
        _qrService = qrService;
        _logger    = logger;
    }

    [HttpGet]
    public IActionResult Index() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() =>
        View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
