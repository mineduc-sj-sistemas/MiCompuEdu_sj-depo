using System;
using MiCompuEdu.Domain.Common;
using MiCompuEdu.Domain.Enums;

namespace MiCompuEdu.Domain.Entities
{
    public class Notificacion : BaseEntity
    {
        public Guid ReparacionId { get; set; }
        public Reparacion Reparacion { get; set; } = null!;

        public TipoNotificacion Tipo { get; set; }
        public string Destinatario { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public EstadoNotificacion Estado { get; set; } = EstadoNotificacion.Pendiente;

        public DateTime? FechaEnvio { get; set; }
        public string? ErrorMensaje { get; set; }

        public int Reintentos { get; set; } = 0;
        public DateTime? ProximoIntento { get; set; }
    }
}
