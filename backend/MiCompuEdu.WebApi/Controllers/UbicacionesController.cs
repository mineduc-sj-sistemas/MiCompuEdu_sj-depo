using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Ubicaciones.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class UbicacionesController : ControllerBase
    {
        private readonly ISender _mediator;

        public UbicacionesController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Roles = "Operador,Tecnico,Supervisor,Administrador")]
        public async Task<ActionResult<List<UbicacionDepositoDto>>> ObtenerTodas()
        {
            var query = new GetUbicacionesQuery();
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }
    }
}
