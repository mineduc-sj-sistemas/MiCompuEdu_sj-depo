using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Beneficiarios.Queries
{
    public record GetBeneficiarioByDniQuery(string Dni) : IRequest<BeneficiarioDto?>;

    public class GetBeneficiarioByDniQueryHandler : IRequestHandler<GetBeneficiarioByDniQuery, BeneficiarioDto?>
    {
        private readonly IApplicationDbContext _context;

        public GetBeneficiarioByDniQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BeneficiarioDto?> Handle(GetBeneficiarioByDniQuery request, CancellationToken cancellationToken)
        {
            var term = request.Dni.Trim().ToUpper();
            var beneficiario = await _context.Beneficiarios
                .Include(b => b.Escuela)
                .Include(b => b.Equipos)
                    .ThenInclude(e => e.ProgramaEducativo)
                .FirstOrDefaultAsync(b => b.Dni.ToUpper() == term || b.Equipos.Any(e => e.NumeroSerie.ToUpper() == term), cancellationToken);

            if (beneficiario == null) return null;

            EquipoDto? equipoDto = null;
            var eq = beneficiario.Equipos.FirstOrDefault();
            if (eq != null)
            {
                equipoDto = new EquipoDto
                {
                    Id = eq.Id,
                    NumeroSerie = eq.NumeroSerie,
                    Marca = eq.Marca,
                    Modelo = eq.Modelo,
                    CredencialesOffice = eq.CredencialesOffice,
                    ProgramaEducativoId = eq.ProgramaEducativoId,
                    ProgramaEducativoNombre = eq.ProgramaEducativo?.Nombre
                };
            }

            return new BeneficiarioDto
            {
                Id = beneficiario.Id,
                Dni = beneficiario.Dni,
                Nombre = beneficiario.Nombre,
                Apellido = beneficiario.Apellido,
                Telefono = beneficiario.Telefono,
                Email = beneficiario.Email,
                TipoBeneficiario = (int)beneficiario.TipoBeneficiario,
                EscuelaId = beneficiario.EscuelaId,
                EscuelaNombre = beneficiario.Escuela?.Nombre,
                DniTutor = beneficiario.DniTutor,
                NombreTutor = beneficiario.NombreTutor,
                TelefonoTutor = beneficiario.TelefonoTutor,
                Grado = beneficiario.Grado,
                Seccion = beneficiario.Seccion,
                Equipo = equipoDto
            };
        }
    }
}
