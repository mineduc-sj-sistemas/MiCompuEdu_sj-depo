using System;
using System.Linq;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize(Roles = "Supervisor,Administrador")]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public AuditoriaController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{tabla}/{registroId}")]
        public async Task<IActionResult> ObtenerHistorial(string tabla, Guid registroId)
        {
            var logs = await _context.AuditLogs
                .Include(a => a.Usuario)
                .Where(a => a.Tabla.ToLower() == tabla.ToLower() && a.RegistroId == registroId)
                .OrderBy(a => a.Fecha)
                .Select(a => new
                {
                    a.Id,
                    a.Tabla,
                    a.RegistroId,
                    a.Accion,
                    a.Fecha,
                    Usuario = a.Usuario != null ? a.Usuario.NombreCompleto : "Sistema/Desconocido",
                    a.DatosAnteriores,
                    a.DatosNuevos
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
