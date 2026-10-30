# 09 — Control de Versiones

Skill de apoyo: `conventional-commit`.

- [ ] **Convención de Commits**: Mensajes claros con prefijos convencionales (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`) y resumen conciso en español o inglés técnico según el equipo.
- [ ] **Estrategia de Ramas**: Trabajo en ramas por módulo o feature (`feature/garantias-externas`, `feature/padron`, `fix/tutor-obligatorio`); revisiones de código antes de mergear a `main`.
- [ ] **Etiquetado de Versiones (Tags)**: Creación de tags SemVer o de fecha (`v1.0.0`, `v2026.10.29`) antes de cada pase a producción.
- [ ] **Segregación de Entornos y Archivos Excluidos**:
  - `.gitignore` correctamente configurado para .NET, Node, Vite, entornos locales (`.env`) y carpetas temporales.
  - Directorio `qa/` excluido mediante `.git/info/exclude` o `.gitignore` para auditorías locales independientes.
- [ ] **Repositorio Limpio**: Sin dumps de bases de datos masivos con datos reales ni archivos binarios no versionables.
