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

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReparacionesController : ControllerBase
    {
        private readonly ISender _mediator;

        public ReparacionesController(ISender mediator)
        {
            _mediator = mediator;
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
                request.FallaReportada,
                request.FallaCatalogoId,
                request.Observaciones,
                operadorId
            );

            var resultado = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<ReparacionDto>>> ObtenerTodos([FromQuery] string? estado, [FromQuery] string? busqueda)
        {
            var query = new GetReparacionesQuery(estado, busqueda);
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
                usuarioId
            );

            var resultado = await _mediator.Send(command);
            return Ok(resultado);
        }
    }

    public record CreateReparacionRequest(
        Guid EquipoId,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones
    );

    public record UpdateEstadoRequest(
        string NuevoEstado,
        string? Diagnostico,
        string? AccionesRealizadas,
        string? Observaciones
    );
}
