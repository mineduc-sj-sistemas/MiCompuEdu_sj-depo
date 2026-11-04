import React from 'react';
import { Search, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ProgramaItem, EscuelaItem } from '../../types';

export type FiltroResultado = 'todos' | 'reparados' | 'no_reparables';
export type FiltroTiempo = 'todos' | 'hoy' | 'semana' | 'mes';

interface FiltrosHistorialEntregasProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filtroResultado: FiltroResultado;
  setFiltroResultado: (v: FiltroResultado) => void;
  filtroTiempo: FiltroTiempo;
  setFiltroTiempo: (v: FiltroTiempo) => void;
  filtroPrograma: string;
  setFiltroPrograma: (v: string) => void;
  filtroEscuela: string;
  setFiltroEscuela: (v: string) => void;
  totalRepairs: number;
  totalReparadas: number;
  totalNoReparables: number;
  programas: ProgramaItem[];
  escuelas: EscuelaItem[];
}

export const FiltrosHistorialEntregas: React.FC<FiltrosHistorialEntregasProps> = ({
  searchTerm,
  setSearchTerm,
  filtroResultado,
  setFiltroResultado,
  filtroTiempo,
  setFiltroTiempo,
  filtroPrograma,
  setFiltroPrograma,
  filtroEscuela,
  setFiltroEscuela,
  totalRepairs,
  totalReparadas,
  totalNoReparables,
  programas,
  escuelas
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° de serie, alumno, tutor, DNI o escuela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF8200]/20 focus:border-[#FF8200] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setFiltroResultado('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filtroResultado === 'todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({totalRepairs})
          </button>
          <button
            onClick={() => setFiltroResultado('reparados')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filtroResultado === 'reparados' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reparadas ({totalReparadas})
          </button>
          <button
            onClick={() => setFiltroResultado('no_reparables')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filtroResultado === 'no_reparables' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            No Reparables ({totalNoReparables})
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Período:</span>
          <select
            value={filtroTiempo}
            onChange={(e) => setFiltroTiempo(e.target.value as FiltroTiempo)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200]"
          >
            <option value="todos">Todo el Historial</option>
            <option value="hoy">Entregadas Hoy</option>
            <option value="semana">Últimos 7 Días</option>
            <option value="mes">Este Mes</option>
          </select>
        </div>

        {programas.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Programa:</span>
            <select
              value={filtroPrograma}
              onChange={(e) => setFiltroPrograma(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200]"
            >
              <option value="">Todos los programas</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {escuelas.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Escuela:</span>
            <select
              value={filtroEscuela}
              onChange={(e) => setFiltroEscuela(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200] max-w-xs truncate"
            >
              <option value="">Todas las escuelas</option>
              {escuelas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {(searchTerm || filtroResultado !== 'todos' || filtroTiempo !== 'todos' || filtroPrograma || filtroEscuela) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFiltroResultado('todos');
              setFiltroTiempo('todos');
              setFiltroPrograma('');
              setFiltroEscuela('');
            }}
            className="text-xs text-[#FF8200] hover:underline font-semibold ml-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};
