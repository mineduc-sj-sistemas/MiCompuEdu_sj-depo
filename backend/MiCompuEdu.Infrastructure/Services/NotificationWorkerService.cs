using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MiCompuEdu.Infrastructure.Services
{
    public class NotificationWorkerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationWorkerService> _logger;
        private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(10); // Polling every 10 seconds

        public NotificationWorkerService(IServiceScopeFactory scopeFactory, ILogger<NotificationWorkerService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("NotificationWorkerService started and listening for queued notifications...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessQueueAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing the notification queue.");
                }

                await Task.Delay(_pollingInterval, stoppingToken);
            }

            _logger.LogInformation("NotificationWorkerService is shutting down.");
        }

        private async Task ProcessQueueAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

            var now = DateTime.UtcNow;

            // Fetch notifications that are Pendiente, or Fallido but eligible for a retry (limit to 5 attempts)
            var pendingNotifications = await context.Notificaciones
                .Where(n => n.Estado == EstadoNotificacion.Pendiente || 
                            (n.Estado == EstadoNotificacion.Fallido && n.Reintentos < 5 && (n.ProximoIntento == null || n.ProximoIntento <= now)))
                .OrderBy(n => n.CreadoEn)
                .Take(10) // Process in chunks
                .ToListAsync(stoppingToken);

            if (pendingNotifications.Count == 0)
            {
                return;
            }

            _logger.LogInformation("Found {Count} notifications to process in queue.", pendingNotifications.Count);

            foreach (var notif in pendingNotifications)
            {
                if (stoppingToken.IsCancellationRequested) break;

                try
                {
                    _logger.LogInformation("Sending notification ID {Id} to {Recipient} (Attempt {Attempt})...", 
                        notif.Id, notif.Destinatario, notif.Reintentos + 1);

                    bool sent = await whatsAppService.SendNotificationAsync(notif.Destinatario, notif.Mensaje);

                    if (sent)
                    {
                        notif.Estado = EstadoNotificacion.Enviado;
                        notif.FechaEnvio = DateTime.UtcNow;
                        notif.ErrorMensaje = null;
                        _logger.LogInformation("Notification ID {Id} sent successfully.", notif.Id);
                    }
                    else
                    {
                        HandleFailure(notif, "WhatsApp Service returned failure.");
                    }
                }
                catch (Exception ex)
                {
                    HandleFailure(notif, ex.Message);
                }
            }

            await context.SaveChangesAsync(stoppingToken);
        }

        private void HandleFailure(Notificacion notif, string errorMsg)
        {
            notif.Reintentos++;
            notif.ErrorMensaje = errorMsg;
            
            if (notif.Reintentos >= 5)
            {
                notif.Estado = EstadoNotificacion.Fallido;
                _logger.LogWarning("Notification ID {Id} to {Recipient} failed permanently after 5 attempts.", notif.Id, notif.Destinatario);
            }
            else
            {
                notif.Estado = EstadoNotificacion.Fallido;
                // Exponential backoff: 10s, 30s, 60s, 120s...
                int backoffSeconds = 10 * (int)Math.Pow(2, notif.Reintentos - 1);
                notif.ProximoIntento = DateTime.UtcNow.AddSeconds(backoffSeconds);
                _logger.LogInformation("Notification ID {Id} scheduled for retry in {Seconds} seconds. Error: {Error}", 
                    notif.Id, backoffSeconds, errorMsg);
            }
        }
    }
}
