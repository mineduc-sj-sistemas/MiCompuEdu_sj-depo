using System;

namespace MiCompuEdu.Application.DTOs
{
    public class EquipoDto
    {
        public Guid Id { get; set; }
        public string NumeroSerie { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public string? CredencialesOffice { get; set; }
    }
}
