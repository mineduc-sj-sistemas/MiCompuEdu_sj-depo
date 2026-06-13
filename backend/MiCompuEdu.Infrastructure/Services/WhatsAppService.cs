using System;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;

namespace MiCompuEdu.Infrastructure.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        public async Task<bool> SendNotificationAsync(string telefono, string mensaje)
        {
            // En producción, se usaría HttpClient enviando un POST JSON
            // al endpoint de Meta Cloud API: https://graph.facebook.com/v18.0/{phone_id}/messages
            
            Console.WriteLine($"[WHATSAPP SERVICE API] Destinatario: {telefono}");
            Console.WriteLine($"[WHATSAPP SERVICE API] Cuerpo: {mensaje}");
            
            await Task.Delay(300);
            
            return true;
        }
    }
}
