# Contexto del Proyecto: MiCompuEdu_sj

Este documento sirve como registro maestro de contexto y arquitectura del sistema **MiCompuEdu_sj** (Sistema de Gestión y Trazabilidad de Dispositivos Educativos para el Depósito del Ministerio de Educación de San Juan).

---

## 1. Descripción General

**MiCompuEdu_sj** es una plataforma web integral diseñada para automatizar el flujo de trabajo de recepción, diagnóstico, reparación, trazabilidad, archivo de planillas firmadas y entrega de dispositivos tecnológicos (notebooks de los programas *Maestros de América*, *Conectar Igualdad*, *Juana Manso*, etc.) en el depósito central del Ministerio de Educación de San Juan.

### Problemas que resuelve:
1. **Registro manual ineficiente**: Errores en la transcripción de datos de beneficiarios, tutores y números de serie de equipos.
2. **Falta de trazabilidad**: Dificultad para conocer el estado, el responsable de entrega/retiro y el historial de reparaciones de un equipo en tiempo real.
3. **Pérdida de información**: Datos sin validar contra el padrón nominal del Ministerio o falta de respaldo digital de actas y planillas firmadas.
4. **Fallas de comunicación**: Equipos archivados indefinidamente debido a la falta de comunicación efectiva para el retiro.

### Soluciones clave:
- Búsqueda y autocompletado asistido por escaneo del código de barras (PDF417) del DNI argentino (`dniParser.ts`).
- Integración nominal con el padrón de *Maestros de América* y soporte para **carga manual completa** cuando el DNI o serie no figura en el padrón.
- Validación obligatoria de datos del **Tutor Responsable** en el caso de alumnos, junto con el registro detallado de la persona física que entrega o retira el equipo y su teléfono de contacto.
- Captura de firma digital manuscrita (en pantalla o remota vía QR) y digitalización de DNI.
- Archivo digital de **Planillas de Retiro Diarias** (múltiples hojas escaneadas en imagen o PDF vinculadas a una fecha específica con buscador por día).
- Gestión digital de reparaciones con asignación de técnicos, plantillas rápidas, derivación a garantía externa en lote y cambio de estados.
- Notificaciones automáticas en segundo plano (`NotificationWorkerService`) al tutor/titular por WhatsApp Business API con política de hasta 3 reintentos.
- Generación de comprobantes oficiales de ingreso, egreso, ficha de estado y remito de garantía en PDF/impresión con código QR único.
- Dashboard interactivo de métricas e indicadores de rendimiento técnico para supervisores y administradores.

---

## 2. Arquitectura Tecnológica

El sistema se compone de dos bloques principales (Backend y Frontend) bajo estándares estrictos de calidad:

### Backend (`/backend`)
- **Framework**: .NET 8 (`ASP.NET Core Web API`).
- **Patrón de Arquitectura**: **Clean Architecture** organizada en 4 proyectos desacoplados + 1 proyecto de pruebas:
  - `MiCompuEdu.Domain`: Entidades puras (`BaseEntity`), enumeraciones y lógica de dominio (0 dependencias externas).
  - `MiCompuEdu.Application`: Casos de uso CQRS con **MediatR** (`IRequest` / `IRequestHandler`), validadores **FluentValidation**, interfaces (`IApplicationDbContext`, `ICurrentUserService`, `IWhatsAppService`, `IPdfGeneratorService`), opciones tipadas (`JwtOptions`, `WhatsAppOptions`) y validador de seguridad de archivos (`FileSecurityValidator`).
  - `MiCompuEdu.Infrastructure`: Persistencia con **Entity Framework Core 8** (PostgreSQL / Npgsql), interceptor automático de auditoría JSONB (`ApplicationDbContext.SaveChangesAsync`), worker en segundo plano (`NotificationWorkerService`) y servicios de infraestructura (`WhatsAppService`, `PdfGeneratorService`).
  - `MiCompuEdu.WebApi`: 13 controladores REST livianos (`< 200` líneas cada uno, 100% desacoplados de `DbContext` vía `ISender`), `GlobalExceptionHandlerMiddleware` (estándar RFC 7807 `ProblemDetails`), `CurrentUserService`, cabeceras de seguridad HTTP y políticas CORS restrictivas.
  - `MiCompuEdu.UnitTests`: Suite de 29 pruebas unitarias automatizadas con **xUnit**, **Moq**, **FluentAssertions** y **EF Core InMemory**.

