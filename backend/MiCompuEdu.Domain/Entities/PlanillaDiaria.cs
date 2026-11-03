using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class PlanillaDiaria : BaseEntity
    {
        /// <summary>
        /// Fecha correspondiente a la planilla firmada de retiros (formato YYYY-MM-DD en UTC).
        /// </summary>
        public DateTime Fecha { get; set; }

        public string? Observaciones { get; set; }

        public Guid? SubidoPorId { get; set; }
        public string SubidoPorNombre { get; set; } = string.Empty;

        public ICollection<ArchivoPlanillaDiaria> Archivos { get; set; } = new List<ArchivoPlanillaDiaria>();
    }

    public class ArchivoPlanillaDiaria : BaseEntity
    {
        public Guid PlanillaDiariaId { get; set; }
        public PlanillaDiaria PlanillaDiaria { get; set; } = null!;

        public string NombreArchivo { get; set; } = string.Empty;
        public string TipoContenido { get; set; } = "image/jpeg";
        public string ContenidoBase64 { get; set; } = string.Empty;
        public long TamanoBytes { get; set; }
    }
}
