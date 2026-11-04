namespace MiCompuEdu.Application.Common.Options
{
    public class JwtOptions
    {
        public const string SectionName = "Jwt";
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = "MiCompuEdu_Issuer";
        public string Audience { get; set; } = "MiCompuEdu_Audience";
        public int ExpirationHours { get; set; } = 8;
    }

    public class WhatsAppOptions
    {
        public const string SectionName = "WhatsApp";
        public string ApiUrl { get; set; } = "https://graph.facebook.com/v19.0";
        public string PhoneNumberId { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string? TemplateName { get; set; }
    }
}
