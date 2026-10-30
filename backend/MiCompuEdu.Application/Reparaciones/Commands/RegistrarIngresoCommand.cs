using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Commands
{
    public record RegistrarIngresoCommand(
        Guid EquipoId,
        string? EquipoMarca,
        string? EquipoModelo,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid OperadorId,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null,
        DateTime? FechaIngreso = null,
        bool SoloCargador = false,
        TipoBeneficiario? TipoBeneficiario = null,
        string? NuevoEquipoNumeroSerie = null,
        string? NuevoEquipoMarca = null,
        string? NuevoEquipoModelo = null,
        string? NuevoEquipoCredencialesOffice = null,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null,
        string? TitularTelefono = null,
        string? PersonaEntregaTipo = null,
        string? PersonaEntregaNombre = null,
        string? PersonaEntregaDni = null,
        string? PersonaEntregaTelefono = null,
        string? PersonaEntregaParentesco = null,
        string? DocIdentidadIngresoBase64 = null
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

            // Actualizar TipoBeneficiario en caliente si viene en la request y es diferente
            if (request.TipoBeneficiario.HasValue && equipo.Beneficiario.TipoBeneficiario != request.TipoBeneficiario.Value)
            {
                equipo.Beneficiario.TipoBeneficiario = request.TipoBeneficiario.Value;
            }

            // Actualizar teléfono del titular si se modificó en el ingreso
            if (!string.IsNullOrWhiteSpace(request.TitularTelefono))
            {
                equipo.Beneficiario.Telefono = request.TitularTelefono.Trim();
            }

            // Actualizar datos del Tutor si el beneficiario es Alumno y se enviaron en la solicitud
            if (!string.IsNullOrWhiteSpace(request.TutorNombre))
            {
                equipo.Beneficiario.NombreTutor = request.TutorNombre.Trim();
            }
            if (!string.IsNullOrWhiteSpace(request.TutorDni))
            {
                equipo.Beneficiario.DniTutor = request.TutorDni.Trim();
            }
            if (!string.IsNullOrWhiteSpace(request.TutorTelefono))
            {
                equipo.Beneficiario.TelefonoTutor = request.TutorTelefono.Trim();
            }

            // Registrar un nuevo equipo si se especificó NuevoEquipoNumeroSerie
            if (!string.IsNullOrWhiteSpace(request.NuevoEquipoNumeroSerie))
            {
                var existingEquipo = await _context.Equipos
                    .Include(e => e.Beneficiario)
                    .FirstOrDefaultAsync(e => e.NumeroSerie.ToUpper() == request.NuevoEquipoNumeroSerie.Trim().ToUpper(), cancellationToken);

                if (existingEquipo == null)
                {
                    var nuevoEquipo = new Equipo
                    {
                        Id = Guid.NewGuid(),
                        NumeroSerie = request.NuevoEquipoNumeroSerie.Trim(),
                        Marca = request.NuevoEquipoMarca ?? "Desconocida",
                        Modelo = request.NuevoEquipoModelo ?? "Desconocido",
                        CredencialesOffice = request.NuevoEquipoCredencialesOffice,
                        BeneficiarioId = equipo.BeneficiarioId,
                        ProgramaEducativoId = request.ProgramaEducativoId ?? equipo.ProgramaEducativoId
                    };
                    _context.Equipos.Add(nuevoEquipo);
                    equipo = nuevoEquipo;
                }
                else
                {
                    equipo = existingEquipo;
                    equipo.BeneficiarioId = equipo.BeneficiarioId;
                    if (!string.IsNullOrWhiteSpace(request.NuevoEquipoMarca)) equipo.Marca = request.NuevoEquipoMarca;
                    if (!string.IsNullOrWhiteSpace(request.NuevoEquipoModelo)) equipo.Modelo = request.NuevoEquipoModelo;
                    if (request.ProgramaEducativoId.HasValue) equipo.ProgramaEducativoId = request.ProgramaEducativoId.Value;
                }
                await _context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                // Actualizar Marca/Modelo en caliente si se envió explícitamente desde la UI
                if (!string.IsNullOrWhiteSpace(request.EquipoMarca) && equipo.Marca != request.EquipoMarca)
                {
                    equipo.Marca = request.EquipoMarca;
                }
                if (!string.IsNullOrWhiteSpace(request.EquipoModelo) && equipo.Modelo != request.EquipoModelo)
                {
                    equipo.Modelo = request.EquipoModelo;
                }

                // Actualizar Programa del Equipo en caliente si viene en la request y no estaba cargado
                if (request.ProgramaEducativoId.HasValue && equipo.ProgramaEducativoId != request.ProgramaEducativoId.Value)
                {
                    equipo.ProgramaEducativoId = request.ProgramaEducativoId.Value;
                }
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

            var fechaIngreso = request.FechaIngreso ?? DateTime.UtcNow;
            var fechaLimite = fechaIngreso.AddDays(promedioDias);

            var docIngresoUrl = DocumentStorageHelper.GuardarDocumentoBase64(request.DocIdentidadIngresoBase64);

            var reparacion = new Reparacion
            {
                Id = Guid.NewGuid(),
                EquipoId = equipo.Id,
                OperadorIngresoId = request.OperadorId,
                Estado = EstadoEquipo.Ingresado,
                FallaReportada = request.FallaReportada,
                FallaCatalogoId = request.FallaCatalogoId,
                Observaciones = request.Observaciones,
                UbicacionDepositoId = request.UbicacionDepositoId,
                FirmaIngresoBase64 = request.FirmaIngresoBase64,
                PersonaEntregaTipo = request.PersonaEntregaTipo,
                PersonaEntregaNombre = request.PersonaEntregaNombre,
                PersonaEntregaDni = request.PersonaEntregaDni,
                PersonaEntregaTelefono = request.PersonaEntregaTelefono,
                PersonaEntregaParentesco = request.PersonaEntregaParentesco,
                DocIdentidadIngresoUrl = docIngresoUrl,
                FechaIngreso = fechaIngreso,
                FechaLimite = fechaLimite,
                SoloCargador = request.SoloCargador
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
                AlumnoNombreCompleto = $"{equipo.Beneficiario.Nombre} {equipo.Beneficiario.Apellido}",
                AlumnoDni = equipo.Beneficiario.Dni,
                AlumnoTelefono = equipo.Beneficiario.Telefono,
                AlumnoEmail = equipo.Beneficiario.Email,
                NombreTutor = $"{equipo.Beneficiario.Nombre} {equipo.Beneficiario.Apellido}",
                TelefonoTutor = equipo.Beneficiario.Telefono,
                TitularDni = equipo.Beneficiario.Dni,
                TitularEmail = equipo.Beneficiario.Email,
                TipoBeneficiario = (int)equipo.Beneficiario.TipoBeneficiario == 0 ? 1 : (int)equipo.Beneficiario.TipoBeneficiario,
                TutorResponsableNombre = equipo.Beneficiario.NombreTutor,
                TutorResponsableDni = equipo.Beneficiario.DniTutor,
                TutorResponsableTelefono = equipo.Beneficiario.TelefonoTutor,
                PersonaEntregaTipo = reparacion.PersonaEntregaTipo,
                PersonaEntregaNombre = reparacion.PersonaEntregaNombre,
                PersonaEntregaDni = reparacion.PersonaEntregaDni,
                PersonaEntregaTelefono = reparacion.PersonaEntregaTelefono,
                PersonaEntregaParentesco = reparacion.PersonaEntregaParentesco,
                DocIdentidadIngresoUrl = reparacion.DocIdentidadIngresoUrl,
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
                FechaLimite = reparacion.FechaLimite,
                SoloCargador = reparacion.SoloCargador
            };
        }
    }
}
