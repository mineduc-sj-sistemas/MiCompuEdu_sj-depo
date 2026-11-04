using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Escuelas.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize(Roles = "Administrador")]
    [ApiController]
    [Route("api/[controller]")]
    public class CleanupEscuelasController : ControllerBase
    {
        private readonly ISender _mediator;

        public CleanupEscuelasController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("run")]
        public async Task<IActionResult> Run(CancellationToken cancellationToken)
        {
            var deleted = await _mediator.Send(new CleanupDuplicateEscuelasCommand(), cancellationToken);
            return Ok(new { Message = $"Limpieza completada. {deleted} escuelas duplicadas fueron eliminadas." });
        }
    }
}
