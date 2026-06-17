using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "escuelas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Cue = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Localidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Departamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escuelas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fallas_catalogo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fallas_catalogo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "programas_educativos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_programas_educativos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NombreCompleto = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NombreUsuario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Rol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "beneficiarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Dni = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EscuelaId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_beneficiarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_beneficiarios_escuelas_EscuelaId",
                        column: x => x.EscuelaId,
                        principalTable: "escuelas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "equipos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroSerie = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Marca = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Modelo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CredencialesOffice = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    BeneficiarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProgramaEducativoId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipos_beneficiarios_BeneficiarioId",
                        column: x => x.BeneficiarioId,
                        principalTable: "beneficiarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_equipos_programas_educativos_ProgramaEducativoId",
                        column: x => x.ProgramaEducativoId,
                        principalTable: "programas_educativos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "reparaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EquipoId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperadorIngresoId = table.Column<Guid>(type: "uuid", nullable: false),
                    TecnicoAsignadoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FallaReportada = table.Column<string>(type: "text", nullable: false),
                    FallaCatalogoId = table.Column<int>(type: "integer", nullable: true),
                    Diagnostico = table.Column<string>(type: "text", nullable: true),
                    AccionesRealizadas = table.Column<string>(type: "text", nullable: true),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    ComprobanteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaIngreso = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    FechaLimite = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaEntrega = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reparaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reparaciones_equipos_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reparaciones_fallas_catalogo_FallaCatalogoId",
                        column: x => x.FallaCatalogoId,
                        principalTable: "fallas_catalogo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_reparaciones_usuarios_OperadorIngresoId",
                        column: x => x.OperadorIngresoId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reparaciones_usuarios_TecnicoAsignadoId",
                        column: x => x.TecnicoAsignadoId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "evidencias_reparacion",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReparacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UrlArchivo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NombreArchivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_evidencias_reparacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_evidencias_reparacion_reparaciones_ReparacionId",
                        column: x => x.ReparacionId,
                        principalTable: "reparaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "historial_movimientos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReparacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    EstadoAnterior = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    EstadoNuevo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true),
                    FechaMovimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historial_movimientos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_historial_movimientos_reparaciones_ReparacionId",
                        column: x => x.ReparacionId,
                        principalTable: "reparaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_historial_movimientos_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notificaciones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReparacionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Destinatario = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Mensaje = table.Column<string>(type: "text", nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMensaje = table.Column<string>(type: "text", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notificaciones_reparaciones_ReparacionId",
                        column: x => x.ReparacionId,
                        principalTable: "reparaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_beneficiarios_dni",
                table: "beneficiarios",
                column: "Dni",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_beneficiarios_EscuelaId",
                table: "beneficiarios",
                column: "EscuelaId");

            migrationBuilder.CreateIndex(
                name: "ix_beneficiarios_nombre",
                table: "beneficiarios",
                columns: new[] { "Apellido", "Nombre" });

            migrationBuilder.CreateIndex(
                name: "ix_equipos_beneficiario",
                table: "equipos",
                column: "BeneficiarioId");

            migrationBuilder.CreateIndex(
                name: "ix_equipos_numero_serie",
                table: "equipos",
                column: "NumeroSerie",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipos_ProgramaEducativoId",
                table: "equipos",
                column: "ProgramaEducativoId");

            migrationBuilder.CreateIndex(
                name: "ix_escuelas_cue",
                table: "escuelas",
                column: "Cue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_evidencias_reparacion_ReparacionId",
                table: "evidencias_reparacion",
                column: "ReparacionId");

            migrationBuilder.CreateIndex(
                name: "ix_fallas_catalogo_nombre",
                table: "fallas_catalogo",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_historial_movimientos_UsuarioId",
                table: "historial_movimientos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "ix_historial_reparacion_fecha",
                table: "historial_movimientos",
                columns: new[] { "ReparacionId", "FechaMovimiento" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_notificaciones_pendientes",
                table: "notificaciones",
                column: "Estado",
                filter: "\"Estado\" = 'Pendiente'");

            migrationBuilder.CreateIndex(
                name: "IX_notificaciones_ReparacionId",
                table: "notificaciones",
                column: "ReparacionId");

            migrationBuilder.CreateIndex(
                name: "ix_programas_educativos_nombre",
                table: "programas_educativos",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reparaciones_equipo",
                table: "reparaciones",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "ix_reparaciones_estado_activo",
                table: "reparaciones",
                column: "Estado",
                filter: "\"Estado\" != 'Entregado'");

            migrationBuilder.CreateIndex(
                name: "IX_reparaciones_FallaCatalogoId",
                table: "reparaciones",
                column: "FallaCatalogoId");

            migrationBuilder.CreateIndex(
                name: "ix_reparaciones_fecha",
                table: "reparaciones",
                column: "FechaIngreso");

            migrationBuilder.CreateIndex(
                name: "IX_reparaciones_OperadorIngresoId",
                table: "reparaciones",
                column: "OperadorIngresoId");

            migrationBuilder.CreateIndex(
                name: "IX_reparaciones_TecnicoAsignadoId",
                table: "reparaciones",
                column: "TecnicoAsignadoId");

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_email",
                table: "usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_nombre_usuario",
                table: "usuarios",
                column: "NombreUsuario",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "evidencias_reparacion");

            migrationBuilder.DropTable(
                name: "historial_movimientos");

            migrationBuilder.DropTable(
                name: "notificaciones");

            migrationBuilder.DropTable(
                name: "reparaciones");

            migrationBuilder.DropTable(
                name: "equipos");

            migrationBuilder.DropTable(
                name: "fallas_catalogo");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "beneficiarios");

            migrationBuilder.DropTable(
                name: "programas_educativos");

            migrationBuilder.DropTable(
                name: "escuelas");
        }
    }
}
