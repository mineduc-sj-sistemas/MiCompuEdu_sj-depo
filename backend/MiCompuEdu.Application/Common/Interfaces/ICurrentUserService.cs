using System;

namespace MiCompuEdu.Application.Common.Interfaces
{
    /// <summary>
    /// Define el servicio para obtener los datos del usuario actual logueado en la sesión HTTP.
    /// </summary>
    public interface ICurrentUserService
    {
        Guid? UsuarioId { get; }
    }
}
