// Configuración centralizada de la API para el frontend
// En Render/producción usa VITE_API_URL si está definida, o '/api/v1' para proxy inverso.
// En desarrollo local apunta al puerto 5110.

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
    ? `http://${window.location.hostname}:5110/api/v1`
    : '/api/v1';

