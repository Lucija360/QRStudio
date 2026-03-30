using QRStudio.Models;

namespace QRStudio.Services;

public interface IBlobStorageService
{
    Task<string> SaveAsync(string fileName, BlobJsonDocument document);
    Task<BlobJsonDocument?> ReadAsync(string fileName);
    Task UpdateAsync(string fileName, BlobJsonDocument document);
    Task ResetTtlAsync(string fileName, DateTimeOffset newExpiry);
    Task<bool> DeleteAsync(string fileName);
    Task<bool> ExistsAsync(string fileName);
    Task<string> GenerateFileName(string firstName, string lastName);
    Task SetTagsAsync(string fileName, IDictionary<string, string> tags);
}
