using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Options;
using MiCompuEdu.Application.Reparaciones.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MiCompuEdu.WebApi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class FirmaRemotaController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly string _jwtKey;

        public FirmaRemotaController(ISender mediator, IOptions<JwtOptions> jwtOptions)
        {
            _mediator = mediator;
            _jwtKey = !string.IsNullOrWhiteSpace(jwtOptions.Value.Key)
                ? jwtOptions.Value.Key
                : throw new InvalidOperationException("La clave JWT no está configurada.");
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
        public async Task<IActionResult> GuardarFirma([FromBody] GuardarFirmaRemotaRequest request, CancellationToken cancellationToken)
        {
            if (!ValidateToken(request.Token, request.ReparacionId, out var error))
            {
                return BadRequest($"Token inválido o expirado: {error}");
            }

            try
            {
                await _mediator.Send(new GuardarFirmaRemotaCommand(
                    request.ReparacionId,
                    request.FirmaBase64,
                    request.TipoFirma
                ), cancellationToken);

                return Ok(new { success = true, message = "Firma guardada correctamente." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private static string GenerateHmac(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
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

                if (!Guid.TryParse(parts[0], out var repId) || repId != expectedReparacionId)
                {
                    error = "La orden no coincide con el token.";
                    return false;
                }

                var expectedSignature = GenerateHmac($"{parts[0]}:{parts[1]}", _jwtKey);
                if (parts[2] != expectedSignature)
                {
                    error = "Firma del token inválida.";
                    return false;
                }

                if (!long.TryParse(parts[1], out var expiryTicks) || DateTime.UtcNow.Ticks > expiryTicks)
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
