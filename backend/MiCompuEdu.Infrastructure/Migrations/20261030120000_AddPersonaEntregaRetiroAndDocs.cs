using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonaEntregaRetiroAndDocs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PersonaEntregaTipo",
                table: "reparaciones",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaEntregaNombre",
                table: "reparaciones",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaEntregaDni",
                table: "reparaciones",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaEntregaTelefono",
                table: "reparaciones",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaEntregaParentesco",
                table: "reparaciones",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocIdentidadIngresoUrl",
                table: "reparaciones",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaRetiroTipo",
                table: "reparaciones",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaRetiroNombre",
                table: "reparaciones",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaRetiroDni",
                table: "reparaciones",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaRetiroTelefono",
                table: "reparaciones",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonaRetiroParentesco",
                table: "reparaciones",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocIdentidadEntregaUrl",
                table: "reparaciones",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "PersonaEntregaTipo", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaEntregaNombre", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaEntregaDni", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaEntregaTelefono", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaEntregaParentesco", table: "reparaciones");
            migrationBuilder.DropColumn(name: "DocIdentidadIngresoUrl", table: "reparaciones");

            migrationBuilder.DropColumn(name: "PersonaRetiroTipo", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaRetiroNombre", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaRetiroDni", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaRetiroTelefono", table: "reparaciones");
            migrationBuilder.DropColumn(name: "PersonaRetiroParentesco", table: "reparaciones");
            migrationBuilder.DropColumn(name: "DocIdentidadEntregaUrl", table: "reparaciones");
        }
    }
}
