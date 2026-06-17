using System;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using MiCompuEdu.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace MiCompuEdu.UnitTests
{
    public class RolePermissionTests
    {
        [Fact]
        public void ReparacionesController_ShouldHaveAuthorizeAttributeAtClassLevel()
        {
            // Arrange & Act
            var type = typeof(ReparacionesController);
            var authorizeAttribute = type.GetCustomAttribute<AuthorizeAttribute>();

            // Assert
            authorizeAttribute.Should().NotBeNull("Controller should be protected by [Authorize]");
        }

        [Theory]
        [InlineData("RegistrarIngreso", "Operador,Supervisor,Administrador")]
        [InlineData("ObtenerTodos", "Operador,Tecnico,Supervisor,Administrador")]
        [InlineData("ActualizarEstado", "Operador,Tecnico,Supervisor,Administrador")]
        [InlineData("SubirEvidencia", "Tecnico,Supervisor,Administrador")]
        public void ReparacionesControllerMethods_ShouldHaveCorrectRoles(string methodName, string expectedRoles)
        {
            // Arrange
            var type = typeof(ReparacionesController);
            var method = type.GetMethods()
                .FirstOrDefault(m => m.Name == methodName && m.GetCustomAttribute<AuthorizeAttribute>() != null);

            // Assert
            method.Should().NotBeNull($"Method {methodName} should exist and have [Authorize] attribute");
            
            var authAttribute = method!.GetCustomAttribute<AuthorizeAttribute>();
            authAttribute!.Roles.Should().Be(expectedRoles, $"Method {methodName} must restrict access to: {expectedRoles}");
        }

        [Theory]
        [InlineData("RegistrarIngreso", typeof(HttpPostAttribute))]
        [InlineData("ObtenerTodos", typeof(HttpGetAttribute))]
        [InlineData("ActualizarEstado", typeof(HttpPutAttribute))]
        [InlineData("SubirEvidencia", typeof(HttpPostAttribute))]
        public void ReparacionesControllerMethods_ShouldHaveCorrectHttpMethodAttribute(string methodName, Type httpMethodAttributeType)
        {
            // Arrange
            var type = typeof(ReparacionesController);
            var method = type.GetMethods()
                .FirstOrDefault(m => m.Name == methodName);

            // Assert
            method.Should().NotBeNull($"Method {methodName} should exist");
            var attribute = method!.GetCustomAttribute(httpMethodAttributeType);
            attribute.Should().NotBeNull($"Method {methodName} should have attribute {httpMethodAttributeType.Name}");
        }
    }
}
