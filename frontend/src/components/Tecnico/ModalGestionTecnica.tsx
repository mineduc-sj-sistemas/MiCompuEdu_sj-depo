import React from 'react';
import type { Reparacion, EvidenciaItem, HistorialMovimientoItem } from '../../types';
import { API_BASE_URL } from '../../config';
import { imprimirFichaEstado, imprimirIngresoComprobante } from '../../utils/printHelpers';
import { Printer, FileText, CheckCircle2, Clock, Sparkles, Camera } from 'lucide-react';

export const PLANTILLAS_RAPIDAS = [
  {
    label: 'Desbloqueo Juana Manso',
    icono: '🔓',
    diag: 'Bloqueo de seguridad por certificado o ciclos.',
    acciones: 'Generación de código de desbloqueo oficial y sincronización de fecha/hora de BIOS.',
    estado: 'Listo_Para_Retirar'
  },
  {
    label: 'Cambio de Pantalla',
    icono: '🖥️',
    diag: 'Display LCD quebrado o flex con falso contacto.',
    acciones: 'Reemplazo de pantalla LCD por módulo nuevo y testeo de imagen.',
    estado: 'Reparado'
  },
  {
    label: 'Cambio de Teclado',
    icono: '⌨️',
    diag: 'Teclas trabadas o matriz sin respuesta.',
    acciones: 'Sustitución de teclado y verificación completa de pulsaciones.',
    estado: 'Reparado'
  },
  {
    label: 'Reinstalación SO',
    icono: '💾',
    diag: 'Fallo de booteo o corrupción de sistema operativo.',
    acciones: 'Clonado con imagen oficial del Ministerio de Educación.',
    estado: 'Listo_Para_Retirar'
  },
  {
    label: 'Pin de Carga / Fuente',
    icono: '🔌',
    diag: 'Conector de carga averiado o cargador defectuoso.',
    acciones: 'Reparación de jack de alimentación y prueba de ciclos de carga.',
    estado: 'Reparado'
  },
  {
    label: 'Espera de Repuesto',
    icono: '⏳',
    diag: 'Requiere repuesto específico no disponible en stock.',
    acciones: 'Solicitud interna de insumos técnicos.',
    estado: 'Esperando_Repuestos'
  }
];

export const ESTADOS_SOPORTE = [
  { id: 'Listo_Para_Retirar', label: 'Listo para Retirar', sub: 'Notifica WhatsApp', color: 'bg-green-600 border-green-600 text-white' },
  { id: 'Reparado', label: 'Reparado', sub: 'Listo en taller', color: 'bg-emerald-600 border-emerald-600 text-white' },
  { id: 'En_Reparacion', label: 'En Reparación', sub: 'En banco', color: 'bg-blue-600 border-blue-600 text-white' },
  { id: 'Esperando_Repuestos', label: 'Esperando Repuesto', sub: 'Insumo faltante', color: 'bg-amber-500 border-amber-500 text-white' },
  { id: 'En_Garantia_Externa', label: 'Garantía Externa', sub: 'Derivado', color: 'bg-cyan-600 border-cyan-600 text-white' },
  { id: 'No_Reparable', label: 'No Reparable', sub: 'Notifica WhatsApp', color: 'bg-red-600 border-red-600 text-white' },
];

interface ModalGestionTecnicaProps {
  selectedRepair: Reparacion;
  nombreTecnico: string;
  mensaje: { tipo: string; texto: string };
  diagnostico: string;
  setDiagnostico: (v: string) => void;
  accionesRealizadas: string;
  setAccionesRealizadas: (v: string) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
  nuevoEstado: string;
  setNuevoEstado: (v: string) => void;
  proveedorGarantia: string;
  setProveedorGarantia: (v: string) => void;
  remitoGarantia: string;
  setRemitoGarantia: (v: string) => void;
  fechaEsperadaGarantia: string;
  setFechaEsperadaGarantia: (v: string) => void;
  evidencias: EvidenciaItem[];
  setEvidencias: React.Dispatch<React.SetStateAction<EvidenciaItem[]>>;
  historial: HistorialMovimientoItem[];
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
  onClose: () => void;
}

