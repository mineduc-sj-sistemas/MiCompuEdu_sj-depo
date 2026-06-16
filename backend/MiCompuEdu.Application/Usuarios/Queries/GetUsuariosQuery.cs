using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Usuarios.Queries
{
    public record GetUsuariosQuery() : IRequest<List<UsuarioDto>>;

    public class GetUsuariosQueryHandler : IRequestHandler<GetUsuariosQuery, List<UsuarioDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetUsuariosQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UsuarioDto>> Handle(GetUsuariosQuery request, CancellationToken cancellationToken)
        {
            var usuarios = await _context.Usuarios
                .OrderBy(u => u.NombreCompleto)
                .Select(u => new UsuarioDto
                {
                    Id = u.Id,
                    NombreCompleto = u.NombreCompleto,
                    NombreUsuario = u.NombreUsuario,
                    Email = u.Email,
                    Rol = u.Rol.ToString(),
                    Activo = u.Activo
                })
                .ToListAsync(cancellationToken);

            return usuarios;
        }
    }
}
