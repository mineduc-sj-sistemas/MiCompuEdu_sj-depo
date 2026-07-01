using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ClosedXML.Excel;
using FluentAssertions;
using MiCompuEdu.Application.Beneficiarios.Commands;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Reparaciones.Queries;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using MiCompuEdu.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace MiCompuEdu.UnitTests
{
    public class QueryAndCommandIntegrationTests
    {
        private readonly Mock<ICurrentUserService> _mockCurrentUserService;
        private readonly DbContextOptions<ApplicationDbContext> _dbContextOptions;

        public QueryAndCommandIntegrationTests()
        {
            _mockCurrentUserService = new Mock<ICurrentUserService>();
            _mockCurrentUserService.Setup(m => m.UsuarioId).Returns(Guid.NewGuid());

            _dbContextOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
        }

        private ApplicationDbContext CreateDbContext()
        {
            return new ApplicationDbContext(_dbContextOptions, _mockCurrentUserService.Object);
        }

        [Fact]
        public async Task GetReparacionesQuery_WithPagination_ShouldPaginateCorrectly()
        {
            // Arrange
            using var context = CreateDbContext();
            
            // Seed a program, a beneficiary, and a few equipments
            var escuela = new Escuela { Id = Guid.NewGuid(), Nombre = "Escuela Sarmiento" };
            var programa = new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "Juana Manso" };
            context.Escuelas.Add(escuela);
            context.ProgramasEducativos.Add(programa);

            var beneficiario = new Beneficiario { Id = Guid.NewGuid(), Dni = "12345678", Nombre = "Juan", Apellido = "Perez", EscuelaId = escuela.Id };
            context.Beneficiarios.Add(beneficiario);

            var equipo1 = new Equipo { Id = Guid.NewGuid(), NumeroSerie = "S1", Marca = "Brand", Modelo = "Model", BeneficiarioId = beneficiario.Id, ProgramaEducativoId = programa.Id };
            var equipo2 = new Equipo { Id = Guid.NewGuid(), NumeroSerie = "S2", Marca = "Brand", Modelo = "Model", BeneficiarioId = beneficiario.Id, ProgramaEducativoId = programa.Id };
            var equipo3 = new Equipo { Id = Guid.NewGuid(), NumeroSerie = "S3", Marca = "Brand", Modelo = "Model", BeneficiarioId = beneficiario.Id, ProgramaEducativoId = programa.Id };
            context.Equipos.AddRange(equipo1, equipo2, equipo3);

            var operador = new Usuario { Id = Guid.NewGuid(), NombreCompleto = "Op", NombreUsuario = "op", Email = "op@gmail.com", PasswordHash = "hash", Rol = UserRole.Operador };
            context.Usuarios.Add(operador);

            // Add three repairs with different ingestion dates
            var r1 = new Reparacion { Id = Guid.NewGuid(), EquipoId = equipo1.Id, Estado = EstadoEquipo.Ingresado, FallaReportada = "No enciende", OperadorIngresoId = operador.Id, FechaIngreso = DateTime.UtcNow.AddMinutes(-30) };
            var r2 = new Reparacion { Id = Guid.NewGuid(), EquipoId = equipo2.Id, Estado = EstadoEquipo.En_Diagnostico, FallaReportada = "Pantalla rota", OperadorIngresoId = operador.Id, FechaIngreso = DateTime.UtcNow.AddMinutes(-20) };
            var r3 = new Reparacion { Id = Guid.NewGuid(), EquipoId = equipo3.Id, Estado = EstadoEquipo.En_Reparacion, FallaReportada = "Bloqueo", OperadorIngresoId = operador.Id, FechaIngreso = DateTime.UtcNow.AddMinutes(-10) };
            context.Reparaciones.AddRange(r1, r2, r3);

            await context.SaveChangesAsync();

            var handler = new GetReparacionesQueryHandler(context);

            // Act - Page 1 with size 2
            var queryPage1 = new GetReparacionesQuery(null, null, null, null, null, null, null, null, 1, 2);
            var resultPage1 = await handler.Handle(queryPage1, CancellationToken.None);

            // Assert Page 1 (Ordered Descending by FechaIngreso: r3, r2)
            resultPage1.Should().HaveCount(2);
            resultPage1[0].Id.Should().Be(r3.Id);
            resultPage1[1].Id.Should().Be(r2.Id);

            // Act - Page 2 with size 2
            var queryPage2 = new GetReparacionesQuery(null, null, null, null, null, null, null, null, 2, 2);
            var resultPage2 = await handler.Handle(queryPage2, CancellationToken.None);

            // Assert Page 2 (r1)
            resultPage2.Should().HaveCount(1);
            resultPage2[0].Id.Should().Be(r1.Id);
        }

        [Fact]
        public async Task ImportarPadronCommand_ShouldProcessChunkedExcelCorrectly()
        {
            // Arrange
            using var context = CreateDbContext();
            
            // Setup default program
            var defaultProg = new ProgramaEducativo
            {
                Id = Guid.NewGuid(),
                Nombre = "MiCompuEdu San Juan",
                Descripcion = "Default",
                Activo = true,
                CreadoEn = DateTime.UtcNow
            };
            context.ProgramasEducativos.Add(defaultProg);
            await context.SaveChangesAsync();

            // Create a dummy Excel stream
            var stream = new MemoryStream();
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Padron");
                
                // Headers (DniParser or ImportarPadron maps column indexes)
                // Row 1: Headers
                worksheet.Cell(1, 1).Value = "ID";
                worksheet.Cell(1, 2).Value = "NRO SERIE";
                worksheet.Cell(1, 3).Value = "DNI ALUMNO";
                worksheet.Cell(1, 4).Value = "NOMBRE ALUMNO";
                worksheet.Cell(1, 5).Value = "DNI TUTOR";
                worksheet.Cell(1, 6).Value = "NOMBRE TUTOR";
                worksheet.Cell(1, 9).Value = "ESCUELA";
                worksheet.Cell(1, 10).Value = "GRADO";
                worksheet.Cell(1, 11).Value = "SECCION";
                worksheet.Cell(1, 12).Value = "CELULAR";
                worksheet.Cell(1, 13).Value = "EMAIL";

                // Row 2: Standard row
                worksheet.Cell(2, 1).Value = "1";
                worksheet.Cell(2, 2).Value = "SERIE-TEST-999";
                worksheet.Cell(2, 3).Value = "45123456";
                worksheet.Cell(2, 4).Value = "Perez, Juan";
                worksheet.Cell(2, 5).Value = "20123456";
                worksheet.Cell(2, 6).Value = "Perez, Carlos";
                worksheet.Cell(2, 9).Value = "Colegio Sarmiento";
                worksheet.Cell(2, 10).Value = "6";
                worksheet.Cell(2, 11).Value = "A";
                worksheet.Cell(2, 12).Value = "2644999999";
                worksheet.Cell(2, 13).Value = "juan@sarmiento.edu.ar";

                workbook.SaveAs(stream);
            }
            stream.Position = 0;

            var command = new ImportarPadronCommand(stream);
            var handler = new ImportarPadronCommandHandler(context);

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.TotalFilas.Should().Be(1);
            result.Errores.Should().Be(0);
            result.BeneficiariosCreados.Should().Be(1);
            result.EquiposCreados.Should().Be(1);
            result.EscuelasCreadas.Should().Be(1);

            // Verify database state
            var savedEscuela = await context.Escuelas.FirstOrDefaultAsync(e => e.Nombre == "Colegio Sarmiento");
            savedEscuela.Should().NotBeNull();

            var savedBeneficiario = await context.Beneficiarios.FirstOrDefaultAsync(b => b.Dni == "45123456");
            savedBeneficiario.Should().NotBeNull();
            savedBeneficiario!.Nombre.Should().Be("Juan");
            savedBeneficiario.Apellido.Should().Be("Perez");
            savedBeneficiario.EscuelaId.Should().Be(savedEscuela!.Id);

            var savedEquipo = await context.Equipos.FirstOrDefaultAsync(e => e.NumeroSerie == "SERIE-TEST-999");
            savedEquipo.Should().NotBeNull();
            savedEquipo!.BeneficiarioId.Should().Be(savedBeneficiario.Id);
        }
    }
}
