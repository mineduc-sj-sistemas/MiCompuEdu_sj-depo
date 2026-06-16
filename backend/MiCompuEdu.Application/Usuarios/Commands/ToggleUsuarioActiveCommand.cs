using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Commands
{
    public record ToggleUsuarioActiveCommand(Guid Id) : IRequest<bool>;

    public class ToggleUsuarioActiveCommandHandler : IRequestHandler<ToggleUsuarioActiveCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public ToggleUsuarioActiveCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(ToggleUsuarioActiveCommand request, CancellationToken cancellationToken)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

            if (usuario == null)
            {
                throw new KeyNotFoundException($"El usuario con ID {request.Id} no existe.");
            }

            usuario.Activo = !usuario.Activo;
            usuario.ActualizadoEn = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return usuario.Activo;
        }
    }
}
