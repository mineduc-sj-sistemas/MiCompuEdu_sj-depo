using System;
using MiCompuEdu.Domain.Common;
using MiCompuEdu.Domain.Enums;

namespace MiCompuEdu.Domain.Entities
{
    public class HistorialMovimiento : BaseEntity
    {
        public Guid ReparacionId { get; set; }
        public Reparacion Reparacion { get; set; } = null!;

        public EstadoEquipo? EstadoAnterior { get; set; }
        public EstadoEquipo EstadoNuevo { get; set; }

        public Guid UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public string? Observaciones { get; set; }
        public DateTime FechaMovimiento { get; set; } = DateTime.UtcNow;
    }
}
