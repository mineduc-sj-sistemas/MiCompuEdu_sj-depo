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
        Guid OperadorId,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null
    ) : IRequest<ReparacionDto>;

    public class RegistrarIngresoCommandHandler : IRequestHandler<RegistrarIngresoCommand, ReparacionDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPdfGeneratorService _pdfGeneratorService;
        private readonly ISignalRService _signalRService;

        public RegistrarIngresoCommandHandler(IApplicationDbContext context, IPdfGeneratorService pdfGeneratorService, ISignalRService signalRService)
        {
            _context = context;
            _pdfGeneratorService = pdfGeneratorService;
            _signalRService = signalRService;
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

            // Actualizar Escuela del Beneficiario en caliente si viene en la request y no estaba cargada
            if (request.EscuelaId.HasValue && equipo.Beneficiario.EscuelaId != request.EscuelaId.Value)
            {
                equipo.Beneficiario.EscuelaId = request.EscuelaId.Value;
            }

            // Actualizar Programa del Equipo en caliente si viene en la request y no estaba cargado
            if (request.ProgramaEducativoId.HasValue && equipo.ProgramaEducativoId != request.ProgramaEducativoId.Value)
            {
                equipo.ProgramaEducativoId = request.ProgramaEducativoId.Value;
            }

            double promedioDias = 7.0;
            if (request.FallaCatalogoId.HasValue)
            {
                var historialReparaciones = await _context.Reparaciones
                    .Where(r => r.FallaCatalogoId == request.FallaCatalogoId.Value && r.Estado == EstadoEquipo.Entregado && r.FechaEntrega.HasValue)
                    .Select(r => new { r.FechaIngreso, r.FechaEntrega })
                    .ToListAsync(cancellationToken);

                if (historialReparaciones.Count > 0)
                {
                    double totalDays = 0;
                    foreach (var hist in historialReparaciones)
                    {
                        totalDays += (hist.FechaEntrega.Value - hist.FechaIngreso).TotalDays;
                    }
                    promedioDias = totalDays / historialReparaciones.Count;
                    if (promedioDias < 1) promedioDias = 1.0;
                }
            }

            var fechaIngreso = DateTime.UtcNow;
            var fechaLimite = fechaIngreso.AddDays(promedioDias);

            var reparacion = new Reparacion
            {
                Id = Guid.NewGuid(),
                EquipoId = request.EquipoId,
                OperadorIngresoId = request.OperadorId,
                Estado = EstadoEquipo.Ingresado,
                FallaReportada = request.FallaReportada,
                FallaCatalogoId = request.FallaCatalogoId,
                Observaciones = request.Observaciones,
                UbicacionDepositoId = request.UbicacionDepositoId,
                FirmaIngresoBase64 = request.FirmaIngresoBase64,
                FechaIngreso = fechaIngreso,
                FechaLimite = fechaLimite
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

            try
            {
                await _signalRService.SendStatusUpdateAsync(reparacion.Id.ToString(), "Ingresado");
            }
            catch
            {
                // Ignorar excepciones de tiempo real
            }

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

            if (reparacion.UbicacionDepositoId.HasValue)
            {
                reparacion.UbicacionDeposito = await _context.UbicacionesDeposito
                    .FirstOrDefaultAsync(u => u.Id == reparacion.UbicacionDepositoId.Value, cancellationToken);
            }

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
                FechaEntrega = reparacion.FechaEntrega,
                UbicacionDepositoId = reparacion.UbicacionDepositoId,
                UbicacionDepositoCodigo = reparacion.UbicacionDeposito?.Codigo,
                FirmaIngresoBase64 = reparacion.FirmaIngresoBase64,
                FirmaEntregaBase64 = reparacion.FirmaEntregaBase64,
                FechaLimite = reparacion.FechaLimite
            };
        }
    }
}
