using System;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class EvidenciaReparacion : BaseEntity
    {
        public Guid ReparacionId { get; set; }
        public Reparacion Reparacion { get; set; } = null!;

        public string UrlArchivo { get; set; } = string.Empty;
        public string NombreArchivo { get; set; } = string.Empty;
    }
}
