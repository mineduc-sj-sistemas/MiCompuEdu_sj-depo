using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;

namespace MiCompuEdu.Application.Reparaciones.Commands
{
    public record AgregarEvidenciaCommand(
        Guid ReparacionId,
        string UrlArchivo,
        string NombreArchivo
    ) : IRequest<EvidenciaDto>;

    public class AgregarEvidenciaCommandHandler : IRequestHandler<AgregarEvidenciaCommand, EvidenciaDto>
    {
        private readonly IApplicationDbContext _context;

        public AgregarEvidenciaCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EvidenciaDto> Handle(AgregarEvidenciaCommand request, CancellationToken cancellationToken)
        {
            var evidencia = new EvidenciaReparacion
            {
                Id = Guid.NewGuid(),
                ReparacionId = request.ReparacionId,
                UrlArchivo = request.UrlArchivo,
                NombreArchivo = request.NombreArchivo,
                CreadoEn = DateTime.UtcNow
            };

            _context.EvidenciasReparacion.Add(evidencia);
            await _context.SaveChangesAsync(cancellationToken);

            return new EvidenciaDto
            {
                Id = evidencia.Id,
                UrlArchivo = evidencia.UrlArchivo,
                NombreArchivo = evidencia.NombreArchivo
            };
        }
    }
}
