# 02 — Backend (.NET 8 / Clean Architecture / C#)

Skill de apoyo: `dotnet-backend-patterns` (Wshobson / Microsoft standard).

### 1. Desacoplamiento de Capas y Responsabilidades (Clean Architecture)
- [ ] **Aislamiento del Dominio (`MiCompuEdu.Domain`)**: Las entidades (`Usuario`, `Reparacion`, `Beneficiario`, `Equipo`, etc.) y enums no tienen referencias a Entity Framework Core, ASP.NET Core ni librerías de infraestructura.
- [ ] **Casos de Uso en Aplicación (`MiCompuEdu.Application`)**: Cada operación de negocio está encapsulada en su propio Command o Query de MediatR con su Handler correspondiente.
- [ ] **Controladores Delgados (Thin Controllers < 200 lín)**: Los controladores de `MiCompuEdu.WebApi/Controllers` actúan como meros adaptadores HTTP: validan el request, invocan `_mediator.Send(...)` y retornan el código de estado correspondiente.
- [ ] **Prohibición de DbContext en Controllers**: Ningún controlador inyecta directamente `IApplicationDbContext` o `ApplicationDbContext`. Toda consulta o mutación a la base de datos se delega a MediatR o Application Services.

### 2. Patrones Asíncronos y Resiliencia
- [ ] **Propagación de `CancellationToken`**: Todos los métodos asíncronos en Handlers, controladores y llamadas a base de datos reciben y propagan el `CancellationToken` para cancelar operaciones si el cliente desconecta.
- [ ] **Cliente HTTP Tipado y Resiliencia en WhatsApp API**: La comunicación con Meta Graph API en `WhatsAppService.cs` utiliza `IHttpClientFactory` con políticas de timeout y reintentos configuradas (Polly / `Microsoft.Extensions.Resilience`).
- [ ] **Procesamiento en Segundo Plano (`NotificationWorkerService`)**: El worker `BackgroundService` procesa la cola de notificaciones pendientes con control de excepciones, pausas configurables y sin bloquear peticiones HTTP de usuarios.

### 3. Configuración, Errores y Logging
- [ ] **Patrón `IOptions<T>` para Configuración Tipada**: Las configuraciones de JWT, conexión a base de datos y WhatsApp se leen mediante clases de opciones fuertemente tipadas en lugar de llamadas sueltas a `Configuration["..."]`.
- [ ] **Manejo Centralizado de Excepciones**: Middleware global de excepciones que captura fallos no controlados y responde con la especificación estándar RFC 7807 (`ProblemDetails`).
- [ ] **Logging Semántico y Estructurado**: Uso de plantillas de mensajes en `ILogger` (ej. `_logger.LogInformation("Reparación {ReparacionId} actualizada a {NuevoEstado}", id, estado)`) evitando la interpolación de strings (`$"..."`) que degrada el rendimiento del garbage collector.
