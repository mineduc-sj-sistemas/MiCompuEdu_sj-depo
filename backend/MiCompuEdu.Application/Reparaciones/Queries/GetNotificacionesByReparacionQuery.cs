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
    public record GetNotificacionesByReparacionQuery(Guid ReparacionId) : IRequest<List<NotificacionDto>>;

    public class GetNotificacionesByReparacionQueryHandler : IRequestHandler<GetNotificacionesByReparacionQuery, List<NotificacionDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetNotificacionesByReparacionQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<NotificacionDto>> Handle(GetNotificacionesByReparacionQuery request, CancellationToken cancellationToken)
        {
            var list = await _context.Notificaciones
                .Where(n => n.ReparacionId == request.ReparacionId)
                .OrderByDescending(n => n.CreadoEn)
                .ToListAsync(cancellationToken);

            return list.Select(n => new NotificacionDto
            {
                Id = n.Id,
                Tipo = n.Tipo.ToString(),
                Destinatario = n.Destinatario,
                Mensaje = n.Mensaje,
                Estado = n.Estado.ToString(),
                FechaEnvio = n.FechaEnvio,
                ErrorMensaje = n.ErrorMensaje,
                Reintentos = n.Reintentos,
                CreadoEn = n.CreadoEn
            }).ToList();
        }
    }
}
