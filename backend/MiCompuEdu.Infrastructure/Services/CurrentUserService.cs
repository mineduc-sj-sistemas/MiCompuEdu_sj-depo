using System;
using System.Security.Claims;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MiCompuEdu.Infrastructure.Services
{
    /// <summary>
    /// Implementación de infraestructura para resolver el ID de usuario desde el contexto HTTP actual.
    /// </summary>
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? UsuarioId
        {
            get
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var parsedId))
                {
                    return parsedId;
                }
                return null;
            }
        }
    }
}
