using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Escuelas.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class EscuelasController : ControllerBase
    {
        private readonly ISender _mediator;

        public EscuelasController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<EscuelaDto>>> ObtenerTodas()
        {
            var query = new GetEscuelasQuery();
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<EscuelaDto>> Crear(MiCompuEdu.Application.Escuelas.Commands.CreateEscuelaCommand command)
        {
            var resultado = await _mediator.Send(command);
            return Ok(resultado);
        }
    }
}
