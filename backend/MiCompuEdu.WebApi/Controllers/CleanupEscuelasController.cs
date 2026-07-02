using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiCompuEdu.Application.Common.Interfaces;

namespace MiCompuEdu.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CleanupEscuelasController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public CleanupEscuelasController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("run")]
        public async Task<IActionResult> Run()
        {
            var escuelas = await _context.Escuelas.ToListAsync();
            var grouped = escuelas.GroupBy(e => e.Nombre.Trim().ToUpper()).Where(g => g.Count() > 1);

            int deleted = 0;
            foreach (var group in grouped)
            {
                var mainEscuela = group.OrderBy(e => e.CreadoEn).First();
                var duplicates = group.Where(e => e.Id != mainEscuela.Id).ToList();

                foreach (var dup in duplicates)
                {
                    // Reasignar beneficiarios
                    var beneficiarios = await _context.Beneficiarios.Where(b => b.EscuelaId == dup.Id).ToListAsync();
                    foreach (var b in beneficiarios)
                    {
                        b.EscuelaId = mainEscuela.Id;
                    }

                    _context.Escuelas.Remove(dup);
                    deleted++;
                }
            }

            await _context.SaveChangesAsync(default);
            return Ok(new { Message = $"Limpieza completada. {deleted} escuelas duplicadas fueron eliminadas." });
        }
    }
}
