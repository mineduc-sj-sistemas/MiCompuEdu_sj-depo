using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Options;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Usuarios.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MiCompuEdu.WebApi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ISender _mediator;
        private readonly JwtOptions _jwtOptions;

        public AuthController(ISender mediator, IOptions<JwtOptions> jwtOptions)
        {
            _mediator = mediator;
            _jwtOptions = jwtOptions.Value;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
        {
            var user = await _mediator.Send(new AuthenticateUserQuery(request.NombreUsuario, request.Password), cancellationToken);
            if (user == null)
            {
                return Unauthorized("Usuario o contraseña incorrectos.");
            }

            if (string.IsNullOrEmpty(_jwtOptions.Key))
            {
                throw new InvalidOperationException("La clave secreta del JWT ('Jwt:Key') no está configurada.");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtOptions.Key);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.NombreUsuario),
                    new Claim(ClaimTypes.Role, user.Rol),
                    new Claim(ClaimTypes.Email, user.Email)
                }),
                Expires = DateTime.UtcNow.AddHours(_jwtOptions.ExpirationHours > 0 ? _jwtOptions.ExpirationHours : 8),
                Issuer = _jwtOptions.Issuer,
                Audience = _jwtOptions.Audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new LoginResponseDto
            {
                Token = tokenHandler.WriteToken(token),
                NombreCompleto = user.NombreCompleto,
                NombreUsuario = user.NombreUsuario,
                Rol = user.Rol,
                Email = user.Email
            });
        }
    }

    public record LoginRequest(string NombreUsuario, string Password);
}
