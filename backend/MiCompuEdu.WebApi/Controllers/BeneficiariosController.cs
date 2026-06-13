using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Beneficiarios.Queries;
using MiCompuEdu.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class BeneficiariosController : ControllerBase
    {
        private readonly ISender _mediator;

        public BeneficiariosController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{dni}")]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<BeneficiarioDto>> ObtenerPorDni(string dni)
        {
            var query = new GetBeneficiarioByDniQuery(dni);
            var resultado = await _mediator.Send(query);

            if (resultado == null)
            {
                return NotFound("Beneficiario no encontrado en el padrón nominal.");
            }

            return Ok(resultado);
        }
    }
}
