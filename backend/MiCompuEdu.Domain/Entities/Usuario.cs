using System;
using MiCompuEdu.Domain.Common;
using MiCompuEdu.Domain.Enums;

namespace MiCompuEdu.Domain.Entities
{
    public class Usuario : BaseEntity
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string NombreUsuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Rol { get; set; }
        public bool Activo { get; set; } = true;
    }
}
