using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiCompuEdu.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoloCargador : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SoloCargador",
                table: "reparaciones",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SoloCargador",
                table: "reparaciones");
        }
    }
}
