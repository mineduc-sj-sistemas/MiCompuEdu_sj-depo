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
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<List<EscuelaDto>>> ObtenerTodas()
        {
            var query = new GetEscuelasQuery();
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }
    }
}
