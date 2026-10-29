# 01 — Seguridad y Control de Accesos (RBAC)

Skill de apoyo: `security-review` (OWASP Top 10, CWE).

- [ ] **Autenticación y Roles**: Toda ruta operativa (`/api/v1/*`) exige autenticación Bearer JWT y filtro por rol explícito (`[Authorize(Roles = "...")]`). Solo `/api/v1/health`, `/api/v1/auth/login` y `/api/v1/reparaciones/consulta-publica/{id}` son públicas.
- [ ] **Control horizontal (IDOR)**: El identificador del operador o técnico que ejecuta acciones se toma del `ClaimsPrincipal` autenticado (`ICurrentUserService`), nunca de parámetros manipulables del request body o query.
- [ ] **Control vertical**: Las acciones administrativas (gestión de personal, asignación de roles, activación/desactivación en `UsuariosController.cs`) están restringidas exclusivamente al rol `Administrador`.
- [ ] **Almacenamiento de credenciales**: Contraseñas de usuario encriptadas con `BCrypt.Net` con factor de costo adecuado; sin hashes o contraseñas en texto plano en la base de datos o en commits.
- [ ] **Gestión de Secretos**: La clave JWT (`Jwt:Key`) y tokens de integraciones (`WhatsApp:Token`) se leen de variables de entorno seguras, sin fallbacks inseguros ni hardcoding en `appsettings.json` o `Program.cs`.
- [ ] **CORS y Encabezados de Red**: CORS restringido a los orígenes autorizados del frontend en producción (evitar `AllowAnyOrigin()` o `SetIsOriginAllowed(x => true)` en despliegue definitivo).
- [ ] **Carga de Archivos / Evidencias Fotográficas**: Verificación de extensiones permitidas (JPG, PNG, WEBP), validación de tipo MIME por firma (magic bytes), limitación de tamaño máximo por archivo, y nombres UUID generados por el servidor sin path traversal (`wwwroot/uploads/evidencias`).
- [ ] **Manejo de Errores y Logs**: Excepciones internas capturadas sin exponer stack traces de .NET al frontend (`UseDeveloperExceptionPage` deshabilitado en producción); logs sin volcar datos personales sensibles (DNI, teléfonos, contraseñas o tokens).
- [ ] **Sanitización y XSS en Frontend**: En React 19, evitar el uso de `dangerouslySetInnerHTML` o evaluar inputs de usuario sin escape; los datos del DNI y remitos se renderizan de forma segura.
- [ ] **Auditoría de Dependencias**: Paquetes NuGet de .NET (`dotnet list package --vulnerable`) y paquetes npm del frontend (`npm audit`) libres de vulnerabilidades críticas o altas.
