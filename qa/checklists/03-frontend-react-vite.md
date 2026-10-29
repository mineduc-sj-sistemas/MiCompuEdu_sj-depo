# 03 — Frontend (React 19 / Vite 8 / TypeScript / Tailwind CSS v4)

- [ ] **Enrutamiento y Control de Roles**: Renderizado condicional en `App.tsx` respetando estrictamente los roles del usuario logueado (`Operador`, `Tecnico`, `Supervisor`, `Administrador`) y ruta `/consulta` pública accesible sin sesión.
- [ ] **Modularidad y Límite de Tamaño de Vistas**:
  - Ningún archivo de vista en `src/pages/` debe superar las **~500 líneas de código**.
  - Si una pantalla es compleja (ej. formularios extensos, modales, dashboards o escaneo de documentos), debe descomponerse en **Partials / Subcomponentes** dentro de subcarpetas `components/` o extraer lógica de negocio a custom hooks (`use...`).
- [ ] **Persistencia y Manejo de Sesión**: La sesión (`micompuedu_session` en `localStorage`) almacena token JWT y rol; si el token expira o es inválido (401), se redirige de forma limpia a la pantalla de Login sin loops infinitos.
- [ ] **Tipado Estricto TypeScript**: Uso de interfaces y tipos centralizados en `types.ts` (`User`, `Reparacion`, `Beneficiario`, etc.); sin uso indiscriminado de `any`.
- [ ] **Estilos y Diseño Responsive**: Uso consistente de clases de Tailwind CSS v4 con la paleta institucional (naranja `#FF8200`, gris grafito `#1D252D`, slate); diseño adaptable a pantallas de escritorio de depósito y dispositivos móviles.
- [ ] **Manejo de Formularios y Estados**: Formularios con feedback visual claro (spinners de carga, mensajes de éxito y alertas de error en rojo); botones de acción deshabilitados durante envíos asincrónicos para prevenir dobles submits.
- [ ] **Lector y Parser de DNI**: `dniParser.ts` procesa correctamente el formato de código de barras PDF417 de los DNIs argentinos (versiones nueva y vieja), extrayendo DNI, apellido, nombre, sexo y fecha de nacimiento sin excepciones no controladas.
- [ ] **Generación e Impresión de Remitos y Comprobantes**: `printHelpers.ts` y las ventanas emergentes de impresión se renderizan correctamente sin recortar encabezados, tablas de equipos ni bloques de firmas.
- [ ] **Configuración de Variables de Entorno**: `config.ts` lee `VITE_API_URL` correctamente con fallback local para desarrollo; sin URLs fijas de localhost en build de producción.
- [ ] **Build y Verificación de Tipos**: `npm run build` (`tsc -b && vite build`) compila sin errores ni warnings críticos de TypeScript.
