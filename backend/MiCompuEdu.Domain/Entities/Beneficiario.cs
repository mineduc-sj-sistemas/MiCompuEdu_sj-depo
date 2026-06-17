using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class Beneficiario : BaseEntity
    {
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // FK opcional — Escalabilidad: vincula al beneficiario con su escuela de origen
        public Guid? EscuelaId { get; set; }
        public Escuela? Escuela { get; set; }

        // Propiedades de navegación
        public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
    }
}
