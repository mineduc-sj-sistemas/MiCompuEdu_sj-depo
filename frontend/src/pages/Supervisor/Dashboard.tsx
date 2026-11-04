import React, { useState, useEffect, useMemo } from 'react';
import type { DashboardStats } from '../../types';
import { LogoSanJuan } from '../../components/Shared/LogoSanJuan';
import { DashboardChartsGrid } from '../../components/Dashboard/DashboardChartsGrid';
import { ModalTrazabilidadEquipo } from '../../components/Dashboard/ModalTrazabilidadEquipo';
import { API_BASE_URL } from '../../config';
import { RefreshCw, Loader2 } from 'lucide-react';

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

const estadoNombreEsp: Record<string, string> = {
  Ingresado: 'Ingresado',
  En_Diagnostico: 'En Diagnóstico',
  En_Reparacion: 'En Reparación',
  Esperando_Repuestos: 'Esperando Repuestos',
  Apartado_Para_Garantia: 'Apartado para Garantía',
  En_Garantia_Externa: 'En Garantía Externa',
  Reparado: 'Reparado',
  Listo_Para_Retirar: 'Listo para retirar',
  No_Reparable: 'No Reparable',
  Entregado: 'Entregado',
};

export const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<{ tipo: string; valor: string; label: string } | null>(null);

  const [selectedModalRepair, setSelectedModalRepair] = useState<any | null>(null);
  const [modalHistory, setModalHistory] = useState<any[]>([]);
  const [loadingModalHistory, setLoadingModalHistory] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch {
      setStats({
        equiposIngresados: 0,
        equiposPendientes: 0,
        equiposEntregados: 0,
        tiempoPromedioReparacionDias: 0,
        fallasMasFrecuentes: [],
        equiposPorEstado: {},
        reparacionesPorEscuela: [],
        efectividadTecnicos: [],
        reparacionesPorMes: [],
      });
    }
  };

  const fetchRepairs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRepairs(await response.json());
      }
    } catch {
      // Ignorar si no está disponible
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchRepairs()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, [token]);

  const s = stats ?? {
    equiposIngresados: 0,
    equiposPendientes: 0,
    equiposEntregados: 0,
    tiempoPromedioReparacionDias: 0,
    fallasMasFrecuentes: [],
    equiposPorEstado: {},
    reparacionesPorEscuela: [],
    efectividadTecnicos: [],
    reparacionesPorMes: [],
  };

  const handleMetricClick = (label: string) => {
    if (label === 'Total Ingresados') setFiltroActivo(null);
    else if (label === 'Pendientes') setFiltroActivo({ tipo: 'pendiente', valor: 'Pendientes', label: 'Estado de Trazabilidad' });
    else if (label === 'Entregados') setFiltroActivo({ tipo: 'entregado', valor: 'Entregado', label: 'Estado de Trazabilidad' });
  };

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (!filtroActivo) return true;
      switch (filtroActivo.tipo) {
        case 'estado':
          return r.estado === filtroActivo.valor;
        case 'pendiente':
          return r.estado !== 'Entregado' && r.estado !== 'Reparado' && r.estado !== 'Listo_Para_Retirar';
        case 'entregado':
          return r.estado === 'Entregado';
        case 'falla':
          return (
            (r.fallaReportada || '').toLowerCase().includes(filtroActivo.valor.toLowerCase()) ||
            (r.fallaCatalogoNombre || '').toLowerCase().includes(filtroActivo.valor.toLowerCase())
          );
        case 'escuela':
          return r.escuelaNombre === filtroActivo.valor;
        case 'tecnico':
          return r.tecnicoAsignadoNombre === filtroActivo.valor;
        case 'mes': {
          if (!r.fechaIngreso) return false;
          const date = new Date(r.fechaIngreso);
          const mesStr = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
          const inputMes = filtroActivo.valor.toLowerCase().replace('.', '');
          const recordMes = mesStr.toLowerCase().replace('.', '');
          return recordMes.includes(inputMes.split(' ')[0]) && recordMes.includes(inputMes.split(' ')[1]);
        }
        default:
          return true;
      }
    });
  }, [repairs, filtroActivo]);

  const handleRowClick = async (repair: any) => {
    setSelectedModalRepair(repair);
    setLoadingModalHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Reparaciones/${repair.id}/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalHistory(res.ok ? await res.json() : []);
    } catch {
      setModalHistory([]);
    } finally {
      setLoadingModalHistory(false);
    }
  };

  const metricCards = [
    { label: 'Total Ingresados', value: s.equiposIngresados, color: 'text-slate-900', bar: 'bg-slate-800', pct: 100 },
    { label: 'Pendientes', value: s.equiposPendientes, color: 'text-[#FF8200]', bar: 'bg-[#FF8200]', pct: Math.min(100, (s.equiposPendientes / (s.equiposIngresados || 1)) * 100) },
    { label: 'Entregados', value: s.equiposEntregados, color: 'text-green-700', bar: 'bg-green-500', pct: Math.min(100, (s.equiposEntregados / (s.equiposIngresados || 1)) * 100) },
    { label: 'Tiempo Prom.', value: `${s.tiempoPromedioReparacionDias}d`, color: 'text-blue-700', bar: 'bg-blue-500', pct: 65 },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8200]" />
        <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <LogoSanJuan className="max-w-[280px]" showMinistry={false} />
          <div className="border-l border-slate-200 pl-4">
            <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Monitoreo de Soporte Técnico</h2>
            <p className="text-slate-400 text-xs mt-0.5">Indicadores de gestión y trazabilidad interactiva en tiempo real.</p>
          </div>
        </div>
        <button
          onClick={reloadAll}
          className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all text-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Panel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div
            key={i}
            onClick={() => handleMetricClick(card.label)}
            className="bg-white border border-slate-200 hover:border-[#FF8200] hover:shadow-md cursor-pointer rounded-xl p-5 transition-all duration-300 group"
          >
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider group-hover:text-[#FF8200] transition-colors">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 font-mono ${card.color}`}>{card.value}</p>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className={`${card.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${card.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {filtroActivo && (
        <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">Filtro Activo</span>
            <span className="text-xs font-semibold text-slate-800">
              {filtroActivo.label}: <span className="text-[#FF8200] font-bold">{filtroActivo.valor.replace(/_/g, ' ')}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">({filteredRepairs.length} de {repairs.length} netbooks coincidentes)</span>
          </div>
          <button
            onClick={() => setFiltroActivo(null)}
            className="text-[11px] font-bold text-orange-600 hover:text-white hover:bg-orange-600 bg-white border border-orange-200 px-3 py-1 rounded-lg transition-all cursor-pointer"
          >
            ✕ Limpiar Filtro
          </button>
        </div>
      )}

      <DashboardChartsGrid
        stats={s}
        estadoColor={estadoColor}
        estadoNombreEsp={estadoNombreEsp}
        onFaultClick={(falla) => setFiltroActivo({ tipo: 'falla', valor: falla, label: 'Falla Reportada' })}
        onEstadoClick={(estado) => setFiltroActivo({ tipo: 'estado', valor: estado, label: 'Estado del Soporte' })}
        onEscuelaClick={(escuela) => setFiltroActivo({ tipo: 'escuela', valor: escuela, label: 'Establecimiento' })}
        onTecnicoClick={(tecnico) => setFiltroActivo({ tipo: 'tecnico', valor: tecnico, label: 'Técnico Asignado' })}
        onMesClick={(mes) => setFiltroActivo({ tipo: 'mes', valor: mes, label: 'Mes de Ingreso' })}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Listado Detallado de Equipos</h3>
            <p className="text-slate-400 text-xs mt-0.5">Muestra los datos cruzados con el filtro activo. Haga clic en cualquier fila para ver el historial.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-bold">{filteredRepairs.length} órdenes encontradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[9px] tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Nro Serie</th>
                <th className="py-3.5 px-4">Marca / Modelo</th>
                <th className="py-3.5 px-4">Escuela / Programa</th>
                <th className="py-3.5 px-4">Tutor / Teléfono</th>
                <th className="py-3.5 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron órdenes para mostrar. {filtroActivo && 'Intente limpiar el filtro activo.'}
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => (
                  <tr key={r.id} onClick={() => handleRowClick(r)} className="hover:bg-slate-50/80 cursor-pointer transition-all duration-150">
                    <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">{new Date(r.fechaIngreso).toLocaleDateString('es-AR')}</td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{r.numeroSerie}</td>
                    <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {r.marca} {r.modelo}{' '}
                      {r.soloCargador && <span className="ml-1 text-[8px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded uppercase">Solo Cargador</span>}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-800 font-semibold truncate max-w-[200px]">{r.escuelaNombre || 'Sin Escuela'}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{r.programaEducativoNombre || 'Sin Programa'}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-650">
                      <p className="font-bold text-slate-800">{r.nombreTutor || 'Sin Nombre'}</p>
                      <p className="text-[10px] text-slate-400">{r.telefonoTutor || 'Sin Teléfono'}</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[9px] font-bold text-white rounded-full uppercase tracking-wider ${estadoColor[r.estado] || 'bg-slate-400'}`}>
                        {estadoNombreEsp[r.estado] || r.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedModalRepair && (
        <ModalTrazabilidadEquipo
          selectedModalRepair={selectedModalRepair}
          modalHistory={modalHistory}
          loadingModalHistory={loadingModalHistory}
          onClose={() => setSelectedModalRepair(null)}
        />
      )}
    </div>
  );
};
