namespace QRStudio.Services;

public interface IRateLimitService
{
    bool IsRateLimited(string key);
    void RecordFailedAttempt(string key);
}
