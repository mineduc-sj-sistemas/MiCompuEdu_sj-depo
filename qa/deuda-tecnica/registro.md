# Registro de Deuda Técnica — MiCompuEdu_sj

Los IDs **no cambian** entre auditorías. Estados: Abierto · En progreso · Parcial · Resuelto · Discutido · Riesgo aceptado · Regresión.  
Alcance vigente: ver `qa/alcance.md`. Última actualización: 2026-11-04 · Auditoría Profunda e Informe Maestro Pre-Deploy (79/79 ítems verificados).

| ID | Sev. | Área | Título | Regla | Detectado | Estado | Cierre | Tarea |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | Media | Backend | Clave secreta JWT con fallback inseguro | 01-seguridad | 2026-10-29 | Resuelto | 2026-11-04 | Validación estricta de `Jwt:Key` (>=32 caracteres) en `Program.cs` y eliminación de fallback en `FirmaRemotaController.cs` usando `IOptions<JwtOptions>`. |
| AUD-002 | Media | Backend | Política CORS excesivamente permisiva en desarrollo | 01-seguridad | 2026-10-29 | Resuelto | 2026-11-04 | Restricción de `WithOrigins(allowedOrigins)` en producción y cabeceras HTTP de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) en `Program.cs`. |
| AUD-003 | Baja | Limpieza | Script `backup_micompuedu.sql` legado en raíz | 07-legacy | 2026-10-29 | Resuelto | 2026-11-04 | Reubicado en `docs/archive/backup_micompuedu.sql` fuera de la raíz de despliegue. |
| AUD-004 | Media | Testing / Backend | Discrepancia de rol en test `SubirEvidencia` y advertencia `MSB3277` | 06-testing | 2026-11-04 | Resuelto | 2026-11-04 | Alineación de `RolePermissionTests.cs` y unificación de `Microsoft.EntityFrameworkCore.Relational` (`8.0.*`). Suite `dotnet test` pasa 29/29 con 0 advertencias. |
| AUD-005 | Media | Frontend | Uso de `any` en 16 archivos TS y ausencia de interceptor `401` | 03-frontend | 2026-11-04 | Resuelto | 2026-11-04 | Tipado estricto completo (`0` usos de `any` en `frontend/src/`), `Promise.all` en carga de catálogos e interceptor global `installSessionExpiredInterceptor` en `config.ts`. |
| AUD-006 | Baja | Base de Datos | Falta de `.AsSplitQuery()` en `GetReparacionesQuery` y mocks en Dashboard | 04-bd / 07-legacy | 2026-11-04 | Resuelto | 2026-11-04 | Incorporación de `.AsSplitQuery()`, `.AsNoTracking()` y `.TagWith()` en todas las queries de lectura y eliminación de datos mock en `GetDashboardStatsQuery.cs`. |

---

## Notas privadas para fases futuras (no se auditan hoy)
- Integración en tiempo real con padrón SIU ministerial provincial (fuera de alcance de la versión actual).
- Pasarela de gestión de garantías con repuestos por partida presupuestaria.

---

## Historial de auditorías

| # | Fecha | Commit | Alcance | Semáforo | Críticas | Altas | Medias | Bajas | Resueltas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-29 | `e0a24fb` | Inicialización de QA y alcance base | 🟡 GO con riesgos | 0 | 0 | 2 | 1 | 0 |
| 2 | 2026-11-04 | `d51f979` | Remediación arquitectónica Clean Architecture + LOC (<500 lín) | 🟢 GO Aprobado | 0 | 0 | 0 | 0 | 3 |
| 3 | 2026-11-04 | `HEAD` | Auditoría profunda código por código (79/79 ítems, 29/29 tests, 0 `any`) | 🟢 GO Aprobado (100%) | 0 | 0 | 0 | 0 | 6 |
