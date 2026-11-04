# 03 — Frontend (React 19 / Vite 8 / TypeScript / Tailwind CSS v4)

Skill de apoyo: `vercel-react-best-practices` (Vercel Engineering).

### 1. Modularidad y Desacoplamiento de Vistas Monolíticas
- [x] **Límite de Tamaño de Vistas (< 500 lín)**: Ningún archivo de componente de página en `src/pages/` debe superar las 500 líneas de código.
- [x] **Extracción a Subcomponentes / Partials**: Las pantallas con flujos densos (`RegistrarIngreso.tsx`, `PanelTecnico.tsx`, `Dashboard.tsx`, `EntregaNotebook.tsx`) delegan sus subsecciones a componentes en subcarpetas `components/` (ej. scanner DNI, modales de diagnóstico, galerías de fotos y filtros).
- [x] **Extracción de Lógica de Negocio a Custom Hooks**: La lógica de manejo de estado compleja (llamadas a API, filtros, lectura de scanner) se extrae a hooks personalizados (`useReparaciones`, `useDniScanner`, etc.) para dejar la vista puramente declarativa.

### 2. Rendimiento y Optimización de Renderizado
- [x] **Eliminación de Waterfalls en Peticiones (`async-parallel`)**: Llamadas independientes a la API (ej. traer catálogos de fallas y escuelas al iniciar) se ejecutan concurrentemente con `Promise.all()` en lugar de secuencialmente con múltiples `await` anidados.
- [x] **Prevención de Re-renders Excesivos (`rerender-memo`)**: Uso de `useMemo` en cálculos pesados de filtrado de tablas y `useCallback` en funciones pasadas como props a componentes hijos para evitar renders innecesarios en listas largas.
- [x] **Optimización de Importaciones de Librerías (`bundle-barrel-imports`)**: Importaciones directas de íconos de `lucide-react` para permitir el Tree Shaking efectivo de Vite y mantener el bundle inicial liviano.

### 3. Tipado, Formularios y Estado de Sesión
- [x] **Tipado Estricto TypeScript (Sin `any`)**: Todas las entidades, DTOs de respuesta y props de componentes cuentan con interfaces definidas en `types.ts`.
- [x] **Control de Envíos Duplicados en Formularios**: Botones de acción ("Registrar Ingreso", "Confirmar Entrega", "Guardar Diagnóstico") se deshabilitan inmediatamente durante la petición HTTP (`isSubmitting / loading`) para impedir registros duplicados.
- [x] **Gestión Robusta de Sesión y Redirección 401**: Si el token JWT en `localStorage` expira o el backend responde `401 Unauthorized`, el interceptor redirige limpiamente a la pantalla de Login sin parpadeos ni bucles infinitos.
- [x] **Compilación Limpia**: `npm run build` (`tsc -b && vite build`) compila con 0 errores y sin warnings bloqueantes.

