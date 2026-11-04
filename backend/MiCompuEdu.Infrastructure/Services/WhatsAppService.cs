using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Common.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MiCompuEdu.Infrastructure.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly WhatsAppOptions _options;
        private readonly ILogger<WhatsAppService> _logger;

        public WhatsAppService(
            HttpClient httpClient,
            IOptions<WhatsAppOptions> options,
            ILogger<WhatsAppService> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<bool> SendNotificationAsync(string phoneNumber, string message)
        {
            try
            {
                var apiUrl = _options.ApiUrl;
                var phoneNumberId = _options.PhoneNumberId;
                var accessToken = _options.AccessToken;
                var templateName = _options.TemplateName;

                if (string.IsNullOrEmpty(phoneNumberId) || string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogInformation("WhatsApp en modo simulador local. Destino configurado: {HasPhone}", !string.IsNullOrWhiteSpace(phoneNumber));
                    return true;
                }

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                string requestUrl = $"{apiUrl}/{phoneNumberId}/messages";

                object payload = !string.IsNullOrEmpty(templateName)
                    ? new
                    {
                        messaging_product = "whatsapp",
                        to = phoneNumber,
                        type = "template",
                        template = new
                        {
                            name = templateName,
                            language = new { code = "es_AR" },
                            components = new[]
                            {
                                new
                                {
                                    type = "body",
                                    parameters = new[]
                                    {
                                        new { type = "text", text = message }
                                    }
                                }
                            }
                        }
                    }
                    : new
                    {
                        messaging_product = "whatsapp",
                        recipient_type = "individual",
                        to = phoneNumber,
                        type = "text",
                        text = new { preview_url = false, body = message }
                    };

                var json = JsonSerializer.Serialize(payload);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Política de resiliencia con hasta 2 reintentos ante fallos transitorios
                for (int attempt = 1; attempt <= 2; attempt++)
                {
                    var response = await _httpClient.PostAsync(requestUrl, content);
                    if (response.IsSuccessStatusCode)
                    {
                        return true;
                    }

                    if ((int)response.StatusCode >= 500 && attempt < 2)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(1));
                        continue;
                    }

                    _logger.LogWarning("WhatsApp API devolvió código HTTP {StatusCode} en intento {Attempt}", (int)response.StatusCode, attempt);
                    return false;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excepción al enviar notificación por WhatsApp API");
                return false;
            }
        }
    }
}
