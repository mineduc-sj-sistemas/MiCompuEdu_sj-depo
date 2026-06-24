import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { AlertTriangle } from 'lucide-react';

export const HealthCheckBanner: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkHealth = async () => {
      try {
        // Evaluamos si el backend está respondiendo. Si no tenemos health endpoint, un OPTIONS a API_BASE_URL o metricas
        const response = await fetch(`${API_BASE_URL}/Reparaciones/metricas`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        // 401 means auth is needed, but the server is definitely UP.
        setIsHealthy(response.ok || response.status === 401 || response.status === 403); 
      } catch (error) {
        setIsHealthy(false);
      }
    };

    checkHealth();
    interval = setInterval(checkHealth, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);

  if (isHealthy) return null;

  return (
    <div className="bg-[#E03C31] text-white px-6 py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2 z-50 w-full animate-fade-in relative">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        SIN CONEXIÓN AL SERVIDOR — Algunas funciones no están disponibles. Verifique la red e intente nuevamente.
      </span>
    </div>
  );
};
