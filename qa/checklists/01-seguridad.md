# 01 — Seguridad y Control de Accesos (OWASP 2025 & Sentry)

Skills de apoyo: `security-review` (Sentry) y `owasp-top-10-testing` (OWASP Top 10:2025).

### A01: Broken Access Control & IDOR (Control de Accesos Horizontal y Vertical)
- [ ] **Control Horizontal (BOLA / IDOR)**: El identificador del usuario que opera se extrae obligatoriamente del `ClaimsPrincipal` autenticado (`ICurrentUserService`), nunca de parámetros manipulables del request body o query params.
- [ ] **Control Vertical por Rol (RBAC)**: Toda ruta operativa (`/api/v1/*`) exige directiva `[Authorize(Roles = "...")]`. Las acciones privilegiadas (gestión de personal, asignación de roles, activación/desactivación en `UsuariosController.cs`) están restringidas exclusivamente al rol `Administrador`.
- [ ] **Rutas Públicas Mínimas y Declaradas**: Únicamente `/api/v1/health`, `/api/v1/auth/login` y `/api/v1/reparaciones/consulta-publica/{id}` están exentas de autenticación.

### A02: Security Misconfiguration (Configuración de Seguridad)
- [ ] **CORS Acotado a Orígenes Confiables**: CORS explícitamente limitado al dominio del frontend institucional en producción; prohibido el uso de `AllowAnyOrigin()` o `SetIsOriginAllowed(x => true)` en despliegue definitivo.
- [ ] **Encabezados HTTP Seguros**: Configuración de cabeceras de protección (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
- [ ] **Swagger Protegido en Producción**: La interfaz gráfica de Swagger UI (`app.UseSwaggerUI()`) está restringida al entorno de desarrollo o protegida bajo autenticación administrativa.

### A04: Cryptographic Failures & Gestión de Secretos
- [ ] **Almacenamiento de Contraseñas con BCrypt**: Las claves de acceso de los usuarios se almacenan con hash `BCrypt.Net` con factor de costo adecuado; sin hashes ni contraseñas en texto plano en la base de datos o en commits.
- [ ] **Secreto JWT Robusto sin Fallbacks Inseguros**: La clave de firma (`Jwt:Key`) se inyecta obligatoriamente por variable de entorno de al menos 32 caracteres; el backend debe fallar al iniciar si la clave no está configurada o usa valores por defecto.
- [ ] **Validación Estricta de Tokens JWT**: Se valida firma, `Issuer`, `Audience`, tiempo de expiración (`ValidateLifetime = true`) y `ClockSkew = TimeSpan.Zero`.

### A05: Injection & Manejo Seguro de Archivos
- [ ] **Prevención de Inyección SQL**: Todas las consultas a PostgreSQL se ejecutan mediante EF Core parametrizado o `FromSqlInterpolated()`; prohibida la concatenación cruda de cadenas en sentencias SQL.
- [ ] **Carga Segura de Evidencias Fotográficas**: Verificación de extensiones permitidas (JPG, PNG, WEBP), validación del magic bytes (firma binaria del archivo), cuota máxima de tamaño y renombramiento con UUIDs únicos generados por el servidor para evitar Path Traversal.
- [ ] **Sanitización contra XSS en Frontend**: Los inputs de usuario (nombre de tutor, DNI, observaciones técnicas) se renderizan mediante escape nativo de React; sin uso de `dangerouslySetInnerHTML`.

### A10: Manejo de Excepciones y Fugas de Información
- [ ] **Supresión de Stack Traces**: En entorno de producción (`ASPNETCORE_ENVIRONMENT=Production`), los errores devuelven un formato genérico `ProblemDetails` sin exponer trazas de la base de datos, rutas internas ni dependencias.
- [ ] **Logs Seguros y Auditables**: La bitácora (`ILogger`) registra eventos de auditoría pero excluye datos sensibles (números de serie con DNI titular, contraseñas, tokens JWT).
