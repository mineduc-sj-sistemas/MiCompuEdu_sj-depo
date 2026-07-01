import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { AlertTriangle } from 'lucide-react';

export const HealthCheckBanner: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkHealth = async () => {
      try {
        // Si el fetch no arroja excepción de red (ERR_CONNECTION_REFUSED), el servidor está encendido.
        // Hacemos una petición simple a un endpoint público conocido.
        await fetch(`${API_BASE_URL}/health`);
        setIsHealthy(true); 
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
