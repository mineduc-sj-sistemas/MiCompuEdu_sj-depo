# 07 — Legacy, Limpieza y Código Muerto

- [ ] **Sin Esquemas de Base de Datos Obsoletos**:
  - Un solo esquema canónico de base de datos (`docs/init-database.sql` y `MiCompuEdu.Infrastructure/Migrations`). Los dumps antiguos como `backup_micompuedu.sql` no deben usarse como fuente de verdad en despliegues nuevos.
- [ ] **Sin Archivos Temporales de Compilación o IDEs en Git**:
  - Carpetas `bin/`, `obj/`, `dist/`, `.vs/`, `TestResults/` correctamente excluidas por `.gitignore`.
- [ ] **Limpieza de Archivos de Carga / Comprobantes**:
  - Comprobantes PDF generados y archivos temporales de evidencias (`wwwroot/comprobantes/*.pdf`, `wwwroot/uploads/evidencias/*`) ignorados en Git salvo `.gitkeep`.
- [ ] **Sin Mocks ni Credenciales Fijas en Código Productivo**:
  - Verificación de que no existan bypasses temporales de autenticación ni tokens falsos hardcodeados en los componentes de frontend o controladores de backend.
- [ ] **Scripts Utilitarios Documentados**:
  - Scripts en la raíz (`import-padron.js`, `test-endpoints.js`) con instrucciones claras en `README.md` o archivados si fueron superados por comandos de la API.
- [ ] **Planillas Excel y Padrón Limpio**:
  - Planillas de padrón de prueba (`netbooks_entregadas.xlsx`, `notebooks_entregadas.xlsx`) protegidas y sin datos confidenciales reales en repositorios públicos.
