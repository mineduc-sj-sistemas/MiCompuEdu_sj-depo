import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../../types';
import { LogoSanJuan } from '../../components/Shared/LogoSanJuan';
import { API_BASE_URL } from '../../config';
import { RefreshCw, Loader2, School, User, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

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

  // States for interactive filters
  const [filtroActivo, setFiltroActivo] = useState<{ tipo: string, valor: string, label: string } | null>(null);
  
  // States for row click details modal
  const [selectedModalRepair, setSelectedModalRepair] = useState<any | null>(null);
  const [modalHistory, setModalHistory] = useState<any[]>([]);
  const [loadingModalHistory, setLoadingModalHistory] = useState(false);

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
      // Fallback a mock data si la API falla o está incompleta
      setStats({
        equiposIngresados: 120,
        equiposPendientes: 38,
        equiposEntregados: 82,
        tiempoPromedioReparacionDias: 2.8,
        fallasMasFrecuentes: [
          { falla: 'Bloqueo de Seguridad', cantidad: 45 },
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

  const fetchRepairs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setRepairs(await response.json());
      }
    } catch (e) {
      console.warn("API Reparaciones no disponible.");
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
    equiposIngresados: 0, equiposPendientes: 0, equiposEntregados: 0,
    tiempoPromedioReparacionDias: 0, fallasMasFrecuentes: [],
    equiposPorEstado: {}, reparacionesPorEscuela: [],
    efectividadTecnicos: [], reparacionesPorMes: [],
  };

  const totalFallas = s.fallasMasFrecuentes.reduce((acc, item) => acc + item.cantidad, 0) || 1;
  const maxMes = Math.max(...(s.reparacionesPorMes.map(m => m.cantidad) || [1])) || 1;

  // Click handler helpers to apply active filters
  const handleMetricClick = (label: string) => {
    if (label === 'Total Ingresados') {
      setFiltroActivo(null);
    } else if (label === 'Pendientes') {
      setFiltroActivo({ tipo: 'pendiente', valor: 'Pendientes', label: 'Estado de Trazabilidad' });
    } else if (label === 'Entregados') {
      setFiltroActivo({ tipo: 'entregado', valor: 'Entregado', label: 'Estado de Trazabilidad' });
    }
  };

  const handleFaultClick = (falla: string) => {
    setFiltroActivo({ tipo: 'falla', valor: falla, label: 'Falla Reportada' });
  };

  const handleEstadoClick = (estado: string) => {
    setFiltroActivo({ tipo: 'estado', valor: estado, label: 'Estado del Soporte' });
  };

  const handleEscuelaClick = (escuela: string) => {
    setFiltroActivo({ tipo: 'escuela', valor: escuela, label: 'Establecimiento' });
  };

  const handleTecnicoClick = (tecnico: string) => {
    setFiltroActivo({ tipo: 'tecnico', valor: tecnico, label: 'Técnico Asignado' });
  };

  const handleMesClick = (mes: string) => {
    setFiltroActivo({ tipo: 'mes', valor: mes, label: 'Mes de Ingreso' });
  };

  // Client-side filtering logic
  const filteredRepairs = repairs.filter(r => {
    if (!filtroActivo) return true;
    switch (filtroActivo.tipo) {
      case 'estado':
        return r.estado === filtroActivo.valor;
      case 'pendiente':
        return r.estado !== 'Entregado' && r.estado !== 'Reparado' && r.estado !== 'Listo_Para_Retirar';
      case 'entregado':
        return r.estado === 'Entregado';
      case 'falla':
        return (r.fallaReportada || '').toLowerCase().includes(filtroActivo.valor.toLowerCase()) ||
               (r.fallaCatalogoNombre || '').toLowerCase().includes(filtroActivo.valor.toLowerCase());
      case 'escuela':
        return r.escuelaNombre === filtroActivo.valor;
      case 'tecnico':
        return r.tecnicoAsignadoNombre === filtroActivo.valor;
      case 'mes':
        if (!r.fechaIngreso) return false;
        const date = new Date(r.fechaIngreso);
        // Compare month/year name snippet (e.g. "Jun 2026" / "Junio 2026")
        const mesStr = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
        const inputMes = filtroActivo.valor.toLowerCase().replace('.', '');
        const recordMes = mesStr.toLowerCase().replace('.', '');
        return recordMes.includes(inputMes.split(' ')[0]) && recordMes.includes(inputMes.split(' ')[1]);
      default:
        return true;
    }
  });

  const handleRowClick = async (repair: any) => {
    setSelectedModalRepair(repair);
    setLoadingModalHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Reparaciones/${repair.id}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setModalHistory(await res.json());
      } else {
        setModalHistory([]);
      }
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
      {/* Header */}
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

      {/* Metric Cards (Interactive) */}
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

      {/* Active Filter Badge */}
      {filtroActivo && (
        <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">Filtro Activo</span>
            <span className="text-xs font-semibold text-slate-800">
              {filtroActivo.label}: <span className="text-[#FF8200] font-bold">{filtroActivo.valor.replace(/_/g, ' ')}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredRepairs.length} de {repairs.length} netbooks coincidentes)
            </span>
          </div>
          <button
            onClick={() => setFiltroActivo(null)}
            className="text-[11px] font-bold text-orange-600 hover:text-white hover:bg-orange-600 bg-white border border-orange-200 px-3 py-1 rounded-lg transition-all cursor-pointer"
          >
            ✕ Limpiar Filtro
          </button>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Faults */}
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
                  onClick={() => handleFaultClick(item.falla)}
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

        {/* Estado Breakdown */}
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
                  onClick={() => handleEstadoClick(estado)}
                  className="bg-slate-50 border border-slate-100 hover:border-slate-350 hover:bg-slate-100/50 hover:shadow-sm cursor-pointer rounded-xl p-3 flex items-center justify-between transition-all duration-300 group"
                >
                  <div>
                    <p className="text-[9px] text-slate-450 uppercase tracking-wider font-bold group-hover:text-slate-800 transition-colors">{estadoNombreEsp[estado] || estado.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{cantidad}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${estadoColor[estado] || 'bg-slate-300'} shadow-sm shrink-0`} />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* By School */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Por Escuela</h3>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {s.reparacionesPorEscuela.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.reparacionesPorEscuela.map((esc, i) => (
                <div
                  key={i}
                  onClick={() => handleEscuelaClick(esc.escuela)}
                  className="flex items-center justify-between bg-slate-50 hover:bg-orange-50/20 border border-slate-100 hover:border-orange-200 cursor-pointer p-2.5 rounded-lg transition-all duration-300 group"
                >
                  <p className="text-xs text-slate-700 font-medium truncate pr-2 group-hover:text-slate-900">{esc.escuela}</p>
                  <span className="text-[10px] font-bold text-[#FF8200] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shrink-0">{esc.cantidad}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Tech Effectiveness */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Rendimiento Técnico</h3>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {s.efectividadTecnicos.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.efectividadTecnicos.map((t, i) => (
                <div
                  key={i}
                  onClick={() => handleTecnicoClick(t.tecnico)}
                  className="bg-slate-50 hover:bg-orange-50/20 border border-slate-100 hover:border-orange-250 cursor-pointer p-3 rounded-lg space-y-1.5 transition-all duration-300"
                >
                  <p className="text-xs font-bold text-slate-800">{t.tecnico}</p>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Reparados: <span className="font-bold text-green-700">{t.reparados}</span></span>
                    <span>Promedio: <span className="font-mono font-bold text-blue-700">{t.tiempoPromedioDias}d</span></span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-[#FF8200]" />
            <h3 className="text-sm font-bold text-slate-800">Ingresos Mensuales</h3>
          </div>
          <div className="space-y-3">
            {s.reparacionesPorMes.length === 0
              ? <p className="text-slate-400 text-xs">Sin datos.</p>
              : s.reparacionesPorMes.map((mes, i) => {
                const pct = Math.round((mes.cantidad / maxMes) * 100);
                return (
                  <div
                    key={i}
                    onClick={() => handleMesClick(mes.mes)}
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
              })}
          </div>
        </div>
      </div>

      {/* Detailed Data Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Listado Detallado de Equipos</h3>
            <p className="text-slate-400 text-xs mt-0.5">Muestra los datos cruzados con el filtro activo. Haga clic en cualquier fila para ver el historial.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-bold">
            {filteredRepairs.length} órdenes encontradas
          </span>
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
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-all duration-150"
                  >
                    <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(r.fechaIngreso).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {r.numeroSerie}
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {r.marca} {r.modelo} {r.soloCargador && (
                        <span className="ml-1 text-[8px] font-bold text-orange-700 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded uppercase">Solo Cargador</span>
                      )}
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

      {/* Detailed Modal Popup with Timeline History */}
      {selectedModalRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-orange-100 text-[#FF8200] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Historial y Trazabilidad</span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">Orden: {selectedModalRepair.numeroSerie}</h3>
                <p className="text-slate-400 text-xs mt-0.5">Ingresado el {new Date(selectedModalRepair.fechaIngreso).toLocaleString('es-AR')}</p>
              </div>
              <button
                onClick={() => setSelectedModalRepair(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Responsable / Tutor</h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p><span className="font-semibold text-slate-400">Nombre:</span> {selectedModalRepair.nombreTutor || 'S/D'}</p>
                    <p><span className="font-semibold text-slate-400">DNI Tutor:</span> {selectedModalRepair.dniTutor || 'S/D'}</p>
                    <p><span className="font-semibold text-slate-400">Teléfono:</span> {selectedModalRepair.telefonoTutor || 'S/D'}</p>
                    <p><span className="font-semibold text-slate-400">Tipo:</span> <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase">{selectedModalRepair.tipoBeneficiario === 3 ? 'Directivo' : selectedModalRepair.tipoBeneficiario === 2 ? 'Docente' : 'Alumno'}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Notebook / Distribución</h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p><span className="font-semibold text-slate-400">Marca/Modelo:</span> {selectedModalRepair.marca} {selectedModalRepair.modelo}</p>
                    <p><span className="font-semibold text-slate-400">Establecimiento:</span> {selectedModalRepair.escuelaNombre || 'Sin Escuela'}</p>
                    <p><span className="font-semibold text-slate-400">Programa:</span> {selectedModalRepair.programaEducativoNombre || 'Sin Programa'}</p>
                    {selectedModalRepair.soloCargador && (
                      <p><span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[9px] border border-orange-100">⚠️ INGRESO SOLO CARGADOR</span></p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider">Falla Inicial Reportada</h4>
                <div className="bg-red-50/40 border border-red-100 rounded-xl p-4 space-y-1">
                  <p className="text-slate-700"><span className="font-bold text-slate-450">Falla:</span> {selectedModalRepair.fallaReportada}</p>
                  <p className="text-slate-700"><span className="font-bold text-slate-450">Obs Estéticas:</span> {selectedModalRepair.observaciones || 'Sin observaciones estéticas.'}</p>
                </div>
              </div>

              {selectedModalRepair.diagnostico && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider">Último Reporte de Taller</h4>
                  <div className="bg-green-50/30 border border-green-150 rounded-xl p-4 space-y-1">
                    <p className="text-slate-700"><span className="font-bold text-slate-450">Diagnóstico:</span> {selectedModalRepair.diagnostico}</p>
                    {selectedModalRepair.accionesRealizadas && (
                      <p className="text-slate-700"><span className="font-bold text-slate-450">Acciones:</span> {selectedModalRepair.accionesRealizadas}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Trazabilidad (Timeline) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trazabilidad de Movimientos</h4>
                {loadingModalHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF8200]" />
                  </div>
                ) : modalHistory.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin movimientos registrados.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                    {modalHistory.map((item: any, idx: number) => (
                      <div key={idx} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#FF8200] border-2 border-white" />
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                          <span className="font-bold text-slate-700">{item.usuarioNombre}</span>
                          <span>{new Date(item.fechaMovimiento).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg text-slate-750">
                          <div className="flex items-center gap-2 mb-1">
                            {item.estadoAnterior ? (
                              <>
                                <span className="px-1.5 py-0.2 bg-orange-100 text-orange-850 rounded text-[9px] font-bold uppercase">
                                  {item.estadoAnterior.replace(/_/g, ' ')}
                                </span>
                                <span>➜</span>
                              </>
                            ) : (
                              <>
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">
                                  CREACIÓN
                                </span>
                                <span>➜</span>
                              </>
                            )}
                            <span className="px-1.5 py-0.2 bg-green-100 text-green-850 rounded text-[9px] font-bold uppercase">
                              {item.estadoNuevo.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {item.observaciones && <p className="mt-1"><strong className="text-slate-400 text-[10px]">Observaciones:</strong> {item.observaciones}</p>}
                          {item.accionesRealizadas && <p className="mt-0.5"><strong className="text-slate-400 text-[10px]">Acciones:</strong> {item.accionesRealizadas}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedModalRepair(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold transition-colors text-xs cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
