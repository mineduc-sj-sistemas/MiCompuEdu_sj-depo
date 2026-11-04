using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.PlanillasDiarias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class PlanillasDiariasController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly ICurrentUserService _currentUser;

        public PlanillasDiariasController(ISender mediator, ICurrentUserService currentUser)
        {
            _mediator = mediator;
            _currentUser = currentUser;
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<List<PlanillaDiariaDto>>> GetPlanillas(
            [FromQuery] string? fecha = null,
            CancellationToken cancellationToken = default)
        {
            var planillas = await _mediator.Send(new GetPlanillasDiariasQuery(fecha), cancellationToken);
            return Ok(planillas);
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        [RequestSizeLimit(52428800)]
        public async Task<ActionResult<PlanillaDiariaDto>> SubirPlanilla(
            [FromForm] string fecha,
            [FromForm] string? observaciones,
            [FromForm] List<IFormFile> archivos,
            CancellationToken cancellationToken = default)
        {
            if (archivos == null || archivos.Count == 0)
            {
                return BadRequest("Debe adjuntar al menos una hoja escaneada (imagen o PDF).");
            }

            var inputs = new List<ArchivoPlanillaInput>();
            foreach (var file in archivos)
            {
                if (file.Length <= 0) continue;
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, cancellationToken);
                inputs.Add(new ArchivoPlanillaInput(file.FileName, ms.ToArray()));
            }

            try
            {
                var result = await _mediator.Send(new SubirPlanillaDiariaCommand(
                    fecha,
                    observaciones,
                    _currentUser.UserId,
                    _currentUser.UserName ?? "Operador",
                    inputs
                ), cancellationToken);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("archivo/{archivoId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> ObtenerArchivo(Guid archivoId, CancellationToken cancellationToken = default)
        {
            var archivo = await _mediator.Send(new GetArchivoPlanillaQuery(archivoId), cancellationToken);
            if (archivo == null)
            {
                return NotFound("Archivo no encontrado.");
            }

            Response.Headers["Content-Disposition"] = $"inline; filename=\"{Uri.EscapeDataString(archivo.NombreArchivo)}\"";
            return File(archivo.Bytes, archivo.TipoContenido);
        }

        [HttpDelete("archivo/{archivoId:guid}")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<IActionResult> EliminarArchivo(Guid archivoId, CancellationToken cancellationToken = default)
        {
            var eliminado = await _mediator.Send(new EliminarArchivoPlanillaCommand(archivoId), cancellationToken);
            if (!eliminado) return NotFound("La hoja solicitada no existe.");
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<IActionResult> EliminarPlanillaDia(Guid id, CancellationToken cancellationToken = default)
        {
            var eliminado = await _mediator.Send(new EliminarPlanillaDiaCommand(id), cancellationToken);
            if (!eliminado) return NotFound("No se encontró el registro de planillas para ese día.");
            return NoContent();
        }
    }
}
