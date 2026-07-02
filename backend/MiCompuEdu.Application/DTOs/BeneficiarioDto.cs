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
        public int TipoBeneficiario { get; set; }
        
        public Guid? EscuelaId { get; set; }
        public string? EscuelaNombre { get; set; }

        // Datos del tutor / responsable
        public string? DniTutor { get; set; }
        public string? NombreTutor { get; set; }
        public string? TelefonoTutor { get; set; }

        // Contexto escolar
        public string? Grado { get; set; }
        public string? Seccion { get; set; }

        public EquipoDto? Equipo { get; set; }
    }
}
