using System.Security.Cryptography;

namespace QRStudio.Services;

public sealed class AccessCodeService : IAccessCodeService
{
    public (string hash, string salt) HashCode(string accessCode)
    {
        var saltBytes = GenerateSalt();
        var saltBase64 = Convert.ToBase64String(saltBytes);
        var hash = ComputeHash(accessCode, saltBytes);
        return (hash, saltBase64);
    }

    public bool VerifyCode(string accessCode, string storedHash, string storedSalt)
    {
        var saltBytes = Convert.FromBase64String(storedSalt);
        var computedHash = ComputeHash(accessCode, saltBytes);

        return CryptographicOperations.FixedTimeEquals(
            Convert.FromBase64String(computedHash),
            Convert.FromBase64String(storedHash));
    }

    public byte[] GenerateSalt()
    {
        return RandomNumberGenerator.GetBytes(16);
    }

    private static string ComputeHash(string accessCode, byte[] salt)
    {
        var codeBytes = System.Text.Encoding.UTF8.GetBytes(accessCode);
        var combined = new byte[salt.Length + codeBytes.Length];
        Buffer.BlockCopy(salt, 0, combined, 0, salt.Length);
        Buffer.BlockCopy(codeBytes, 0, combined, salt.Length, codeBytes.Length);

        var hashBytes = SHA256.HashData(combined);
        return Convert.ToBase64String(hashBytes);
    }
}
