using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Queries
{
    public record EstadoPublicoReparacionDto(
        string NumeroSerie,
        string MarcaModelo,
        string Estado,
        DateTime FechaIngreso,
        DateTime? FechaLimite
    );

    public record GetEstadoPublicoReparacionQuery(Guid Id) : IRequest<EstadoPublicoReparacionDto?>;

    public class GetEstadoPublicoReparacionQueryHandler : IRequestHandler<GetEstadoPublicoReparacionQuery, EstadoPublicoReparacionDto?>
    {
        private readonly IApplicationDbContext _context;

        public GetEstadoPublicoReparacionQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EstadoPublicoReparacionDto?> Handle(GetEstadoPublicoReparacionQuery request, CancellationToken cancellationToken)
        {
            return await _context.Reparaciones
                .AsNoTracking()
                .TagWith("ConsultaPublica_EstadoReparacion")
                .Where(r => r.Id == request.Id)
                .Select(r => new EstadoPublicoReparacionDto(
                    r.Equipo.NumeroSerie,
                    r.Equipo.Marca + " " + r.Equipo.Modelo,
                    r.Estado.ToString(),
                    r.FechaIngreso,
                    r.FechaLimite
                ))
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
