using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Escuelas.Commands
{
    public record CleanupDuplicateEscuelasCommand() : IRequest<int>;

    public class CleanupDuplicateEscuelasCommandHandler : IRequestHandler<CleanupDuplicateEscuelasCommand, int>
    {
        private readonly IApplicationDbContext _context;

        public CleanupDuplicateEscuelasCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(CleanupDuplicateEscuelasCommand request, CancellationToken cancellationToken)
        {
            var escuelas = await _context.Escuelas.ToListAsync(cancellationToken);
            var grouped = escuelas.GroupBy(e => e.Nombre.Trim().ToUpper()).Where(g => g.Count() > 1);

            int deleted = 0;
            foreach (var group in grouped)
            {
                var mainEscuela = group.OrderBy(e => e.CreadoEn).First();
                var duplicates = group.Where(e => e.Id != mainEscuela.Id).ToList();

                foreach (var dup in duplicates)
                {
                    var beneficiarios = await _context.Beneficiarios
                        .Where(b => b.EscuelaId == dup.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var b in beneficiarios)
                    {
                        b.EscuelaId = mainEscuela.Id;
                    }

                    _context.Escuelas.Remove(dup);
                    deleted++;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            return deleted;
        }
    }
}
