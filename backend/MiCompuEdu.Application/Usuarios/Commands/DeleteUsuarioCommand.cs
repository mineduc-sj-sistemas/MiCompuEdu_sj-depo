using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Commands
{
    public record DeleteUsuarioCommand(Guid Id) : IRequest<bool>;

    public class DeleteUsuarioCommandHandler : IRequestHandler<DeleteUsuarioCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public DeleteUsuarioCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteUsuarioCommand request, CancellationToken cancellationToken)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

            if (usuario == null)
            {
                throw new KeyNotFoundException($"El usuario con ID {request.Id} no existe.");
            }

            if (string.Equals(usuario.NombreUsuario, "admin", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("No se puede eliminar la cuenta principal de administración (@admin).");
            }

            var tieneReparaciones = await _context.Reparaciones
                .AnyAsync(r => r.OperadorIngresoId == request.Id || r.TecnicoAsignadoId == request.Id, cancellationToken);

            var tieneMovimientos = await _context.HistorialMovimientos
                .AnyAsync(hm => hm.UsuarioId == request.Id, cancellationToken);

            if (tieneReparaciones || tieneMovimientos)
            {
                throw new InvalidOperationException("El usuario registra actividad histórica en reparaciones y no puede eliminarse físicamente. Utilice el interruptor de estado para desactivar su cuenta.");
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
