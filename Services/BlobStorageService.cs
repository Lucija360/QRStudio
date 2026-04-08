using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using QRStudio.Models;

namespace QRStudio.Services;

public sealed partial class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;
    private readonly ILogger<BlobStorageService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public BlobStorageService(BlobContainerClient container, ILogger<BlobStorageService> logger)
    {
        _container = container;
        _logger = logger;
    }

    public async Task<string> SaveAsync(string fileName, BlobJsonDocument document)
    {
        await _container.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var json = JsonSerializer.Serialize(document, JsonOptions);
        var blob = _container.GetBlobClient(fileName);

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = "application/json" });

        return fileName;
    }

    public async Task<BlobJsonDocument?> ReadAsync(string fileName)
    {
        var blob = _container.GetBlobClient(fileName);

        if (!await blob.ExistsAsync())
            return null;

        var response = await blob.DownloadContentAsync();
        var json = response.Value.Content.ToString();
        return JsonSerializer.Deserialize<BlobJsonDocument>(json, JsonOptions);
    }

    public async Task<bool> DeleteAsync(string fileName)
    {
        var blob = _container.GetBlobClient(fileName);
        var response = await blob.DeleteIfExistsAsync();
        return response.Value;
    }

    public async Task UpdateAsync(string fileName, BlobJsonDocument document)
    {
        var json = JsonSerializer.Serialize(document, JsonOptions);
        var blob = _container.GetBlobClient(fileName);

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        await blob.UploadAsync(stream, overwrite: true);
    }

    public async Task ResetTtlAsync(string fileName, DateTimeOffset newExpiry)
    {
        var blob = _container.GetBlobClient(fileName);
        await blob.SetTagsAsync(new Dictionary<string, string>
        {
            ["expiresAt"] = newExpiry.ToString("O")
        });
    }

    public async Task<bool> ExistsAsync(string fileName)
    {
        var blob = _container.GetBlobClient(fileName);
        return await blob.ExistsAsync();
    }

    public async Task<string> GenerateFileName(string firstName, string lastName)
    {
        var name = $"{firstName}-{lastName}".ToLowerInvariant();
        name = SanitizeRegex().Replace(name, "");
        name = MultipleDashRegex().Replace(name, "-").Trim('-');

        if (string.IsNullOrEmpty(name))
            name = "contact";

        // Append 4-char random suffix
        var suffix = GenerateRandomSuffix(4);
        var candidate = $"{name}-{suffix}.json";

        // Sequential index on collision
        var index = 1;
        while (await ExistsAsync(candidate))
        {
            candidate = $"{name}-{suffix}-{index}.json";
            index++;
        }

        return candidate;
    }

    public async Task SetTagsAsync(string fileName, IDictionary<string, string> tags)
    {
        var blob = _container.GetBlobClient(fileName);
        await blob.SetTagsAsync(tags);
    }

    public async Task<IReadOnlyList<(string FileName, BlobJsonDocument Document)>> FindByNamePrefixAsync(string firstName, string lastName)
    {
        var name = $"{firstName}-{lastName}-".ToLowerInvariant();
        name = SanitizeRegex().Replace(name, "");
        name = MultipleDashRegex().Replace(name, "-").TrimStart('-');

        if (string.IsNullOrEmpty(name) || name == "-")
            return [];

        var results = new List<(string, BlobJsonDocument)>();

        await foreach (var blobItem in _container.GetBlobsAsync(BlobTraits.None, BlobStates.None, name, default))
        {
            try
            {
                var doc = await ReadAsync(blobItem.Name);
                if (doc == null) continue;

                // Filter out expired entries
                if (!string.IsNullOrEmpty(doc.ExpiresAt) &&
                    DateTimeOffset.TryParse(doc.ExpiresAt, out var expiry) &&
                    expiry < DateTimeOffset.UtcNow)
                {
                    continue;
                }

                results.Add((blobItem.Name, doc));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read blob {BlobName} during prefix search", blobItem.Name);
            }
        }

        return results;
    }

    private static string GenerateRandomSuffix(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var sb = new StringBuilder(length);
        foreach (var b in bytes)
            sb.Append(chars[b % chars.Length]);
        return sb.ToString();
    }

    [GeneratedRegex("[^a-z0-9-]")]
    private static partial Regex SanitizeRegex();

    [GeneratedRegex("-{2,}")]
    private static partial Regex MultipleDashRegex();
}