### Frontend (`/frontend`)
- **Framework**: React 19 + Vite 8.
- **Lenguaje**: TypeScript 5.9 en modo estricto (`strict: true`, **0 usos de `any`**).
- **Estilos**: Tailwind CSS v4 (integrado vía `@tailwindcss/vite`) con identidad visual institucional del Gobierno de San Juan (`#FF8200`).
- **Modularización**: Todas las vistas (`src/pages/`) tienen menos de 500 líneas de código, apoyadas en custom hooks (`useRegistrarIngresoForm`, `usePlanillasRetiro`) y subcomponentes especializados (`src/components/`).
- **Seguridad de Sesión**: Interceptor centralizado de respuestas `401 Unauthorized` (`installSessionExpiredInterceptor` en `src/config.ts`) que limpia la sesión caducada y redirige automáticamente al login.

---

## 3. Modelo de Datos y Esquema PostgreSQL

El esquema relacional en PostgreSQL cuenta con **EF Core Migrations** versionadas, **12+ índices estratégicos** (incluyendo índices parciales `WHERE estado != 'Entregado'` y `WHERE estado = 'Pendiente'`) y restricciones físicas (`CHECK`, `UNIQUE`, `ON DELETE RESTRICT/CASCADE`).

### Tablas del Sistema:
1. **`escuelas`**: Establecimientos educativos provinciales (`cue` único, `nombre`, `localidad`, `departamento`).
2. **`programas_educativos`**: Programas de distribución (*Maestros de América*, *Conectar Igualdad*, *Juana Manso*, etc.).
3. **`ubicaciones_deposito`**: Posiciones físicas de estantería/fila en el depósito (`codigo` único).
4. **`usuarios`**: Cuentas del personal con `password_hash` BCrypt y `CHECK` de rol (`Administrador`, `Supervisor`, `Tecnico`, `Operador`).
5. **`beneficiarios`**: Alumnos, docentes y directivos (`dni` único, datos de contacto y columnas de tutor responsable: `dni_tutor`, `nombre_tutor`, `telefono_tutor`, `grado`, `seccion`).
6. **`equipos`**: Netbooks registradas (`numero_serie` único, `marca`, `modelo`, `beneficiario_id`, `programa_educativo_id`).
7. **`fallas_catalogo`**: Catálogo tipificado de fallas comunes.
8. **`reparaciones`**: Órdenes de servicio con trazabilidad de ingreso/retiro (`persona_entrega_*`, `persona_retiro_*`, `doc_identidad_*`, `firma_*_base64`), garantía externa (`proveedor_garantia`, `remito_garantia`, `fecha_esperada_garantia`) y estado.
9. **`historial_movimientos`**: Trazabilidad cronológica de cambios de estado por orden.
10. **`evidencias_reparacion`**: Fotografías y adjuntos técnicos validados por firma mágica (magic bytes).
11. **`notificaciones`**: Cola e historial de envíos por WhatsApp/Email con contador de `reintentos`.
12. **`planillas_diarias`** y **`archivos_planilla_diaria`**: Registro de planillas físicas firmadas por fecha de retiro con soporte para múltiples archivos adjuntos (JPG, PNG, WEBP, PDF).
13. **`audit_log`**: Log inmutable de auditoría a nivel de fila con `datos_anteriores` y `datos_nuevos` en formato `JSONB`.

---

## 4. Catálogo de Endpoints REST (`/api/v1`)

