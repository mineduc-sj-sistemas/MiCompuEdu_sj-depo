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
        public string TitularDni { get; set; } = string.Empty;
        public string? TitularEmail { get; set; }
        public int TipoBeneficiario { get; set; } = 1;
        public string? TutorResponsableNombre { get; set; }
        public string? TutorResponsableDni { get; set; }
        public string? TutorResponsableTelefono { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string FallaReportada { get; set; } = string.Empty;
        public string? Diagnostico { get; set; }
        public string? AccionesRealizadas { get; set; }
        public string? Observaciones { get; set; }
        public string? ComprobanteUrl { get; set; }
        public DateTime FechaIngreso { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public Guid? EscuelaId { get; set; }
        public string? EscuelaNombre { get; set; }
        public Guid? ProgramaEducativoId { get; set; }
        public string? ProgramaEducativoNombre { get; set; }
        public Guid? TecnicoAsignadoId { get; set; }
        public string? TecnicoAsignadoNombre { get; set; }
        public int? FallaCatalogoId { get; set; }
        public string? FallaCatalogoNombre { get; set; }
        public Guid? UbicacionDepositoId { get; set; }
        public string? UbicacionDepositoCodigo { get; set; }
        public string? ProveedorGarantia { get; set; }
        public string? RemitoGarantia { get; set; }
        public DateTime? FechaEsperadaGarantia { get; set; }
        public string? FirmaIngresoBase64 { get; set; }
        public string? FirmaEntregaBase64 { get; set; }
        public DateTime? FechaLimite { get; set; }
        public bool SoloCargador { get; set; }
        public System.Collections.Generic.List<EvidenciaDto> Evidencias { get; set; } = new();
    }

    public class EvidenciaDto
    {
        public Guid Id { get; set; }
        public string UrlArchivo { get; set; } = string.Empty;
        public string NombreArchivo { get; set; } = string.Empty;
    }
}
