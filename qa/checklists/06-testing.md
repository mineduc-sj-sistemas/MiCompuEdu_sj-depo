# 06 — Testing y Verificación Automatizada

- [ ] **Suite de Pruebas Unitarias (.NET xUnit)**:
  - Proyecto `MiCompuEdu.UnitTests` implementa tests para lógica central:
    - `DniParserTests.cs`: Decodificación y parsing de strings crudos de código de barras DNI PDF417.
    - `ReparacionStateTransitionsTests.cs`: Validación de transiciones válidas e inválidas en la máquina de estados de órdenes de reparación.
    - `RolePermissionTests.cs`: Cobertura de permisos y restricciones por rol (Operador vs. Administrador vs. Técnico).
    - `QueryAndCommandIntegrationTests.cs`: Comprobación de integración de Handlers con base de datos en memoria / mocks.
- [ ] **Tests de Integración y Validación de Endpoints**:
  - Script automatizado `test-endpoints.js` para validación rápida de contratos HTTP y flujos completos con Node.js.
- [ ] **Aislamiento de Pruebas**:
  - Los tests automatizados **nunca** se ejecutan contra la base de datos de producción ni disparan llamadas reales a la API de WhatsApp ni imprimen en impresoras físicas.
- [ ] **Datos de Prueba Ficticios**:
  - Toda la batería de pruebas utiliza números de serie ficticios y beneficiarios ficticios (sin datos personales reales amparados por ley de protección de datos).
- [ ] **Pruebas Manuales Funcionales**:
  - Registro de casos de prueba manual en `qa/pruebas-manuales/flujo-ROL.md` y `qa/pruebas-manuales/matriz-testing-caja-negra.csv` para flujos de UI y escaneo físico.
