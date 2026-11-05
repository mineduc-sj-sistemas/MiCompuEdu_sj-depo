import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import {
  User,
  MapPin,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  ShieldCheck,
  Info,
  PackageCheck,
  Phone,
  Hash,
  Users,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DigitalSignatureCanvas } from '../Signature/DigitalSignatureCanvas';
import { DocumentoIdentidadSection } from '../Scanner/DocumentoIdentidadSection';
import type { ScannedDniData } from '../../utils/dniParser';

export type PersonaRetiroTipo = 'Tutor' | 'Alumno' | 'MismaPersonaEntrega' | 'Tercero';

interface ModalConfirmarEntregaProps {
  selectedRepair: Reparacion;
  loading: boolean;
  errorModal: string;
  telefonoEntrega: string;
  setTelefonoEntrega: (val: string) => void;
  personaRetiroTipo: PersonaRetiroTipo;
  aplicarPersonaRetiro: (tipo: PersonaRetiroTipo) => void;
  personaRetiroNombre: string;
  setPersonaRetiroNombre: (val: string) => void;
  personaRetiroDni: string;
  setPersonaRetiroDni: (val: string) => void;
  personaRetiroTelefono: string;
  setPersonaRetiroTelefono: (val: string) => void;
  personaRetiroParentesco: string;
  setPersonaRetiroParentesco: (val: string) => void;
  docIdentidadEntregaBase64: string | null;
  setDocIdentidadEntregaBase64: (val: string | null) => void;
  setFirmaEntregaBase64: (val: string | null) => void;
  onDniScanned: (scanned: ScannedDniData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const getRolLabel = (tipo?: number) => {
  if (tipo === 2) return 'Docente';
  if (tipo === 3) return 'Directivo';
  return 'Alumno';
};

export const ModalConfirmarEntrega: React.FC<ModalConfirmarEntregaProps> = ({
  selectedRepair,
  loading,
  errorModal,
  telefonoEntrega,
  setTelefonoEntrega,
  personaRetiroTipo,
  aplicarPersonaRetiro,
  personaRetiroNombre,
  setPersonaRetiroNombre,
  personaRetiroDni,
  setPersonaRetiroDni,
  personaRetiroTelefono,
  setPersonaRetiroTelefono,
  personaRetiroParentesco,
  setPersonaRetiroParentesco,
  docIdentidadEntregaBase64,
  setDocIdentidadEntregaBase64,
  setFirmaEntregaBase64,
  onDniScanned,
  onSubmit,
  onClose,
}) => {
  useEffect(() => {
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
  }, [onClose]);

  const isAlumno = (selectedRepair.tipoBeneficiario ?? 1) === 1;
  const rolLabel = getRolLabel(selectedRepair.tipoBeneficiario);
  const isReparado = selectedRepair.estado === 'Listo_Para_Retirar';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/20 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200/90 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in"
      >
        {/* Cabecera Fija Luminosa */}
        <div className="bg-gradient-to-r from-orange-50/90 via-white to-slate-50 border-b border-slate-200/80 px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF8200] to-amber-500 text-white flex items-center justify-center shadow-md shadow-[#FF8200]/25 shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Confirmar Entrega de Equipo
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    isReparado
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-[#E03C31]'
                  }`}
                >
                  {isReparado ? 'Reparado — Listo' : 'No Reparable'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-[#FF8200] border border-orange-200/70">
                  {isAlumno ? 'Alumno' : rolLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-slate-700">Serie: {selectedRepair.numeroSerie}</span>
                <span>•</span>
                <span>{selectedRepair.marcaModelo}</span>
                {selectedRepair.ubicacionDepositoCodigo && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[#FF8200] font-semibold">
                      <MapPin className="w-3 h-3" />
                      {selectedRepair.ubicacionDepositoCodigo}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer shrink-0"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo en 2 Columnas con Scroll Controlado */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {errorModal && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E03C31] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorModal}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Columna Izquierda: Datos del Titular/Equipo + Quién Retira */}
            <div className="lg:col-span-6 space-y-4">
              {/* Resumen de Titular, Tutor y Diagnóstico */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#FF8200]" />
                    Datos del {isAlumno ? 'Alumno (Titular)' : rolLabel}
                  </span>
                  {selectedRepair.programaEducativoNombre && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {selectedRepair.programaEducativoNombre}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                      Nombre y Apellido
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">DNI</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedRepair.alumnoDni || selectedRepair.titularDni || 'No registrado'}
                    </span>
                  </div>
                  {selectedRepair.escuelaNombre && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                        Establecimiento Educativo
                      </span>
                      <span className="font-semibold text-slate-700">{selectedRepair.escuelaNombre}</span>
                    </div>
                  )}
                </div>

                {isAlumno && (
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Tutor Responsable en Padrón
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {selectedRepair.tutorResponsableNombre || 'No registrado en padrón'}
                        {selectedRepair.tutorResponsableDni && ` (DNI: ${selectedRepair.tutorResponsableDni})`}
                      </span>
                    </div>
                    <span className="text-slate-600 font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {selectedRepair.tutorResponsableTelefono || selectedRepair.telefonoTutor || 'Sin teléfono'}
                    </span>
                  </div>
                )}

                {selectedRepair.personaEntregaNombre && (
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Presentó en depósito al ingreso
                      </span>
                      <span className="text-slate-700 font-medium">
                        {selectedRepair.personaEntregaNombre}{' '}
                        {selectedRepair.personaEntregaDni && `(DNI: ${selectedRepair.personaEntregaDni})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                        {selectedRepair.personaEntregaParentesco || 'Entregó'}
                      </span>
                      {selectedRepair.docIdentidadIngresoUrl && (
                        <a
                          href={
                            selectedRepair.docIdentidadIngresoUrl.startsWith('http')
                              ? selectedRepair.docIdentidadIngresoUrl
                              : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadIngresoUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#FF8200] hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> DNI Ingreso
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Resumen técnico compacto integrado */}
                <div className="pt-2.5 border-t border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-[#FF8200]" />
                    Informe Técnico
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>Falla:</strong> {selectedRepair.fallaReportada} •{' '}
                    <strong>Diagnóstico:</strong> {selectedRepair.diagnostico || 'Sin diagnóstico detallado'}
                    {selectedRepair.accionesRealizadas ? ` • Acciones: ${selectedRepair.accionesRealizadas}` : ''}
                  </p>
                </div>
              </div>

              {/* Formulario de Quién Retira */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-[#FF8200]" />
                    <span className="font-bold text-xs uppercase tracking-wide">¿Quién retira el equipo ahora?</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
                    {isAlumno ? (
                      <button
                        type="button"
                        onClick={() => aplicarPersonaRetiro('Tutor')}
                        className={`flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          personaRetiroTipo === 'Tutor'
                            ? 'bg-[#FF8200] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tutor Responsable
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => aplicarPersonaRetiro('Alumno')}
                        className={`flex-1 min-w-[110px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          personaRetiroTipo === 'Alumno'
                            ? 'bg-[#FF8200] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Es el Titular
                      </button>
                    )}

                    {selectedRepair.personaEntregaNombre && (
                      <button
                        type="button"
                        onClick={() => aplicarPersonaRetiro('MismaPersonaEntrega')}
                        className={`flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          personaRetiroTipo === 'MismaPersonaEntrega'
                            ? 'bg-[#FF8200] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title={`Misma persona que entregó (${selectedRepair.personaEntregaNombre})`}
                      >
                        Misma que entregó
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => aplicarPersonaRetiro('Tercero')}
                      className={`flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        personaRetiroTipo === 'Tercero'
                          ? 'bg-[#FF8200] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tercero / Autorizado
                    </button>
                  </div>
                </div>

                {personaRetiroTipo === 'Tercero' && (
                  <div className="bg-blue-50/90 border border-blue-200 text-blue-900 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Retira un tercero o familiar autorizado. Complete sus datos a continuación:</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nombre y Apellido <span className="text-[#FF8200]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        type="text"
                        placeholder="Nombre completo"
                        value={personaRetiroNombre}
                        onChange={(e) => setPersonaRetiroNombre(e.target.value)}
                        className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      DNI de quien retira <span className="text-[#FF8200]">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        type="text"
                        placeholder="Número de DNI"
                        value={personaRetiroDni}
                        onChange={(e) => setPersonaRetiroDni(e.target.value)}
                        className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#FF8200] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Teléfono de Contacto <span className="text-[#FF8200]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required
                        type="text"
                        placeholder="Ej: 2644123456"
                        value={personaRetiroTelefono || telefonoEntrega}
                        onChange={(e) => {
                          setPersonaRetiroTelefono(e.target.value);
                          setTelefonoEntrega(e.target.value);
                        }}
                        className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Parentesco / Relación {personaRetiroTipo === 'Tercero' && <span className="text-[#FF8200]">*</span>}
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        required={personaRetiroTipo === 'Tercero'}
                        type="text"
                        placeholder="Ej: Madre, Padre, Tío, Autorizado..."
                        value={personaRetiroParentesco}
                        onChange={(e) => setPersonaRetiroParentesco(e.target.value)}
                        className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Digitalización de DNI + Firma Digital */}
            <div className="lg:col-span-6 space-y-4">
              <DocumentoIdentidadSection
                documentoBase64={docIdentidadEntregaBase64}
                onDocumentoChange={setDocIdentidadEntregaBase64}
                onDniParsed={onDniScanned}
                label="Digitalización del DNI de quien retira"
                descripcion="Escanee con pistola lectora, tome foto o suba imagen del DNI para la constancia digital."
              />

              <DigitalSignatureCanvas
                onSignatureChange={setFirmaEntregaBase64}
                title="Firma Digital de Recepción y Conformidad"
                subtitle="Firma en pantalla o mediante QR desde el celular de quien retira."
              />
            </div>
          </div>
        </div>

        {/* Pie Fijo de Acciones */}
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Los campos marcados con <strong className="text-[#FF8200]">*</strong> son obligatorios para emitir el acta
            de egreso.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-colors text-xs border border-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !(personaRetiroTelefono || telefonoEntrega).trim()}
              className="flex-1 sm:flex-initial bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#FF8200]/20 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Entregar y Archivar
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
};
