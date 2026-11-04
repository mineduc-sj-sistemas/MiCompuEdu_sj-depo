# 06 — Testing y Verificación Automatizada (xUnit)

Skill de apoyo: `dotnet-backend-patterns` (Testing con xUnit & WebApplicationFactory).

### 1. Cobertura de Pruebas Unitarias (`MiCompuEdu.UnitTests`)
- [x] **Tests de Dominio y Lógica Pura**: Pruebas unitarias sobre la lógica de parsing de DNI (`DniParserTests.cs`) con casos borde (formatos nuevos, formatos viejos, caracteres inválidos).
- [x] **Tests de Máquina de Estados de Reparaciones**: Pruebas sobre `ReparacionStateTransitionsTests.cs` validando que no se permitan saltos ilegales (ej. de "Ingresado" directo a "Entregado" sin pasar por diagnóstico o resolución).
- [x] **Tests de Permisos y Roles (RBAC)**: Pruebas en `RolePermissionTests.cs` comprobando que roles no autorizados reciban `403 Forbidden` al invocar acciones restringidas.

### 2. Aislamiento y Entornos Seguros
- [x] **Aislamiento Total de Producción**: Los tests automatizados **nunca** se ejecutan contra bases de datos reales ni realizan llamadas HTTP reales a la API de WhatsApp de Meta.
- [x] **Uso de Base de Datos Efímera / InMemory**: Pruebas de integración (`QueryAndCommandIntegrationTests.cs`) ejecutadas contra base de datos en memoria o Testcontainers desechables.
- [x] **Datos Personales Ficticios**: Ningún test almacena DNIs, teléfonos ni nombres de beneficiarios reales.

