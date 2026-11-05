import React, { useState } from 'react';
import {
  Calendar,
  Upload,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FilePlus2,
  Sparkles,
  Image as ImageIcon,
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
  formatearTamano,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const hoyIso = new Date().toISOString().split('T')[0];

  const setAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFechaCarga(d.toISOString().split('T')[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setArchivosSeleccionados((prev) => [...prev, ...dropped]);
    }
  };

  return (
    <div
      ref={formCardRef}
      className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
    >
      {/* Cabecera Institucional Luminosa */}
      <div className="bg-gradient-to-r from-orange-50/90 via-white to-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8200] to-amber-500 text-white flex items-center justify-center shadow-sm shadow-[#FF8200]/25 shrink-0">
            <FilePlus2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 tracking-tight">Adjuntar Hojas Escaneadas</h2>
            <p className="text-xs text-slate-500">Vincule escaneos o PDFs a una jornada específica</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100/80 text-[#FF8200] border border-orange-200/70 px-2.5 py-1 rounded-full shrink-0">
          JPG · PNG · PDF
        </span>
      </div>

      <form onSubmit={handleSubirPlanilla} className="p-6 space-y-5">
        {/* Paso 1: Fecha */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF8200] text-[11px] font-extrabold flex items-center justify-center">
                1
              </span>
              <span>
                Día de la Planilla Firmada <span className="text-[#FF8200]">*</span>
              </span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFechaCarga(hoyIso)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  fechaCarga === hoyIso
                    ? 'bg-[#FF8200] text-white'
                    : 'bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-[#FF8200]'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={setAyer}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-[#FF8200] transition-colors cursor-pointer"
              >
                Ayer
              </button>
            </div>
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-[#FF8200] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={fechaCarga}
              onChange={(e) => setFechaCarga(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 transition-all"
            />
          </div>

          {planillaExistenteParaFechaCarga && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                El día <strong>{formatearFechaCorta(fechaCarga)}</strong> ya cuenta con{' '}
                <strong>{planillaExistenteParaFechaCarga.archivos.length} hoja(s)</strong>. Las nuevas se sumarán a esta
                misma jornada.
              </span>
            </div>
          )}
        </div>

        {/* Paso 2: Archivos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#FF8200] text-[11px] font-extrabold flex items-center justify-center">
                2
              </span>
              <span>
                Hojas Escaneadas <span className="text-[#FF8200]">*</span>
              </span>
            </label>
            {archivosSeleccionados.length > 0 && (
              <button
                type="button"
                onClick={() => setArchivosSeleccionados([])}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                Vaciar lista ({archivosSeleccionados.length})
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all group ${
              isDragging
                ? 'border-[#FF8200] bg-orange-50/60 scale-[0.99]'
                : 'border-slate-200 hover:border-[#FF8200]/70 bg-gradient-to-b from-slate-50/50 to-slate-50/90 hover:from-orange-50/20 hover:to-orange-50/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center mx-auto mb-3 group-hover:scale-105 group-hover:border-orange-200 transition-all">
              <Upload className="w-5 h-5 text-[#FF8200]" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Haga clic o arrastre las hojas escaneadas aquí
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Permite seleccionar múltiples imágenes (JPG, PNG, WEBP) o documentos PDF de varias páginas
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3.5 px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-[#FF8200] text-[#FF8200] group-hover:text-white border border-orange-200 group-hover:border-[#FF8200] text-xs font-bold shadow-2xs transition-all">
              <Plus className="w-3.5 h-3.5" />
              Seleccionar archivos del equipo
            </span>
          </div>

          {previewsLocales.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#FF8200]" />
                  Hojas listas para subir ({previewsLocales.length}):
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#FF8200] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otra hoja
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {previewsLocales.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-colors"
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
                          <FileText className="w-4 h-4" />
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
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Paso 3: Observaciones */}
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-extrabold flex items-center justify-center">
              3
            </span>
            <span>
              Nota u Observación del Día <span className="text-slate-400 font-normal">(Opcional)</span>
            </span>
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Planillas turno mañana (Hoja 1 a 3) - Retiro docentes y alumnos..."
            className="w-full px-3.5 py-2.5 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 transition-all"
          />
        </div>

        {mensajeError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{mensajeError}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={subiendo || archivosSeleccionados.length === 0}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            subiendo || archivosSeleccionados.length === 0
              ? 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed'
              : 'bg-[#FF8200] hover:bg-[#e67500] text-white shadow-md shadow-[#FF8200]/20 cursor-pointer'
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
              Guardar {archivosSeleccionados.length > 0 ? `${archivosSeleccionados.length} Hoja(s)` : 'Planilla'} en el
              Día {formatearFechaCorta(fechaCarga)}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
