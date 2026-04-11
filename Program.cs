using Azure.Storage.Blobs;
using Microsoft.AspNetCore.RateLimiting;
using QRStudio.Services;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("qr-api", o =>
    {
        o.PermitLimit = 20;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
builder.Services.AddSingleton<IAccessCodeService, AccessCodeService>();
builder.Services.AddSingleton<IRateLimitService, RateLimitService>();

var blobConnectionString = builder.Configuration["BlobStorage:ConnectionString"];
var blobContainerName = builder.Configuration["BlobStorage:ContainerName"] ?? "qrstudio-contacts";

if (!string.IsNullOrWhiteSpace(blobConnectionString))
{
    builder.Services.AddSingleton(_ => new BlobServiceClient(blobConnectionString));
    builder.Services.AddSingleton(sp =>
    {
        var blobServiceClient = sp.GetRequiredService<BlobServiceClient>();
        return blobServiceClient.GetBlobContainerClient(blobContainerName);
    });
    builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
    builder.Services.AddHostedService<TtlCleanupService>();
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
