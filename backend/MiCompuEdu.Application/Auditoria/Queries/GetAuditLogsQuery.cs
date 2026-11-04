using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Auditoria.Queries
{
    public record AuditLogItemDto(
        long Id,
        string Tabla,
        Guid RegistroId,
        string Accion,
        DateTime Fecha,
        string Usuario,
        string? DatosAnteriores,
        string? DatosNuevos
    );

    public record GetAuditLogsQuery(string Tabla, Guid RegistroId) : IRequest<List<AuditLogItemDto>>;

    public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, List<AuditLogItemDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAuditLogsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AuditLogItemDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
        {
            var tablaLower = request.Tabla.ToLower();

            return await _context.AuditLogs
                .AsNoTracking()
                .TagWith("Auditoria_ObtenerHistorial")
                .Include(a => a.Usuario)
                .Where(a => a.Tabla.ToLower() == tablaLower && a.RegistroId == request.RegistroId)
                .OrderBy(a => a.Fecha)
                .Select(a => new AuditLogItemDto(
                    a.Id,
                    a.Tabla,
                    a.RegistroId,
                    a.Accion,
                    a.Fecha,
                    a.Usuario != null ? a.Usuario.NombreCompleto : "Sistema/Desconocido",
                    a.DatosAnteriores,
                    a.DatosNuevos
                ))
                .ToListAsync(cancellationToken);
        }
    }
}
