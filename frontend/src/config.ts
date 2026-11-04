// Configuración centralizada de la API para el frontend
// En Render/producción usa VITE_API_URL si está definida, o '/api/v1' para proxy inverso.
// En desarrollo local apunta al puerto 5110.

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
    ? `http://${window.location.hostname}:5110/api/v1`
    : '/api/v1';

// Interceptor global de sesión expirada (401 Unauthorized)
let isInterceptorInstalled = false;

export function installSessionExpiredInterceptor(onSessionExpired: () => void): void {
  if (isInterceptorInstalled || typeof window === 'undefined') return;
  isInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isLoginEndpoint = urlStr.toLowerCase().includes('/auth/login');

    if (response.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('micompuedu_session');
      onSessionExpired();
    }
    return response;
  };
}
