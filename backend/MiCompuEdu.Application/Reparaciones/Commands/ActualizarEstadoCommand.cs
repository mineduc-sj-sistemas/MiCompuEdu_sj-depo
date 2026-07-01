using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Commands
{
    public record ActualizarEstadoCommand(
        Guid ReparacionId,
        EstadoEquipo NuevoEstado,
        string? Diagnostico,
        string? AccionesRealizadas,
        string? Observaciones,
        Guid UsuarioId,
        string? ProveedorGarantia = null,
        string? RemitoGarantia = null,
        DateTime? FechaEsperadaGarantia = null,
        string? FirmaEntregaBase64 = null
    ) : IRequest<bool>;

    public class ActualizarEstadoCommandHandler : IRequestHandler<ActualizarEstadoCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly IWhatsAppService _whatsAppService;
        private readonly ISignalRService _signalRService;

        public ActualizarEstadoCommandHandler(IApplicationDbContext context, IWhatsAppService whatsAppService, ISignalRService signalRService)
        {
            _context = context;
            _whatsAppService = whatsAppService;
            _signalRService = signalRService;
        }

        public async Task<bool> Handle(ActualizarEstadoCommand request, CancellationToken cancellationToken)
        {
            var reparacion = await _context.Reparaciones
                .Include(r => r.Equipo)
                .ThenInclude(e => e.Beneficiario)
                .FirstOrDefaultAsync(r => r.Id == request.ReparacionId, cancellationToken);

            if (reparacion == null)
            {
                throw new KeyNotFoundException($"La reparación con ID {request.ReparacionId} no existe.");
            }

            var estadoAnterior = reparacion.Estado;
            if (!ValidarTransicion(estadoAnterior, request.NuevoEstado))
            {
                throw new InvalidOperationException($"La transición de estado desde '{estadoAnterior}' hacia '{request.NuevoEstado}' no está permitida.");
            }
            reparacion.Estado = request.NuevoEstado;
            
            if (!string.IsNullOrEmpty(request.Diagnostico))
                reparacion.Diagnostico = request.Diagnostico;
                
            if (!string.IsNullOrEmpty(request.AccionesRealizadas))
                reparacion.AccionesRealizadas = request.AccionesRealizadas;
                
            if (!string.IsNullOrEmpty(request.Observaciones))
                reparacion.Observaciones = request.Observaciones;

            if (!string.IsNullOrEmpty(request.ProveedorGarantia))
                reparacion.ProveedorGarantia = request.ProveedorGarantia;

            if (!string.IsNullOrEmpty(request.RemitoGarantia))
                reparacion.RemitoGarantia = request.RemitoGarantia;

            if (request.FechaEsperadaGarantia.HasValue)
                reparacion.FechaEsperadaGarantia = request.FechaEsperadaGarantia;

            if (!string.IsNullOrEmpty(request.FirmaEntregaBase64))
                reparacion.FirmaEntregaBase64 = request.FirmaEntregaBase64;

            reparacion.ActualizadoEn = DateTime.UtcNow;

            if (request.NuevoEstado == EstadoEquipo.Entregado)
            {
                reparacion.FechaEntrega = DateTime.UtcNow;
            }

            // Registrar movimiento en el historial
            var movimiento = new HistorialMovimiento
            {
                Id = Guid.NewGuid(),
                ReparacionId = reparacion.Id,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = request.NuevoEstado,
                UsuarioId = request.UsuarioId,
                Observaciones = request.Observaciones ?? $"Cambio de estado a {request.NuevoEstado}.",
                FechaMovimiento = DateTime.UtcNow
            };

             _context.HistorialMovimientos.Add(movimiento);
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                await _signalRService.SendStatusUpdateAsync(reparacion.Id.ToString(), request.NuevoEstado.ToString());
            }
            catch
            {
                // Ignorar excepciones de transporte en tiempo real
            }

            // Trigger notificaciones de WhatsApp
            if (request.NuevoEstado == EstadoEquipo.Listo_Para_Retirar || request.NuevoEstado == EstadoEquipo.No_Reparable)
            {
                var beneficiario = reparacion.Equipo.Beneficiario;
                string mensaje = request.NuevoEstado == EstadoEquipo.Listo_Para_Retirar
                    ? $"Hola {beneficiario.Nombre} {beneficiario.Apellido}. Tu notebook marca {reparacion.Equipo.Marca} (Serie: {reparacion.Equipo.NumeroSerie}) está REPARADA y lista para retirar en el depósito del Ministerio de Educación de San Juan. Horario: Lunes a Viernes de 8 a 13 hs. Por favor trae tu DNI físico."
                    : $"Hola {beneficiario.Nombre} {beneficiario.Apellido}. Informamos que luego del diagnóstico técnico realizado a tu notebook marca {reparacion.Equipo.Marca} (Serie: {reparacion.Equipo.NumeroSerie}), el equipo ha sido catalogado como NO REPARABLE. Puedes pasar a retirarlo por el depósito central del Ministerio.";

                // Encolar log de notificación en BD
                var notificacionLog = new Notificacion
                {
                    Id = Guid.NewGuid(),
                    ReparacionId = reparacion.Id,
                    Tipo = TipoNotificacion.WhatsApp,
                    Destinatario = beneficiario.Telefono,
                    Mensaje = mensaje,
                    Estado = EstadoNotificacion.Pendiente,
                    CreadoEn = DateTime.UtcNow
                };

                _context.Notificaciones.Add(notificacionLog);
                await _context.SaveChangesAsync(cancellationToken);

                // La notificación queda encolada en la BD como Pendiente para ser procesada asíncronamente por el Worker en segundo plano
            }

            return true;
        }

        public static bool ValidarTransicion(EstadoEquipo anterior, EstadoEquipo nuevo)
        {
            if (anterior == nuevo) return true;

            return anterior switch
            {
                EstadoEquipo.Ingresado => 
                    nuevo == EstadoEquipo.En_Diagnostico || 
                    nuevo == EstadoEquipo.En_Reparacion || 
                    nuevo == EstadoEquipo.Listo_Para_Retirar ||
                    nuevo == EstadoEquipo.No_Reparable,

                EstadoEquipo.En_Diagnostico => 
                    nuevo == EstadoEquipo.En_Reparacion || 
                    nuevo == EstadoEquipo.Esperando_Repuestos || 
                    nuevo == EstadoEquipo.Apartado_Para_Garantia || 
                    nuevo == EstadoEquipo.Listo_Para_Retirar || 
                    nuevo == EstadoEquipo.No_Reparable,

                EstadoEquipo.En_Reparacion => 
                    nuevo == EstadoEquipo.Esperando_Repuestos || 
                    nuevo == EstadoEquipo.Apartado_Para_Garantia || 
                    nuevo == EstadoEquipo.Reparado || 
                    nuevo == EstadoEquipo.Listo_Para_Retirar || 
                    nuevo == EstadoEquipo.No_Reparable,

                EstadoEquipo.Esperando_Repuestos => 
                    nuevo == EstadoEquipo.En_Reparacion || 
                    nuevo == EstadoEquipo.No_Reparable,

                EstadoEquipo.Apartado_Para_Garantia => 
                    nuevo == EstadoEquipo.En_Garantia_Externa,

                EstadoEquipo.En_Garantia_Externa => 
                    nuevo == EstadoEquipo.Reparado || 
                    nuevo == EstadoEquipo.Listo_Para_Retirar || 
                    nuevo == EstadoEquipo.No_Reparable,

                EstadoEquipo.Reparado => 
                    nuevo == EstadoEquipo.Listo_Para_Retirar,

                EstadoEquipo.Listo_Para_Retirar => 
                    nuevo == EstadoEquipo.Entregado,

                EstadoEquipo.No_Reparable => 
                    nuevo == EstadoEquipo.Entregado,

                EstadoEquipo.Entregado => 
                    false, // Estado final

                _ => false
            };
        }
    }
}
