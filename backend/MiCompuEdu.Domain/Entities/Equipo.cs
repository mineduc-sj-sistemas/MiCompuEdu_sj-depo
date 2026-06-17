using System;
using System.Collections.Generic;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class Equipo : BaseEntity
    {
        public string NumeroSerie { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public string? CredencialesOffice { get; set; }

        public Guid BeneficiarioId { get; set; }
        public Beneficiario Beneficiario { get; set; } = null!;

        // FK opcional — Escalabilidad: vincula el equipo con el programa educativo de origen
        public Guid? ProgramaEducativoId { get; set; }
        public ProgramaEducativo? ProgramaEducativo { get; set; }

        public ICollection<Reparacion> Reparaciones { get; set; } = new List<Reparacion>();
    }
}
