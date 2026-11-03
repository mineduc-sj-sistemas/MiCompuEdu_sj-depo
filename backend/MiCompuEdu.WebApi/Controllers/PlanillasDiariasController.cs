using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class PlanillasDiariasController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public PlanillasDiariasController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<List<PlanillaDiariaDto>>> GetPlanillas([FromQuery] string? fecha = null, CancellationToken cancellationToken = default)
        {
            var query = _context.PlanillasDiarias
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(fecha) && DateTime.TryParse(fecha, out var parsedDate))
            {
                var startUtc = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, 0, 0, 0, DateTimeKind.Utc);
                var endUtc = startUtc.AddDays(1);
                query = query.Where(p => p.Fecha >= startUtc && p.Fecha < endUtc);
            }

            var planillas = await query
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

            return Ok(planillas);
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        [RequestSizeLimit(52428800)] // 50 MB max
        public async Task<ActionResult<PlanillaDiariaDto>> SubirPlanilla(
            [FromForm] string fecha,
            [FromForm] string? observaciones,
            [FromForm] List<IFormFile> archivos,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(fecha) || !DateTime.TryParse(fecha, out var parsedDate))
            {
                return BadRequest("Debe indicar una fecha válida (YYYY-MM-DD).");
            }

            if (archivos == null || archivos.Count == 0)
            {
                return BadRequest("Debe adjuntar al menos una hoja escaneada (imagen o PDF).");
            }

            Guid? usuarioId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                usuarioId = parsedUserId;
            }

            var usuarioNombre = User.FindFirst(ClaimTypes.Name)?.Value ?? "Operador";
            if (usuarioId.HasValue)
            {
                var dbUser = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == usuarioId.Value, cancellationToken);
                if (dbUser != null && !string.IsNullOrWhiteSpace(dbUser.NombreCompleto))
                {
                    usuarioNombre = dbUser.NombreCompleto;
                }
            }

            var fechaUtc = new DateTime(parsedDate.Year, parsedDate.Month, parsedDate.Day, 0, 0, 0, DateTimeKind.Utc);
            var endUtc = fechaUtc.AddDays(1);

            // Buscar si ya existe un registro para ese día para agregarle más hojas
            var planilla = await _context.PlanillasDiarias
                .Include(p => p.Archivos)
                .FirstOrDefaultAsync(p => p.Fecha >= fechaUtc && p.Fecha < endUtc, cancellationToken);

            if (planilla == null)
            {
                planilla = new PlanillaDiaria
                {
                    Fecha = fechaUtc,
                    Observaciones = observaciones?.Trim(),
                    SubidoPorId = usuarioId,
                    SubidoPorNombre = usuarioNombre
                };
                _context.PlanillasDiarias.Add(planilla);
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(observaciones))
                {
                    planilla.Observaciones = string.IsNullOrWhiteSpace(planilla.Observaciones)
                        ? observaciones.Trim()
                        : $"{planilla.Observaciones} | {observaciones.Trim()}";
                }
                planilla.SubidoPorId = usuarioId;
                planilla.SubidoPorNombre = usuarioNombre;
                planilla.ActualizadoEn = DateTime.UtcNow;
            }

            foreach (var file in archivos)
            {
                if (file.Length <= 0) continue;

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, cancellationToken);
                var bytes = ms.ToArray();
                var base64 = Convert.ToBase64String(bytes);

                var contentType = file.ContentType;
                if (string.IsNullOrWhiteSpace(contentType) || contentType == "application/octet-stream")
                {
                    var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
                    contentType = ext switch
                    {
                        ".pdf" => "application/pdf",
                        ".png" => "image/png",
                        ".webp" => "image/webp",
                        _ => "image/jpeg"
                    };
                }

                var nuevoArchivo = new ArchivoPlanillaDiaria
                {
                    PlanillaDiariaId = planilla.Id,
                    NombreArchivo = file.FileName,
                    TipoContenido = contentType,
                    ContenidoBase64 = base64,
                    TamanoBytes = file.Length
                };

                _context.ArchivosPlanillaDiaria.Add(nuevoArchivo);
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Recargar proyección limpia
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
                .FirstOrDefaultAsync(cancellationToken);

            return Ok(result);
        }

        [HttpGet("archivo/{archivoId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> ObtenerArchivo(Guid archivoId, CancellationToken cancellationToken = default)
        {
            var archivo = await _context.ArchivosPlanillaDiaria
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == archivoId, cancellationToken);

            if (archivo == null || string.IsNullOrWhiteSpace(archivo.ContenidoBase64))
            {
                return NotFound("Archivo no encontrado.");
            }

            try
            {
                var bytes = Convert.FromBase64String(archivo.ContenidoBase64);
                Response.Headers["Content-Disposition"] = $"inline; filename=\"{Uri.EscapeDataString(archivo.NombreArchivo)}\"";
                return File(bytes, archivo.TipoContenido);
            }
            catch
            {
                return BadRequest("El contenido del archivo no es válido.");
            }
        }

        [HttpDelete("archivo/{archivoId:guid}")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<IActionResult> EliminarArchivo(Guid archivoId, CancellationToken cancellationToken = default)
        {
            var archivo = await _context.ArchivosPlanillaDiaria
                .FirstOrDefaultAsync(a => a.Id == archivoId, cancellationToken);

            if (archivo == null)
            {
                return NotFound("La hoja solicitada no existe.");
            }

            var planillaId = archivo.PlanillaDiariaId;
            _context.ArchivosPlanillaDiaria.Remove(archivo);
            await _context.SaveChangesAsync(cancellationToken);

            // Si la planilla quedó sin archivos activos, también limpiamos el contenedor del día
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

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<IActionResult> EliminarPlanillaDia(Guid id, CancellationToken cancellationToken = default)
        {
            var planilla = await _context.PlanillasDiarias
                .Include(p => p.Archivos)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            if (planilla == null)
            {
                return NotFound("No se encontró el registro de planillas para ese día.");
            }

            _context.PlanillasDiarias.Remove(planilla);
            await _context.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }

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
}
