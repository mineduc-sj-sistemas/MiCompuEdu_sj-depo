using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    /// <summary>
    /// Catálogo de programas educativos nacionales/provinciales (Conectar Igualdad, Juana Manso, etc.).
    /// Permite clasificar equipos por programa para reportes y trazabilidad de origen.
    /// </summary>
    public class ProgramaEducativo : BaseEntity
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; } = true;

        // Navegación
        public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
    }
}
