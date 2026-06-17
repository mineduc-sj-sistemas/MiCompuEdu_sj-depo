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
            var beneficiario = await _context.Beneficiarios
                .Include(b => b.Escuela)
                .Include(b => b.Equipos)
                    .ThenInclude(e => e.ProgramaEducativo)
                .FirstOrDefaultAsync(b => b.Dni == request.Dni, cancellationToken);

            // Demo Auto-generator helper
            if (beneficiario == null)
            {
                if (request.Dni.Length >= 7 && request.Dni.Length <= 9 && double.TryParse(request.Dni, out _))
                {
                    beneficiario = new Beneficiario
                    {
                        Id = Guid.NewGuid(),
                        Dni = request.Dni,
                        Nombre = "Juan",
                        Apellido = "Pérez (Demo)",
                        Telefono = "+542644010203",
                        Email = $"juan.perez.{request.Dni}@sanjuan.edu.ar",
                        CreadoEn = DateTime.UtcNow
                    };

                    var equipo = new Equipo
                    {
                        Id = Guid.NewGuid(),
                        NumeroSerie = $"S-EDU-{request.Dni}-X",
                        Marca = "Exo",
                        Modelo = "Juana Manso v2",
                        CredencialesOffice = $"office.juan.{request.Dni} / pass1234",
                        BeneficiarioId = beneficiario.Id,
                        CreadoEn = DateTime.UtcNow
                    };

                    _context.Beneficiarios.Add(beneficiario);
                    _context.Equipos.Add(equipo);
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    beneficiario = await _context.Beneficiarios
                        .Include(b => b.Escuela)
                        .Include(b => b.Equipos)
                            .ThenInclude(e => e.ProgramaEducativo)
                        .FirstOrDefaultAsync(b => b.Dni == request.Dni, cancellationToken);
                }
                else
                {
                    return null;
                }
            }

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
                EscuelaId = beneficiario.EscuelaId,
                EscuelaNombre = beneficiario.Escuela?.Nombre,
                EscuelaCue = beneficiario.Escuela?.Cue,
                Equipo = equipoDto
            };
        }
    }
}
