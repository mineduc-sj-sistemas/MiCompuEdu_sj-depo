using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTutorAndContextToBeneficiario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DniTutor",
                table: "beneficiarios",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Grado",
                table: "beneficiarios",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreTutor",
                table: "beneficiarios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Seccion",
                table: "beneficiarios",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoTutor",
                table: "beneficiarios",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DniTutor",
                table: "beneficiarios");

            migrationBuilder.DropColumn(
                name: "Grado",
                table: "beneficiarios");

            migrationBuilder.DropColumn(
                name: "NombreTutor",
                table: "beneficiarios");

            migrationBuilder.DropColumn(
                name: "Seccion",
                table: "beneficiarios");

            migrationBuilder.DropColumn(
                name: "TelefonoTutor",
                table: "beneficiarios");
        }
    }
}
