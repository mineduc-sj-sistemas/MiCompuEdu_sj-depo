using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class UbicacionDeposito : BaseEntity
    {
        public string Estanteria { get; set; } = string.Empty;
        public int Fila { get; set; }
        public int Posicion { get; set; }
        public string Codigo { get; set; } = string.Empty; // e.g. "EST-A-F3-P12"
        public bool Activo { get; set; } = true;

        public ICollection<Reparacion> Reparaciones { get; set; } = new List<Reparacion>();
    }
}
