using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Escuelas.Queries
{
    public class EscuelaDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
    }

    public record GetEscuelasQuery : IRequest<List<EscuelaDto>>;

    public class GetEscuelasQueryHandler : IRequestHandler<GetEscuelasQuery, List<EscuelaDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetEscuelasQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<EscuelaDto>> Handle(GetEscuelasQuery request, CancellationToken cancellationToken)
        {
            return await _context.Escuelas
                .Where(e => e.Activo)
                .OrderBy(e => e.Nombre)
                .Select(e => new EscuelaDto
                {
                    Id = e.Id,
                    Nombre = e.Nombre
                })
                .ToListAsync(cancellationToken);
        }
    }
}
