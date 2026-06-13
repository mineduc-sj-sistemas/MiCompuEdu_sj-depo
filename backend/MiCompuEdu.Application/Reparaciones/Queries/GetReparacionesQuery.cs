using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Queries
{
    public record GetReparacionesQuery(string? Estado, string? TerminoBusqueda) : IRequest<List<ReparacionDto>>;

    public class GetReparacionesQueryHandler : IRequestHandler<GetReparacionesQuery, List<ReparacionDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetReparacionesQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ReparacionDto>> Handle(GetReparacionesQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Reparaciones
                .Include(r => r.Equipo)
                .ThenInclude(e => e.Beneficiario)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Estado) && Enum.TryParse<EstadoEquipo>(request.Estado, out var parsedEstado))
            {
                query = query.Where(r => r.Estado == parsedEstado);
            }

            if (!string.IsNullOrEmpty(request.TerminoBusqueda))
            {
                var term = request.TerminoBusqueda.ToLower();
                query = query.Where(r => 
                    r.Equipo.NumeroSerie.ToLower().Contains(term) ||
                    r.Equipo.Beneficiario.Dni.Contains(term) ||
                    r.Equipo.Beneficiario.Nombre.ToLower().Contains(term) ||
                    r.Equipo.Beneficiario.Apellido.ToLower().Contains(term)
                );
            }

            var list = await query
                .OrderByDescending(r => r.FechaIngreso)
                .ToListAsync(cancellationToken);

            return list.Select(r => new ReparacionDto
            {
                Id = r.Id,
                EquipoId = r.EquipoId,
                NumeroSerie = r.Equipo.NumeroSerie,
                MarcaModelo = $"{r.Equipo.Marca} {r.Equipo.Modelo}",
                NombreTutor = $"{r.Equipo.Beneficiario.Nombre} {r.Equipo.Beneficiario.Apellido}",
                TelefonoTutor = r.Equipo.Beneficiario.Telefono,
                Estado = r.Estado.ToString(),
                FallaReportada = r.FallaReportada,
                Diagnostico = r.Diagnostico,
                AccionesRealizadas = r.AccionesRealizadas,
                Observaciones = r.Observaciones,
                ComprobanteUrl = r.ComprobanteUrl,
                FechaIngreso = r.FechaIngreso,
                FechaEntrega = r.FechaEntrega
            }).ToList();
        }
    }
}
