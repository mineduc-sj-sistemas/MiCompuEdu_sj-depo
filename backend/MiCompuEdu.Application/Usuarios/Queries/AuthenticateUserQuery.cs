using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Queries
{
    public record AuthenticatedUserResult(
        Guid Id,
        string NombreCompleto,
        string NombreUsuario,
        string Rol,
        string Email
    );

    public record AuthenticateUserQuery(string NombreUsuario, string Password) : IRequest<AuthenticatedUserResult?>;

    public class AuthenticateUserQueryHandler : IRequestHandler<AuthenticateUserQuery, AuthenticatedUserResult?>
    {
        private readonly IApplicationDbContext _context;

        public AuthenticateUserQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AuthenticatedUserResult?> Handle(AuthenticateUserQuery request, CancellationToken cancellationToken)
        {
            var usernameLower = request.NombreUsuario.Trim().ToLower();
            var usuario = await _context.Usuarios
                .AsNoTracking()
                .TagWith("Auth_VerificarCredenciales")
                .FirstOrDefaultAsync(u => u.NombreUsuario.ToLower() == usernameLower && u.Activo, cancellationToken);

            if (usuario == null)
            {
                return null;
            }

            bool isValid = false;
            try
            {
                isValid = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);
            }
            catch
            {
                isValid = false;
            }

            if (!isValid)
            {
                return null;
            }

            return new AuthenticatedUserResult(
                usuario.Id,
                usuario.NombreCompleto,
                usuario.NombreUsuario,
                usuario.Rol.ToString(),
                usuario.Email
            );
        }
    }
}
