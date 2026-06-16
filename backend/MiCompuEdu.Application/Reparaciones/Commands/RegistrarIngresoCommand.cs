using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Commands
{
    public record RegistrarIngresoCommand(
        Guid EquipoId,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid OperadorId
    ) : IRequest<ReparacionDto>;

    public class RegistrarIngresoCommandHandler : IRequestHandler<RegistrarIngresoCommand, ReparacionDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPdfGeneratorService _pdfGeneratorService;

        public RegistrarIngresoCommandHandler(IApplicationDbContext context, IPdfGeneratorService pdfGeneratorService)
        {
            _context = context;
            _pdfGeneratorService = pdfGeneratorService;
        }

        public async Task<ReparacionDto> Handle(RegistrarIngresoCommand request, CancellationToken cancellationToken)
        {
            var equipo = await _context.Equipos
                .Include(e => e.Beneficiario)
                .FirstOrDefaultAsync(e => e.Id == request.EquipoId, cancellationToken);

            if (equipo == null)
            {
                throw new KeyNotFoundException($"El equipo con ID {request.EquipoId} no existe.");
            }

            var reparacion = new Reparacion
            {
                Id = Guid.NewGuid(),
                EquipoId = request.EquipoId,
                OperadorIngresoId = request.OperadorId,
                Estado = EstadoEquipo.Ingresado,
                FallaReportada = request.FallaReportada,
                FallaCatalogoId = request.FallaCatalogoId,
                Observaciones = request.Observaciones,
                FechaIngreso = DateTime.UtcNow
            };

            reparacion.Equipo = equipo;

            // Registro en Historial
            var movimiento = new HistorialMovimiento
            {
                Id = Guid.NewGuid(),
                ReparacionId = reparacion.Id,
                EstadoAnterior = null,
                EstadoNuevo = EstadoEquipo.Ingresado,
                UsuarioId = request.OperadorId,
                Observaciones = "Ingreso inicial registrado en sistema.",
                FechaMovimiento = DateTime.UtcNow
            };

            _context.Reparaciones.Add(reparacion);
            _context.HistorialMovimientos.Add(movimiento);
            
            await _context.SaveChangesAsync(cancellationToken);

            // Generar el PDF real y guardar su ruta
            try
            {
                var pdfUrl = await _pdfGeneratorService.GenerateReceiptPdfAsync(reparacion);
                reparacion.ComprobanteUrl = pdfUrl;
            }
            catch
            {
                reparacion.ComprobanteUrl = $"/comprobantes/{reparacion.Id}.pdf";
            }
            await _context.SaveChangesAsync(cancellationToken);

            return new ReparacionDto
            {
                Id = reparacion.Id,
                EquipoId = equipo.Id,
                NumeroSerie = equipo.NumeroSerie,
                MarcaModelo = $"{equipo.Marca} {equipo.Modelo}",
                NombreTutor = $"{equipo.Beneficiario.Nombre} {equipo.Beneficiario.Apellido}",
                TelefonoTutor = equipo.Beneficiario.Telefono,
                Estado = reparacion.Estado.ToString(),
                FallaReportada = reparacion.FallaReportada,
                Diagnostico = reparacion.Diagnostico,
                AccionesRealizadas = reparacion.AccionesRealizadas,
                Observaciones = reparacion.Observaciones,
                ComprobanteUrl = reparacion.ComprobanteUrl,
                FechaIngreso = reparacion.FechaIngreso,
                FechaEntrega = reparacion.FechaEntrega
            };
        }
    }
}
