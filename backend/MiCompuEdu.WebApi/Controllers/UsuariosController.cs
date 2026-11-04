using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Usuarios.Commands;
using MiCompuEdu.Application.Usuarios.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize(Roles = "Administrador")]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly ISender _mediator;

        public UsuariosController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<UsuarioDto>>> ObtenerTodos(CancellationToken cancellationToken = default)
        {
            var query = new GetUsuariosQuery();
            var resultado = await _mediator.Send(query, cancellationToken);
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioDto>> Crear([FromBody] CreateUsuarioRequest request, CancellationToken cancellationToken = default)
        {
            var command = new CreateUsuarioCommand(
                request.NombreCompleto,
                request.NombreUsuario,
                request.Email,
                request.Password,
                request.Rol
            );

            var resultado = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(Crear), new { id = resultado.Id }, resultado);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UsuarioDto>> Actualizar(Guid id, [FromBody] UpdateUsuarioRequest request, CancellationToken cancellationToken = default)
        {
            var command = new UpdateUsuarioCommand(
                id,
                request.NombreCompleto,
                request.Email,
                request.Password,
                request.Rol
            );

            var resultado = await _mediator.Send(command, cancellationToken);
            return Ok(resultado);
        }

        [HttpPut("{id}/toggle-active")]
        public async Task<ActionResult<bool>> ToggleActive(Guid id, CancellationToken cancellationToken = default)
        {
            var command = new ToggleUsuarioActiveCommand(id);
            var resultado = await _mediator.Send(command, cancellationToken);
            return Ok(resultado);
        }
    }

    public record CreateUsuarioRequest(
        string NombreCompleto,
        string NombreUsuario,
        string Email,
        string Password,
        string Rol
    );

    public record UpdateUsuarioRequest(
        string NombreCompleto,
        string Email,
        string? Password,
        string Rol
    );
}
