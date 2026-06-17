using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    /// <summary>
    /// Representa un establecimiento educativo del sistema provincial.
    /// Permite vincular beneficiarios con sus escuelas de origen para trazabilidad geográfica.
    /// </summary>
    public class Escuela : BaseEntity
    {
        /// <summary>Código Único de Establecimiento (CUE) asignado por el Ministerio.</summary>
        public string Cue { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;
        public string Localidad { get; set; } = string.Empty;
        public string? Departamento { get; set; }
        public bool Activo { get; set; } = true;

        // Navegación
        public ICollection<Beneficiario> Beneficiarios { get; set; } = new List<Beneficiario>();
    }
}
