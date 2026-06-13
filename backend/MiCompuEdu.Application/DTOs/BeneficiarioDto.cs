using System;

namespace MiCompuEdu.Application.DTOs
{
    public class BeneficiarioDto
    {
        public Guid Id { get; set; }
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public EquipoDto? Equipo { get; set; }
    }
}
