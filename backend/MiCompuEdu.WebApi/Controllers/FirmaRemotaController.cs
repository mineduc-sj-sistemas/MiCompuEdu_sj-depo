using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MiCompuEdu.WebApi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class FirmaRemotaController : ControllerBase
    {
        private readonly IApplicationDbContext _context;
        private readonly ISignalRService _signalRService;
        private readonly IPdfGeneratorService _pdfGeneratorService;
        private readonly string _jwtKey;

        public FirmaRemotaController(
            IApplicationDbContext context,
            ISignalRService signalRService,
            IPdfGeneratorService pdfGeneratorService,
            IConfiguration configuration)
        {
            _context = context;
            _signalRService = signalRService;
            _pdfGeneratorService = pdfGeneratorService;
            _jwtKey = configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraParaSanJuanDeAlMenos32Caracteres!";
        }

        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        [HttpGet("token/{reparacionId}")]
        public IActionResult ObtenerToken(Guid reparacionId)
        {
            var expiry = DateTime.UtcNow.AddMinutes(15).Ticks;
            var rawData = $"{reparacionId}:{expiry}";
            var signature = GenerateHmac(rawData, _jwtKey);
            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{rawData}:{signature}"));

            return Ok(new { token });
        }

        [AllowAnonymous]
        [HttpPost("guardar")]
        public async Task<IActionResult> GuardarFirma([FromBody] GuardarFirmaRemotaRequest request)
        {
            if (!ValidateToken(request.Token, request.ReparacionId, out var error))
            {
                return BadRequest($"Token inválido o expirado: {error}");
            }

            var reparacion = await _context.Reparaciones
                .Include(r => r.Equipo)
                .ThenInclude(e => e.Beneficiario)
                .FirstOrDefaultAsync(r => r.Id == request.ReparacionId);

            if (reparacion == null)
            {
                return NotFound($"La orden de reparación con ID {request.ReparacionId} no existe.");
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
                return BadRequest("El campo TipoFirma debe ser 'Ingreso' o 'Entrega'.");
            }

            reparacion.ActualizadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync(default);

            try
            {
                await _signalRService.SendSignatureReceivedAsync(reparacion.Id.ToString(), request.TipoFirma);
            }
            catch
            {
                // Ignorar excepciones de tiempo real
            }

            return Ok(new { success = true, message = "Firma guardada correctamente." });
        }

        private static string GenerateHmac(string data, string key)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }

        private bool ValidateToken(string base64Token, Guid expectedReparacionId, out string error)
        {
            error = string.Empty;
            try
            {
                var raw = Encoding.UTF8.GetString(Convert.FromBase64String(base64Token));
                var parts = raw.Split(':');
                if (parts.Length != 3)
                {
                    error = "Formato de token malformado.";
                    return false;
                }

                var repIdStr = parts[0];
                var expiryTicksStr = parts[1];
                var signature = parts[2];

                if (!Guid.TryParse(repIdStr, out var repId) || repId != expectedReparacionId)
                {
                    error = "La orden no coincide con el token.";
                    return false;
                }

                var rawData = $"{repIdStr}:{expiryTicksStr}";
                var expectedSignature = GenerateHmac(rawData, _jwtKey);
                if (signature != expectedSignature)
                {
                    error = "Firma del token inválida.";
                    return false;
                }

                if (!long.TryParse(expiryTicksStr, out var expiryTicks) || DateTime.UtcNow.Ticks > expiryTicks)
                {
                    error = "El token ha expirado.";
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return false;
            }
        }
    }

    public record GuardarFirmaRemotaRequest(
        Guid ReparacionId,
        string Token,
        string FirmaBase64,
        string TipoFirma
    );
}
