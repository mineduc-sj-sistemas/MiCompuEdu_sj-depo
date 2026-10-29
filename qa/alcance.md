# Alcance Vigente de Auditoría — MiCompuEdu_sj

> Se actualiza cuando el equipo avanza. Cada cambio de frontera queda registrado con fecha y commit.

| Campo | Valor |
|---|---|
| **Fecha** | 2026-10-29 |
| **Commit** | `e0a24fb` |
| **Producto / módulo** | MiCompuEdu_sj (Sistema de Gestión y Trazabilidad de Dispositivos Educativos para Depósito Central - Ministerio de Educación de San Juan) |
| **Flujo en alcance** | 1. Autenticación JWT y control de accesos por roles (Administrador, Supervisor, Técnico, Operador).<br>2. Recepción e Ingreso de notebooks con escaneo PDF417 de DNI, autocompletado desde padrón y generación de comprobante PDF oficial con QR.<br>3. Módulo de Diagnóstico, Reparación y Carga de Evidencias Técnicas.<br>4. Módulo de Derivación a Garantías Externas masivas con generación de remitos oficiales.<br>5. Módulo de Entrega física con validación de tutor/titular y registro de firma.<br>6. Despacho automatizado de notificaciones al tutor vía WhatsApp Business API.<br>7. Dashboard estadístico de supervisión y control operativo.<br>8. Gestión de Personal Institucional (CRUD de usuarios con BCrypt).<br>9. Consulta Pública de estado de órdenes por QR o DNI sin autenticación previa. |
| **Última vista/funcionalidad validada** | Módulo de Garantías Externas y Derivación Masiva en `PanelTecnico.tsx` y validación de teléfono y tutor obligatorio en `EntregaNotebook.tsx` (Commits `6780cf2`, `9fc0c50`). |
| **Fuera de alcance** | Facturación, compras/adquisiciones de repuestos con proveedores provinciales externos (solo se gestiona derivación a garantía oficial), sincronización bidireccional en tiempo real con SIU/SAGE ministerial central (se utiliza padrón precargado). |
| **Accesos provisorios / riesgos aceptados temporalmente** | Token JWT con clave de desarrollo por defecto si no se inyecta `Jwt:Key` en variables de entorno productivas (`Program.cs:93`). Sembrado de credenciales iniciales `Admin123!` para usuarios por defecto (`Program.cs:149`). Certificados SSL autofirmados en Nginx en entornos locales. |

---

## Método
Se audita **desde la última funcionalidad validada hacia atrás**. Por cada vista: componente React → endpoints API WebApi → mediadores/comandos MediatR → servicios de infraestructura → entidades y tablas PostgreSQL.

---

## Mapa Vista → Código

