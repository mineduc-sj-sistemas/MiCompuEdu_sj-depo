using System;
using System.Collections.Generic;
using System.Linq;
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
    public record RegistrarIngresoManualCommand(
        // Datos del Titular
        string TitularDni,
        string TitularNombre,
        string TitularApellido,
        string TitularTelefono,
        string TitularEmail,
        TipoBeneficiario TipoBeneficiario,
        
        // Datos del Equipo
        string EquipoNumeroSerie,
        string EquipoMarca,
        string EquipoModelo,
        string? EquipoCredencialesOffice,
        
        // Datos del Ingreso
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
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null
    ) : IRequest<ReparacionDto>;

    public class RegistrarIngresoManualCommandHandler : IRequestHandler<RegistrarIngresoManualCommand, ReparacionDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPdfGeneratorService _pdfGeneratorService;
        private readonly ISignalRService _signalRService;

        public RegistrarIngresoManualCommandHandler(IApplicationDbContext context, IPdfGeneratorService pdfGeneratorService, ISignalRService signalRService)
        {
            _context = context;
            _pdfGeneratorService = pdfGeneratorService;
            _signalRService = signalRService;
        }

        public async Task<ReparacionDto> Handle(RegistrarIngresoManualCommand request, CancellationToken cancellationToken)
        {
            // 1. Buscar o Crear Beneficiario
            var beneficiario = await _context.Beneficiarios
                .FirstOrDefaultAsync(b => b.Dni == request.TitularDni, cancellationToken);

            if (beneficiario == null)
            {
                beneficiario = new Beneficiario
                {
                    Id = Guid.NewGuid(),
                    Dni = request.TitularDni,
                    Nombre = request.TitularNombre,
                    Apellido = request.TitularApellido,
                    Telefono = request.TitularTelefono,
                    Email = request.TitularEmail,
                    EscuelaId = request.EscuelaId,
                    TipoBeneficiario = request.TipoBeneficiario,
                    NombreTutor = request.TutorNombre,
                    DniTutor = request.TutorDni,
                    TelefonoTutor = request.TutorTelefono
                };
                _context.Beneficiarios.Add(beneficiario);
            }
            else
            {
                // Actualizar datos si ya existe y viene información nueva
                beneficiario.Nombre = request.TitularNombre ?? beneficiario.Nombre;
                beneficiario.Apellido = request.TitularApellido ?? beneficiario.Apellido;
                beneficiario.Telefono = request.TitularTelefono ?? beneficiario.Telefono;
                beneficiario.Email = request.TitularEmail ?? beneficiario.Email;
                if (request.EscuelaId.HasValue) beneficiario.EscuelaId = request.EscuelaId.Value;
                if (!string.IsNullOrEmpty(request.TutorNombre)) beneficiario.NombreTutor = request.TutorNombre;
                if (!string.IsNullOrEmpty(request.TutorDni)) beneficiario.DniTutor = request.TutorDni;
                if (!string.IsNullOrEmpty(request.TutorTelefono)) beneficiario.TelefonoTutor = request.TutorTelefono;
            }

            // 2. Buscar o Crear Equipo
            var equipo = await _context.Equipos
                .FirstOrDefaultAsync(e => e.NumeroSerie == request.EquipoNumeroSerie, cancellationToken);

            if (equipo == null)
            {
                equipo = new Equipo
                {
                    Id = Guid.NewGuid(),
                    BeneficiarioId = beneficiario.Id,
                    NumeroSerie = request.EquipoNumeroSerie,
                    Marca = request.EquipoMarca,
                    Modelo = request.EquipoModelo,
                    CredencialesOffice = request.EquipoCredencialesOffice,
                    ProgramaEducativoId = request.ProgramaEducativoId
                };
                _context.Equipos.Add(equipo);
            }
            else
            {
                // Si existe, asegurarse de que esté vinculado al beneficiario correcto
                equipo.BeneficiarioId = beneficiario.Id;
                equipo.Marca = request.EquipoMarca ?? equipo.Marca;
                equipo.Modelo = request.EquipoModelo ?? equipo.Modelo;
                if (request.ProgramaEducativoId.HasValue) equipo.ProgramaEducativoId = request.ProgramaEducativoId.Value;
            }

            // Guardar cambios iniciales para que existan en BD (necesario si son nuevos)
            await _context.SaveChangesAsync(cancellationToken);

            // 3. Crear Reparación
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
                FechaIngreso = fechaIngreso,
                FechaLimite = fechaLimite,
                Equipo = equipo,
                SoloCargador = request.SoloCargador
            };

            // Asegurarnos de que la navegación Beneficiario esté asignada para el generador de PDF
            reparacion.Equipo.Beneficiario = beneficiario;

            var movimiento = new HistorialMovimiento
            {
                Id = Guid.NewGuid(),
                ReparacionId = reparacion.Id,
                EstadoAnterior = null,
                EstadoNuevo = EstadoEquipo.Ingresado,
                UsuarioId = request.OperadorId,
                Observaciones = "Ingreso manual registrado en sistema.",
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
                // Ignorar excepciones
            }

            try
            {
                var pdfUrl = await _pdfGeneratorService.GenerateReceiptPdfAsync(reparacion);
                reparacion.ComprobanteUrl = pdfUrl;
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                reparacion.ComprobanteUrl = $"/comprobantes/{reparacion.Id}.pdf";
            }

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
                NombreTutor = $"{beneficiario.Nombre} {beneficiario.Apellido}",
                TelefonoTutor = beneficiario.Telefono,
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
