using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Common.Security;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Reparaciones.Commands;
using MiCompuEdu.Application.Reparaciones.Queries;
using MiCompuEdu.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReparacionesController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly ICurrentUserService _currentUser;

        public ReparacionesController(ISender mediator, ICurrentUserService currentUser)
        {
            _mediator = mediator;
            _currentUser = currentUser;
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<ReparacionDto>> RegistrarIngreso(
            [FromBody] CreateReparacionRequest request,
            CancellationToken cancellationToken)
        {
            if (!_currentUser.UserId.HasValue)
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");

            var resultado = await _mediator.Send(request.ToCommand(_currentUser.UserId.Value), cancellationToken);
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }

        [HttpPost("manual")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<ReparacionDto>> RegistrarIngresoManual(
            [FromBody] CreateReparacionManualRequest request,
            CancellationToken cancellationToken)
        {
            if (!_currentUser.UserId.HasValue)
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");

            var resultado = await _mediator.Send(request.ToCommand(_currentUser.UserId.Value), cancellationToken);
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }

        [HttpGet("{id}/historial")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<HistorialMovimientoDto>>> ObtenerHistorial(Guid id, CancellationToken cancellationToken)
        {
            var resultado = await _mediator.Send(new GetHistorialMovimientosQuery(id), cancellationToken);
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
            [FromQuery] DateTime? fechaFin,
            CancellationToken cancellationToken)
        {
            var query = new GetReparacionesQuery(
                estado, busqueda, escuelaId, programaEducativoId,
                tecnicoAsignadoId, fallaCatalogoId, fechaInicio, fechaFin
            );
            return Ok(await _mediator.Send(query, cancellationToken));
        }

        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<bool>> ActualizarEstado(
            Guid id,
            [FromBody] UpdateEstadoRequest request,
            CancellationToken cancellationToken)
        {
            if (!_currentUser.UserId.HasValue)
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");

            if (!Enum.TryParse<EstadoEquipo>(request.NuevoEstado, out var parsedEstado))
                return BadRequest($"El estado '{request.NuevoEstado}' no es un estado de reparación válido.");

            try
            {
                var resultado = await _mediator.Send(request.ToCommand(id, parsedEstado, _currentUser.UserId.Value), cancellationToken);
                return Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id}/notificaciones")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<NotificacionDto>>> ObtenerNotificaciones(Guid id, CancellationToken cancellationToken)
        {
            return Ok(await _mediator.Send(new GetNotificacionesByReparacionQuery(id), cancellationToken));
        }

        [HttpPost("{id}/evidencias")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<EvidenciaDto>> SubirEvidencia(
            Guid id,
            [FromForm] IFormFile file,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No se proporcionó ningún archivo válido.");

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var bytes = ms.ToArray();

            var validation = FileSecurityValidator.ValidateFile(file.FileName, bytes);
            if (!validation.IsValid)
                return BadRequest(validation.ErrorMessage);

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "evidencias");
            Directory.CreateDirectory(uploadsFolder);

            var safeFileName = $"{Guid.NewGuid()}{validation.SafeExtension}";
            await System.IO.File.WriteAllBytesAsync(Path.Combine(uploadsFolder, safeFileName), bytes, cancellationToken);

            var resultado = await _mediator.Send(new AgregarEvidenciaCommand(id, $"/uploads/evidencias/{safeFileName}", file.FileName), cancellationToken);
            return CreatedAtAction(nameof(SubirEvidencia), new { id = resultado.Id }, resultado);
        }

        [HttpGet("{id}/comprobante")]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<IActionResult> DescargarComprobante(Guid id, CancellationToken cancellationToken)
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "comprobantes", $"{id}.pdf");
            if (!System.IO.File.Exists(filePath))
                return NotFound("El archivo físico del comprobante no existe en el servidor.");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);
            return File(fileBytes, "application/pdf", $"comprobante_{id.ToString().Substring(0, 8)}.pdf");
        }

        [HttpGet("{id}/estado-publico")]
        [HttpGet("consulta-publica/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<EstadoPublicoReparacionDto>> ObtenerEstadoPublico(Guid id, CancellationToken cancellationToken)
        {
            var rep = await _mediator.Send(new GetEstadoPublicoReparacionQuery(id), cancellationToken);
            if (rep == null) return NotFound("No se encontró información para la reparación consultada.");
            return Ok(rep);
        }
    }
}