1. **`AuthController` (`/api/v1/auth`)**: `POST /login` (autenticación JWT con BCrypt).
2. **`BeneficiariosController` (`/api/v1/beneficiarios`)**: `GET /{dni}` (búsqueda por DNI de titular/tutor o número de serie).
3. **`ReparacionesController` (`/api/v1/reparaciones`)**:
   - `GET /`: Listado filtrado y paginado con `.AsNoTracking()`, `.AsSplitQuery()` y `.TagWith()`.
   - `POST /`: Registro de ingreso desde padrón.
   - `POST /manual`: Registro de ingreso con alta/actualización manual de beneficiario y equipo.
   - `PUT /{id}/estado`: Actualización de diagnóstico, estado, garantía o entrega final.
   - `GET /{id}/historial` y `GET /{id}/notificaciones`: Trazabilidad e historial de avisos.
   - `POST /{id}/evidencias`: Subida segura de evidencia validada con `FileSecurityValidator`.
   - `GET /{id}/comprobante` y `GET /consulta-publica/{id}`: Comprobante PDF y consulta pública por QR.
4. **`PlanillasDiariasController` (`/api/v1/planillasdiarias`)**: `GET /`, `POST /`, `POST /{id}/archivos`, `DELETE /{id}`, `DELETE /archivos/{archivoId}`.
5. **`FirmaRemotaController` (`/api/v1/firmaremota`)**: `GET /token/{reparacionId}` y `POST /guardar` (firma manuscrita desde celular vía QR con token HMAC-SHA256).
6. **`DashboardController` (`/api/v1/dashboard/stats`)**: KPIs operativos, distribución de estados, top escuelas, efectividad técnica y tendencia mensual.
7. **`AuditoriaController` (`/api/v1/auditoria`)**: Consulta paginada de registros `audit_log` (Supervisor/Administrador).
8. **`ImportacionController` (`/api/v1/importacion/padron`)**: Importación masiva desde Excel (`.xlsx`/`.xls`).
9. **`EscuelasController`, `ProgramasController`, `UbicacionesController`, `CleanupEscuelasController`, `UsuariosController`**: Administración de catálogos y personal.

---

## 5. Registro de Cambios Recientes

- **2026-11-04**: **Auditoría Profunda y Remediación Integral QA Pre-Deploy (10/10 Áreas al 100%)**:
  - Refactorización de los 13 controladores de `MiCompuEdu.WebApi` para eliminar toda dependencia directa de `ApplicationDbContext`, delegando el 100% de la lógica a handlers CQRS de `MediatR` con propagación de `CancellationToken` y manteniendo cada controlador por debajo de 200 líneas.
  - Refactorización y modularización de las 11 páginas del frontend React (`src/pages/`) para que ninguna supere las 500 líneas, extrayendo hooks y subcomponentes cohesivos.
  - Eliminación del 100% de usos del tipo `any` en TypeScript (`0` ocurrencias en todo `frontend/src/`), incorporación de carga paralela con `Promise.all` e interceptor global de sesión expirada (`401 Unauthorized`).
  - Optimización de consultas EF Core con `.AsNoTracking()`, `.AsSplitQuery()` y `.TagWith()`, y eliminación de datos mock en `GetDashboardStatsQuery`.
  - Validación de seguridad de archivos por *Magic Bytes* (`FileSecurityValidator`), cabeceras HTTP de seguridad, CORS restrictivo por entorno y suite de 29 pruebas unitarias en `MiCompuEdu.UnitTests` pasando al 100%.
- **2026-07-02**: Implementación del módulo de **Planillas de Retiro Diarias** (`PlanillasDiariasController`, `PlanillasRetiro.tsx`) para adjuntar múltiples hojas escaneadas (imagen o PDF) vinculadas a un día específico con búsqueda por fecha, carga manual cuando el DNI no se encuentra en *Maestros de América*, obligatoriedad de datos del tutor para alumnos y edición de teléfono en ingreso/entrega.
