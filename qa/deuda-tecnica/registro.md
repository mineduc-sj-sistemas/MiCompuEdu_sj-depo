# Registro de Deuda Técnica — MiCompuEdu_sj

Los IDs **no cambian** entre auditorías. Estados: Abierto · En progreso · Parcial · Resuelto · Discutido · Riesgo aceptado · Regresión.  
Alcance vigente: ver `qa/alcance.md`. Última actualización: 2026-10-29 · commit `e0a24fb`.

| ID | Sev. | Área | Título | Regla | Detectado | Estado | Cierre | Tarea |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | Media | Backend | Clave secreta JWT con fallback inseguro | 01-seguridad | 2026-10-29 | Abierto | | Inyectar obligatoriamente `Jwt:Key` desde variables de entorno y fallar al inicio si no está definida en `Program.cs`. |
| AUD-002 | Media | Backend | Política CORS excesivamente permisiva en desarrollo | 01-seguridad | 2026-10-29 | Abierto | | Acotar `SetIsOriginAllowed` a orígenes estrictos del frontend institucional en producción. |
| AUD-003 | Baja | Limpieza | Script `backup_micompuedu.sql` legado en raíz | 07-legacy | 2026-10-29 | Abierto | | Mover a archivo histórico o excluir de despliegues productivos para evitar confusiones con EF Migrations. |

---

## Notas privadas para fases futuras (no se auditan hoy)
- Integración en tiempo real con padrón SIU ministerial provincial (fuera de alcance de la versión actual).
- Pasarela de gestión de garantías con repuestos por partida presupuestaria.

---

## Historial de auditorías

| # | Fecha | Commit | Alcance | Semáforo | Críticas | Altas | Medias | Bajas | Resueltas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-29 | `e0a24fb` | Inicialización de QA y alcance base | 🟡 GO con riesgos | 0 | 0 | 2 | 1 | 0 |
