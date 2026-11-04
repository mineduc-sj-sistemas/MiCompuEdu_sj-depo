using System;
using System.Security.Claims;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MiCompuEdu.Infrastructure.Services
{
    /// <summary>
    /// Implementación de infraestructura para resolver el ID y rol de usuario desde el contexto HTTP actual.
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
                return Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
            }
        }

        public Guid? UserId => UsuarioId;

        public string? UserName => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;

        public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;

        public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
    }
}
