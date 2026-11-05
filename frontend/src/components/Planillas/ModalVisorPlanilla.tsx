import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ExternalLink, X } from 'lucide-react';
import type { ArchivoPlanilla } from '../../pages/Operator/PlanillasRetiro';

interface ModalVisorPlanillaProps {
  archivoEnVisor: {
    archivo: ArchivoPlanilla;
    fechaPlanilla: string;
    indice: number;
    listaArchivos: ArchivoPlanilla[];
  } | null;
  onClose: () => void;
  onChangeVisor: (nuevo: {
    archivo: ArchivoPlanilla;
    fechaPlanilla: string;
    indice: number;
    listaArchivos: ArchivoPlanilla[];
  }) => void;
  formatearFechaCorta: (fechaIso: string) => string;
  formatearTamano: (bytes: number) => string;
  esPdf: (archivo: ArchivoPlanilla) => boolean;
  getArchivoFullUrl: (archivoId: string) => string;
  handleImprimirHoja: (archivo: ArchivoPlanilla, fecha: string) => void;
}

export const ModalVisorPlanilla: React.FC<ModalVisorPlanillaProps> = ({
  archivoEnVisor,
  onClose,
  onChangeVisor,
  formatearFechaCorta,
  formatearTamano,
  esPdf,
  getArchivoFullUrl,
  handleImprimirHoja,
}) => {
  useEffect(() => {
    if (!archivoEnVisor) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [archivoEnVisor, onClose]);

  if (!archivoEnVisor) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
        {/* Barra superior del visor */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50/90 via-white to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-[#FF8200] text-white text-xs font-extrabold">
              {formatearFechaCorta(archivoEnVisor.fechaPlanilla)}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Hoja #{archivoEnVisor.indice + 1} de {archivoEnVisor.listaArchivos.length} —{' '}
                {archivoEnVisor.archivo.nombreArchivo}
              </h3>
              <p className="text-[11px] text-slate-500">{formatearTamano(archivoEnVisor.archivo.tamanoBytes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {archivoEnVisor.listaArchivos.length > 1 && (
              <div className="flex items-center gap-1 mr-2 bg-slate-100 rounded-xl p-1">
                <button
                  type="button"
                  disabled={archivoEnVisor.indice === 0}
                  onClick={() => {
                    const nuevoIdx = archivoEnVisor.indice - 1;
                    onChangeVisor({
                      ...archivoEnVisor,
                      indice: nuevoIdx,
                      archivo: archivoEnVisor.listaArchivos[nuevoIdx],
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={archivoEnVisor.indice === archivoEnVisor.listaArchivos.length - 1}
                  onClick={() => {
                    const nuevoIdx = archivoEnVisor.indice + 1;
                    onChangeVisor({
                      ...archivoEnVisor,
                      indice: nuevoIdx,
                      archivo: archivoEnVisor.listaArchivos[nuevoIdx],
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleImprimirHoja(archivoEnVisor.archivo, archivoEnVisor.fechaPlanilla)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF8200] border border-slate-200 hover:border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            <a
              href={getArchivoFullUrl(archivoEnVisor.archivo.id)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF8200] border border-slate-200 hover:border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en pestaña
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del visor */}
        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4 min-h-[65vh]">
          {esPdf(archivoEnVisor.archivo) ? (
            <iframe
              src={getArchivoFullUrl(archivoEnVisor.archivo.id)}
              title={archivoEnVisor.archivo.nombreArchivo}
              className="w-full h-[72vh] rounded-xl border border-slate-300 bg-white"
            />
          ) : (
            <img
              src={getArchivoFullUrl(archivoEnVisor.archivo.id)}
              alt={archivoEnVisor.archivo.nombreArchivo}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md bg-white"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
