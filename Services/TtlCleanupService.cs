using Azure.Storage.Blobs;

namespace QRStudio.Services;

public sealed class TtlCleanupService : IHostedService, IDisposable
{
    private readonly BlobContainerClient _container;
    private readonly ILogger<TtlCleanupService> _logger;
    private readonly int _intervalMinutes;
    private readonly bool _enabled;
    private PeriodicTimer? _timer;
    private Task? _executingTask;
    private CancellationTokenSource? _cts;

    public TtlCleanupService(BlobContainerClient container, IConfiguration configuration, ILogger<TtlCleanupService> logger)
    {
        _container = container;
        _logger = logger;
        _intervalMinutes = configuration.GetValue("TtlCleanup:IntervalMinutes", 60);
        _enabled = configuration.GetValue("TtlCleanup:Enabled", true);
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_enabled)
        {
            _logger.LogInformation("TTL cleanup service is disabled");
            return Task.CompletedTask;
        }

        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _timer = new PeriodicTimer(TimeSpan.FromMinutes(_intervalMinutes));
        _executingTask = RunCleanupLoopAsync(_cts.Token);

        _logger.LogInformation("TTL cleanup service started with interval {Interval} minutes", _intervalMinutes);
        return Task.CompletedTask;
    }

    private async Task RunCleanupLoopAsync(CancellationToken stoppingToken)
    {
        while (await _timer!.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await CleanExpiredBlobsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during TTL cleanup");
            }
        }
    }

    private async Task CleanExpiredBlobsAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var deleted = 0;

        await foreach (var blob in _container.GetBlobsAsync(
            traits: Azure.Storage.Blobs.Models.BlobTraits.Tags,
            states: Azure.Storage.Blobs.Models.BlobStates.None,
            prefix: null,
            cancellationToken: cancellationToken))
        {
            if (blob.Tags != null &&
                blob.Tags.TryGetValue("expiresAt", out var expiresAtStr) &&
                DateTimeOffset.TryParse(expiresAtStr, out var expiresAt) &&
                expiresAt < now)
            {
                var client = _container.GetBlobClient(blob.Name);
                await client.DeleteIfExistsAsync(cancellationToken: cancellationToken);
                deleted++;
                _logger.LogDebug("Deleted expired blob: {BlobName}", blob.Name);
            }
        }

        if (deleted > 0)
            _logger.LogInformation("TTL cleanup deleted {Count} expired blob(s)", deleted);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_executingTask == null)
            return;

        _cts?.Cancel();
        _timer?.Dispose();

        await Task.WhenAny(_executingTask, Task.Delay(Timeout.Infinite, cancellationToken));
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _timer?.Dispose();
        _cts?.Dispose();
    }
}
