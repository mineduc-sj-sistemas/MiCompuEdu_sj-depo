using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Dashboard.Queries;
using MiCompuEdu.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ISender _mediator;

        public DashboardController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Supervisor,Administrador")]
        public async Task<ActionResult<DashboardDto>> ObtenerEstadisticas()
        {
            var query = new GetDashboardStatsQuery();
            var resultado = await _mediator.Send(query);
            return Ok(resultado);
        }
    }
}
