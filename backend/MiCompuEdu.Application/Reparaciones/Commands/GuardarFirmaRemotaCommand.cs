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
    public record GuardarFirmaRemotaCommand(
        Guid ReparacionId,
        string FirmaBase64,
        string TipoFirma
    ) : IRequest<bool>;

    public class GuardarFirmaRemotaCommandHandler : IRequestHandler<GuardarFirmaRemotaCommand, bool>
    {
        private readonly IApplicationDbContext _context;
        private readonly ISignalRService _signalRService;
        private readonly IPdfGeneratorService _pdfGeneratorService;

        public GuardarFirmaRemotaCommandHandler(
            IApplicationDbContext context,
            ISignalRService signalRService,
            IPdfGeneratorService pdfGeneratorService)
        {
            _context = context;
            _signalRService = signalRService;
            _pdfGeneratorService = pdfGeneratorService;
        }

        public async Task<bool> Handle(GuardarFirmaRemotaCommand request, CancellationToken cancellationToken)
        {
            var reparacion = await _context.Reparaciones
                .Include(r => r.Equipo)
                .ThenInclude(e => e.Beneficiario)
                .FirstOrDefaultAsync(r => r.Id == request.ReparacionId, cancellationToken);

            if (reparacion == null)
            {
                throw new KeyNotFoundException($"La orden de reparación con ID {request.ReparacionId} no existe.");
            }

            if (request.TipoFirma.Equals("Ingreso", StringComparison.OrdinalIgnoreCase))
            {
                reparacion.FirmaIngresoBase64 = request.FirmaBase64;
                try
                {
                    var pdfUrl = await _pdfGeneratorService.GenerateReceiptPdfAsync(reparacion);
                    reparacion.ComprobanteUrl = pdfUrl;
                }
                catch
                {
                    // No bloquear respuesta si falla regeneración de PDF
                }
            }
            else if (request.TipoFirma.Equals("Entrega", StringComparison.OrdinalIgnoreCase))
            {
                reparacion.FirmaEntregaBase64 = request.FirmaBase64;
                reparacion.Estado = EstadoEquipo.Entregado;
                reparacion.FechaEntrega = DateTime.UtcNow;

                var movimiento = new HistorialMovimiento
                {
                    Id = Guid.NewGuid(),
                    ReparacionId = reparacion.Id,
                    EstadoAnterior = EstadoEquipo.Listo_Para_Retirar,
                    EstadoNuevo = EstadoEquipo.Entregado,
                    UsuarioId = reparacion.OperadorIngresoId,
                    Observaciones = "Entregado físicamente al tutor y firmado remotamente por QR.",
                    FechaMovimiento = DateTime.UtcNow
                };
                _context.HistorialMovimientos.Add(movimiento);
            }
            else
            {
                throw new ArgumentException("El campo TipoFirma debe ser 'Ingreso' o 'Entrega'.");
            }

            reparacion.ActualizadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                await _signalRService.SendSignatureReceivedAsync(reparacion.Id.ToString(), request.TipoFirma);
            }
            catch
            {
                // Ignorar excepciones de notificación en tiempo real
            }

            return true;
        }
    }
}
