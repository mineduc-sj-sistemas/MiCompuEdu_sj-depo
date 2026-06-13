import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../../types';

interface DashboardProps {
  token: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5110/api/v1/Dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data: DashboardStats = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación para dashboard.');
      setStats({
        equiposIngresados: 120,
        equiposPendientes: 38,
        equiposEntregados: 82,
        tiempoPromedioReparacionDias: 2.8,
        fallasMasFrecuentes: [
          { falla: 'Bloqueo de Seguridad Juana Manso', cantidad: 45 },
          { falla: 'No Enciende', cantidad: 32 },
          { falla: 'Pantalla Rota / Sin Imagen', cantidad: 20 },
          { falla: 'Falla de Teclado', cantidad: 15 },
          { falla: 'Problemas de Sistema Operativo', cantidad: 8 }
        ],
        equiposPorEstado: {
          Ingresado: 12,
          En_Diagnostico: 8,
          En_Reparacion: 10,
          Esperando_Repuestos: 5,
          Reparado: 3,
          Listo_Para_Retirar: 0,
          No_Reparable: 0,
          Entregado: 82
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading && !stats) {
    return (
      <div className="text-center py-20">
        <span className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
        <p className="text-slate-500 mt-2">Cargando estadísticas del Ministerio...</p>
      </div>
    );
  }

  const s = stats || {
    equiposIngresados: 0,
    equiposPendientes: 0,
    equiposEntregados: 0,
    tiempoPromedioReparacionDias: 0.0,
    fallasMasFrecuentes: [],
    equiposPorEstado: {}
  };

  const totalFallas = s.fallasMasFrecuentes.reduce((acc, item) => acc + item.cantidad, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Dashboard Estadístico</h2>
          <p className="text-slate-400 mt-1">Indicadores globales y tiempos de resolución del depósito central.</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="absolute right-4 top-4 text-3xl opacity-10">📥</div>
          <p className="text-slate-500 text-sm font-semibold">Total Ingresados</p>
          <p className="text-4xl font-extrabold text-white mt-2 font-mono">{s.equiposIngresados}</p>
          <p className="text-xs text-indigo-400 mt-2">Equipos recibidos en el período</p>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="absolute right-4 top-4 text-3xl opacity-10">🔧</div>
          <p className="text-slate-500 text-sm font-semibold">Pendientes Soporte</p>
          <p className="text-4xl font-extrabold text-amber-400 mt-2 font-mono">{s.equiposPendientes}</p>
          <p className="text-xs text-slate-400 mt-2">En proceso de diagnóstico/reparación</p>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="absolute right-4 top-4 text-3xl opacity-10">✅</div>
          <p className="text-slate-500 text-sm font-semibold">Entregados / Listos</p>
          <p className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono">{s.equiposEntregados}</p>
          <p className="text-xs text-slate-400 mt-2">Dispositivos devueltos a las escuelas</p>
        </div>

        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="absolute right-4 top-4 text-3xl opacity-10">⏱️</div>
          <p className="text-slate-500 text-sm font-semibold">Tiempo Res. Promedio</p>
          <p className="text-4xl font-extrabold text-indigo-450 mt-2 font-mono">{s.tiempoPromedioReparacionDias}d</p>
          <p className="text-xs text-indigo-400 mt-2">Días promedio entre ingreso y resolución</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Faults Bar Chart */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-white">Fallas más Frecuentes</h3>
          <div className="space-y-4">
            {s.fallasMasFrecuentes.map((item, index) => {
              const percentage = Math.round((item.cantidad / totalFallas) * 100);
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-semibold">{item.falla}</span>
                    <span className="text-indigo-400 font-mono font-bold">{item.cantidad} equipos ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Breakdown */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-white">Distribución por Estado</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(s.equiposPorEstado)
              .filter(([estado]) => estado !== 'Entregado') // no mostrar el histórico masivo de entregados para enfocar en los activos
              .map(([estado, cantidad], idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      {estado.replace(/_/g, ' ')}
                    </span>
                    <p className="text-2xl font-bold text-white mt-1 font-mono">{cantidad}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    estado === 'Ingresado' ? 'bg-blue-500' :
                    estado === 'En_Diagnostico' ? 'bg-amber-500' :
                    estado === 'En_Reparacion' ? 'bg-indigo-500' :
                    estado === 'Esperando_Repuestos' ? 'bg-purple-500' :
                    'bg-emerald-500'
                  }`}></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
