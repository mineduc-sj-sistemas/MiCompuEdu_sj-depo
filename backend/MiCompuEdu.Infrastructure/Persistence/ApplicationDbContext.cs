using System;
using System.Threading;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<Beneficiario> Beneficiarios => Set<Beneficiario>();
        public DbSet<Equipo> Equipos => Set<Equipo>();
        public DbSet<FallaCatalogo> FallasCatalogo => Set<FallaCatalogo>();
        public DbSet<Reparacion> Reparaciones => Set<Reparacion>();
        public DbSet<HistorialMovimiento> HistorialMovimientos => Set<HistorialMovimiento>();
        public DbSet<EvidenciaReparacion> EvidenciasReparacion => Set<EvidenciaReparacion>();
        public DbSet<Notificacion> Notificaciones => Set<Notificacion>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>()
                .Property(u => u.Rol)
                .HasConversion(
                    v => v.ToString(),
                    v => (UserRole)Enum.Parse(typeof(UserRole), v));

            modelBuilder.Entity<Reparacion>()
                .Property(r => r.Estado)
                .HasConversion(
                    v => v.ToString(),
                    v => (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v));

            modelBuilder.Entity<HistorialMovimiento>()
                .Property(hm => hm.EstadoAnterior)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToString() : null,
                    v => !string.IsNullOrEmpty(v) ? (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v) : null);

            modelBuilder.Entity<HistorialMovimiento>()
                .Property(hm => hm.EstadoNuevo)
                .HasConversion(
                    v => v.ToString(),
                    v => (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v));

            modelBuilder.Entity<Notificacion>()
                .Property(n => n.Tipo)
                .HasConversion(
                    v => v.ToString(),
                    v => (TipoNotificacion)Enum.Parse(typeof(TipoNotificacion), v));

            modelBuilder.Entity<Notificacion>()
                .Property(n => n.Estado)
                .HasConversion(
                    v => v.ToString(),
                    v => (EstadoNotificacion)Enum.Parse(typeof(EstadoNotificacion), v));

            modelBuilder.Entity<Usuario>().ToTable("usuarios");
            modelBuilder.Entity<Beneficiario>().ToTable("beneficiarios");
            modelBuilder.Entity<Equipo>().ToTable("equipos");
            modelBuilder.Entity<FallaCatalogo>().ToTable("fallas_catalogo");
            modelBuilder.Entity<Reparacion>().ToTable("reparaciones");
            modelBuilder.Entity<HistorialMovimiento>().ToTable("historial_movimientos");
            modelBuilder.Entity<EvidenciaReparacion>().ToTable("evidencias_reparacion");
            modelBuilder.Entity<Notificacion>().ToTable("notificaciones");
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
            {
                if (entry.State == EntityState.Modified)
                {
                    entry.Entity.ActualizadoEn = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
