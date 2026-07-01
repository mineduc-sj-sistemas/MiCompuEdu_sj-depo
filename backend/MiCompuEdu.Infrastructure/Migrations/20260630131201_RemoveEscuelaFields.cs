using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEscuelaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_escuelas_cue",
                table: "escuelas");

            migrationBuilder.DropColumn(
                name: "Cue",
                table: "escuelas");

            migrationBuilder.DropColumn(
                name: "Departamento",
                table: "escuelas");

            migrationBuilder.DropColumn(
                name: "Localidad",
                table: "escuelas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cue",
                table: "escuelas",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Departamento",
                table: "escuelas",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Localidad",
                table: "escuelas",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "ix_escuelas_cue",
                table: "escuelas",
                column: "Cue",
                unique: true);
        }
    }
}
