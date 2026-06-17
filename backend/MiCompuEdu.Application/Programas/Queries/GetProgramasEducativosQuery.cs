using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Programas.Queries
{
    public class ProgramaEducativoDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public record GetProgramasEducativosQuery : IRequest<List<ProgramaEducativoDto>>;

    public class GetProgramasEducativosQueryHandler : IRequestHandler<GetProgramasEducativosQuery, List<ProgramaEducativoDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetProgramasEducativosQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProgramaEducativoDto>> Handle(GetProgramasEducativosQuery request, CancellationToken cancellationToken)
        {
            return await _context.ProgramasEducativos
                .Where(p => p.Activo)
                .OrderBy(p => p.Nombre)
                .Select(p => new ProgramaEducativoDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion
                })
                .ToListAsync(cancellationToken);
        }
    }
}
