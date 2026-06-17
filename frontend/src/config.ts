// Configuración centralizada de la API para el frontend
// En desarrollo, apunta directamente al puerto del backend local (5110).
// En producción, utiliza rutas relativas delegando el enrutamiento al proxy inverso de Nginx.

export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5110/api/v1'
  : '/api/v1';
