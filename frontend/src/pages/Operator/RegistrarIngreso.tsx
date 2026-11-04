import React from 'react';
import { CrearEscuelaModal } from '../../components/Escuelas/CrearEscuelaModal';
import { Search, AlertTriangle, Check, Loader2, Printer } from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';
import { FormularioBeneficiarioManual } from '../../components/Ingreso/FormularioBeneficiarioManual';
import { FormularioBeneficiarioPadron } from '../../components/Ingreso/FormularioBeneficiarioPadron';
import { SeccionSoporteYConformidadIngreso } from '../../components/Ingreso/SeccionSoporteYConformidadIngreso';
import { useRegistrarIngresoForm } from '../../hooks/useRegistrarIngresoForm';

interface RegistrarIngresoProps {
  token: string;
  nombreOperador: string;
}

export const RegistrarIngreso: React.FC<RegistrarIngresoProps> = ({ token, nombreOperador }) => {
  const f = useRegistrarIngresoForm(token, nombreOperador);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {f.isCrearEscuelaModalOpen && (
        <CrearEscuelaModal
          token={token}
          onClose={() => f.setIsCrearEscuelaModalOpen(false)}
          onSuccess={f.handleEscuelaCreada}
        />
      )}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Ingreso de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca por DNI de tutor, alumno o número de serie de la netbook para registrar la orden de servicio.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <label className="block text-slate-700 text-xs font-semibold mb-2">
            Paso 1: Seleccionar Programa de Entrega
          </label>
          <select
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF8200] text-sm font-medium transition-colors"
            value={f.selectedProgramaInicialId}
            onChange={(e) => {
              f.setSelectedProgramaInicialId(e.target.value);
              f.setForzarModoManual(false);
              f.setBeneficiario(null);
              f.setDniInput('');
              f.setMensajeError('');
              f.setMensajeExito('');
            }}
          >
            <option value="">-- Seleccione el Programa --</option>
            {f.programas.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.nombre}
              </option>
            ))}
          </select>
        </div>

        {f.selectedProgramaInicialId && f.isMaestrosDeAmerica && (
          <div className="animate-fade-in space-y-2 pt-2">
            <label className="block text-slate-700 text-xs font-semibold mb-2">
              Paso 2: Identificación de Alumno, Docente, Tutor o Equipo
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={f.dniInputRef}
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#FF8200] transition-colors"
                  placeholder="Ingrese DNI (alumno/docente) o número de serie (ej: SJMA025-011176)..."
                  value={f.dniInput}
                  onChange={f.handleDniInputChange}
                  onKeyDown={f.handleKeyDown}
                  disabled={f.loading}
                />
                {f.dniInput && (
                  <button
                    onClick={() => {
                      f.setDniInput('');
                      f.setForzarModoManual(false);
                      f.setMensajeError('');
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => f.buscarBeneficiario()}
                disabled={f.loading || !f.dniInput}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[120px]"
              >
                {f.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Tip: La búsqueda se realiza de manera automática al completar un DNI de 7-8 dígitos o un código de netbook. Si no figura en el padrón, se habilitará la carga manual.
            </p>
          </div>
        )}

        {f.mensajeError && (
          <div className="p-3 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {f.mensajeError}
          </div>
        )}

        {f.mensajeExito && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-green-600" />
              <span>{f.mensajeExito}</span>
            </div>
            {f.ultimoComprobante && (
              <button
                type="button"
                onClick={() => f.ultimoComprobante && imprimirComprobante(f.ultimoComprobante)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Comprobante (Opcional)
              </button>
            )}
          </div>
        )}

        {f.selectedProgramaInicialId && f.isManualMode && (
          <form onSubmit={f.handleIngresarNotebook} className="space-y-6 pt-4 border-t border-slate-100 animate-fade-in">
            <FormularioBeneficiarioManual
              forzarModoManual={f.forzarModoManual}
              manualTipoBeneficiario={f.manualTipoBeneficiario}
              setManualTipoBeneficiario={f.setManualTipoBeneficiario}
              manualTitularDni={f.manualTitularDni}
              setManualTitularDni={f.setManualTitularDni}
              manualTitularNombre={f.manualTitularNombre}
              setManualTitularNombre={f.setManualTitularNombre}
              manualTitularApellido={f.manualTitularApellido}
              setManualTitularApellido={f.setManualTitularApellido}
              manualTitularTelefono={f.manualTitularTelefono}
              setManualTitularTelefono={f.setManualTitularTelefono}
              manualTitularEmail={f.manualTitularEmail}
              setManualTitularEmail={f.setManualTitularEmail}
              manualTutorNombre={f.manualTutorNombre}
              setManualTutorNombre={f.setManualTutorNombre}
              manualTutorDni={f.manualTutorDni}
              setManualTutorDni={f.setManualTutorDni}
              manualTutorTelefono={f.manualTutorTelefono}
              setManualTutorTelefono={f.setManualTutorTelefono}
              manualEquipoNumeroSerie={f.manualEquipoNumeroSerie}
              setManualEquipoNumeroSerie={f.setManualEquipoNumeroSerie}
              manualEquipoMarca={f.manualEquipoMarca}
              setManualEquipoMarca={f.setManualEquipoMarca}
              manualEquipoModelo={f.manualEquipoModelo}
              setManualEquipoModelo={f.setManualEquipoModelo}
              manualEquipoCredencialesOffice={f.manualEquipoCredencialesOffice}
              setManualEquipoCredencialesOffice={f.setManualEquipoCredencialesOffice}
            />

            <SeccionSoporteYConformidadIngreso
              esAlumno={f.manualTipoBeneficiario === 1}
              escuelas={f.escuelas}
              escuelaSearch={f.escuelaSearch}
              handleEscuelaSearchChange={f.handleEscuelaSearchChange}
              isEscuelaDropdownOpen={f.isEscuelaDropdownOpen}
              setIsEscuelaDropdownOpen={f.setIsEscuelaDropdownOpen}
              setSelectedEscuelaId={f.setSelectedEscuelaId}
              setEscuelaSearch={f.setEscuelaSearch}
              onOpenCrearEscuelaModal={() => f.setIsCrearEscuelaModalOpen(true)}
              fallaCatalogoId={f.fallaCatalogoId}
              setFallaCatalogoId={f.setFallaCatalogoId}
              fallaReportada={f.fallaReportada}
              setFallaReportada={f.setFallaReportada}
              observaciones={f.observaciones}
              setObservaciones={f.setObservaciones}
              fechaIngreso={f.fechaIngreso}
              setFechaIngreso={f.setFechaIngreso}
              soloCargador={f.soloCargador}
              setSoloCargador={f.setSoloCargador}
              personaEntregaTipo={f.personaEntregaTipo}
              aplicarPersonaEntrega={(tipo) => f.aplicarPersonaEntrega(tipo)}
              personaEntregaNombre={f.personaEntregaNombre}
              setPersonaEntregaNombre={f.setPersonaEntregaNombre}
              personaEntregaDni={f.personaEntregaDni}
              setPersonaEntregaDni={f.setPersonaEntregaDni}
              personaEntregaTelefono={f.personaEntregaTelefono}
              setPersonaEntregaTelefono={f.setPersonaEntregaTelefono}
              personaEntregaParentesco={f.personaEntregaParentesco}
              setPersonaEntregaParentesco={f.setPersonaEntregaParentesco}
              docIdentidadIngresoBase64={f.docIdentidadIngresoBase64}
              setDocIdentidadIngresoBase64={f.setDocIdentidadIngresoBase64}
              handleDniEscaneadoQuienEntrega={f.handleDniEscaneadoQuienEntrega}
              setFirmaIngresoBase64={f.setFirmaIngresoBase64}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (f.forzarModoManual) {
                    f.setForzarModoManual(false);
                    f.setDniInput('');
                    f.setMensajeError('');
                  } else {
                    f.setSelectedProgramaInicialId('');
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={f.loading}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[150px]"
              >
                {f.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ingreso Manual'}
              </button>
            </div>
          </form>
        )}

        {f.beneficiario && (
          <form onSubmit={f.handleIngresarNotebook} className="space-y-6 pt-4 border-t border-slate-100">
            <FormularioBeneficiarioPadron
              beneficiario={f.beneficiario}
              setBeneficiario={f.setBeneficiario}
              aplicarPersonaEntrega={f.aplicarPersonaEntrega}
              registrarNuevoEquipo={f.registrarNuevoEquipo}
              setRegistrarNuevoEquipo={f.setRegistrarNuevoEquipo}
              customSerial={f.customSerial}
              setCustomSerial={f.setCustomSerial}
              customMarca={f.customMarca}
              setCustomMarca={f.setCustomMarca}
              customModelo={f.customModelo}
              setCustomModelo={f.setCustomModelo}
              customCredencialesOffice={f.customCredencialesOffice}
              setCustomCredencialesOffice={f.setCustomCredencialesOffice}
            />

            <SeccionSoporteYConformidadIngreso
              esAlumno={(f.beneficiario.tipoBeneficiario ?? 1) === 1}
              escuelas={f.escuelas}
              escuelaSearch={f.escuelaSearch}
              handleEscuelaSearchChange={f.handleEscuelaSearchChange}
              isEscuelaDropdownOpen={f.isEscuelaDropdownOpen}
              setIsEscuelaDropdownOpen={f.setIsEscuelaDropdownOpen}
              setSelectedEscuelaId={f.setSelectedEscuelaId}
              setEscuelaSearch={f.setEscuelaSearch}
              onOpenCrearEscuelaModal={() => f.setIsCrearEscuelaModalOpen(true)}
              fallaCatalogoId={f.fallaCatalogoId}
              setFallaCatalogoId={f.setFallaCatalogoId}
              fallaReportada={f.fallaReportada}
              setFallaReportada={f.setFallaReportada}
              observaciones={f.observaciones}
              setObservaciones={f.setObservaciones}
              fechaIngreso={f.fechaIngreso}
              setFechaIngreso={f.setFechaIngreso}
              soloCargador={f.soloCargador}
              setSoloCargador={f.setSoloCargador}
              personaEntregaTipo={f.personaEntregaTipo}
              aplicarPersonaEntrega={(tipo) => f.aplicarPersonaEntrega(tipo)}
              personaEntregaNombre={f.personaEntregaNombre}
              setPersonaEntregaNombre={f.setPersonaEntregaNombre}
              personaEntregaDni={f.personaEntregaDni}
              setPersonaEntregaDni={f.setPersonaEntregaDni}
              personaEntregaTelefono={f.personaEntregaTelefono}
              setPersonaEntregaTelefono={f.setPersonaEntregaTelefono}
              personaEntregaParentesco={f.personaEntregaParentesco}
              setPersonaEntregaParentesco={f.setPersonaEntregaParentesco}
              docIdentidadIngresoBase64={f.docIdentidadIngresoBase64}
              setDocIdentidadIngresoBase64={f.setDocIdentidadIngresoBase64}
              handleDniEscaneadoQuienEntrega={f.handleDniEscaneadoQuienEntrega}
              setFirmaIngresoBase64={f.setFirmaIngresoBase64}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => f.setBeneficiario(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={f.loading}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[150px]"
              >
                {f.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ingreso'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
