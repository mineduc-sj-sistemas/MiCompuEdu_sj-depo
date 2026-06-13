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
        Guid UsuarioId
    ) : IRequest<bool>;

    public class ActualizarEstadoCommandHandler : IRequestHandler<ActualizarEstadoCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly IWhatsAppService _whatsAppService;

        public ActualizarEstadoCommandHandler(IApplicationDbContext context, IWhatsAppService whatsAppService)
        {
            _context = context;
            _whatsAppService = whatsAppService;
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
            reparacion.Estado = request.NuevoEstado;
            
            if (!string.IsNullOrEmpty(request.Diagnostico))
                reparacion.Diagnostico = request.Diagnostico;
                
            if (!string.IsNullOrEmpty(request.AccionesRealizadas))
                reparacion.AccionesRealizadas = request.AccionesRealizadas;
                
            if (!string.IsNullOrEmpty(request.Observaciones))
                reparacion.Observaciones = request.Observaciones;

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

                // Llamada asíncrona de WhatsApp
                try
                {
                    bool enviado = await _whatsAppService.SendNotificationAsync(beneficiario.Telefono, mensaje);
                    if (enviado)
                    {
                        notificacionLog.Estado = EstadoNotificacion.Enviado;
                        notificacionLog.FechaEnvio = DateTime.UtcNow;
                    }
                    else
                    {
                        notificacionLog.Estado = EstadoNotificacion.Fallido;
                        notificacionLog.ErrorMensaje = "Error en el consumo del API de WhatsApp.";
                    }
                }
                catch (Exception ex)
                {
                    notificacionLog.Estado = EstadoNotificacion.Fallido;
                    notificacionLog.ErrorMensaje = ex.Message;
                }

                await _context.SaveChangesAsync(cancellationToken);
            }

            return true;
        }
    }
}
