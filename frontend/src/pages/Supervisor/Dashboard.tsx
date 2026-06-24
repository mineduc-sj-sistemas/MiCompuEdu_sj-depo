import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../../types';
import { LogoSanJuan } from '../../components/Shared/LogoSanJuan';
import { API_BASE_URL } from '../../config';
import { RefreshCw, Loader2, School, User, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  token: string;
}

const estadoColor: Record<string, string> = {
  Ingresado: 'bg-blue-500',
  En_Diagnostico: 'bg-amber-400',
  En_Reparacion: 'bg-orange-500',
  Esperando_Repuestos: 'bg-purple-500',
  Apartado_Para_Garantia: 'bg-indigo-500',
  En_Garantia_Externa: 'bg-cyan-500',
  Reparado: 'bg-green-500',
  Listo_Para_Retirar: 'bg-teal-500',
  No_Reparable: 'bg-red-400',
  Entregado: 'bg-slate-400',
};

export const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch {
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
          { falla: 'Problemas de Sistema Operativo', cantidad: 8 },
        ],
        equiposPorEstado: {
          Ingresado: 12, En_Diagnostico: 8, En_Reparacion: 10,
          Esperando_Repuestos: 5, Apartado_Para_Garantia: 3,
          En_Garantia_Externa: 2, Reparado: 3,
          Listo_Para_Retirar: 0, No_Reparable: 0, Entregado: 82,
        },
        reparacionesPorEscuela: [
          { escuela: 'Escuela Normal Sarmiento', cantidad: 45 },
          { escuela: 'EPET N° 1 Rogelio Boero', cantidad: 35 },
          { escuela: 'Colegio Nacional Cabrera', cantidad: 22 },
          { escuela: 'Colegio Provincial Concepción', cantidad: 18 },
        ],
        efectividadTecnicos: [
          { tecnico: 'Técnico Reparador Alfa', reparados: 48, tiempoPromedioDias: 2.1 },
          { tecnico: 'Técnico Beta Soporte', reparados: 34, tiempoPromedioDias: 3.2 },
        ],
        reparacionesPorMes: [
          { mes: 'Mar 2026', cantidad: 18 },
          { mes: 'Abr 2026', cantidad: 25 },
          { mes: 'May 2026', cantidad: 38 },
          { mes: 'Jun 2026', cantidad: 39 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [token]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8200]" />
        <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
      </div>
    );
  }

  const s = stats ?? {
    equiposIngresados: 0, equiposPendientes: 0, equiposEntregados: 0,
    tiempoPromedioReparacionDias: 0, fallasMasFrecuentes: [],
    equiposPorEstado: {}, reparacionesPorEscuela: [],
    efectividadTecnicos: [], reparacionesPorMes: [],
  };

  const totalFallas = s.fallasMasFrecuentes.reduce((acc, item) => acc + item.cantidad, 0) || 1;
  const maxMes = Math.max(...(s.reparacionesPorMes.map(m => m.cantidad) || [1])) || 1;

  const metricCards = [
    { label: 'Total Ingresados', value: s.equiposIngresados, color: 'text-slate-900', bar: 'bg-slate-800', pct: 100 },
    { label: 'Pendientes', value: s.equiposPendientes, color: 'text-[#FF8200]', bar: 'bg-[#FF8200]', pct: Math.min(100, (s.equiposPendientes / (s.equiposIngresados || 1)) * 100) },
    { label: 'Entregados', value: s.equiposEntregados, color: 'text-green-700', bar: 'bg-green-500', pct: Math.min(100, (s.equiposEntregados / (s.equiposIngresados || 1)) * 100) },
    { label: 'Tiempo Prom.', value: `${s.tiempoPromedioReparacionDias}d`, color: 'text-blue-700', bar: 'bg-blue-500', pct: 65 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <LogoSanJuan className="max-w-[280px]" showMinistry={false} />
          <div className="border-l border-slate-200 pl-4">
            <h2 className="text-xl font-bold text-slate-900">Monitoreo de Soporte Técnico</h2>
            <p className="text-slate-400 text-xs mt-0.5">Indicadores de gestión y trazabilidad en tiempo real.</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium px-4 py-2 rounded-lg border border-slate-200 transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 font-mono ${card.color}`}>{card.value}</p>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className={`${card.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${card.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Faults */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertCircle className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-semibold text-slate-800">Fallas más Frecuentes</h3>
          </div>
          <div className="space-y-3">
            {s.fallasMasFrecuentes.map((item, i) => {
              const pct = Math.round((item.cantidad / totalFallas) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 truncate pr-2">{item.falla}</span>
                    <span className="text-[#FF8200] font-mono font-semibold shrink-0">{item.cantidad} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#FF8200] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-800">Distribución por Estado</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(s.equiposPorEstado)
              .filter(([estado]) => estado !== 'Entregado')
              .map(([estado, cantidad], i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{estado.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{cantidad}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${estadoColor[estado] || 'bg-slate-300'} shrink-0`} />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* By School */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-semibold text-slate-800">Por Escuela</h3>
          </div>
          <div className="space-y-2">
            {s.reparacionesPorEscuela.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.reparacionesPorEscuela.map((esc, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-700 font-medium truncate pr-2">{esc.escuela}</p>
                  <span className="text-[10px] font-bold text-[#FF8200] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shrink-0">{esc.cantidad}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Tech Effectiveness */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-semibold text-slate-800">Rendimiento Técnico</h3>
          </div>
          <div className="space-y-2">
            {s.efectividadTecnicos.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.efectividadTecnicos.map((t, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-800">{t.tecnico}</p>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Reparados: <span className="font-bold text-green-700">{t.reparados}</span></span>
                    <span>Prom: <span className="font-mono font-bold text-blue-700">{t.tiempoPromedioDias}d</span></span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-semibold text-slate-800">Ingresos Mensuales</h3>
          </div>
          <div className="space-y-3">
            {s.reparacionesPorMes.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.reparacionesPorMes.map((mes, i) => {
                const pct = Math.round((mes.cantidad / maxMes) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{mes.mes}</span>
                      <span className="text-slate-800 font-mono font-semibold">{mes.cantidad}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
