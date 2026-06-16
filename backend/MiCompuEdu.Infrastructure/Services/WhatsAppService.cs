using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MiCompuEdu.Infrastructure.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public WhatsAppService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        public async Task<bool> SendNotificationAsync(string phoneNumber, string message)
        {
            try
            {
                var apiUrl = _configuration["WhatsApp:ApiUrl"] ?? "https://graph.facebook.com/v19.0";
                var phoneNumberId = _configuration["WhatsApp:PhoneNumberId"];
                var accessToken = _configuration["WhatsApp:AccessToken"];
                var templateName = _configuration["WhatsApp:TemplateName"];

                // Si no están configuradas las credenciales obligatorias, simulamos éxito (modo debug local)
                if (string.IsNullOrEmpty(phoneNumberId) || string.IsNullOrEmpty(accessToken))
                {
                    Console.WriteLine($"[WhatsApp Simulator] Envío a {phoneNumber}: {message}");
                    return true;
                }

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                string requestUrl = $"{apiUrl}/{phoneNumberId}/messages";

                // En una cuenta de producción, se suele requerir el uso de plantillas pre-aprobadas.
                // Si se configuró un nombre de plantilla en appsettings.json, usamos la estructura de plantilla.
                // En caso contrario, enviamos un mensaje de texto plano directo (válido para sandbox interactivos).
                object payload;
                if (!string.IsNullOrEmpty(templateName))
                {
                    payload = new
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
                    };
                }
                else
                {
                    payload = new
                    {
                        messaging_product = "whatsapp",
                        recipient_type = "individual",
                        to = phoneNumber,
                        type = "text",
                        text = new { preview_url = false, body = message }
                    };
                }

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(requestUrl, content);
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                var errorResponse = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[WhatsApp API Error] {errorResponse}");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WhatsApp Exception] {ex.Message}");
                return false;
            }
        }
    }
}
