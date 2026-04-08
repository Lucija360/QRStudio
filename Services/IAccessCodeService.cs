namespace QRStudio.Services;

public interface IAccessCodeService
{
    (string hash, string salt) HashCode(string accessCode);
    bool VerifyCode(string accessCode, string storedHash, string storedSalt);
    byte[] GenerateSalt();
}
