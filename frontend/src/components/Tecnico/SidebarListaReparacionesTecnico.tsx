import React from 'react';
import type { Reparacion } from '../../types';

interface SidebarListaReparacionesTecnicoProps {
  repairs: Reparacion[];
  loading: boolean;
  isBulkMode: boolean;
  setIsBulkMode: (v: boolean) => void;
  selectedRepair: Reparacion | null;
  setSelectedRepair: (r: Reparacion | null) => void;
  selectedRepairIds: string[];
  setSelectedRepairIds: React.Dispatch<React.SetStateAction<string[]>>;
  setMensaje: (m: { tipo: string; texto: string }) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  escuelaFiltroId: string;
  setEscuelaFiltroId: (v: string) => void;
  programaFiltroId: string;
  setProgramaFiltroId: (v: string) => void;
  fallaFiltroId: string;
  setFallaFiltroId: (v: string) => void;
  fechaInicioFiltro: string;
  setFechaInicioFiltro: (v: string) => void;
  fechaFinFiltro: string;
  setFechaFinFiltro: (v: string) => void;
  escuelas: any[];
  programas: any[];
  fetchRepairs: () => void;
  handleSelectRepair: (r: Reparacion) => void;
}

export const SidebarListaReparacionesTecnico: React.FC<SidebarListaReparacionesTecnicoProps> = ({
  repairs,
  loading,
  isBulkMode,
  setIsBulkMode,
  selectedRepair,
  setSelectedRepair,
  selectedRepairIds,
  setSelectedRepairIds,
  setMensaje,
  busqueda,
  setBusqueda,
  showFilters,
  setShowFilters,
  escuelaFiltroId,
  setEscuelaFiltroId,
  programaFiltroId,
  setProgramaFiltroId,
  fallaFiltroId,
  setFallaFiltroId,
  fechaInicioFiltro,
  setFechaInicioFiltro,
  fechaFinFiltro,
  setFechaFinFiltro,
  escuelas,
  programas,
  fetchRepairs,
  handleSelectRepair
}) => {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-[#1D252D]">Notebooks Activas</h3>
        <button
          type="button"
          onClick={() => {
            setIsBulkMode(!isBulkMode);
            setSelectedRepairIds([]);
            setSelectedRepair(null);
            setMensaje({ tipo: '', texto: '' });
          }}
          className={`text-xs font-bold px-2 py-1 rounded transition-all ${
            isBulkMode
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              : 'bg-[#FF8200]/10 hover:bg-[#FF8200]/20 text-[#FF8200]'
          }`}
        >
          {isBulkMode ? '❌ Modo Individual' : '📦 Modo Masivo'}
        </button>
      </div>

      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
            placeholder="Buscar serie o tutor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchRepairs(); }}
          />
          <button
            type="button"
            onClick={fetchRepairs}
            className="bg-[#FF8200] hover:bg-[#e07200] text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
          >
            Buscar
          </button>
        </div>
        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-[#FF8200] font-bold hover:underline"
          >
            {showFilters ? '▲ Ocultar Filtros' : '▼ Filtros Avanzados'}
          </button>
          {(escuelaFiltroId || programaFiltroId || fallaFiltroId || fechaInicioFiltro || fechaFinFiltro || busqueda) && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setEscuelaFiltroId('');
                setProgramaFiltroId('');
                setFallaFiltroId('');
                setFechaInicioFiltro('');
                setFechaFinFiltro('');
                setTimeout(fetchRepairs, 50);
              }}
              className="text-red-500 font-bold hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-2 pt-2 border-t border-slate-200 animate-fadeIn text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Escuela</label>
              <select
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                value={escuelaFiltroId}
                onChange={(e) => setEscuelaFiltroId(e.target.value)}
              >
                <option value="">Todas</option>
                {escuelas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Programa</label>
              <select
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                value={programaFiltroId}
                onChange={(e) => setProgramaFiltroId(e.target.value)}
              >
                <option value="">Todos</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">Falla del Catálogo</label>
              <select
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                value={fallaFiltroId}
                onChange={(e) => setFallaFiltroId(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="1">No Enciende</option>
                <option value="2">Pantalla Rota / Sin Imagen</option>
                <option value="3">Bloqueo de Seguridad</option>
                <option value="4">Falla de Teclado</option>
                <option value="5">Problemas de Sistema Operativo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 font-bold mb-1">F. Inicio</label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                  value={fechaInicioFiltro}
                  onChange={(e) => setFechaInicioFiltro(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">F. Fin</label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                  value={fechaFinFiltro}
                  onChange={(e) => setFechaFinFiltro(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={fetchRepairs}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded transition-all text-center mt-2 border border-slate-300"
            >
              Aplicar Filtros
            </button>
          </div>
        )}
      </div>

      {loading && repairs.length === 0 ? (
        <div className="text-center py-6">
          <span className="inline-block w-6 h-6 border-2 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : repairs.length === 0 ? (
        <p className="text-slate-400 text-sm">No tiene equipos asignados pendientes.</p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {isBulkMode && (
            <div className="flex justify-between items-center px-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedRepairIds.length === repairs.length) {
                    setSelectedRepairIds([]);
                  } else {
                    setSelectedRepairIds(repairs.map(r => r.id));
                  }
                }}
                className="text-xs text-[#FF8200] font-bold hover:underline"
              >
                {selectedRepairIds.length === repairs.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
              <span className="text-xs text-slate-500 font-bold">{selectedRepairIds.length} seleccionados</span>
            </div>
          )}
          {repairs.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              {isBulkMode && (
                <input
                  type="checkbox"
                  checked={selectedRepairIds.includes(r.id)}
                  onChange={() => {
                    if (selectedRepairIds.includes(r.id)) {
                      setSelectedRepairIds(prev => prev.filter(id => id !== r.id));
                    } else {
                      setSelectedRepairIds(prev => [...prev, r.id]);
                    }
                  }}
                  className="w-4 h-4 text-[#FF8200] focus:ring-[#FF8200] border-slate-350 rounded cursor-pointer shrink-0"
                />
              )}
              <button
                onClick={() => {
                  if (isBulkMode) {
                    if (selectedRepairIds.includes(r.id)) {
                      setSelectedRepairIds(prev => prev.filter(id => id !== r.id));
                    } else {
                      setSelectedRepairIds(prev => [...prev, r.id]);
                    }
                  } else {
                    handleSelectRepair(r);
                  }
                }}
                className={`flex-1 text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                  !isBulkMode && selectedRepair?.id === r.id
                    ? 'bg-[#FF8200]/5 border-[#FF8200] shadow-sm'
                    : selectedRepairIds.includes(r.id)
                    ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[#1D252D] font-bold text-sm">{r.numeroSerie}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    r.estado === 'Ingresado' ? 'bg-blue-550/10 border-blue-200 text-blue-700' :
                    r.estado === 'En_Diagnostico' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    r.estado === 'En_Reparacion' ? 'bg-orange-50 border-orange-200 text-[#FF8200]' :
                    r.estado === 'Esperando_Repuestos' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    r.estado === 'Apartado_Para_Garantia' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                    r.estado === 'En_Garantia_Externa' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' :
                    'bg-green-50 border-green-200 text-green-700'
                  }`}>
                    {r.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold truncate mt-1">
                  {(r.tipoBeneficiario ?? 1) === 1 ? 'Alumno: ' : 'Titular: '}
                  {r.alumnoNombreCompleto || r.nombreTutor}
                </p>
                {(r.tipoBeneficiario ?? 1) === 1 && r.tutorResponsableNombre && (
                  <p className="text-[11px] text-slate-500 truncate">
                    Tutor: {r.tutorResponsableNombre}
                  </p>
                )}
                {r.personaEntregaNombre && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Entregó: {r.personaEntregaNombre} ({r.personaEntregaParentesco || 'Entregó'})
                  </p>
                )}
                <p className="text-xs text-slate-400">Modelo: {r.marcaModelo}</p>
                {r.proveedorGarantia && (
                  <p className="text-[10px] font-semibold text-slate-550 mt-1">
                    🏢 Garantía: {r.proveedorGarantia} (Remito: {r.remitoGarantia || '-'})
                  </p>
                )}
                {r.ubicacionDepositoCodigo && (
                  <p className="text-[10px] font-semibold text-[#FF8200] mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span>{r.ubicacionDepositoCodigo}</span>
                  </p>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
