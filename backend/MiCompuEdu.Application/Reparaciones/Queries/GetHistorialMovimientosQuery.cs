using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Queries
{
    public record GetHistorialMovimientosQuery(Guid ReparacionId) : IRequest<List<HistorialMovimientoDto>>;

    public class GetHistorialMovimientosQueryHandler : IRequestHandler<GetHistorialMovimientosQuery, List<HistorialMovimientoDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetHistorialMovimientosQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<HistorialMovimientoDto>> Handle(GetHistorialMovimientosQuery request, CancellationToken cancellationToken)
        {
            var list = await _context.HistorialMovimientos
                .AsNoTracking()
                .Include(h => h.Usuario)
                .Where(h => h.ReparacionId == request.ReparacionId)
                .OrderByDescending(h => h.FechaMovimiento)
                .ToListAsync(cancellationToken);

            return list.Select(h => new HistorialMovimientoDto
            {
                Id = h.Id,
                ReparacionId = h.ReparacionId,
                EstadoAnterior = h.EstadoAnterior?.ToString(),
                EstadoNuevo = h.EstadoNuevo.ToString(),
                UsuarioId = h.UsuarioId,
                UsuarioNombre = h.Usuario?.NombreCompleto ?? "Sistema",
                Observaciones = h.Observaciones,
                FechaMovimiento = h.FechaMovimiento
            }).ToList();
        }
    }
}