export const ModalGestionTecnica: React.FC<ModalGestionTecnicaProps> = ({
  selectedRepair,
  nombreTecnico,
  mensaje,
  diagnostico,
  setDiagnostico,
  accionesRealizadas,
  setAccionesRealizadas,
  observaciones,
  setObservaciones,
  nuevoEstado,
  setNuevoEstado,
  proveedorGarantia,
  setProveedorGarantia,
  remitoGarantia,
  setRemitoGarantia,
  fechaEsperadaGarantia,
  setFechaEsperadaGarantia,
  evidencias,
  setEvidencias,
  historial,
  loading,
  onSubmit,
  onFileUpload,
  onTriggerFileInput,
  onClose
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-[#1D252D]">Orden: {selectedRepair.numeroSerie}</h3>
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
              {selectedRepair.marcaModelo}
            </span>
            {selectedRepair.ubicacionDepositoCodigo && (
              <span className="bg-orange-50 border border-orange-200 text-[#FF8200] text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                📍 {selectedRepair.ubicacionDepositoCodigo}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-1 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong className="text-slate-800">{(selectedRepair.tipoBeneficiario ?? 1) === 1 ? 'Alumno:' : 'Titular:'}</strong>{' '}
                {selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}{' '}
                {(selectedRepair.alumnoDni || selectedRepair.titularDni) && (
                  <span className="text-slate-400 font-mono">(DNI: {selectedRepair.alumnoDni || selectedRepair.titularDni})</span>
                )}
              </span>
              {(selectedRepair.tipoBeneficiario ?? 1) === 1 && selectedRepair.tutorResponsableNombre && (
                <span>
                  <strong className="text-slate-800">Tutor:</strong> {selectedRepair.tutorResponsableNombre}{' '}
                  {selectedRepair.tutorResponsableDni && <span className="text-slate-400 font-mono">(DNI: {selectedRepair.tutorResponsableDni})</span>}
                </span>
              )}
              <span>
                <strong className="text-slate-800">Tel:</strong> {selectedRepair.telefonoTutor || 'Sin teléfono'}
              </span>
              <span>
                <strong className="text-slate-800">Ingreso:</strong> {new Date(selectedRepair.fechaIngreso).toLocaleDateString()}
              </span>
            </div>

            {(selectedRepair.personaEntregaNombre || selectedRepair.personaRetiroNombre) && (
              <div className="pt-1.5 mt-1.5 border-t border-slate-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                {selectedRepair.personaEntregaNombre && (
                  <span>
                    <strong className="text-slate-700">Entregó en depósito:</strong> {selectedRepair.personaEntregaNombre}{' '}
                    <span className="text-slate-400">({selectedRepair.personaEntregaParentesco || 'Entregó'})</span>
                  </span>
                )}
                {selectedRepair.personaRetiroNombre && (
                  <span>
                    <strong className="text-slate-700">Retiró:</strong> {selectedRepair.personaRetiroNombre}{' '}
                    <span className="text-slate-400">({selectedRepair.personaRetiroParentesco || 'Retiró'})</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => imprimirIngresoComprobante(selectedRepair, nombreTecnico)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Imprimir Comprobante de Ingreso con QR"
          >
            <FileText className="w-3.5 h-3.5 text-[#FF8200]" />
            Imprimir Ingreso
          </button>
          <button
            type="button"
            onClick={() => imprimirFichaEstado(selectedRepair, nombreTecnico, historial)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Imprimir Ficha Técnica de Servicio con el estado actual"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            Imprimir Estado Actual
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`p-3 rounded-lg text-xs border font-semibold ${
          mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Falla Reportada Inicial</span>
          <p className="text-xs font-semibold text-slate-800 italic">"{selectedRepair.fallaReportada}"</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-[#FF8200]" />
            <span>Plantillas Rápidas de Diagnóstico (1 Clic)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {PLANTILLAS_RAPIDAS.map((plantilla, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => {
                  setDiagnostico(plantilla.diag);
                  setAccionesRealizadas(plantilla.acciones);
                  setNuevoEstado(plantilla.estado);
                }}
                className="bg-slate-50 hover:bg-orange-50/70 hover:border-orange-200 border border-slate-200 p-2 rounded-lg text-left transition-all cursor-pointer group"
              >
                <span className="text-xs block mb-0.5">{plantilla.icono}</span>
                <span className="text-[10px] font-semibold text-slate-700 group-hover:text-[#FF8200] block truncate">
                  {plantilla.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Próximo Estado de Soporte
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {ESTADOS_SOPORTE.map((est) => {
              const isSelected = nuevoEstado === est.id;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setNuevoEstado(est.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `${est.color} shadow-sm font-bold scale-[1.02]`
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-bold leading-tight">{est.label}</span>
                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {est.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1">Diagnóstico Técnico</label>
            <textarea
              required={nuevoEstado === 'Reparado' || nuevoEstado === 'Listo_Para_Retirar' || nuevoEstado === 'No_Reparable'}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Detallar la falla real detectada..."
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1">Acciones Realizadas</label>
            <textarea
              required={nuevoEstado === 'Reparado' || nuevoEstado === 'Listo_Para_Retirar' || nuevoEstado === 'No_Reparable'}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
              placeholder="Describir las reparaciones o tareas efectuadas..."
              value={accionesRealizadas}
              onChange={(e) => setAccionesRealizadas(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 text-xs font-semibold mb-1">Observaciones Internas (Opcional)</label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
            placeholder="Ej: Faltan tornillos, carcasa rallada..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {nuevoEstado === 'En_Garantia_Externa' && (
          <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">Proveedor de Garantía *</label>
              <input
                required
                type="text"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                placeholder="Ej: Exo, BGH, Lenovo..."
                value={proveedorGarantia}
                onChange={(e) => setProveedorGarantia(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">Nº de Remito / Guía *</label>
              <input
                required
                type="text"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                placeholder="Ej: R-0001-00045"
                value={remitoGarantia}
                onChange={(e) => setRemitoGarantia(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">Fecha Esperada Retorno</label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                value={fechaEsperadaGarantia}
                onChange={(e) => setFechaEsperadaGarantia(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          {(selectedRepair.docIdentidadIngresoUrl || selectedRepair.docIdentidadEntregaUrl) && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <FileText className="w-4 h-4 text-[#FF8200]" />
                <span>Documentos de Identidad Digitalizados (DNI)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedRepair.docIdentidadIngresoUrl && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">DNI Presentado al Ingreso</p>
                      <p className="text-[10px] text-slate-500">{selectedRepair.personaEntregaNombre || 'Constancia digital'}</p>
                    </div>
                    <a
                      href={selectedRepair.docIdentidadIngresoUrl.startsWith('http') ? selectedRepair.docIdentidadIngresoUrl : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadIngresoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-orange-50 hover:bg-orange-100 text-[#FF8200] border border-orange-200 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer"
                    >
                      Ver Documento
                    </a>
                  </div>
                )}
                {selectedRepair.docIdentidadEntregaUrl && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">DNI Registrado al Retiro</p>
                      <p className="text-[10px] text-slate-500">{selectedRepair.personaRetiroNombre || 'Constancia digital'}</p>
                    </div>
                    <a
                      href={selectedRepair.docIdentidadEntregaUrl.startsWith('http') ? selectedRepair.docIdentidadEntregaUrl : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadEntregaUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer"
                    >
                      Ver Documento
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <details className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
            <summary className="p-2.5 text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#FF8200]" />
                Evidencias Fotográficas ({evidencias.length})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Desplegar</span>
            </summary>
            <div className="p-3 border-t border-slate-200 bg-white space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Imágenes técnicas adjuntas</span>
                <input
                  type="file"
                  id="file-evidence-upload"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={onFileUpload}
                />
                <button
                  type="button"
                  onClick={onTriggerFileInput}
                  className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#FF8200] font-bold px-3 py-1 rounded transition-colors"
                >
                  📷 Adjuntar Foto
                </button>
              </div>

              {evidencias.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-slate-400 text-xs">
                  No hay archivos cargados.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {evidencias.map((ev, i) => {
                    const fileUrl = ev.urlArchivo && ev.urlArchivo.startsWith('/')
                      ? `${API_BASE_URL.replace('/api/v1', '')}${ev.urlArchivo}`
                      : (ev.urlArchivo || '');
                    return (
                      <div key={ev.id || i} className="relative group aspect-square rounded bg-slate-100 overflow-hidden border border-slate-200">
                        <img src={fileUrl} alt={ev.nombreArchivo || 'Evidencia'} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEvidencias(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold transition-all text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>

          <details className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
            <summary className="p-2.5 text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF8200]" />
                Historial de Movimientos ({historial.length})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Desplegar</span>
            </summary>
            <div className="p-3 border-t border-slate-200 bg-white">
              {historial.length === 0 ? (
                <p className="text-xs text-slate-400">No hay movimientos registrados para esta orden.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-3">
                  {historial.map((item, idx) => (
                    <div key={item.id || idx} className="relative text-xs">
                      <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#FF8200] border-2 border-white" />
                      <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                        <span className="font-semibold text-slate-700">{item.usuarioNombre || item.operadorNombre || 'Personal'}</span>
                        <span>{item.fechaMovimiento ? new Date(item.fechaMovimiento).toLocaleString() : ''}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                          {item.estadoAnterior || item.estadoOrigen ? (
                            <>
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-850 text-[9px] font-bold rounded uppercase">
                                {(item.estadoAnterior || item.estadoOrigen || '').replace(/_/g, ' ')}
                              </span>
                              <span className="text-slate-400 text-[10px]">➜</span>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded uppercase">
                                Ingreso Inicial
                              </span>
                              <span className="text-slate-400 text-[10px]">➜</span>
                            </>
                          )}
                          <span className="px-2 py-0.5 bg-green-100 text-green-850 text-[9px] font-bold rounded uppercase">
                            {(item.estadoNuevo || item.estadoDestino || 'Sin Estado').replace(/_/g, ' ')}
                          </span>
                        </div>
                        {item.observaciones && (
                          <p className="text-slate-650 font-medium mt-1">
                            <strong className="text-slate-400">Obs:</strong> {item.observaciones}
                          </p>
                        )}
                        {item.accionesRealizadas && (
                          <p className="text-slate-650 mt-0.5">
                            <strong className="text-slate-400">Acciones:</strong> {item.accionesRealizadas}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors text-xs cursor-pointer"
          >
            Cerrar Detalle
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[170px] text-xs cursor-pointer gap-1.5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardar Diagnóstico (F10)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
