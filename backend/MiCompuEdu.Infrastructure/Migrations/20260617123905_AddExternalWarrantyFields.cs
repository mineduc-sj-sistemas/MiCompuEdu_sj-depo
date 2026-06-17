using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalWarrantyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEsperadaGarantia",
                table: "reparaciones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProveedorGarantia",
                table: "reparaciones",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RemitoGarantia",
                table: "reparaciones",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaEsperadaGarantia",
                table: "reparaciones");

            migrationBuilder.DropColumn(
                name: "ProveedorGarantia",
                table: "reparaciones");

            migrationBuilder.DropColumn(
                name: "RemitoGarantia",
                table: "reparaciones");
        }
    }
}
