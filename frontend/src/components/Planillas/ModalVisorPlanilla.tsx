import React from 'react';
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
  handleImprimirHoja
}) => {
  if (!archivoEnVisor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Barra superior del visor */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-[#FF8200] text-white text-xs font-extrabold">
              {formatearFechaCorta(archivoEnVisor.fechaPlanilla)}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">
                Hoja #{archivoEnVisor.indice + 1} de {archivoEnVisor.listaArchivos.length} — {archivoEnVisor.archivo.nombreArchivo}
              </h3>
              <p className="text-[11px] text-slate-400">
                {formatearTamano(archivoEnVisor.archivo.tamanoBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {archivoEnVisor.listaArchivos.length > 1 && (
              <div className="flex items-center gap-1 mr-2 bg-white/10 rounded-xl p-1">
                <button
                  type="button"
                  disabled={archivoEnVisor.indice === 0}
                  onClick={() => {
                    const nuevoIdx = archivoEnVisor.indice - 1;
                    onChangeVisor({
                      ...archivoEnVisor,
                      indice: nuevoIdx,
                      archivo: archivoEnVisor.listaArchivos[nuevoIdx]
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-white/10 transition-colors"
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
                      archivo: archivoEnVisor.listaArchivos[nuevoIdx]
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-white/10 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleImprimirHoja(archivoEnVisor.archivo, archivoEnVisor.fechaPlanilla)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            <a
              href={getArchivoFullUrl(archivoEnVisor.archivo.id)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en pestaña
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500 text-white transition-colors ml-1"
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
    </div>
  );
};
