using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDigitalSignature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirmaEntregaBase64",
                table: "reparaciones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmaIngresoBase64",
                table: "reparaciones",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirmaEntregaBase64",
                table: "reparaciones");

            migrationBuilder.DropColumn(
                name: "FirmaIngresoBase64",
                table: "reparaciones");
        }
    }
}
