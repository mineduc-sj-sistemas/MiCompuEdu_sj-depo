import React from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { User, MapPin, AlertTriangle, Loader2, X, FileText, ShieldCheck, Info } from 'lucide-react';
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Confirmar Entrega de Equipo</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Serie: {selectedRepair.numeroSerie} — {selectedRepair.marcaModelo}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorModal && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#E03C31] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorModal}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF8200]" />
              Datos del {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? 'Alumno (Titular)' : getRolLabel(selectedRepair.tipoBeneficiario)}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800">
              {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? 'Alumno' : getRolLabel(selectedRepair.tipoBeneficiario)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Nombre y Apellido</span>
              <span className="font-semibold text-slate-900">{selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">DNI</span>
              <span className="font-mono font-semibold text-slate-900">{selectedRepair.alumnoDni || selectedRepair.titularDni || 'No registrado'}</span>
            </div>
            {selectedRepair.escuelaNombre && (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">Escuela</span>
                <span className="font-medium text-slate-700">{selectedRepair.escuelaNombre}</span>
              </div>
            )}
          </div>

          {(selectedRepair.tipoBeneficiario ?? 1) === 1 && (
            <div className="pt-2 border-t border-slate-200/70 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Tutor Responsable Registrado en Padrón
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">
                  {selectedRepair.tutorResponsableNombre || 'No registrado'}
                  {selectedRepair.tutorResponsableDni && ` (DNI: ${selectedRepair.tutorResponsableDni})`}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {selectedRepair.tutorResponsableTelefono || selectedRepair.telefonoTutor || 'Sin teléfono'}
                </span>
              </div>
            </div>
          )}

          {selectedRepair.personaEntregaNombre && (
            <div className="pt-2 border-t border-slate-200/70 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Presentó en depósito al momento del ingreso
              </span>
              <div className="flex justify-between items-center text-xs text-slate-700">
                <span className="font-medium">
                  {selectedRepair.personaEntregaNombre}{' '}
                  {selectedRepair.personaEntregaDni && `(DNI: ${selectedRepair.personaEntregaDni})`}
                </span>
                <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                  {selectedRepair.personaEntregaParentesco || 'Entregó'}
                </span>
              </div>
              {selectedRepair.docIdentidadIngresoUrl && (
                <div className="pt-1">
                  <a
                    href={
                      selectedRepair.docIdentidadIngresoUrl.startsWith('http')
                        ? selectedRepair.docIdentidadIngresoUrl
                        : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadIngresoUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#FF8200] hover:underline font-bold flex items-center gap-1"
                  >
                    📄 Ver DNI escaneado al ingreso
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#FF8200]" />
              <span className="font-bold text-slate-900 text-xs">¿Quién retira el equipo ahora?</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap">
              {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? (
                <button
                  type="button"
                  onClick={() => aplicarPersonaRetiro('Tutor')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    personaRetiroTipo === 'Tutor' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Es el Tutor Responsable
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => aplicarPersonaRetiro('Alumno')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    personaRetiroTipo === 'Alumno' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Es el Titular
                </button>
              )}
              {selectedRepair.personaEntregaNombre && (
                <button
                  type="button"
                  onClick={() => aplicarPersonaRetiro('MismaPersonaEntrega')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    personaRetiroTipo === 'MismaPersonaEntrega' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Misma persona que entregó (${selectedRepair.personaEntregaNombre})`}
                >
                  Misma que entregó
                </button>
              )}
              <button
                type="button"
                onClick={() => aplicarPersonaRetiro('Tercero')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  personaRetiroTipo === 'Tercero' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tercero / Familiar Autorizado
              </button>
            </div>
          </div>

          {personaRetiroTipo === 'Tercero' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>El equipo es retirado por un tercero o familiar autorizado. Complete sus datos a continuación:</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Nombre y Apellido de quien retira *</label>
              <input
                required
                type="text"
                placeholder="Nombre completo"
                value={personaRetiroNombre}
                onChange={(e) => setPersonaRetiroNombre(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                  personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">DNI de quien retira *</label>
              <input
                required
                type="text"
                placeholder="DNI"
                value={personaRetiroDni}
                onChange={(e) => setPersonaRetiroDni(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                  personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Teléfono de Contacto *</label>
              <input
                required
                type="text"
                placeholder="Ej: 2644123456"
                value={personaRetiroTelefono || telefonoEntrega}
                onChange={(e) => {
                  setPersonaRetiroTelefono(e.target.value);
                  setTelefonoEntrega(e.target.value);
                }}
                className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                  personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Parentesco / Relación {personaRetiroTipo === 'Tercero' && '*'}
              </label>
              <input
                required={personaRetiroTipo === 'Tercero'}
                type="text"
                placeholder="Ej: Madre, Tío, Hermano mayor, Autorizado..."
                value={personaRetiroParentesco}
                onChange={(e) => setPersonaRetiroParentesco(e.target.value)}
                className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                  personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                }`}
              />
            </div>
          </div>

          <DocumentoIdentidadSection
            documentoBase64={docIdentidadEntregaBase64}
            onDocumentoChange={setDocIdentidadEntregaBase64}
            onDniParsed={onDniScanned}
            label="Digitalización del DNI de quien retira"
            descripcion="Escanee el DNI con pistola de código de barras, tome foto con la cámara o suba el archivo para la constancia digital."
          />

          <DigitalSignatureCanvas
            onSignatureChange={setFirmaEntregaBase64}
            title="Firma Digital de Recepción y Conformidad"
            subtitle="Firma en pantalla (dedo o ratón). Reemplaza la firma en papel y queda registrada en el expediente de la notebook."
          />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 border-b border-slate-200/60 pb-1.5">
            <FileText className="w-3.5 h-3.5 text-[#FF8200]" />
            Detalle Técnico de la Reparación
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Falla reportada</span>
            <span className="text-slate-700 font-medium text-right">{selectedRepair.fallaReportada}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Diagnóstico técnico</span>
            <span className="text-slate-700 font-medium text-right">{selectedRepair.diagnostico || 'Sin diagnóstico'}</span>
          </div>
          {selectedRepair.accionesRealizadas && (
            <div className="flex justify-between">
              <span className="text-slate-400">Acciones realizadas</span>
              <span className="text-slate-700 font-medium text-right">{selectedRepair.accionesRealizadas}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Ubicación Depósito
            </span>
            <span className="font-semibold text-[#FF8200]">{selectedRepair.ubicacionDepositoCodigo || 'Área Sistemas'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-xs border border-slate-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !(personaRetiroTelefono || telefonoEntrega).trim()}
            className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entregar y Archivar'}
          </button>
        </div>
      </form>
    </div>
  );
};
