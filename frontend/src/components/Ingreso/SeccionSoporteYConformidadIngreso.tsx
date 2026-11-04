import React from 'react';
import { FileText, Plus, ShieldCheck, Info } from 'lucide-react';
import { DigitalSignatureCanvas } from '../Signature/DigitalSignatureCanvas';
import { DocumentoIdentidadSection } from '../Scanner/DocumentoIdentidadSection';
import type { ScannedDniData } from '../../utils/dniParser';
import type { EscuelaItem } from '../../types';

interface SeccionSoporteYConformidadIngresoProps {
  esAlumno: boolean;
  escuelas: EscuelaItem[];
  escuelaSearch: string;
  handleEscuelaSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEscuelaDropdownOpen: boolean;
  setIsEscuelaDropdownOpen: (v: boolean) => void;
  setSelectedEscuelaId: (id: string) => void;
  setEscuelaSearch: (v: string) => void;
  onOpenCrearEscuelaModal: () => void;
  fallaCatalogoId: number;
  setFallaCatalogoId: (id: number) => void;
  fallaReportada: string;
  setFallaReportada: (v: string) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
  fechaIngreso: string;
  setFechaIngreso: (v: string) => void;
  soloCargador: boolean;
  setSoloCargador: (v: boolean) => void;
  personaEntregaTipo: 'Tutor' | 'Tercero';
  aplicarPersonaEntrega: (tipo: 'Tutor' | 'Tercero') => void;
  personaEntregaNombre: string;
  setPersonaEntregaNombre: (v: string) => void;
  personaEntregaDni: string;
  setPersonaEntregaDni: (v: string) => void;
  personaEntregaTelefono: string;
  setPersonaEntregaTelefono: (v: string) => void;
  personaEntregaParentesco: string;
  setPersonaEntregaParentesco: (v: string) => void;
  docIdentidadIngresoBase64: string | null;
  setDocIdentidadIngresoBase64: (v: string | null) => void;
  handleDniEscaneadoQuienEntrega: (scanned: ScannedDniData) => void;
  setFirmaIngresoBase64: (v: string | null) => void;
}

