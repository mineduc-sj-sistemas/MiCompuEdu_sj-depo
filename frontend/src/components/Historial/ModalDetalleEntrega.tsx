import React from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import {
  Laptop, X, User, ShieldCheck, Phone, FileText, Eye, Clock,
  RefreshCw, ArrowRight, Printer
} from 'lucide-react';

interface ModalDetalleEntregaProps {
  selectedRepair: Reparacion | null;
  onClose: () => void;
  historialMovimientos: any[];
  loadingHistorial: boolean;
  onReimprimirComprobante: (repair: Reparacion) => void;
  previewDocUrl: string | null;
  previewDocTitle: string;
  onOpenPreviewDoc: (url: string, title: string) => void;
  onClosePreviewDoc: () => void;
}

export const ModalDetalleEntrega: React.FC<ModalDetalleEntregaProps> = ({
  selectedRepair,
  onClose,
  historialMovimientos,
  loadingHistorial,
  onReimprimirComprobante,
  previewDocUrl,
  previewDocTitle,
  onOpenPreviewDoc,
  onClosePreviewDoc
}) => {
  return (
    <>
      {selectedRepair && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">Orden de Entrega #{selectedRepair.numeroSerie}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable' ? 'Reparada' : 'No Reparable'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedRepair.marcaModelo} - {selectedRepair.programaEducativoNombre || 'Plan Conectar / Provincial'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Sección 1: Beneficiario y Retiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Titular del Equipo
                  </p>
                  <div>
                    <p className="font-bold text-slate-800">{selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}</p>
                    <p className="text-xs text-slate-500">DNI: <span className="font-mono font-semibold">{selectedRepair.alumnoDni || selectedRepair.titularDni}</span></p>
                    <p className="text-xs text-slate-500">Escuela: <span className="font-medium text-slate-700">{selectedRepair.escuelaNombre || 'No informada'}</span></p>
                    {selectedRepair.tutorResponsableNombre && (
                      <p className="text-xs text-slate-500 pt-1">
                        Tutor Registrado: <span className="font-medium text-slate-700">{selectedRepair.tutorResponsableNombre} (DNI {selectedRepair.tutorResponsableDni})</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Persona que Retiró
                  </p>
                  <div>
                    <p className="font-bold text-slate-800">{selectedRepair.personaRetiroNombre || selectedRepair.tutorResponsableNombre || selectedRepair.nombreTutor}</p>
                    <p className="text-xs text-slate-500">DNI: <span className="font-mono font-semibold">{selectedRepair.personaRetiroDni || selectedRepair.tutorResponsableDni || 'No registrado'}</span></p>
                    <p className="text-xs text-slate-500">Vínculo: <span className="font-medium text-slate-700">{selectedRepair.personaRetiroParentesco || 'Tutor Responsable'}</span></p>
                    {selectedRepair.personaRetiroTelefono && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedRepair.personaRetiroTelefono}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Informe Técnico */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Informe Técnico y Diagnóstico
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Falla Reportada en Ingreso:</span>
                    <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                      {selectedRepair.fallaReportada || 'Sin detalle de falla reportada.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Diagnóstico Técnico:</span>
                    <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                      {selectedRepair.diagnostico || 'Sin diagnóstico registrado.'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500">Acciones Realizadas / Reparación:</span>
                  <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                    {selectedRepair.accionesRealizadas || 'Sin acciones registradas.'}
                  </p>
                </div>

                {selectedRepair.observaciones && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Observaciones Generales:</span>
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 italic">
                      {selectedRepair.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Sección 3: Firmas y Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firma Digital de Recepción
                  </p>
                  {selectedRepair.firmaEntregaBase64 ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <img 
                        src={selectedRepair.firmaEntregaBase64} 
                        alt="Firma Entrega" 
                        className="max-h-28 object-contain" 
                      />
                      <span className="text-[10px] text-slate-400 font-mono mt-1">Conformidad de entrega firmada</span>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                      No se registró firma digital manuscrita.
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Documento de Identidad
                  </p>
                  {selectedRepair.docIdentidadEntregaUrl ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center gap-2">
                      <button
                        onClick={() => {
                          const fullUrl = selectedRepair.docIdentidadEntregaUrl!.startsWith('http') 
                            ? selectedRepair.docIdentidadEntregaUrl! 
                            : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadEntregaUrl}`;
                          onOpenPreviewDoc(fullUrl, `DNI Retiro - ${selectedRepair.personaRetiroNombre || selectedRepair.numeroSerie}`);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Documento Escaneado Completo
                      </button>
                      <span className="text-[10px] text-slate-400">DNI escaneado en el momento de la entrega</span>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                      No se adjuntó escaneo de documento.
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 4: Historial de Movimientos de la Orden */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Trazabilidad de Estados
                </p>
                {loadingHistorial ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#FF8200]" />
                  </div>
                ) : historialMovimientos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay historial disponible.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {historialMovimientos.map((m: any, idx: number) => (
                      <div key={m.id || idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{m.estadoAnterior || 'Inicio'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{m.estadoNuevo}</span>
                          {m.observaciones && <span className="text-slate-500 italic truncate max-w-xs ml-2">({m.observaciones})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(m.fechaMovimiento).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Fecha entrega: {selectedRepair.fechaEntrega ? new Date(selectedRepair.fechaEntrega).toLocaleString('es-AR') : '-'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReimprimirComprobante(selectedRepair)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Comprobante Oficial
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Vista Previa de Documento / Firma */}
      {previewDocUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">{previewDocTitle}</h4>
              <button 
                onClick={onClosePreviewDoc}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4 max-h-[70vh] overflow-hidden">
              <img 
                src={previewDocUrl} 
                alt="Documento" 
                className="max-h-[60vh] max-w-full object-contain rounded shadow"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClosePreviewDoc}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-all"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
