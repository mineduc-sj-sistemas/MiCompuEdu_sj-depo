using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Ubicaciones.Queries
{
    public record GetUbicacionesQuery : IRequest<List<UbicacionDepositoDto>>;

    public class GetUbicacionesQueryHandler : IRequestHandler<GetUbicacionesQuery, List<UbicacionDepositoDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetUbicacionesQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UbicacionDepositoDto>> Handle(GetUbicacionesQuery request, CancellationToken cancellationToken)
        {
            var list = await _context.UbicacionesDeposito
                .Where(u => u.Activo)
                .OrderBy(u => u.Codigo)
                .ToListAsync(cancellationToken);

            return list.Select(u => new UbicacionDepositoDto
            {
                Id = u.Id,
                Estanteria = u.Estanteria,
                Fila = u.Fila,
                Posicion = u.Posicion,
                Codigo = u.Codigo,
                Activo = u.Activo
            }).ToList();
        }
    }
}
