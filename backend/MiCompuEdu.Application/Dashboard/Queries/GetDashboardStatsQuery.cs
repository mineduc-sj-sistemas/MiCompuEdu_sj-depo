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

namespace MiCompuEdu.Application.Dashboard.Queries
{
    public record GetDashboardStatsQuery : IRequest<DashboardDto>;

    public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardDto>
    {
        private readonly IApplicationDbContext _context;

        public GetDashboardStatsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
        {
            var baseQuery = _context.Reparaciones
                .AsNoTracking()
                .TagWith("Dashboard_Estadisticas");

            var totalReparaciones = await baseQuery.CountAsync(cancellationToken);
            var entregados = await baseQuery.CountAsync(r => r.Estado == EstadoEquipo.Entregado, cancellationToken);
            var pendientes = await baseQuery.CountAsync(r =>
                r.Estado != EstadoEquipo.Entregado &&
                r.Estado != EstadoEquipo.No_Reparable, cancellationToken);

            var reparacionesConTiempo = await baseQuery
                .Where(r => r.FechaEntrega != null)
                .Select(r => new { r.FechaIngreso, FechaEntrega = r.FechaEntrega!.Value })
                .ToListAsync(cancellationToken);

            double promedioDias = 0;
            if (reparacionesConTiempo.Count > 0)
            {
                promedioDias = reparacionesConTiempo
                    .Select(r => (r.FechaEntrega - r.FechaIngreso).TotalDays)
                    .Average();
            }

            var fallasQuery = await baseQuery
                .Include(r => r.FallaCatalogo)
                .Where(r => r.FallaCatalogoId != null)
                .GroupBy(r => r.FallaCatalogo!.Nombre)
                .Select(g => new FallaFrecuenteDto
                {
                    Falla = g.Key,
                    Cantidad = g.Count()
                })
                .OrderByDescending(f => f.Cantidad)
                .Take(5)
                .ToListAsync(cancellationToken);

            var estadosGroup = await baseQuery
                .GroupBy(r => r.Estado)
                .Select(g => new { Estado = g.Key.ToString(), Cantidad = g.Count() })
                .ToListAsync(cancellationToken);

            var dictEstados = Enum.GetNames(typeof(EstadoEquipo))
                .ToDictionary(name => name, _ => 0);

            foreach (var group in estadosGroup)
            {
                dictEstados[group.Estado] = group.Cantidad;
            }

            // 1. Consultar escuelas asociadas a reparaciones
            var escuelasQuery = await baseQuery
                .Include(r => r.Equipo)
                    .ThenInclude(e => e.Beneficiario)
                        .ThenInclude(b => b.Escuela)
                .Where(r => r.Equipo.Beneficiario.EscuelaId != null)
                .GroupBy(r => r.Equipo.Beneficiario.Escuela!.Nombre)
                .Select(g => new ReparacionEscuelaDto
                {
                    Escuela = g.Key,
                    Cantidad = g.Count()
                })
                .OrderByDescending(e => e.Cantidad)
                .Take(5)
                .ToListAsync(cancellationToken);

            // 2. Consultar rendimiento/efectividad por técnico
            var tecnicosQuery = await baseQuery
                .Include(r => r.TecnicoAsignado)
                .Where(r => r.TecnicoAsignadoId != null && (r.Estado == EstadoEquipo.Reparado || r.Estado == EstadoEquipo.Listo_Para_Retirar || r.Estado == EstadoEquipo.Entregado))
                .GroupBy(r => r.TecnicoAsignado!.NombreCompleto)
                .Select(g => new EfectividadTecnicoDto
                {
                    Tecnico = g.Key,
                    Reparados = g.Count(),
                    TiempoPromedioDias = g.Average(r => r.FechaEntrega != null ? (r.FechaEntrega.Value - r.FechaIngreso).TotalDays : 2.5)
                })
                .OrderByDescending(t => t.Reparados)
                .ToListAsync(cancellationToken);

            foreach (var t in tecnicosQuery)
            {
                t.TiempoPromedioDias = Math.Round(t.TiempoPromedioDias, 1);
            }

            // 3. Consultar tendencias mensuales
            var monthlyRepairs = await baseQuery
                .Select(r => new { r.FechaIngreso })
                .ToListAsync(cancellationToken);

            var mesNombres = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };

            var trendsQuery = monthlyRepairs
                .GroupBy(r => new { r.FechaIngreso.Year, r.FechaIngreso.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new ReparacionesMensualesDto
                {
                    Mes = $"{mesNombres[g.Key.Month - 1]} {g.Key.Year}",
                    Cantidad = g.Count()
                })
                .ToList();

            return new DashboardDto
            {
                EquiposIngresados = totalReparaciones,
                EquiposPendientes = pendientes,
                EquiposEntregados = entregados,
                TiempoPromedioReparacionDias = Math.Round(promedioDias, 1),
                FallasMasFrecuentes = fallasQuery,
                EquiposPorEstado = dictEstados,
                ReparacionesPorEscuela = escuelasQuery,
                EfectividadTecnicos = tecnicosQuery,
                ReparacionesPorMes = trendsQuery
            };
        }
    }
}
