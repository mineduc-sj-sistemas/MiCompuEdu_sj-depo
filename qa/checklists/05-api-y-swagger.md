# 05 — API RESTful, Controladores y Swagger (OWASP API Security)

Skill de apoyo: `owasp-top-10-testing` (API Security 2023: BOLA, Mass Assignment, BFLA).

### 1. Diseño de Endpoints y Verbos HTTP Semánticos
- [ ] **Contratos REST Consistentes**:
  - `POST /api/v1/reparaciones` retorna `201 Created` con encabezado `Location` apuntando a la nueva orden.
  - `PUT /api/v1/reparaciones/{id}/estado` retorna `200 OK` con el DTO actualizado o `204 No Content`.
  - Consultas fallidas devuelven `404 Not Found` (recurso inexistente) o `400 Bad Request` (error de validación de negocio), nunca `500 Internal Server Error`.
- [ ] **Validación Estricta de Payloads (Anti Mass-Assignment)**:
  - Los controladores reciben Request Records / DTOs específicos (`CreateReparacionRequest`, `UpdateUsuarioRequest`), impidiendo que un atacante inyecte campos restringidos como `Rol`, `PasswordHash` o `Id`.

### 2. Sincronización y Swagger OpenAPI
- [ ] **Sincronización Exacta Frontend ↔ Backend**: Cada llamada HTTP en el cliente React (`config.ts`, `RegistrarIngreso.tsx`, `PanelTecnico.tsx`, etc.) coincide exactamente en verbo, ruta y nombres de propiedades con los endpoints de ASP.NET Core.
- [ ] **Documentación OpenAPI Vigente**: La especificación Swagger documenta los esquemas de request/response y los esquemas de seguridad Bearer JWT.
- [ ] **Protección de Swagger en Producción**: Acceso restringido o deshabilitado en entornos públicos de producción (`!app.Environment.IsDevelopment()`).
