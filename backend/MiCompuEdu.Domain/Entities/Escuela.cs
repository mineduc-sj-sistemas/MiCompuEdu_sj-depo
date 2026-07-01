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
        public string Nombre { get; set; } = string.Empty;
        public bool Activo { get; set; } = true;

        // Navegación
        public ICollection<Beneficiario> Beneficiarios { get; set; } = new List<Beneficiario>();
    }
}
