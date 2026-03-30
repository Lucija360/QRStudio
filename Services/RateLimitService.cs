using System.Collections.Concurrent;

namespace QRStudio.Services;

public sealed class RateLimitService : IRateLimitService
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan Window = TimeSpan.FromSeconds(60);

    private readonly ConcurrentDictionary<string, List<DateTimeOffset>> _attempts = new();

    public bool IsRateLimited(string key)
    {
        if (!_attempts.TryGetValue(key, out var timestamps))
            return false;

        var cutoff = DateTimeOffset.UtcNow - Window;
        lock (timestamps)
        {
            timestamps.RemoveAll(t => t < cutoff);
            return timestamps.Count >= MaxAttempts;
        }
    }

    public void RecordFailedAttempt(string key)
    {
        var timestamps = _attempts.GetOrAdd(key, _ => new List<DateTimeOffset>());
        var cutoff = DateTimeOffset.UtcNow - Window;
        lock (timestamps)
        {
            timestamps.RemoveAll(t => t < cutoff);
            timestamps.Add(DateTimeOffset.UtcNow);
        }
    }
}
