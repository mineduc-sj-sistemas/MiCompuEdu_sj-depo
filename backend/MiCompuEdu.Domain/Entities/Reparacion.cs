using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;
using MiCompuEdu.Domain.Enums;

namespace MiCompuEdu.Domain.Entities
{
    public class Reparacion : BaseEntity
    {
        public Guid EquipoId { get; set; }
        public Equipo Equipo { get; set; } = null!;

        public Guid OperadorIngresoId { get; set; }
        public Usuario OperadorIngreso { get; set; } = null!;

        public Guid? TecnicoAsignadoId { get; set; }
        public Usuario? TecnicoAsignado { get; set; }

        public EstadoEquipo Estado { get; set; } = EstadoEquipo.Ingresado;
        public string FallaReportada { get; set; } = string.Empty;

        public int? FallaCatalogoId { get; set; }
        public FallaCatalogo? FallaCatalogo { get; set; }

        public Guid? UbicacionDepositoId { get; set; }
        public UbicacionDeposito? UbicacionDeposito { get; set; }

        public string? Diagnostico { get; set; }
        public string? AccionesRealizadas { get; set; }
        public string? Observaciones { get; set; }
        public string? ComprobanteUrl { get; set; }

        public string? ProveedorGarantia { get; set; }
        public string? RemitoGarantia { get; set; }
        public DateTime? FechaEsperadaGarantia { get; set; }

        public string? FirmaIngresoBase64 { get; set; }
        public string? FirmaEntregaBase64 { get; set; }

        public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
        public DateTime? FechaLimite { get; set; }
        public DateTime? FechaEntrega { get; set; }

        // Propiedades de navegación
        public ICollection<HistorialMovimiento> HistorialMovimientos { get; set; } = new List<HistorialMovimiento>();
        public ICollection<EvidenciaReparacion> EvidenciasReparacion { get; set; } = new List<EvidenciaReparacion>();
        public ICollection<Notificacion> Notificaciones { get; set; } = new List<Notificacion>();
    }
}
