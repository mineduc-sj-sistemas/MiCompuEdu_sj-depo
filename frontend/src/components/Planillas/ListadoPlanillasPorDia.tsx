import React from 'react';
import {
  Calendar, FileText, Image as ImageIcon, Search, Trash2,
  Eye, Download, Plus, RefreshCw, X,
  Printer, FolderOpen, User
} from 'lucide-react';
import type { ArchivoPlanilla, PlanillaDiaria } from '../../pages/Operator/PlanillasRetiro';

interface ListadoPlanillasPorDiaProps {
  hoyIso: string;
  fechaBusqueda: string;
  setFechaBusqueda: (v: string) => void;
  filtroTexto: string;
  setFiltroTexto: (v: string) => void;
  loading: boolean;
  planillasFiltradas: PlanillaDiaria[];
  formatearFechaCorta: (f: string) => string;
  formatearFechaLarga: (f: string) => string;
  formatearTamano: (b: number) => string;
  esPdf: (a: ArchivoPlanilla) => boolean;
  getArchivoFullUrl: (id: string) => string;
  handleAgregarMasHojasAlDia: (fecha: string) => void;
  handleEliminarDiaCompleto: (planilla: PlanillaDiaria) => void;
  handleEliminarArchivo: (archivo: ArchivoPlanilla, fecha: string) => void;
  handleImprimirHoja: (archivo: ArchivoPlanilla, fecha: string) => void;
  onOpenVisor: (data: {
    archivo: ArchivoPlanilla;
    fechaPlanilla: string;
    indice: number;
    listaArchivos: ArchivoPlanilla[];
  }) => void;
}

export const ListadoPlanillasPorDia: React.FC<ListadoPlanillasPorDiaProps> = ({
  hoyIso,
  fechaBusqueda,
  setFechaBusqueda,
  filtroTexto,
  setFiltroTexto,
  loading,
  planillasFiltradas,
  formatearFechaCorta,
  formatearFechaLarga,
  formatearTamano,
  esPdf,
  getArchivoFullUrl,
  handleAgregarMasHojasAlDia,
  handleEliminarDiaCompleto,
  handleEliminarArchivo,
  handleImprimirHoja,
  onOpenVisor
}) => {
  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#FF8200]" />
              Buscar Planillas por Día
            </h2>
            <p className="text-xs text-slate-500">
              Seleccione una fecha en el calendario para ver todas las hojas firmadas de ese día
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFechaBusqueda(hoyIso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                fechaBusqueda === hoyIso
                  ? 'bg-[#FF8200] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const ayer = new Date();
                ayer.setDate(ayer.getDate() - 1);
                setFechaBusqueda(ayer.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => {
                setFechaBusqueda('');
                setFiltroTexto('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                fechaBusqueda === ''
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Ver Todos los Días
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="relative">
            <Calendar className="w-4 h-4 text-[#FF8200] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={fechaBusqueda}
              onChange={(e) => setFechaBusqueda(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
            />
            {fechaBusqueda && (
              <button
                type="button"
                onClick={() => setFechaBusqueda('')}
                title="Quitar filtro de fecha"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Filtrar por nota, operador o nombre de archivo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#FF8200] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Cargando planillas escaneadas...</p>
        </div>
      ) : planillasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {fechaBusqueda
              ? `No hay planillas cargadas para el día ${formatearFechaCorta(fechaBusqueda)}`
              : 'Aún no hay planillas escaneadas registradas'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {fechaBusqueda
              ? 'Puede adjuntar las hojas firmadas de esta fecha desde el panel izquierdo o pulsar en "Ver Todos los Días".'
              : 'Seleccione una fecha y suba las hojas firmadas (imágenes o PDF) en el formulario de la izquierda.'}
          </p>
          {fechaBusqueda && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleAgregarMasHojasAlDia(fechaBusqueda)}
                className="px-4 py-2 rounded-xl bg-[#FF8200] text-white text-xs font-bold hover:bg-[#e67500] transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Cargar hojas para el {formatearFechaCorta(fechaBusqueda)}
              </button>
              <button
                type="button"
                onClick={() => setFechaBusqueda('')}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
              >
                Ver todos los días
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {planillasFiltradas.map((planilla) => (
            <div
              key={planilla.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF8200] text-white text-xs font-extrabold tracking-wide">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatearFechaCorta(planilla.fecha)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 capitalize">
                      {formatearFechaLarga(planilla.fecha)}
                    </h3>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                      {planilla.archivos.length} {planilla.archivos.length === 1 ? 'hoja adjunta' : 'hojas adjuntas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Cargado por: <strong className="text-slate-700">{planilla.subidoPorNombre || 'Operador'}</strong>
                    </span>
                    {planilla.observaciones && (
                      <span className="text-slate-600 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                        Nota: {planilla.observaciones}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAgregarMasHojasAlDia(planilla.fecha)}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF8200] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Adjuntar más hojas escaneadas a este mismo día"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar más hojas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarDiaCompleto(planilla)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar todas las hojas de este día"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {planilla.archivos.map((archivo, idx) => {
                  const isPdfFile = esPdf(archivo);
                  const fileUrl = getArchivoFullUrl(archivo.id);

                  return (
                    <div
                      key={archivo.id}
                      className="group rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col justify-between hover:border-[#FF8200] hover:shadow-md transition-all"
                    >
                      <div
                        onClick={() =>
                          onOpenVisor({
                            archivo,
                            fechaPlanilla: planilla.fecha,
                            indice: idx,
                            listaArchivos: planilla.archivos
                          })
                        }
                        className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer border-b border-slate-200"
                      >
                        <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                          Hoja #{idx + 1}
                        </span>

                        {isPdfFile ? (
                          <div className="flex flex-col items-center justify-center text-center p-4">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                              <FileText className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600">
                              Documento PDF
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              Clic para abrir visor
                            </span>
                          </div>
                        ) : (
                          <img
                            src={fileUrl}
                            alt={archivo.nombreArchivo}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-[#FF8200]" />
                            Ver Hoja
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white space-y-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={archivo.nombreArchivo}>
                            {archivo.nombreArchivo}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            {isPdfFile ? (
                              <FileText className="w-3 h-3 text-red-500 shrink-0" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-blue-500 shrink-0" />
                            )}
                            <span>{formatearTamano(archivo.tamanoBytes)}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenVisor({
                                archivo,
                                fechaPlanilla: planilla.fecha,
                                indice: idx,
                                listaArchivos: planilla.archivos
                              })
                            }
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImprimirHoja(archivo, planilla.fecha)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Imprimir hoja"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={fileUrl}
                            download={archivo.nombreArchivo}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Descargar archivo original"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleEliminarArchivo(archivo, planilla.fecha)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar esta hoja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
