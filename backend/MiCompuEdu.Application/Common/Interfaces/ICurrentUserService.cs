using System;

namespace MiCompuEdu.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        Guid? UsuarioId { get; }
        Guid? UserId { get; }
        string? UserName { get; }
        string? Role { get; }
        bool IsAuthenticated { get; }
    }
}
