# 10 — Documentación Técnica y de Negocio

- [ ] **Documento de Contexto Vivo (`context.md`)**:
  - `context.md` al día con las últimas decisiones de arquitectura, nuevas columnas, migraciones EF Core, endpoints y modelos agregados.
- [ ] **Esquemas y DDL**:
  - `docs/init-database.sql` y `docs/modelo_base_datos.dbml` reflejan exactamente el estado actual del modelo en `ApplicationDbContext`.
- [ ] **Documentación de Endpoints**:
  - La lista de endpoints y parámetros en la documentación coincide con los controladores reales en `MiCompuEdu.WebApi/Controllers/`.
- [ ] **Variables de Entorno (`.env.example`)**:
  - Todas las variables leídas por el backend o el frontend están declaradas en `.env.example` con comentarios explicativos sobre su formato y obligatoriedad.
- [ ] **Guía de Puesta en Marcha**:
  - Instrucciones claras para levantar el entorno local mediante `docker-compose up -d` o ejecución manual con dotnet y npm.
- [ ] **Reglas de Negocio Documentadas**:
  - Lógica de asignación de técnicos, cálculo de semáforos de dashboard, obligatoriedad de tutor según minoría de edad y derivación masiva a garantía documentadas y alineadas con el código.
