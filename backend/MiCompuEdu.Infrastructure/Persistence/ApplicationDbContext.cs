using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
        private readonly ICurrentUserService _currentUserService;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ICurrentUserService currentUserService) : base(options)
        {
            _currentUserService = currentUserService;
        }

        // ─── DbSets principales ───────────────────────────────────
        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<Beneficiario> Beneficiarios => Set<Beneficiario>();
        public DbSet<Equipo> Equipos => Set<Equipo>();
        public DbSet<FallaCatalogo> FallasCatalogo => Set<FallaCatalogo>();
        public DbSet<Reparacion> Reparaciones => Set<Reparacion>();
        public DbSet<HistorialMovimiento> HistorialMovimientos => Set<HistorialMovimiento>();
        public DbSet<EvidenciaReparacion> EvidenciasReparacion => Set<EvidenciaReparacion>();
        public DbSet<Notificacion> Notificaciones => Set<Notificacion>();

        // ─── DbSets de escalabilidad ──────────────────────────────
        public DbSet<Escuela> Escuelas => Set<Escuela>();
        public DbSet<ProgramaEducativo> ProgramasEducativos => Set<ProgramaEducativo>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<UbicacionDeposito> UbicacionesDeposito => Set<UbicacionDeposito>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ════════════════════════════════════════════════════════
            //  USUARIOS
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.ToTable("usuarios");

                entity.HasKey(u => u.Id);

                entity.Property(u => u.NombreCompleto).HasMaxLength(200).IsRequired();
                entity.Property(u => u.NombreUsuario).HasMaxLength(50).IsRequired();
                entity.Property(u => u.Email).HasMaxLength(200).IsRequired();
                entity.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
                entity.Property(u => u.Activo).HasDefaultValue(true);
                entity.Property(u => u.CreadoEn).HasDefaultValueSql("NOW()");

                entity.Property(u => u.Rol)
                    .HasConversion(
                        v => v.ToString(),
                        v => (UserRole)Enum.Parse(typeof(UserRole), v))
                    .HasMaxLength(20)
                    .IsRequired();

                // Índices
                entity.HasIndex(u => u.NombreUsuario)
                    .IsUnique()
                    .HasDatabaseName("ix_usuarios_nombre_usuario");

                entity.HasIndex(u => u.Email)
                    .IsUnique()
                    .HasDatabaseName("ix_usuarios_email");
            });

            // ════════════════════════════════════════════════════════
            //  BENEFICIARIOS
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Beneficiario>(entity =>
            {
                entity.ToTable("beneficiarios");

                entity.HasKey(b => b.Id);

                entity.Property(b => b.Dni).HasMaxLength(15).IsRequired();
                entity.Property(b => b.Nombre).HasMaxLength(100).IsRequired();
                entity.Property(b => b.Apellido).HasMaxLength(100).IsRequired();
                entity.Property(b => b.Telefono).HasMaxLength(30);
                entity.Property(b => b.Email).HasMaxLength(200);
                entity.Property(b => b.DniTutor).HasMaxLength(15);
                entity.Property(b => b.NombreTutor).HasMaxLength(200);
                entity.Property(b => b.TelefonoTutor).HasMaxLength(30);
                entity.Property(b => b.Grado).HasMaxLength(50);
                entity.Property(b => b.Seccion).HasMaxLength(50);
                entity.Property(b => b.CreadoEn).HasDefaultValueSql("NOW()");

                // FK opcional a Escuela
                entity.HasOne(b => b.Escuela)
                    .WithMany(e => e.Beneficiarios)
                    .HasForeignKey(b => b.EscuelaId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Índices
                entity.HasIndex(b => b.Dni)
                    .IsUnique()
                    .HasDatabaseName("ix_beneficiarios_dni");

                entity.HasIndex(b => new { b.Apellido, b.Nombre })
                    .HasDatabaseName("ix_beneficiarios_nombre");
            });

            // ════════════════════════════════════════════════════════
            //  EQUIPOS
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Equipo>(entity =>
            {
                entity.ToTable("equipos");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.NumeroSerie).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Marca).HasMaxLength(80).IsRequired();
                entity.Property(e => e.Modelo).HasMaxLength(120).IsRequired();
                entity.Property(e => e.CredencialesOffice).HasMaxLength(200);
                entity.Property(e => e.CreadoEn).HasDefaultValueSql("NOW()");

                // FK a Beneficiario (requerido, RESTRICT)
                entity.HasOne(e => e.Beneficiario)
                    .WithMany(b => b.Equipos)
                    .HasForeignKey(e => e.BeneficiarioId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FK opcional a ProgramaEducativo
                entity.HasOne(e => e.ProgramaEducativo)
                    .WithMany(p => p.Equipos)
                    .HasForeignKey(e => e.ProgramaEducativoId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Índices
                entity.HasIndex(e => e.NumeroSerie)
                    .IsUnique()
                    .HasDatabaseName("ix_equipos_numero_serie");

                entity.HasIndex(e => e.BeneficiarioId)
                    .HasDatabaseName("ix_equipos_beneficiario");
            });

            // ════════════════════════════════════════════════════════
            //  FALLAS CATÁLOGO
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<FallaCatalogo>(entity =>
            {
                entity.ToTable("fallas_catalogo");

                entity.HasKey(f => f.Id);
                entity.Property(f => f.Id).UseIdentityAlwaysColumn();

                entity.Property(f => f.Nombre).HasMaxLength(150).IsRequired();
                entity.Property(f => f.Descripcion).HasMaxLength(500);
                entity.Property(f => f.Activo).HasDefaultValue(true);
                entity.Property(f => f.CreadoEn).HasDefaultValueSql("NOW()");

                entity.HasIndex(f => f.Nombre)
                    .IsUnique()
                    .HasDatabaseName("ix_fallas_catalogo_nombre");
            });

            // ════════════════════════════════════════════════════════
            //  REPARACIONES
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Reparacion>(entity =>
            {
                entity.ToTable("reparaciones");

                entity.HasKey(r => r.Id);

                entity.Property(r => r.FallaReportada).HasColumnType("text").IsRequired();
                entity.Property(r => r.Diagnostico).HasColumnType("text");
                entity.Property(r => r.AccionesRealizadas).HasColumnType("text");
                entity.Property(r => r.Observaciones).HasColumnType("text");
                entity.Property(r => r.ComprobanteUrl).HasMaxLength(500);
                entity.Property(r => r.ProveedorGarantia).HasMaxLength(150);
                entity.Property(r => r.RemitoGarantia).HasMaxLength(100);
                entity.Property(r => r.FechaEsperadaGarantia);
                entity.Property(r => r.FirmaIngresoBase64).HasColumnType("text");
                entity.Property(r => r.FirmaEntregaBase64).HasColumnType("text");

                entity.Property(r => r.PersonaEntregaTipo).HasMaxLength(50);
                entity.Property(r => r.PersonaEntregaNombre).HasMaxLength(200);
                entity.Property(r => r.PersonaEntregaDni).HasMaxLength(30);
                entity.Property(r => r.PersonaEntregaTelefono).HasMaxLength(50);
                entity.Property(r => r.PersonaEntregaParentesco).HasMaxLength(100);
                entity.Property(r => r.DocIdentidadIngresoUrl).HasMaxLength(500);

                entity.Property(r => r.PersonaRetiroTipo).HasMaxLength(50);
                entity.Property(r => r.PersonaRetiroNombre).HasMaxLength(200);
                entity.Property(r => r.PersonaRetiroDni).HasMaxLength(30);
                entity.Property(r => r.PersonaRetiroTelefono).HasMaxLength(50);
                entity.Property(r => r.PersonaRetiroParentesco).HasMaxLength(100);
                entity.Property(r => r.DocIdentidadEntregaUrl).HasMaxLength(500);

                entity.Property(r => r.CreadoEn).HasDefaultValueSql("NOW()");
                entity.Property(r => r.FechaIngreso).HasDefaultValueSql("NOW()");

                entity.Property(r => r.Estado)
                    .HasConversion(
                        v => v.ToString(),
                        v => (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v))
                    .HasMaxLength(30)
                    .IsRequired();

                // FK a Equipo (RESTRICT)
                entity.HasOne(r => r.Equipo)
                    .WithMany(e => e.Reparaciones)
                    .HasForeignKey(r => r.EquipoId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FK a Usuario como Operador de Ingreso (RESTRICT)
                entity.HasOne(r => r.OperadorIngreso)
                    .WithMany()
                    .HasForeignKey(r => r.OperadorIngresoId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FK a Usuario como Técnico Asignado (nullable, SET NULL)
                entity.HasOne(r => r.TecnicoAsignado)
                    .WithMany()
                    .HasForeignKey(r => r.TecnicoAsignadoId)
                    .OnDelete(DeleteBehavior.SetNull);

                // FK a FallaCatalogo (nullable, SET NULL)
                entity.HasOne(r => r.FallaCatalogo)
                    .WithMany()
                    .HasForeignKey(r => r.FallaCatalogoId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Índices
                entity.HasIndex(r => r.Estado)
                    .HasDatabaseName("ix_reparaciones_estado_activo")
                    .HasFilter("\"Estado\" != 'Entregado'");

                entity.HasIndex(r => r.EquipoId)
                    .HasDatabaseName("ix_reparaciones_equipo");

                entity.HasIndex(r => r.FechaIngreso)
                    .HasDatabaseName("ix_reparaciones_fecha");
            });

            // ════════════════════════════════════════════════════════
            //  HISTORIAL DE MOVIMIENTOS
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<HistorialMovimiento>(entity =>
            {
                entity.ToTable("historial_movimientos");

                entity.HasKey(hm => hm.Id);

                entity.Property(hm => hm.Observaciones).HasColumnType("text");
                entity.Property(hm => hm.FechaMovimiento).HasDefaultValueSql("NOW()");
                entity.Property(hm => hm.CreadoEn).HasDefaultValueSql("NOW()");

                entity.Property(hm => hm.EstadoAnterior)
                    .HasConversion(
                        v => v.HasValue ? v.Value.ToString() : null,
                        v => !string.IsNullOrEmpty(v) ? (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v) : null)
                    .HasMaxLength(30);

                entity.Property(hm => hm.EstadoNuevo)
                    .HasConversion(
                        v => v.ToString(),
                        v => (EstadoEquipo)Enum.Parse(typeof(EstadoEquipo), v))
                    .HasMaxLength(30)
                    .IsRequired();

                // FK a Reparación (CASCADE — si se borra la orden, se borra su historial)
                entity.HasOne(hm => hm.Reparacion)
                    .WithMany(r => r.HistorialMovimientos)
                    .HasForeignKey(hm => hm.ReparacionId)
                    .OnDelete(DeleteBehavior.Cascade);

                // FK a Usuario (RESTRICT)
                entity.HasOne(hm => hm.Usuario)
                    .WithMany()
                    .HasForeignKey(hm => hm.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Índices
                entity.HasIndex(hm => new { hm.ReparacionId, hm.FechaMovimiento })
                    .HasDatabaseName("ix_historial_reparacion_fecha")
                    .IsDescending(false, true);
            });

            // ════════════════════════════════════════════════════════
            //  EVIDENCIAS DE REPARACIÓN
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<EvidenciaReparacion>(entity =>
            {
                entity.ToTable("evidencias_reparacion");

                entity.HasKey(ev => ev.Id);

                entity.Property(ev => ev.UrlArchivo).HasMaxLength(500).IsRequired();
                entity.Property(ev => ev.NombreArchivo).HasMaxLength(200).IsRequired();
                entity.Property(ev => ev.CreadoEn).HasDefaultValueSql("NOW()");

                // FK a Reparación (CASCADE)
                entity.HasOne(ev => ev.Reparacion)
                    .WithMany(r => r.EvidenciasReparacion)
                    .HasForeignKey(ev => ev.ReparacionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ════════════════════════════════════════════════════════
            //  NOTIFICACIONES
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Notificacion>(entity =>
            {
                entity.ToTable("notificaciones");

                entity.HasKey(n => n.Id);

                entity.Property(n => n.Destinatario).HasMaxLength(50).IsRequired();
                entity.Property(n => n.Mensaje).HasColumnType("text").IsRequired();
                entity.Property(n => n.ErrorMensaje).HasColumnType("text");
                entity.Property(n => n.CreadoEn).HasDefaultValueSql("NOW()");

                entity.Property(n => n.Tipo)
                    .HasConversion(
                        v => v.ToString(),
                        v => (TipoNotificacion)Enum.Parse(typeof(TipoNotificacion), v))
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(n => n.Estado)
                    .HasConversion(
                        v => v.ToString(),
                        v => (EstadoNotificacion)Enum.Parse(typeof(EstadoNotificacion), v))
                    .HasMaxLength(20)
                    .IsRequired();

                // FK a Reparación (CASCADE)
                entity.HasOne(n => n.Reparacion)
                    .WithMany(r => r.Notificaciones)
                    .HasForeignKey(n => n.ReparacionId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Índice parcial para la cola de envío
                entity.HasIndex(n => n.Estado)
                    .HasDatabaseName("ix_notificaciones_pendientes")
                    .HasFilter("\"Estado\" = 'Pendiente'");
            });

            // ════════════════════════════════════════════════════════
            //  ESCUELAS (Escalabilidad)
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<Escuela>(entity =>
            {
                entity.ToTable("escuelas");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Nombre).HasMaxLength(250).IsRequired();
                entity.Property(e => e.Activo).HasDefaultValue(true);
                entity.Property(e => e.CreadoEn).HasDefaultValueSql("NOW()");
            });

            // ════════════════════════════════════════════════════════
            //  PROGRAMAS EDUCATIVOS (Escalabilidad)
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<ProgramaEducativo>(entity =>
            {
                entity.ToTable("programas_educativos");

                entity.HasKey(p => p.Id);

                entity.Property(p => p.Nombre).HasMaxLength(150).IsRequired();
                entity.Property(p => p.Descripcion).HasMaxLength(500);
                entity.Property(p => p.Activo).HasDefaultValue(true);
                entity.Property(p => p.CreadoEn).HasDefaultValueSql("NOW()");

                entity.HasIndex(p => p.Nombre)
                    .IsUnique()
                    .HasDatabaseName("ix_programas_educativos_nombre");
            });

            // ════════════════════════════════════════════════════════
            //  AUDIT LOG (Auditoría Global)
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("audit_log");

                entity.HasKey(a => a.Id);
                entity.Property(a => a.Id).UseIdentityAlwaysColumn();

                entity.Property(a => a.Tabla).HasMaxLength(100).IsRequired();
                entity.Property(a => a.RegistroId).IsRequired();
                entity.Property(a => a.Accion).HasMaxLength(20).IsRequired();
                entity.Property(a => a.DatosAnteriores).HasColumnType("jsonb");
                entity.Property(a => a.DatosNuevos).HasColumnType("jsonb");
                entity.Property(a => a.Fecha).HasDefaultValueSql("NOW()");

                entity.HasOne(a => a.Usuario)
                    .WithMany()
                    .HasForeignKey(a => a.UsuarioId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(a => new { a.Tabla, a.RegistroId })
                    .HasDatabaseName("ix_audit_tabla_registro");
            });

            // ════════════════════════════════════════════════════════
            //  UBICACIONES DEPOSITO
            // ════════════════════════════════════════════════════════
            modelBuilder.Entity<UbicacionDeposito>(entity =>
            {
                entity.ToTable("ubicaciones_deposito");

                entity.HasKey(u => u.Id);

                entity.Property(u => u.Estanteria).HasMaxLength(50).IsRequired();
                entity.Property(u => u.Codigo).HasMaxLength(100).IsRequired();
                entity.Property(u => u.Activo).HasDefaultValue(true);
                entity.Property(u => u.CreadoEn).HasDefaultValueSql("NOW()");

                entity.HasIndex(u => u.Codigo)
                    .IsUnique()
                    .HasDatabaseName("ix_ubicaciones_deposito_codigo");
            });

            // Relación en Reparación
            modelBuilder.Entity<Reparacion>()
                .HasOne(r => r.UbicacionDeposito)
                .WithMany(u => u.Reparaciones)
                .HasForeignKey(r => r.UbicacionDepositoId)
                .OnDelete(DeleteBehavior.SetNull);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // 1. Aplicar actualizado en a entidades modificadas
            foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
            {
                if (entry.State == EntityState.Modified)
                {
                    entry.Entity.ActualizadoEn = DateTime.UtcNow;
                }
            }

            // 2. Preparar logs de auditoría antes del guardado físico
            var auditEntries = OnBeforeSaveChanges();

            // Si ya hay una transacción activa de base de datos, simplemente guardamos en ese contexto
            if (Database.CurrentTransaction != null)
            {
                var result = await base.SaveChangesAsync(cancellationToken);
                await OnAfterSaveChanges(auditEntries, cancellationToken);
                return result;
            }

            // Si no hay transacción activa, creamos una transacción atómica local
            using var transaction = await Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await base.SaveChangesAsync(cancellationToken);
                await OnAfterSaveChanges(auditEntries, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private List<AuditEntry> OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();
            var usuarioId = _currentUserService.UsuarioId;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    Tabla = entry.Metadata.GetTableName() ?? entry.Metadata.DisplayName(),
                    UsuarioId = usuarioId
                };
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;

                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.Accion = "Insert";
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;

                        case EntityState.Deleted:
                            auditEntry.Accion = "Delete";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                var original = property.OriginalValue;
                                var current = property.CurrentValue;
                                if ((original == null && current != null) || (original != null && !original.Equals(current)))
                                {
                                    auditEntry.Accion = "Update";
                                    auditEntry.OldValues[propertyName] = original;
                                    auditEntry.NewValues[propertyName] = current;
                                }
                            }
                            break;
                    }
                }
            }

            // Mapeo inicial de PK
            foreach (var entry in auditEntries)
            {
                if (entry.Entry.Entity is Domain.Common.BaseEntity baseEntity)
                {
                    entry.RegistroId = baseEntity.Id;
                }
                else
                {
                    var pk = entry.KeyValues.FirstOrDefault().Value;
                    if (pk is Guid guidPk)
                    {
                        entry.RegistroId = guidPk;
                    }
                    else if (pk is int intPk)
                    {
                        // Para IDs autoincrementables serial, se resolverán en OnAfterSaveChanges
                        entry.RegistroId = Guid.Empty;
                    }
                }
            }

            return auditEntries;
        }

        private async Task OnAfterSaveChanges(List<AuditEntry> auditEntries, CancellationToken cancellationToken)
        {
            if (auditEntries == null || auditEntries.Count == 0)
                return;

            bool hasEntries = false;

            foreach (var auditEntry in auditEntries)
            {
                if (auditEntry.RegistroId == Guid.Empty)
                {
                    if (auditEntry.Entry.Entity is Domain.Common.BaseEntity baseEntity)
                    {
                        auditEntry.RegistroId = baseEntity.Id;
                    }
                    else
                    {
                        var pk = auditEntry.Entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue;
                        if (pk is Guid guidPk)
                        {
                            auditEntry.RegistroId = guidPk;
                        }
                        else if (pk != null)
                        {
                            // Si es un INT serial (como FallaCatalogo), convertimos a Guid usando MD5 o guardamos un Guid vacío/aleatorio.
                            // Para consistencia con la columna UUID, mapeamos un Guid determinista basado en el INT autoincremental.
                            byte[] bytes = new byte[16];
                            BitConverter.GetBytes(Convert.ToInt32(pk)).CopyTo(bytes, 0);
                            auditEntry.RegistroId = new Guid(bytes);
                        }
                    }
                }

                if (string.IsNullOrEmpty(auditEntry.Accion))
                    continue;

                AuditLogs.Add(auditEntry.ToAuditLog());
                hasEntries = true;
            }

            if (hasEntries)
            {
                await base.SaveChangesAsync(cancellationToken);
            }
        }
    }

    /// <summary>
    /// Clase helper para recolectar información de auditoría antes del guardado físico.
    /// </summary>
    internal class AuditEntry
    {
        public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            Entry = entry;
        }

        public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
        public string Tabla { get; set; } = string.Empty;
        public Guid? UsuarioId { get; set; }
        public string Accion { get; set; } = string.Empty;
        public Guid RegistroId { get; set; }
        public Dictionary<string, object?> KeyValues { get; } = new();
        public Dictionary<string, object?> OldValues { get; } = new();
        public Dictionary<string, object?> NewValues { get; } = new();

        public AuditLog ToAuditLog()
        {
            return new AuditLog
            {
                Tabla = Tabla,
                UsuarioId = UsuarioId,
                Accion = Accion,
                RegistroId = RegistroId,
                Fecha = DateTime.UtcNow,
                DatosAnteriores = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues),
                DatosNuevos = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues)
            };
        }
    }
}
