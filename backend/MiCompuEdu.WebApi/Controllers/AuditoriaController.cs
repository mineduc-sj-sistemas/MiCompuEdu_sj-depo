using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Auditoria.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize(Roles = "Supervisor,Administrador")]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly ISender _mediator;

        public AuditoriaController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{tabla}/{registroId}")]
        public async Task<IActionResult> ObtenerHistorial(string tabla, Guid registroId, CancellationToken cancellationToken)
        {
            var logs = await _mediator.Send(new GetAuditLogsQuery(tabla, registroId), cancellationToken);
            return Ok(logs);
        }
    }
}
