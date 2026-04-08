using Microsoft.AspNetCore.Mvc;

namespace QRStudio.Controllers;

[Route("view")]
public class ViewController : Controller
{
    [HttpGet("{slug}")]
    public IActionResult Index(string slug)
    {
        ViewBag.Slug = slug;
        return View();
    }
}
