using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Reparaciones.Commands;
using MiCompuEdu.Application.Reparaciones.Queries;
using MiCompuEdu.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReparacionesController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly IApplicationDbContext _context;

        public ReparacionesController(ISender mediator, IApplicationDbContext context)
        {
            _mediator = mediator;
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<ReparacionDto>> RegistrarIngreso([FromBody] CreateReparacionRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var operadorId))
            {
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");
            }

            var command = new RegistrarIngresoCommand(
                request.EquipoId,
                request.EquipoMarca,
                request.EquipoModelo,
                request.FallaReportada,
                request.FallaCatalogoId,
                request.Observaciones,
                operadorId,
                request.EscuelaId,
                request.ProgramaEducativoId,
                request.UbicacionDepositoId,
                request.FirmaIngresoBase64,
                request.FechaIngreso,
                request.SoloCargador,
                request.TipoBeneficiario,
                request.NuevoEquipoNumeroSerie,
                request.NuevoEquipoMarca,
                request.NuevoEquipoModelo,
                request.NuevoEquipoCredencialesOffice,
                request.TutorNombre,
                request.TutorDni,
                request.TutorTelefono,
                request.TitularTelefono
            );

            var resultado = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }

        [HttpPost("manual")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<ReparacionDto>> RegistrarIngresoManual([FromBody] CreateReparacionManualRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var operadorId))
            {
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");
            }

            var command = new MiCompuEdu.Application.Reparaciones.Commands.RegistrarIngresoManualCommand(
                request.TitularDni,
                request.TitularNombre,
                request.TitularApellido,
                request.TitularTelefono,
                request.TitularEmail,
                request.TipoBeneficiario,
                request.EquipoNumeroSerie,
                request.EquipoMarca,
                request.EquipoModelo,
                request.EquipoCredencialesOffice,
                request.FallaReportada,
                request.FallaCatalogoId,
                request.Observaciones,
                operadorId,
                request.EscuelaId,
                request.ProgramaEducativoId,
                request.UbicacionDepositoId,
                request.FirmaIngresoBase64,
                request.FechaIngreso,
                request.SoloCargador,
                request.TutorNombre,
                request.TutorDni,
                request.TutorTelefono
            );

            var resultado = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }

        [HttpGet("{id}/historial")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<HistorialMovimientoDto>>> ObtenerHistorial(Guid id)
        {
            var query = new GetHistorialMovimientosQuery(id);
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<ReparacionDto>>> ObtenerTodos(
            [FromQuery] string? estado, 
            [FromQuery] string? busqueda,
            [FromQuery] Guid? escuelaId,
            [FromQuery] Guid? programaEducativoId,
            [FromQuery] Guid? tecnicoAsignadoId,
            [FromQuery] int? fallaCatalogoId,
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            var query = new GetReparacionesQuery(
                estado, 
                busqueda, 
                escuelaId, 
                programaEducativoId, 
                tecnicoAsignadoId, 
                fallaCatalogoId, 
                fechaInicio, 
                fechaFin
            );
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }

        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<bool>> ActualizarEstado(Guid id, [FromBody] UpdateEstadoRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var usuarioId))
            {
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");
            }

            if (!Enum.TryParse<EstadoEquipo>(request.NuevoEstado, out var parsedEstado))
            {
                return BadRequest($"El estado '{request.NuevoEstado}' no es un estado de reparación válido.");
            }

            var command = new ActualizarEstadoCommand(
                id,
                parsedEstado,
                request.Diagnostico,
                request.AccionesRealizadas,
                request.Observaciones,
                usuarioId,
                request.ProveedorGarantia,
                request.RemitoGarantia,
                request.FechaEsperadaGarantia,
                request.FirmaEntregaBase64,
                request.TelefonoContacto,
                request.TutorNombre,
                request.TutorDni
            );

            var resultado = await _mediator.Send(command);
            return Ok(resultado);
        }

        [HttpGet("{id}/notificaciones")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<NotificacionDto>>> ObtenerNotificaciones(Guid id)
        {
            var query = new GetNotificacionesByReparacionQuery(id);
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }

        [HttpPost("{id}/evidencias")]
        [Authorize(Roles = "Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<EvidenciaDto>> SubirEvidencia(Guid id, [FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No se proporcionó ningún archivo válido.");
            }

            try
            {
                var extension = System.IO.Path.GetExtension(file.FileName).ToLower();
                var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                if (!System.Linq.Enumerable.Contains(extensionesPermitidas, extension))
                {
                    return BadRequest("Tipo de archivo no permitido. Solo se permiten imágenes (jpg, jpeg, png) y PDFs.");
                }

                // Asegurar directorio uploads/evidencias en wwwroot
                var uploadsFolder = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "uploads", "evidencias");
                if (!System.IO.Directory.Exists(uploadsFolder))
                {
                    System.IO.Directory.CreateDirectory(uploadsFolder);
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = System.IO.Path.Combine(uploadsFolder, fileName);

                using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var urlArchivo = $"/uploads/evidencias/{fileName}";
                var command = new AgregarEvidenciaCommand(id, urlArchivo, file.FileName);

                var resultado = await _mediator.Send(command);
                return CreatedAtAction(nameof(SubirEvidencia), new { id = resultado.Id }, resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al guardar la evidencia física: {ex.Message}");
            }
        }

        [HttpGet("{id}/comprobante")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<IActionResult> DescargarComprobante(Guid id)
        {
            var filePath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "App_Data", "comprobantes", $"{id}.pdf");
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("El archivo físico del comprobante no existe en el servidor.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "application/pdf", $"comprobante_{id.ToString().Substring(0, 8)}.pdf");
        }

        [HttpGet("{id}/estado-publico")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> ObtenerEstadoPublico(Guid id)
        {
            var rep = await _context.Reparaciones
                .Include(r => r.Equipo)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rep == null)
            {
                return NotFound("No se encontró información para la reparación consultada.");
            }

            return Ok(new
            {
                NumeroSerie = rep.Equipo.NumeroSerie,
                MarcaModelo = $"{rep.Equipo.Marca} {rep.Equipo.Modelo}",
                Estado = rep.Estado.ToString(),
                FechaIngreso = rep.FechaIngreso,
                FechaLimite = rep.FechaLimite
            });
        }
    }

    public record CreateReparacionRequest(
        Guid EquipoId,
        string? EquipoMarca,
        string? EquipoModelo,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null,
        DateTime? FechaIngreso = null,
        bool SoloCargador = false,
        MiCompuEdu.Domain.Enums.TipoBeneficiario? TipoBeneficiario = null,
        string? NuevoEquipoNumeroSerie = null,
        string? NuevoEquipoMarca = null,
        string? NuevoEquipoModelo = null,
        string? NuevoEquipoCredencialesOffice = null,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null,
        string? TitularTelefono = null
    );

    public record CreateReparacionManualRequest(
        string TitularDni,
        string TitularNombre,
        string TitularApellido,
        string TitularTelefono,
        string TitularEmail,
        MiCompuEdu.Domain.Enums.TipoBeneficiario TipoBeneficiario,
        string EquipoNumeroSerie,
        string EquipoMarca,
        string EquipoModelo,
        string? EquipoCredencialesOffice,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null,
        DateTime? FechaIngreso = null,
        bool SoloCargador = false,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null
    );

    public record UpdateEstadoRequest(
        string NuevoEstado,
        string? Diagnostico,
        string? AccionesRealizadas,
        string? Observaciones,
        string? ProveedorGarantia = null,
        string? RemitoGarantia = null,
        DateTime? FechaEsperadaGarantia = null,
        string? FirmaEntregaBase64 = null,
        string? TelefonoContacto = null,
        string? TutorNombre = null,
        string? TutorDni = null
    );
}
