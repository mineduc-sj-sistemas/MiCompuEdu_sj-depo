using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUbicacionesDeposito : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UbicacionDepositoId",
                table: "reparaciones",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ubicaciones_deposito",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Estanteria = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fila = table.Column<int>(type: "integer", nullable: false),
                    Posicion = table.Column<int>(type: "integer", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ubicaciones_deposito", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reparaciones_UbicacionDepositoId",
                table: "reparaciones",
                column: "UbicacionDepositoId");

            migrationBuilder.CreateIndex(
                name: "ix_ubicaciones_deposito_codigo",
                table: "ubicaciones_deposito",
                column: "Codigo",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_reparaciones_ubicaciones_deposito_UbicacionDepositoId",
                table: "reparaciones",
                column: "UbicacionDepositoId",
                principalTable: "ubicaciones_deposito",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_reparaciones_ubicaciones_deposito_UbicacionDepositoId",
                table: "reparaciones");

            migrationBuilder.DropTable(
                name: "ubicaciones_deposito");

            migrationBuilder.DropIndex(
                name: "IX_reparaciones_UbicacionDepositoId",
                table: "reparaciones");

            migrationBuilder.DropColumn(
                name: "UbicacionDepositoId",
                table: "reparaciones");
        }
    }
}
