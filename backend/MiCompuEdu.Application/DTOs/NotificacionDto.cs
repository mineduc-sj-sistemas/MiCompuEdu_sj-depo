using System;

namespace MiCompuEdu.Application.DTOs
{
    public class NotificacionDto
    {
        public Guid Id { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Destinatario { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public DateTime? FechaEnvio { get; set; }
        public string? ErrorMensaje { get; set; }
        public int Reintentos { get; set; }
        public DateTime CreadoEn { get; set; }
    }
}
