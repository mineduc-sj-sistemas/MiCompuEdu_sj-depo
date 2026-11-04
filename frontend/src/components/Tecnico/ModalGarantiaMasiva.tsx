import React from 'react';

interface ModalGarantiaMasivaProps {
  mensaje: { tipo: string; texto: string };
  selectedRepairIds: string[];
  bulkProveedorGarantia: string;
  setBulkProveedorGarantia: (v: string) => void;
  bulkRemitoGarantia: string;
  setBulkRemitoGarantia: (v: string) => void;
  bulkFechaEsperadaGarantia: string;
  setBulkFechaEsperadaGarantia: (v: string) => void;
  bulkDiagnostico: string;
  setBulkDiagnostico: (v: string) => void;
  bulkObservaciones: string;
  setBulkObservaciones: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateRemito: () => void;
  onCancel: () => void;
}

export const ModalGarantiaMasiva: React.FC<ModalGarantiaMasivaProps> = ({
  mensaje,
  selectedRepairIds,
  bulkProveedorGarantia,
  setBulkProveedorGarantia,
  bulkRemitoGarantia,
  setBulkRemitoGarantia,
  bulkFechaEsperadaGarantia,
  setBulkFechaEsperadaGarantia,
  bulkDiagnostico,
  setBulkDiagnostico,
  bulkObservaciones,
  setBulkObservaciones,
  loading,
  onSubmit,
  onGenerateRemito,
  onCancel
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-[#1D252D]">Derivación Masiva a Garantía</h3>
        <p className="text-xs text-slate-500 mt-1">
          Derive múltiples notebooks a proveedor de garantía externo en un solo paso y genere el remito de salida.
        </p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-lg text-sm border font-semibold ${
          mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1D252D] font-bold">
          Equipos seleccionados para derivar: {selectedRepairIds.length}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Proveedor de Garantía *</label>
            <input
              required
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Ej: Exo, BGH, Lenovo..."
              value={bulkProveedorGarantia}
              onChange={(e) => setBulkProveedorGarantia(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Nº de Remito / Guía *</label>
            <input
              required
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Ej: R-0001-00045"
              value={bulkRemitoGarantia}
              onChange={(e) => setBulkRemitoGarantia(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Fecha Esperada de Retorno (Opcional)</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
              value={bulkFechaEsperadaGarantia}
              onChange={(e) => setBulkFechaEsperadaGarantia(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Diagnóstico Masivo</label>
            <textarea
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Diagnóstico aplicable a los equipos a derivar..."
              value={bulkDiagnostico}
              onChange={(e) => setBulkDiagnostico(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Observaciones de Remisión</label>
            <textarea
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Observaciones internas para la remisión..."
              value={bulkObservaciones}
              onChange={(e) => setBulkObservaciones(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onGenerateRemito}
            disabled={selectedRepairIds.length === 0}
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-6 py-3 rounded-lg font-bold border border-slate-200 transition-all text-sm flex items-center gap-2"
          >
            📄 Generar Remito PDF
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedRepairIds.length === 0}
              className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[180px] text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                `Derivar Masivamente (${selectedRepairIds.length})`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