| Vista Frontend | Componente React | Ruta API | Controlador Backend | Comando / Query MediatR | Tablas PostgreSQL |
|---|---|---|---|---|---|
| **Login** | `pages/Login.tsx` | `POST /api/v1/auth/login` | `AuthController.cs` | Inyección directa / EF Core | `usuarios` |
| **Recepción / Registrar Ingreso** | `pages/Operator/RegistrarIngreso.tsx` | `GET /api/v1/beneficiarios/{dni}`<br>`POST /api/v1/reparaciones`<br>`POST /api/v1/escuelas` | `BeneficiariosController.cs`<br>`ReparacionesController.cs`<br>`EscuelasController.cs` | `GetBeneficiarioByDniQuery`<br>`RegistrarIngresoCommand`<br>`CreateEscuelaCommand` | `beneficiarios`, `equipos`, `reparaciones`, `historial_movimientos`, `escuelas`, `programas_educativos` |
| **Entrega de Notebooks** | `pages/Operator/EntregaNotebook.tsx` | `GET /api/v1/reparaciones`<br>`PUT /api/v1/reparaciones/{id}/estado` | `ReparacionesController.cs` | `GetReparacionesQuery`<br>`ActualizarEstadoCommand` | `reparaciones`, `historial_movimientos`, `beneficiarios` |
| **Firma Digital Remota** | `pages/Operator/FirmaRemota.tsx` | `POST /api/v1/firmas/remota` | `FirmaRemotaController.cs` | Inyección de firma / EF Core | `reparaciones`, `evidencias_reparacion` |
| **Panel Técnico / Soporte y Garantía** | `pages/Technician/PanelTecnico.tsx` | `GET /api/v1/reparaciones`<br>`PUT /api/v1/reparaciones/{id}/estado`<br>`POST /api/v1/reparaciones/{id}/evidencias`<br>`PUT /api/v1/reparaciones/derivar-masivo` | `ReparacionesController.cs` | `GetReparacionesQuery`<br>`ActualizarEstadoCommand`<br>`AgregarEvidenciaCommand` | `reparaciones`, `historial_movimientos`, `evidencias_reparacion`, `notificaciones` |
| **Dashboard Estadístico** | `pages/Supervisor/Dashboard.tsx` | `GET /api/v1/dashboard/stats` | `DashboardController.cs` | `GetDashboardStatsQuery` | `reparaciones`, `equipos`, `usuarios`, `fallas_catalogo` |
| **Importación de Padrón** | `pages/Supervisor/ImportarPadron.tsx` | `POST /api/v1/importacion/padron`<br>`POST /api/v1/beneficiarios/importar` | `ImportacionController.cs`<br>`BeneficiariosController.cs` | `ImportarPadronCommand` | `beneficiarios`, `escuelas` |
| **Gestión de Personal** | `pages/Supervisor/GestionUsuarios.tsx` | `GET /api/v1/usuarios`<br>`POST /api/v1/usuarios`<br>`PUT /api/v1/usuarios/{id}`<br>`PUT /api/v1/usuarios/{id}/toggle-active` | `UsuariosController.cs` | `GetUsuariosQuery`<br>`CreateUsuarioCommand`<br>`UpdateUsuarioCommand`<br>`ToggleUsuarioActiveCommand` | `usuarios`, `audit_log` |
| **Consulta Pública** | `pages/ConsultaPublica.tsx` | `GET /api/v1/reparaciones/consulta-publica/{id}` | `ReparacionesController.cs` | `GetReparacionByIdQuery` | `reparaciones`, `historial_movimientos`, `equipos` |

---

## Reglas de Negocio Relevantes

| Regla | Dónde está documentada | Dónde se implementa |
|---|---|---|
| **Verificación de Tutor si es menor**: Si el beneficiario es alumno o menor, es obligatorio registrar los datos del tutor (nombre, DNI y teléfono de contacto). | `context.md`, commits `6780cf2`, `f8763c6` | `RegistrarIngreso.tsx`, `EntregaNotebook.tsx`, `RegistrarIngresoCommand.cs` |
| **Generación obligatoria de Comprobante QR**: Cada ingreso debe generar un comprobante PDF institucional con código QR que enlaza a la consulta pública. | `context.md:22`, `docs/documentacion_tesis.md` | `PdfGeneratorService.cs`, `RegistrarIngresoCommand.cs`, `QuestPDF` |
| **Disparo automático de WhatsApp**: Cambios a estados `Listo para retirar` o `No reparable` encolan y disparan mensaje vía WhatsApp Business Cloud API. | `context.md:21, 146` | `WhatsAppService.cs`, `ActualizarEstadoCommand.cs`, `NotificationWorkerService.cs` |
| **Derivación Masiva a Garantía**: Se pueden agrupar múltiples equipos para envío conjunto a servicio técnico externo oficial, emitiendo remito único con firma y proveedor. | `context.md:143`, commit `c94343b` | `PanelTecnico.tsx`, `ActualizarEstadoCommand.cs`, `reparaciones.ProveedorGarantia` |
| **Restricción de Perfiles (RBAC)**: Solo `Administrador` gestiona personal. `Operador` registra ingreso y entrega. `Técnico` y `Operador` cambian diagnósticos y estados. | `context.md:102, 148` | `[Authorize(Roles = "...")]` en Controllers y validación condicional en `App.tsx` |
| **Inmutabilidad de Auditoría**: Toda alteración crítica debe registrar un snapshot `JSONB` con `datos_anteriores` y `datos_nuevos`. | `context.md:66` | `AuditLog.cs`, `ApplicationDbContext.cs` |
