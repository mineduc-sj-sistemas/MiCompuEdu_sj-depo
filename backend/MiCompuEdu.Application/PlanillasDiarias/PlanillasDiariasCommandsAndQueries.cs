using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Common.Security;
using MiCompuEdu.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.PlanillasDiarias
{
    public class PlanillaDiariaDto
    {
        public Guid Id { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string? Observaciones { get; set; }
        public Guid? SubidoPorId { get; set; }
        public string SubidoPorNombre { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<ArchivoPlanillaDto> Archivos { get; set; } = new();
    }

    public class ArchivoPlanillaDto
    {
        public Guid Id { get; set; }
        public string NombreArchivo { get; set; } = string.Empty;
        public string TipoContenido { get; set; } = string.Empty;
        public long TamanoBytes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Url { get; set; } = string.Empty;
    }

    public record ArchivoPlanillaInput(string NombreArchivo, byte[] Bytes);

    public record ArchivoPlanillaFileResult(byte[] Bytes, string TipoContenido, string NombreArchivo);

    // 1. Query: Listar / Buscar por fecha
    public record GetPlanillasDiariasQuery(string? Fecha) : IRequest<List<PlanillaDiariaDto>>;

    public class GetPlanillasDiariasQueryHandler : IRequestHandler<GetPlanillasDiariasQuery, List<PlanillaDiariaDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetPlanillasDiariasQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PlanillaDiariaDto>> Handle(GetPlanillasDiariasQuery request, CancellationToken cancellationToken)
        {
            var query = _context.PlanillasDiarias
                .AsNoTracking()
                .TagWith("PlanillasDiarias_ListarPorFecha");

            if (!string.IsNullOrWhiteSpace(request.Fecha) && DateTime.TryParse(request.Fecha, out var parsedDate))
            {
                var startUtc = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, 0, 0, 0, DateTimeKind.Utc);
                var endUtc = startUtc.AddDays(1);
                query = query.Where(p => p.Fecha >= startUtc && p.Fecha < endUtc);
            }

            return await query
                .OrderByDescending(p => p.Fecha)
                .ThenByDescending(p => p.CreadoEn)
                .Select(p => new PlanillaDiariaDto
                {
                    Id = p.Id,
                    Fecha = p.Fecha.ToString("yyyy-MM-dd"),
                    Observaciones = p.Observaciones,
                    SubidoPorId = p.SubidoPorId,
                    SubidoPorNombre = p.SubidoPorNombre,
                    CreatedAt = p.CreadoEn,
                    Archivos = p.Archivos
                        .OrderBy(a => a.CreadoEn)
                        .Select(a => new ArchivoPlanillaDto
                        {
                            Id = a.Id,
                            NombreArchivo = a.NombreArchivo,
                            TipoContenido = a.TipoContenido,
                            TamanoBytes = a.TamanoBytes,
                            CreatedAt = a.CreadoEn,
                            Url = $"/api/v1/PlanillasDiarias/archivo/{a.Id}"
                        })
                        .ToList()
                })
                .ToListAsync(cancellationToken);
        }
    }

    // 2. Command: Subir una o múltiples hojas vinculadas a un día
    public record SubirPlanillaDiariaCommand(
        string Fecha,
        string? Observaciones,
        Guid? UsuarioId,
        string UsuarioNombre,
        List<ArchivoPlanillaInput> Archivos
    ) : IRequest<PlanillaDiariaDto>;

    public class SubirPlanillaDiariaCommandHandler : IRequestHandler<SubirPlanillaDiariaCommand, PlanillaDiariaDto>
    {
        private readonly IApplicationDbContext _context;

        public SubirPlanillaDiariaCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PlanillaDiariaDto> Handle(SubirPlanillaDiariaCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Fecha) || !DateTime.TryParse(request.Fecha, out var parsedDate))
            {
                throw new ArgumentException("Debe indicar una fecha válida (YYYY-MM-DD).");
            }

            if (request.Archivos == null || request.Archivos.Count == 0)
            {
                throw new ArgumentException("Debe adjuntar al menos una hoja escaneada (imagen o PDF).");
            }

            var usuarioNombre = request.UsuarioNombre;
            if (request.UsuarioId.HasValue)
            {
                var dbUser = await _context.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == request.UsuarioId.Value, cancellationToken);
                if (dbUser != null && !string.IsNullOrWhiteSpace(dbUser.NombreCompleto))
                {
                    usuarioNombre = dbUser.NombreCompleto;
                }
            }

            var fechaUtc = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, 0, 0, 0, DateTimeKind.Utc);
            var endUtc = fechaUtc.AddDays(1);

            var planilla = await _context.PlanillasDiarias
                .Include(p => p.Archivos)
                .FirstOrDefaultAsync(p => p.Fecha >= fechaUtc && p.Fecha < endUtc, cancellationToken);

            if (planilla == null)
            {
                planilla = new PlanillaDiaria
                {
                    Fecha = fechaUtc,
                    Observaciones = request.Observaciones?.Trim(),
                    SubidoPorId = request.UsuarioId,
                    SubidoPorNombre = usuarioNombre
                };
                _context.PlanillasDiarias.Add(planilla);
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(request.Observaciones))
                {
                    planilla.Observaciones = string.IsNullOrWhiteSpace(planilla.Observaciones)
                        ? request.Observaciones.Trim()
                        : $"{planilla.Observaciones} | {request.Observaciones.Trim()}";
                }
                planilla.SubidoPorId = request.UsuarioId;
                planilla.SubidoPorNombre = usuarioNombre;
                planilla.ActualizadoEn = DateTime.UtcNow;
            }

            foreach (var item in request.Archivos)
            {
                var validation = FileSecurityValidator.ValidateFile(item.NombreArchivo, item.Bytes);
                if (!validation.IsValid)
                {
                    throw new ArgumentException($"Archivo '{item.NombreArchivo}' rechazado: {validation.ErrorMessage}");
                }

                var nuevoArchivo = new ArchivoPlanillaDiaria
                {
                    PlanillaDiariaId = planilla.Id,
                    NombreArchivo = item.NombreArchivo,
                    TipoContenido = validation.ContentType,
                    ContenidoBase64 = Convert.ToBase64String(item.Bytes),
                    TamanoBytes = item.Bytes.Length
                };

                _context.ArchivosPlanillaDiaria.Add(nuevoArchivo);
            }

            await _context.SaveChangesAsync(cancellationToken);

            var result = await _context.PlanillasDiarias
                .AsNoTracking()
                .Where(p => p.Id == planilla.Id)
                .Select(p => new PlanillaDiariaDto
                {
                    Id = p.Id,
                    Fecha = p.Fecha.ToString("yyyy-MM-dd"),
                    Observaciones = p.Observaciones,
                    SubidoPorId = p.SubidoPorId,
                    SubidoPorNombre = p.SubidoPorNombre,
                    CreatedAt = p.CreadoEn,
                    Archivos = p.Archivos
                        .OrderBy(a => a.CreadoEn)
                        .Select(a => new ArchivoPlanillaDto
                        {
                            Id = a.Id,
                            NombreArchivo = a.NombreArchivo,
                            TipoContenido = a.TipoContenido,
                            TamanoBytes = a.TamanoBytes,
                            CreatedAt = a.CreadoEn,
                            Url = $"/api/v1/PlanillasDiarias/archivo/{a.Id}"
                        })
                        .ToList()
                })
                .FirstAsync(cancellationToken);

            return result;
        }
    }

    // 3. Query: Obtener binario de un archivo
    public record GetArchivoPlanillaQuery(Guid ArchivoId) : IRequest<ArchivoPlanillaFileResult?>;

    public class GetArchivoPlanillaQueryHandler : IRequestHandler<GetArchivoPlanillaQuery, ArchivoPlanillaFileResult?>
    {
        private readonly IApplicationDbContext _context;

        public GetArchivoPlanillaQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ArchivoPlanillaFileResult?> Handle(GetArchivoPlanillaQuery request, CancellationToken cancellationToken)
        {
            var archivo = await _context.ArchivosPlanillaDiaria
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.ArchivoId, cancellationToken);

            if (archivo == null || string.IsNullOrWhiteSpace(archivo.ContenidoBase64))
            {
                return null;
            }

            var bytes = Convert.FromBase64String(archivo.ContenidoBase64);
            return new ArchivoPlanillaFileResult(bytes, archivo.TipoContenido, archivo.NombreArchivo);
        }
    }

    // 4. Command: Eliminar un archivo individual
    public record EliminarArchivoPlanillaCommand(Guid ArchivoId) : IRequest<bool>;

    public class EliminarArchivoPlanillaCommandHandler : IRequestHandler<EliminarArchivoPlanillaCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public EliminarArchivoPlanillaCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(EliminarArchivoPlanillaCommand request, CancellationToken cancellationToken)
        {
            var archivo = await _context.ArchivosPlanillaDiaria
                .FirstOrDefaultAsync(a => a.Id == request.ArchivoId, cancellationToken);

            if (archivo == null) return false;

            var planillaId = archivo.PlanillaDiariaId;
            _context.ArchivosPlanillaDiaria.Remove(archivo);
            await _context.SaveChangesAsync(cancellationToken);

            var quedanArchivos = await _context.ArchivosPlanillaDiaria
                .AnyAsync(a => a.PlanillaDiariaId == planillaId, cancellationToken);

            if (!quedanArchivos)
            {
                var planilla = await _context.PlanillasDiarias
                    .FirstOrDefaultAsync(p => p.Id == planillaId, cancellationToken);
                if (planilla != null)
                {
                    _context.PlanillasDiarias.Remove(planilla);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            return true;
        }
    }

    // 5. Command: Eliminar día completo
    public record EliminarPlanillaDiaCommand(Guid PlanillaId) : IRequest<bool>;

    public class EliminarPlanillaDiaCommandHandler : IRequestHandler<EliminarPlanillaDiaCommand, bool>
    {
        private readonly IApplicationDbContext _context;

        public EliminarPlanillaDiaCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(EliminarPlanillaDiaCommand request, CancellationToken cancellationToken)
        {
            var planilla = await _context.PlanillasDiarias
                .Include(p => p.Archivos)
                .FirstOrDefaultAsync(p => p.Id == request.PlanillaId, cancellationToken);

            if (planilla == null) return false;

            _context.PlanillasDiarias.Remove(planilla);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
