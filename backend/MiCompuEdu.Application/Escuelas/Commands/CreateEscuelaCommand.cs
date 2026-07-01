using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Escuelas.Queries;
using MiCompuEdu.Domain.Entities;

namespace MiCompuEdu.Application.Escuelas.Commands
{
    public record CreateEscuelaCommand : IRequest<EscuelaDto>
    {
        public string Nombre { get; set; } = string.Empty;
    }

    public class CreateEscuelaCommandHandler : IRequestHandler<CreateEscuelaCommand, EscuelaDto>
    {
        private readonly IApplicationDbContext _context;

        public CreateEscuelaCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EscuelaDto> Handle(CreateEscuelaCommand request, CancellationToken cancellationToken)
        {
            var escuela = new Escuela
            {
                Nombre = request.Nombre,
                Activo = true
            };

            _context.Escuelas.Add(escuela);
            await _context.SaveChangesAsync(cancellationToken);

            return new EscuelaDto
            {
                Id = escuela.Id,
                Nombre = escuela.Nombre
            };
        }
    }
}
