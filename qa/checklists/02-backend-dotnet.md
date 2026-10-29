# 02 — Backend (.NET 8 / Clean Architecture / C#)

- [ ] **Desacoplamiento de Capas (Clean Architecture)**:
  - `MiCompuEdu.Domain`: Contiene entidades, enums y lógica pura; cero referencias a EF Core, ASP.NET o librerías de infraestructura.
  - `MiCompuEdu.Application`: Contiene comandos y consultas CQRS con MediatR, DTOs, interfaces (`IApplicationDbContext`, `IWhatsAppService`, etc.) y validaciones; sin dependencias a controladores ni bases de datos físicas.
  - `MiCompuEdu.Infrastructure`: Implementa acceso a datos con EF Core, generación de PDFs (`QuestPDF`), SignalR y servicios externos.
  - `MiCompuEdu.WebApi`: Controladores livianos que delegan la lógica a MediatR (`_mediator.Send(...)`), middlewares y configuración de inyección de dependencias.
- [ ] **Controladores Delgados (Thin Controllers) y Límite de Tamaño**:
  - Ningún controlador debe superar las **~200 líneas de código**.
  - **Cero inyecciones directas de DbContext en Controllers**: Ningún controlador debe inyectar `IApplicationDbContext` o `ApplicationDbContext`. Toda consulta o persistencia debe delegarse a Commands/Queries de MediatR o Application Services.
- [ ] **Patrón CQRS y MediatR**: Cada caso de uso está encapsulado en su respectivo Command/Query y Handler (`RegistrarIngresoCommand`, `ActualizarEstadoCommand`, `GetDashboardStatsQuery`, etc.).
- [ ] **Validación de Datos de Entrada**: Validación de parámetros requeridos (DNI válido, tutor obligatorio si el beneficiario es menor, número de serie de equipo, estado de reparación válido) antes de persistir.
- [ ] **Manejo Centralizado de Excepciones**: Middleware global de excepciones o filtros para devolver respuestas HTTP con estructura consistente (`ProblemDetails` o formato estándar JSON) y códigos de estado adecuados (400 Bad Request, 404 Not Found, 409 Conflict, 500 Internal Server Error).
- [ ] **Inyección de Dependencias y Ciclos de Vida**: Servicios registrados con su ciclo de vida correcto (`Scoped` para DbContext y servicios por solicitud, `HostedService` para background workers como `NotificationWorkerService`).
- [ ] **Resiliencia e Integraciones Asíncronas**: Las llamadas a la API de WhatsApp Business tienen control de reintentos, timeout definido y manejo de contingencia en caso de falta de conexión a Meta.
- [ ] **Worker de Notificaciones en Segundo Plano**: `NotificationWorkerService` procesa la cola de notificaciones pendientes de forma controlada sin saturar la base de datos ni bloquear peticiones web.
- [ ] **Versionado y Rutas REST**: Rutas de controladores prefijadas consistentemente con `/api/v1/[controller]`.
- [ ] **Health Check**: Endpoint `/api/v1/health` disponible y respondiendo `200 OK` para monitoreo de orquestadores Docker/Render sin efectos secundarios.
