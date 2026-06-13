using System;

namespace MiCompuEdu.Application.DTOs
{
    public class ReparacionDto
    {
        public Guid Id { get; set; }
        public Guid EquipoId { get; set; }
        public string NumeroSerie { get; set; } = string.Empty;
        public string MarcaModelo { get; set; } = string.Empty;
        public string NombreTutor { get; set; } = string.Empty;
        public string TelefonoTutor { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string FallaReportada { get; set; } = string.Empty;
        public string? Diagnostico { get; set; }
        public string? AccionesRealizadas { get; set; }
        public string? Observaciones { get; set; }
        public string? ComprobanteUrl { get; set; }
        public DateTime FechaIngreso { get; set; }
        public DateTime? FechaEntrega { get; set; }
    }
}
