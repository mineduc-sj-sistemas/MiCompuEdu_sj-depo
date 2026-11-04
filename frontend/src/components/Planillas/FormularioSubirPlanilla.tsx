import React from 'react';
import {
  Calendar, Upload, FileText, Plus, CheckCircle2, AlertCircle, RefreshCw, X, FilePlus2
} from 'lucide-react';
import type { PlanillaDiaria } from '../../pages/Operator/PlanillasRetiro';

interface FormularioSubirPlanillaProps {
  formCardRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  fechaCarga: string;
  setFechaCarga: (v: string) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
  archivosSeleccionados: File[];
  setArchivosSeleccionados: React.Dispatch<React.SetStateAction<File[]>>;
  previewsLocales: { file: File; previewUrl: string | null }[];
  subiendo: boolean;
  mensajeExito: string | null;
  mensajeError: string | null;
  planillaExistenteParaFechaCarga?: PlanillaDiaria;
  handleSeleccionarArchivos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuitarArchivoSeleccionado: (index: number) => void;
  handleSubirPlanilla: (e: React.FormEvent) => void;
  formatearFechaCorta: (fechaIso: string) => string;
  formatearTamano: (bytes: number) => string;
}

export const FormularioSubirPlanilla: React.FC<FormularioSubirPlanillaProps> = ({
  formCardRef,
  fileInputRef,
  fechaCarga,
  setFechaCarga,
  observaciones,
  setObservaciones,
  archivosSeleccionados,
  setArchivosSeleccionados,
  previewsLocales,
  subiendo,
  mensajeExito,
  mensajeError,
  planillaExistenteParaFechaCarga,
  handleSeleccionarArchivos,
  handleQuitarArchivoSeleccionado,
  handleSubirPlanilla,
  formatearFechaCorta,
  formatearTamano
}) => {
  return (
    <div ref={formCardRef} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FilePlus2 className="w-5 h-5 text-[#FF8200]" />
          <h2 className="font-bold text-base">Adjuntar Hojas Escaneadas</h2>
        </div>
        <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-full font-medium">
          Múltiples hojas / Imágenes o PDF
        </span>
      </div>

      <form onSubmit={handleSubirPlanilla} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            1. Día de la Planilla Firmada <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={fechaCarga}
              onChange={(e) => setFechaCarga(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent"
            />
          </div>

          {planillaExistenteParaFechaCarga && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                El día <strong>{formatearFechaCorta(fechaCarga)}</strong> ya tiene{' '}
                <strong>{planillaExistenteParaFechaCarga.archivos.length} hoja(s)</strong> cargada(s). Las nuevas hojas que suba se agregarán a ese mismo día.
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Hojas Escaneadas (JPG, PNG, WEBP o PDF) <span className="text-red-500">*</span>
            </label>
            {archivosSeleccionados.length > 0 && (
              <button
                type="button"
                onClick={() => setArchivosSeleccionados([])}
                className="text-[11px] text-red-600 hover:underline font-semibold"
              >
                Limpiar selección ({archivosSeleccionados.length})
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            onChange={handleSeleccionarArchivos}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#FF8200] bg-slate-50/70 hover:bg-orange-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 text-[#FF8200]" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Haga clic para seleccionar una o varias hojas
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Puede elegir múltiples fotos/escaneos a la vez o archivos PDF de varias páginas
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[#FF8200]/10 text-[#FF8200] text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              Seleccionar archivos del equipo
            </span>
          </div>

          {previewsLocales.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Hojas listas para subir ({previewsLocales.length}):
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#FF8200] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otra hoja
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {previewsLocales.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                          <span className="text-[9px] font-extrabold uppercase">PDF</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Hoja #{idx + 1}: {item.file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatearTamano(item.file.size)} • {item.previewUrl ? 'Imagen escaneada' : 'Documento PDF'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuitarArchivoSeleccionado(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar de la lista"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            3. Nota u Observación del Día (Opcional)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Planillas turno mañana (Hoja 1 a 3) - Retiro docentes y alumnos..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent"
          />
        </div>

        {mensajeError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{mensajeError}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={subiendo || archivosSeleccionados.length === 0}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
            subiendo || archivosSeleccionados.length === 0
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-[#FF8200] hover:bg-[#e67500] shadow-orange-500/20'
          }`}
        >
          {subiendo ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Guardando hojas escaneadas...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Guardar {archivosSeleccionados.length > 0 ? `${archivosSeleccionados.length} Hoja(s)` : 'Planilla'} en el Día {formatearFechaCorta(fechaCarga)}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
