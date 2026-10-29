# 05 — API RESTful, Controladores y Swagger

- [ ] **Rutas y Verbos HTTP Coherentes**:
  - `POST` para creación (`/api/v1/reparaciones`, `/api/v1/usuarios`, `/api/v1/auth/login`).
  - `GET` para lectura (`/api/v1/reparaciones`, `/api/v1/beneficiarios/{dni}`, `/api/v1/dashboard/stats`).
  - `PUT` para actualización de estado o entidad completa (`/api/v1/reparaciones/{id}/estado`, `/api/v1/usuarios/{id}`).
- [ ] **Sincronización Frontend ↔ Backend**:
  - Cada endpoint invocado desde los servicios y páginas de React (`config.ts`, `RegistrarIngreso.tsx`, `PanelTecnico.tsx`, `EntregaNotebook.tsx`, etc.) coincide exactamente en URL, verbo HTTP y estructura de payload con el controlador backend.
- [ ] **Documentación OpenAPI / Swagger**:
  - `c.SwaggerDoc("v1")` configurado con seguridad Bearer JWT.
  - Swagger UI habilitado en desarrollo (`app.Environment.IsDevelopment()`) y protegido o deshabilitado en producción si la política institucional lo requiere.
- [ ] **Contratos de Respuesta Uniformes**:
  - Retorno de códigos de estado HTTP semánticos: `200 OK`, `201 Created`, `400 Bad Request` (errores de validación de negocio), `401 Unauthorized`, `403 Forbidden` (rol no autorizado), `404 Not Found`.
- [ ] **DTOs de Entrada y Salida**:
  - Las entidades de base de datos nunca se retornan desnudas directamente al cliente; se proyectan a DTOs específicos (`ReparacionDto`, `BeneficiarioDto`, `DashboardDto`, etc.).
- [ ] **Hub de Notificaciones en Tiempo Real (SignalR)**:
  - Hub `/hubs/reparaciones` mapeado y configurado para notificar cambios de estado en vivo a las bandejas conectadas.
