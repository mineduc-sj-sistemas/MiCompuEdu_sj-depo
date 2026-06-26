using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Beneficiarios.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ImportacionController : ControllerBase
    {
        private readonly ISender _mediator;

        public ImportacionController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("padron")]
        [Authorize(Roles = "Supervisor,Administrador")]
        public async Task<ActionResult<ImportarPadronResultDto>> ImportarPadron([FromForm] IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
            {
                return BadRequest("No se ha seleccionado ningún archivo o el archivo está vacío.");
            }

            // Validar extensión
            var extension = System.IO.Path.GetExtension(archivo.FileName).ToLower();
            if (extension != ".xlsx" && extension != ".xls")
            {
                return BadRequest("Formato de archivo no válido. Solo se admiten archivos de Excel (.xlsx, .xls).");
            }

            using var stream = archivo.OpenReadStream();
            var command = new ImportarPadronCommand(stream);
            var resultado = await _mediator.Send(command);

            return Ok(resultado);
        }
    }
}
