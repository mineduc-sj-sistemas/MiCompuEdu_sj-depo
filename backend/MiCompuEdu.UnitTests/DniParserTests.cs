using System;
using FluentAssertions;
using MiCompuEdu.Domain.Common;
using Xunit;

namespace MiCompuEdu.UnitTests
{
    public class DniParserTests
    {
        [Fact]
        public void ParseDniScan_WithNullOrEmpty_ShouldReturnNull()
        {
            // Act
            var result1 = DniParser.ParseDniScan(null!);
            var result2 = DniParser.ParseDniScan("");
            var result3 = DniParser.ParseDniScan("   ");
            var result4 = DniParser.ParseDniScan("12345"); // too short

            // Assert
            result1.Should().BeNull();
            result2.Should().BeNull();
            result3.Should().BeNull();
            result4.Should().BeNull();
        }

        [Fact]
        public void ParseDniScan_WithValidStandardModernFormat_ShouldParseCorrectly()
        {
            // Arrange
            // Formato estándar: 00123456789@APELLIDO@NOMBRE@M@DNI@COPIAS@FECHA_NACIMIENTO@FECHA_EMISION@CUIL
            string rawScan = "00543216789@PEREZ@JUAN CARLOS@M@42345678@A@15/10/1999@12/03/2018@20423456789";

            // Act
            var result = DniParser.ParseDniScan(rawScan);

            // Assert
            result.Should().NotBeNull();
            result!.Dni.Should().Be("42345678");
            result.Apellido.Should().Be("Perez");
            result.Nombre.Should().Be("Juan Carlos");
            result.Sexo.Should().Be("M");
            result.FechaNacimiento.Should().Be("15/10/1999");
        }

        [Fact]
        public void ParseDniScan_WithAlternativePositionDni_ShouldStillFindDni()
        {
            // Arrange
            // DNI in index 5 instead of 4, but still valid 8 digits
            string rawScan = "00543216789@GONZALEZ@MARIA@F@INVALID_DNI@43123456@12/12/2000";

            // Act
            var result = DniParser.ParseDniScan(rawScan);

            // Assert
            result.Should().NotBeNull();
            result!.Dni.Should().Be("43123456");
            result.Apellido.Should().Be("Gonzalez");
            result.Nombre.Should().Be("Maria");
            result.Sexo.Should().Be("F");
        }

        [Fact]
        public void ParseDniScan_WithNoValidDniPattern_ShouldReturnNull()
        {
            // Arrange
            // No 7 or 8 digits string anywhere in the splits
            string rawScan = "00543216789@RODRIGUEZ@PEDRO@M@ABCDEF@XYZ@10/10/1990";

            // Act
            var result = DniParser.ParseDniScan(rawScan);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void ParseDniScan_WithMixedCasingAndSpaces_ShouldNormalizeCasing()
        {
            // Arrange
            string rawScan = "00543216789@  de la vega  @  carlos alberto  @M@38765432@A@01/01/1992";

            // Act
            var result = DniParser.ParseDniScan(rawScan);

            // Assert
            result.Should().NotBeNull();
            result!.Dni.Should().Be("38765432");
            result.Apellido.Should().Be("De La Vega");
            result.Nombre.Should().Be("Carlos Alberto");
        }
    }
}
