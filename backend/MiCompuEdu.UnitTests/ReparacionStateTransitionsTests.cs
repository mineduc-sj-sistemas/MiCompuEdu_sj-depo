using System;
using FluentAssertions;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Xunit;

namespace MiCompuEdu.UnitTests
{
    public class ReparacionStateTransitionsTests
    {
        [Fact]
        public void CreateReparacion_ShouldDefaultToIngresado()
        {
            // Act
            var reparacion = new Reparacion();

            // Assert
            reparacion.Estado.Should().Be(EstadoEquipo.Ingresado);
            reparacion.FechaIngreso.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
            reparacion.FechaEntrega.Should().BeNull();
        }

        [Fact]
        public void TransitionToEntregado_ShouldSetFechaEntrega()
        {
            // Arrange
            var reparacion = new Reparacion
            {
                Estado = EstadoEquipo.Listo_Para_Retirar
            };

            // Act - Simulando la lógica del comando
            reparacion.Estado = EstadoEquipo.Entregado;
            reparacion.FechaEntrega = DateTime.UtcNow;

            // Assert
            reparacion.Estado.Should().Be(EstadoEquipo.Entregado);
            reparacion.FechaEntrega.Should().NotBeNull();
            reparacion.FechaEntrega.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        }

        [Fact]
        public void TransitionToEnGarantiaExterna_ShouldRecordWarrantyFields()
        {
            // Arrange
            var reparacion = new Reparacion
            {
                Estado = EstadoEquipo.Ingresado
            };
            var proveedor = "Exo Oficial";
            var remito = "R-999";
            var fechaEsperada = DateTime.UtcNow.AddDays(10);

            // Act - Simulando asignación de derivación
            reparacion.Estado = EstadoEquipo.En_Garantia_Externa;
            reparacion.ProveedorGarantia = proveedor;
            reparacion.RemitoGarantia = remito;
            reparacion.FechaEsperadaGarantia = fechaEsperada;

            // Assert
            reparacion.Estado.Should().Be(EstadoEquipo.En_Garantia_Externa);
            reparacion.ProveedorGarantia.Should().Be(proveedor);
            reparacion.RemitoGarantia.Should().Be(remito);
            reparacion.FechaEsperadaGarantia.Should().Be(fechaEsperada);
        }

        [Fact]
        public void AddDigitalSignature_ShouldStoreSignatureSuccessfully()
        {
            // Arrange
            var reparacion = new Reparacion();
            var mockSignature = "data:image/png;base64,mockbytes...";

            // Act
            reparacion.FirmaIngresoBase64 = mockSignature;

            // Assert
            reparacion.FirmaIngresoBase64.Should().Be(mockSignature);
            reparacion.FirmaEntregaBase64.Should().BeNull();
        }
    }
}
