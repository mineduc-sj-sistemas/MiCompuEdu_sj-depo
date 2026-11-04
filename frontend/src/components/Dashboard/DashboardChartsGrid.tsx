import React from 'react';
import type { DashboardStats } from '../../types';
import { School, User, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

interface DashboardChartsGridProps {
  stats: DashboardStats;
  estadoColor: Record<string, string>;
  estadoNombreEsp: Record<string, string>;
  onFaultClick: (falla: string) => void;
  onEstadoClick: (estado: string) => void;
  onEscuelaClick: (escuela: string) => void;
  onTecnicoClick: (tecnico: string) => void;
  onMesClick: (mes: string) => void;
}

export const DashboardChartsGrid: React.FC<DashboardChartsGridProps> = ({
  stats: s,
  estadoColor,
  estadoNombreEsp,
  onFaultClick,
  onEstadoClick,
  onEscuelaClick,
  onTecnicoClick,
  onMesClick,
}) => {
  const totalFallas = s.fallasMasFrecuentes.reduce((acc, item) => acc + item.cantidad, 0) || 1;
  const maxMes = Math.max(...(s.reparacionesPorMes.map((m) => m.cantidad) || [1])) || 1;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertCircle className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Fallas más Frecuentes</h3>
          </div>
          <div className="space-y-3">
            {s.fallasMasFrecuentes.map((item, i) => {
              const pct = Math.round((item.cantidad / totalFallas) * 100);
              return (
                <div
                  key={i}
                  onClick={() => onFaultClick(item.falla)}
                  className="space-y-1 cursor-pointer group p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all duration-300"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium group-hover:text-[#FF8200] transition-colors truncate pr-2">{item.falla}</span>
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

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Distribución por Estado</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(s.equiposPorEstado)
              .filter(([estado]) => estado !== 'Entregado')
              .map(([estado, cantidad], i) => (
                <div
                  key={i}
                  onClick={() => onEstadoClick(estado)}
                  className="bg-slate-50 border border-slate-100 hover:border-slate-350 hover:bg-slate-100/50 hover:shadow-sm cursor-pointer rounded-xl p-3 flex items-center justify-between transition-all duration-300 group"
                >
                  <div>
                    <p className="text-[9px] text-slate-450 uppercase tracking-wider font-bold group-hover:text-slate-800 transition-colors">
                      {estadoNombreEsp[estado] || estado.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{cantidad}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${estadoColor[estado] || 'bg-slate-300'} shadow-sm shrink-0`} />
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Por Escuela</h3>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {s.reparacionesPorEscuela.length === 0 ? (
              <p className="text-slate-400 text-xs">Sin datos.</p>
            ) : (
              s.reparacionesPorEscuela.map((esc, i) => (
                <div
                  key={i}
                  onClick={() => onEscuelaClick(esc.escuela)}
                  className="flex items-center justify-between bg-slate-50 hover:bg-orange-50/20 border border-slate-100 hover:border-orange-200 cursor-pointer p-2.5 rounded-lg transition-all duration-300 group"
                >
                  <p className="text-xs text-slate-700 font-medium truncate pr-2 group-hover:text-slate-900">{esc.escuela}</p>
                  <span className="text-[10px] font-bold text-[#FF8200] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shrink-0">{esc.cantidad}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Rendimiento Técnico</h3>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {s.efectividadTecnicos.length === 0 ? (
              <p className="text-slate-400 text-xs">Sin datos.</p>
            ) : (
              s.efectividadTecnicos.map((t, i) => (
                <div
                  key={i}
                  onClick={() => onTecnicoClick(t.tecnico)}
                  className="bg-slate-50 hover:bg-orange-50/20 border border-slate-100 hover:border-orange-250 cursor-pointer p-3 rounded-lg space-y-1.5 transition-all duration-300"
                >
                  <p className="text-xs font-bold text-slate-800">{t.tecnico}</p>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Reparados: <span className="font-bold text-green-700">{t.reparados}</span></span>
                    <span>Promedio: <span className="font-mono font-bold text-blue-700">{t.tiempoPromedioDias}d</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Ingresos Mensuales</h3>
          </div>
          <div className="space-y-3">
            {s.reparacionesPorMes.length === 0 ? (
              <p className="text-slate-400 text-xs">Sin datos.</p>
            ) : (
              s.reparacionesPorMes.map((mes, i) => {
                const pct = Math.round((mes.cantidad / maxMes) * 100);
                return (
                  <div
                    key={i}
                    onClick={() => onMesClick(mes.mes)}
                    className="space-y-1 cursor-pointer group p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-all duration-300"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-semibold group-hover:text-[#FF8200] transition-colors">{mes.mes}</span>
                      <span className="text-slate-800 font-mono font-bold">{mes.cantidad}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};
