using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Commands
{
    public record CreateUsuarioCommand(
        string NombreCompleto,
        string NombreUsuario,
        string Email,
        string Password,
        string Rol
    ) : IRequest<UsuarioDto>;

    public class CreateUsuarioCommandHandler : IRequestHandler<CreateUsuarioCommand, UsuarioDto>
    {
        private readonly IApplicationDbContext _context;

        public CreateUsuarioCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UsuarioDto> Handle(CreateUsuarioCommand request, CancellationToken cancellationToken)
        {
            var existeUsuario = await _context.Usuarios
                .AnyAsync(u => u.NombreUsuario.ToLower() == request.NombreUsuario.ToLower(), cancellationToken);

            if (existeUsuario)
            {
                throw new InvalidOperationException($"El nombre de usuario '{request.NombreUsuario}' ya está en uso.");
            }

            if (!Enum.TryParse<UserRole>(request.Rol, out var parsedRole))
            {
                throw new ArgumentException($"El rol '{request.Rol}' no es válido.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                NombreUsuario = request.NombreUsuario,
                Email = request.Email,
                PasswordHash = passwordHash,
                Rol = parsedRole,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync(cancellationToken);

            return new UsuarioDto
            {
                Id = usuario.Id,
                NombreCompleto = usuario.NombreCompleto,
                NombreUsuario = usuario.NombreUsuario,
                Email = usuario.Email,
                Rol = usuario.Rol.ToString(),
                Activo = usuario.Activo
            };
        }
    }
}