export const SeccionSoporteYConformidadIngreso: React.FC<SeccionSoporteYConformidadIngresoProps> = ({
  esAlumno,
  escuelas,
  escuelaSearch,
  handleEscuelaSearchChange,
  isEscuelaDropdownOpen,
  setIsEscuelaDropdownOpen,
  setSelectedEscuelaId,
  setEscuelaSearch,
  onOpenCrearEscuelaModal,
  fallaCatalogoId,
  setFallaCatalogoId,
  fallaReportada,
  setFallaReportada,
  observaciones,
  setObservaciones,
  fechaIngreso,
  setFechaIngreso,
  soloCargador,
  setSoloCargador,
  personaEntregaTipo,
  aplicarPersonaEntrega,
  personaEntregaNombre,
  setPersonaEntregaNombre,
  personaEntregaDni,
  setPersonaEntregaDni,
  personaEntregaTelefono,
  setPersonaEntregaTelefono,
  personaEntregaParentesco,
  setPersonaEntregaParentesco,
  docIdentidadIngresoBase64,
  setDocIdentidadIngresoBase64,
  handleDniEscaneadoQuienEntrega,
  setFirmaIngresoBase64
}) => {
  const filteredEscuelas = escuelas.filter(e =>
    e.nombre.toLowerCase().includes(escuelaSearch.toLowerCase())
  );

  return (
    <>
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
          <FileText className="w-4.5 h-4.5" />
          <h3 className="text-sm font-semibold text-slate-800">Ubicación y Distribución</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1.5">Escuela</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                  placeholder="-- Buscar Escuela --"
                  value={escuelaSearch}
                  onChange={handleEscuelaSearchChange}
                  onFocus={() => setIsEscuelaDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsEscuelaDropdownOpen(false), 200)}
                />
                {isEscuelaDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEscuelas.map(esc => (
                      <div
                        key={esc.id}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-xs text-slate-700"
                        onClick={() => {
                          setSelectedEscuelaId(esc.id);
                          setEscuelaSearch(esc.nombre);
                          setIsEscuelaDropdownOpen(false);
                        }}
                      >
                        {esc.nombre}
                      </div>
                    ))}
                    {filteredEscuelas.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-400">No se encontraron escuelas...</div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenCrearEscuelaModal}
                className="flex-shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
                title="Agregar nueva escuela"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1.5">Ubicación Depósito</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors cursor-not-allowed opacity-80"
              value="sistemas"
              disabled
            >
              <option value="sistemas">Área Sistemas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Detalles del Soporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-slate-700 text-xs font-semibold mb-1.5">Falla Común</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
              value={fallaCatalogoId}
              onChange={(e) => setFallaCatalogoId(Number(e.target.value))}
            >
              <option value={1}>No Enciende</option>
              <option value={2}>Pantalla Rota / Sin Imagen</option>
              <option value={3}>Bloqueo de Seguridad</option>
              <option value={4}>Falla de Teclado</option>
              <option value={5}>Problemas de Sistema Operativo</option>
              <option value={6}>Otro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-slate-700 text-xs font-semibold mb-1.5">Descripción de Falla</label>
            <textarea
              required={fallaCatalogoId === 6}
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
              placeholder="Escriba los detalles de la falla reportada..."
              value={fallaReportada}
              onChange={(e) => setFallaReportada(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 text-xs font-semibold mb-1.5">Observaciones Estéticas / Accesorios</label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
            placeholder="Ej: Trae cargador original. Tapa rayada."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1.5">Fecha de Ingreso (Carga Retroactiva)</label>
            <input
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-750 cursor-pointer">
              <input
                type="checkbox"
                checked={soloCargador}
                onChange={(e) => setSoloCargador(e.target.checked)}
                className="text-[#FF8200] focus:ring-[#FF8200] rounded"
              />
              Ingreso de Solo Cargador (Hardware)
            </label>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-[#FF8200]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Quién presenta / entrega el equipo en depósito?</h3>
              <p className="text-[11px] text-slate-500">
                {esAlumno
                  ? 'Los alumnos no pueden entregar equipos directamente. Seleccione el tutor o cargue los datos de un tercero autorizado.'
                  : 'Registre a la persona física que asiste a dejar el equipo en depósito.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => aplicarPersonaEntrega('Tutor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                personaEntregaTipo === 'Tutor' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {esAlumno ? 'Es el Tutor Responsable' : 'Es el Titular'}
            </button>
            <button
              type="button"
              onClick={() => aplicarPersonaEntrega('Tercero')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                personaEntregaTipo === 'Tercero' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tercero / Familiar Autorizado
            </button>
          </div>
        </div>

        {personaEntregaTipo === 'Tercero' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              El equipo es entregado por un tercero o familiar autorizado. Complete sus datos a continuación:
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Nombre y Apellido *</label>
            <input
              required
              type="text"
              placeholder="Nombre completo"
              className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
              }`}
              value={personaEntregaNombre}
              onChange={(e) => setPersonaEntregaNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">DNI *</label>
            <input
              required
              type="text"
              placeholder="DNI de quien entrega"
              className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
              }`}
              value={personaEntregaDni}
              onChange={(e) => setPersonaEntregaDni(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Teléfono Contacto</label>
            <input
              type="text"
              placeholder="Teléfono de quien entrega"
              className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
              }`}
              value={personaEntregaTelefono}
              onChange={(e) => setPersonaEntregaTelefono(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Parentesco / Relación *</label>
            <input
              required
              type="text"
              placeholder="Ej: Madre, Tío, Hermano mayor, Autorizado..."
              className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
              }`}
              value={personaEntregaParentesco}
              onChange={(e) => setPersonaEntregaParentesco(e.target.value)}
            />
          </div>
        </div>

        <DocumentoIdentidadSection
          documentoBase64={docIdentidadIngresoBase64}
          onDocumentoChange={setDocIdentidadIngresoBase64}
          onDniParsed={handleDniEscaneadoQuienEntrega}
          label="Digitalización del DNI de quien entrega"
          descripcion="Escanee el código de barras PDF417, capture una foto con la cámara web o cargue el archivo del documento."
        />

        <DigitalSignatureCanvas
          onSignatureChange={setFirmaIngresoBase64}
          title="Firma Digital en Pantalla"
          subtitle="El presentante puede firmar con el dedo (táctil) o ratón para registrar el ingreso sin requerir papel."
        />
      </div>
    </>
  );
};
