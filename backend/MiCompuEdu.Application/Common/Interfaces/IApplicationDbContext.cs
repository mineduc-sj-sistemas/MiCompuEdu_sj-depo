using System.Threading;
using System.Threading.Tasks;
using MiCompuEdu.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<Usuario> Usuarios { get; }
        DbSet<Beneficiario> Beneficiarios { get; }
        DbSet<Equipo> Equipos { get; }
        DbSet<FallaCatalogo> FallasCatalogo { get; }
        DbSet<Reparacion> Reparaciones { get; }
        DbSet<HistorialMovimiento> HistorialMovimientos { get; }
        DbSet<EvidenciaReparacion> EvidenciasReparacion { get; }
        DbSet<Notificacion> Notificaciones { get; }

        DbSet<Escuela> Escuelas { get; }
        DbSet<ProgramaEducativo> ProgramasEducativos { get; }
        DbSet<AuditLog> AuditLogs { get; }
        DbSet<UbicacionDeposito> UbicacionesDeposito { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
