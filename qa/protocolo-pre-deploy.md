# Protocolo Pre-Deploy (QA)

## Cuándo
Antes de cada deploy a **PRODUCCIÓN**. Para entornos de prueba/staging se aplica la versión corta (pasos 1, 2 y 5).

## Semáforo
- 🔴 **NO-GO:** algún hallazgo **Crítico** abierto (autenticación/RBAC, secretos, base de datos o build roto), o dependencias/lockfile sin verificar.
- 🟡 **GO con riesgos:** hay hallazgos **Altos** abiertos con plan y fecha, sin Críticos.
- 🟢 **GO:** solo Medios/Bajos.
- La seguridad crítica es **bloqueante automática** en producción.

## Pasos
1. **Fijar el commit** a evaluar (`git log -1 --format=%h`) y actualizar el repositorio (`git pull`).
2. **Auditar** con el agente y las skills personales (ver `plantillas/prompts.md`), recorriendo `checklists/01…10` dentro del alcance definido en `alcance.md`.
3. **Comparar** contra `deuda-tecnica/registro.md`: Resuelto / Parcial / No resuelto / Nuevo / Regresión.
4. **Redactar** `informes/AUDITORIA_<fecha>_<sha>.md` (y su `.html` imprimible). Actualizar el registro.
5. **Emitir** `pedidos/PEDIDO_DE_CAMBIOS_<fecha>.md` con lo pendiente y entregarlo al equipo.
6. **Pruebas manuales** de los ítems de UI/flujo (`pruebas-manuales/`), siempre en un entorno de prueba aislado.
7. **Veredicto** y reporte de avance (`REPORTE_AVANCE`) a jefatura.

## Reglas
- Un ítem pasa a **Resuelto** solo si cumple su criterio de aceptación en el commit re-auditado.
- Las discrepancias se registran como **Discutido** o **Riesgo aceptado** (con nombre y fecha); nunca se borran.
- Nunca ejecutar pruebas que creen datos o llamen a servicios externos reales contra producción.
