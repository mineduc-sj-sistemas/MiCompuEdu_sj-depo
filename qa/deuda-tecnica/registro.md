# Registro de Deuda Técnica — MiCompuEdu_sj

Los IDs **no cambian** entre auditorías. Estados: Abierto · En progreso · Parcial · Resuelto · Discutido · Riesgo aceptado · Regresión.  
Alcance vigente: ver `qa/alcance.md`. Última actualización: 2026-11-04 · remediación integral QA Pre-Deploy.

| ID | Sev. | Área | Título | Regla | Detectado | Estado | Cierre | Tarea |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | Media | Backend | Clave secreta JWT con fallback inseguro | 01-seguridad | 2026-10-29 | Resuelto | 2026-11-04 | Validación estricta de `Jwt:Key` (>=32 caracteres) en `Program.cs` con excepción fatal en entorno `Production` y `JwtOptions` tipado (`IOptions<JwtOptions>`). |
| AUD-002 | Media | Backend | Política CORS excesivamente permisiva en desarrollo | 01-seguridad | 2026-10-29 | Resuelto | 2026-11-04 | Restricción de `WithOrigins(allowedOrigins)` en producción y cabeceras HTTP de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) en `Program.cs`. |
| AUD-003 | Baja | Limpieza | Script `backup_micompuedu.sql` legado en raíz | 07-legacy | 2026-10-29 | Resuelto | 2026-11-04 | Reubicado en `docs/archive/backup_micompuedu.sql` fuera de la raíz de despliegue. |

---

## Notas privadas para fases futuras (no se auditan hoy)
- Integración en tiempo real con padrón SIU ministerial provincial (fuera de alcance de la versión actual).
- Pasarela de gestión de garantías con repuestos por partida presupuestaria.

---

## Historial de auditorías

| # | Fecha | Commit | Alcance | Semáforo | Críticas | Altas | Medias | Bajas | Resueltas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-29 | `e0a24fb` | Inicialización de QA y alcance base | 🟡 GO con riesgos | 0 | 0 | 2 | 1 | 0 |
| 2 | 2026-11-04 | `main` | Remediación integral 10 áreas + Clean Architecture + LOC (<500 lín) | 🟢 GO Aprobado (100%) | 0 | 0 | 0 | 0 | 3 |
