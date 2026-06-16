import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../../types';
import { LogoSanJuan } from '../../components/Shared/LogoSanJuan';

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
          En_Garantia_Externa: 2,
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
        <span className="inline-block w-10 h-10 border-4 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
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
      {/* Header with Dashboard info and official crest */}
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <LogoSanJuan className="max-w-[320px]" />
          <div className="border-l border-slate-300 pl-4">
            <h2 className="text-2xl font-extrabold text-[#1D252D] m-0">Monitoreo de Soporte Técnico</h2>
            <p className="text-slate-500 text-xs mt-0.5">Indicadores de gestión y trazabilidad en tiempo real.</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-200 transition-colors text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Ingresados</p>
          <p className="text-4xl font-extrabold text-[#1D252D] mt-2 font-mono">{s.equiposIngresados}</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#1D252D] h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pendientes de Soporte</p>
          <p className="text-4xl font-extrabold text-[#FF8200] mt-2 font-mono">{s.equiposPendientes}</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#FF8200] h-full rounded-full" style={{ width: `${Math.min(100, (s.equiposPendientes / (s.equiposIngresados || 1)) * 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Entregados / Listos</p>
          <p className="text-4xl font-extrabold text-green-700 mt-2 font-mono">{s.equiposEntregados}</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-600 h-full rounded-full" style={{ width: `${Math.min(100, (s.equiposEntregados / (s.equiposIngresados || 1)) * 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tiempo Res. Promedio</p>
          <p className="text-4xl font-extrabold text-blue-700 mt-2 font-mono">{s.tiempoPromedioReparacionDias}d</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Faults Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#1D252D] border-b border-slate-100 pb-2">Fallas más Frecuentes</h3>
          <div className="space-y-4">
            {s.fallasMasFrecuentes.map((item, index) => {
              const percentage = Math.round((item.cantidad / totalFallas) * 100);
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-semibold">{item.falla}</span>
                    <span className="text-[#FF8200] font-mono font-bold">{item.cantidad} equipos ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-[#FF8200] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#1D252D] border-b border-slate-100 pb-2">Distribución por Estado</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(s.equiposPorEstado)
              .filter(([estado]) => estado !== 'Entregado')
              .map(([estado, cantidad], idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                      {estado.replace(/_/g, ' ')}
                    </span>
                    <p className="text-2xl font-bold text-[#1D252D] mt-1 font-mono">{cantidad}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    estado === 'Ingresado' ? 'bg-blue-500' :
                    estado === 'En_Diagnostico' ? 'bg-[#FBDD40]' :
                    estado === 'En_Reparacion' ? 'bg-[#FF8200]' :
                    estado === 'Esperando_Repuestos' ? 'bg-purple-500' :
                    estado === 'En_Garantia_Externa' ? 'bg-cyan-500' :
                    'bg-green-500'
                  }`}></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
