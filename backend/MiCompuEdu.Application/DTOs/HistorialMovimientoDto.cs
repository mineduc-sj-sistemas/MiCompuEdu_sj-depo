using System;

namespace MiCompuEdu.Application.DTOs
{
    public class HistorialMovimientoDto
    {
        public Guid Id { get; set; }
        public Guid ReparacionId { get; set; }
        public string? EstadoAnterior { get; set; }
        public string EstadoNuevo { get; set; } = string.Empty;
        public Guid UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public DateTime FechaMovimiento { get; set; }
    }
}
