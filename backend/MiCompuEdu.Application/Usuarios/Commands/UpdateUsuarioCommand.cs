using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Commands
{
    public record UpdateUsuarioCommand(
        Guid Id,
        string NombreCompleto,
        string Email,
        string? Password,
        string Rol
    ) : IRequest<UsuarioDto>;

    public class UpdateUsuarioCommandHandler : IRequestHandler<UpdateUsuarioCommand, UsuarioDto>
    {
        private readonly IApplicationDbContext _context;

        public UpdateUsuarioCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UsuarioDto> Handle(UpdateUsuarioCommand request, CancellationToken cancellationToken)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

            if (usuario == null)
            {
                throw new KeyNotFoundException($"El usuario con ID {request.Id} no existe.");
            }

            if (!Enum.TryParse<UserRole>(request.Rol, out var parsedRole))
            {
                throw new ArgumentException($"El rol '{request.Rol}' no es válido.");
            }

            usuario.NombreCompleto = request.NombreCompleto;
            usuario.Email = request.Email;
            usuario.Rol = parsedRole;
            usuario.ActualizadoEn = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(request.Password))
            {
                usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

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
