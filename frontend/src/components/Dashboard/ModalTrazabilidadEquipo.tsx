import React from 'react';
import { Loader2 } from 'lucide-react';

interface ModalTrazabilidadEquipoProps {
  selectedModalRepair: any;
  modalHistory: any[];
  loadingModalHistory: boolean;
  onClose: () => void;
}

export const ModalTrazabilidadEquipo: React.FC<ModalTrazabilidadEquipoProps> = ({
  selectedModalRepair,
  modalHistory,
  loadingModalHistory,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <span className="text-[9px] bg-orange-100 text-[#FF8200] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Historial y Trazabilidad
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">
              Orden: {selectedModalRepair.numeroSerie}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Ingresado el {new Date(selectedModalRepair.fechaIngreso).toLocaleString('es-AR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-semibold text-lg p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Responsable / Tutor</h4>
              <div className="space-y-1 text-xs text-slate-700">
                <p><span className="font-semibold text-slate-400">Nombre:</span> {selectedModalRepair.nombreTutor || 'S/D'}</p>
                <p><span className="font-semibold text-slate-400">DNI Tutor:</span> {selectedModalRepair.dniTutor || 'S/D'}</p>
                <p><span className="font-semibold text-slate-400">Teléfono:</span> {selectedModalRepair.telefonoTutor || 'S/D'}</p>
                <p>
                  <span className="font-semibold text-slate-400">Tipo:</span>{' '}
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-bold uppercase">
                    {selectedModalRepair.tipoBeneficiario === 3 ? 'Directivo' : selectedModalRepair.tipoBeneficiario === 2 ? 'Docente' : 'Alumno'}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Notebook / Distribución</h4>
              <div className="space-y-1 text-xs text-slate-700">
                <p><span className="font-semibold text-slate-400">Marca/Modelo:</span> {selectedModalRepair.marca} {selectedModalRepair.modelo}</p>
                <p><span className="font-semibold text-slate-400">Establecimiento:</span> {selectedModalRepair.escuelaNombre || 'Sin Escuela'}</p>
                <p><span className="font-semibold text-slate-400">Programa:</span> {selectedModalRepair.programaEducativoNombre || 'Sin Programa'}</p>
                {selectedModalRepair.soloCargador && (
                  <p>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[9px] border border-orange-100">
                      ⚠️ INGRESO SOLO CARGADOR
                    </span>
                  </p>
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
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#FF8200] border-2 border-white" />
                    <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                      <span className="font-bold text-slate-700">{item.usuarioNombre || item.operadorNombre || 'Personal'}</span>
                      <span>{item.fechaMovimiento ? new Date(item.fechaMovimiento).toLocaleString() : ''}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg text-slate-750">
                      <div className="flex items-center gap-2 mb-1">
                        {item.estadoAnterior || item.estadoOrigen ? (
                          <>
                            <span className="px-1.5 py-0.2 bg-orange-100 text-orange-850 rounded text-[9px] font-bold uppercase">
                              {(item.estadoAnterior || item.estadoOrigen || '').replace(/_/g, ' ')}
                            </span>
                            <span>➜</span>
                          </>
                        ) : (
                          <>
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold uppercase">
                              Ingreso Inicial
                            </span>
                            <span>➜</span>
                          </>
                        )}
                        <span className="px-1.5 py-0.2 bg-green-100 text-green-850 rounded text-[9px] font-bold uppercase">
                          {(item.estadoNuevo || item.estadoDestino || 'Sin Estado').replace(/_/g, ' ')}
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

        <div className="p-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold transition-colors text-xs cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
