using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Programas.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProgramasController : ControllerBase
    {
        private readonly ISender _mediator;

        public ProgramasController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<List<ProgramaEducativoDto>>> ObtenerTodos()
        {
            var query = new GetProgramasEducativosQuery();
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }
    }
}
