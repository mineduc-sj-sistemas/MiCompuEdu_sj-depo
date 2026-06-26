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
    public record GetReparacionesQuery(
        string? Estado, 
        string? TerminoBusqueda,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? TecnicoAsignadoId = null,
        int? FallaCatalogoId = null,
        DateTime? FechaInicio = null,
        DateTime? FechaFin = null,
        int? PageIndex = null,
        int? PageSize = null
    ) : IRequest<List<ReparacionDto>>;

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
                .AsNoTracking()
                .Include(r => r.Equipo)
                    .ThenInclude(e => e.Beneficiario)
                        .ThenInclude(b => b.Escuela)
                .Include(r => r.Equipo)
                    .ThenInclude(e => e.ProgramaEducativo)
                .Include(r => r.TecnicoAsignado)
                .Include(r => r.FallaCatalogo)
                .Include(r => r.UbicacionDeposito)
                .Include(r => r.EvidenciasReparacion)
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

            if (request.EscuelaId.HasValue)
            {
                query = query.Where(r => r.Equipo.Beneficiario.EscuelaId == request.EscuelaId.Value);
            }

            if (request.ProgramaEducativoId.HasValue)
            {
                query = query.Where(r => r.Equipo.ProgramaEducativoId == request.ProgramaEducativoId.Value);
            }

            if (request.TecnicoAsignadoId.HasValue)
            {
                query = query.Where(r => r.TecnicoAsignadoId == request.TecnicoAsignadoId.Value);
            }

            if (request.FallaCatalogoId.HasValue)
            {
                query = query.Where(r => r.FallaCatalogoId == request.FallaCatalogoId.Value);
            }

            if (request.FechaInicio.HasValue)
            {
                query = query.Where(r => r.FechaIngreso >= request.FechaInicio.Value);
            }

            if (request.FechaFin.HasValue)
            {
                query = query.Where(r => r.FechaIngreso <= request.FechaFin.Value);
            }

            query = query.OrderByDescending(r => r.FechaIngreso);

            if (request.PageSize.HasValue)
            {
                var pageIndex = request.PageIndex ?? 1;
                if (pageIndex < 1) pageIndex = 1;
                query = query.Skip((pageIndex - 1) * request.PageSize.Value).Take(request.PageSize.Value);
            }

            var list = await query.ToListAsync(cancellationToken);

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
                FechaEntrega = r.FechaEntrega,
                EscuelaId = r.Equipo.Beneficiario.EscuelaId,
                EscuelaNombre = r.Equipo.Beneficiario.Escuela?.Nombre,
                ProgramaEducativoId = r.Equipo.ProgramaEducativoId,
                ProgramaEducativoNombre = r.Equipo.ProgramaEducativo?.Nombre,
                TecnicoAsignadoId = r.TecnicoAsignadoId,
                TecnicoAsignadoNombre = r.TecnicoAsignado?.NombreCompleto,
                FallaCatalogoId = r.FallaCatalogoId,
                FallaCatalogoNombre = r.FallaCatalogo?.Nombre,
                UbicacionDepositoId = r.UbicacionDepositoId,
                UbicacionDepositoCodigo = r.UbicacionDeposito?.Codigo,
                ProveedorGarantia = r.ProveedorGarantia,
                RemitoGarantia = r.RemitoGarantia,
                FechaEsperadaGarantia = r.FechaEsperadaGarantia,
                FirmaIngresoBase64 = r.FirmaIngresoBase64,
                FirmaEntregaBase64 = r.FirmaEntregaBase64,
                FechaLimite = r.FechaLimite,
                Evidencias = r.EvidenciasReparacion.Select(ev => new EvidenciaDto
                {
                    Id = ev.Id,
                    UrlArchivo = ev.UrlArchivo,
                    NombreArchivo = ev.NombreArchivo
                }).ToList()
            }).ToList();
        }
    }
}
