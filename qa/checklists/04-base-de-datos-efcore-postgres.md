# 04 — Base de Datos (PostgreSQL / EF Core Queries)

Skill de apoyo: `optimizing-ef-core-queries` (.NET Foundation / Microsoft).

### 1. Optimización de Consultas y Seguimiento (Change Tracker)
- [ ] **Uso Sistemático de `AsNoTracking()`**: Todas las consultas de solo lectura (listados en `GetReparacionesQuery`, `GetBeneficiarioByDniQuery`, `GetDashboardStatsQuery`) utilizan `.AsNoTracking()` para no sobrecargar la memoria con tracking de entidades.
- [ ] **Proyecciones Directas (`Select`) vs Entidades Completas**: Se proyecta directamente a DTOs (`.Select(r => new ReparacionDto { ... })`) cargando exclusivamente las columnas necesarias en lugar de traer la fila entera con todas sus relaciones.
- [ ] **Prevención de Problemas N+1 y Explosión Cartesiana**: Inclusiones de relaciones con `Include()` acotadas; uso de `.AsSplitQuery()` en caso de incluir múltiples colecciones hijas para evitar duplicación de filas en memoria.
- [ ] **Sin `SaveChanges` en Bucles**: En procesos de importación masiva (`import-padron.js` o comandos de importación), las entidades se agregan en lote (`AddRange`) y se ejecuta un único `SaveChangesAsync()` al final.

### 2. Índices Estratégicos y Modelado Físico
- [ ] **Cobertura de Índices para Filtros Críticos**:
  - Índices únicos en claves de negocio: `usuarios(nombre_usuario)`, `usuarios(email)`, `equipos(numero_serie)`, `beneficiarios(dni)`.
  - Índice parcial `ix_reparaciones_estado_activo` (`WHERE estado != 'Entregado'`) verificado en planes de ejecución para la bandeja operativa.
  - Índice parcial `ix_notificaciones_pendientes` (`WHERE estado = 'Pendiente'`) para el despacho del worker.
  - Índice compuesto ordenado en `historial_movimientos(reparacion_id, fecha_movimiento DESC)`.
- [ ] **Etiquetado de Consultas con `.TagWith()`**: Consultas complejas etiquetadas en código (ej. `.TagWith("BandejaTecnica_ListadoActivo")`) para facilitar el diagnóstico en los logs de PostgreSQL.

### 3. Migraciones, Concurrencia y Resiliencia
- [ ] **Migraciones Versionadas con EF Core**: Todas las alteraciones de tablas se realizan mediante migraciones en `MiCompuEdu.Infrastructure/Migrations`; prohibido `EnsureCreated()` en producción.
- [ ] **Integridad Referencial Estricta**: Relaciones con `ON DELETE RESTRICT` en entidades principales (`Beneficiario` con `Equipos`, `Equipo` con `Reparaciones`) para prevenir eliminaciones accidentales de historial.
- [ ] **Auditoría Transaccional (`audit_log`)**: Inserción atómica dentro de la misma transacción de los snapshots `JSONB` de cambios críticos.
