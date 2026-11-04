import React from 'react';
import { User, Laptop } from 'lucide-react';

interface FormularioBeneficiarioManualProps {
  forzarModoManual: boolean;
  manualTipoBeneficiario: number;
  setManualTipoBeneficiario: (v: number) => void;
  manualTitularDni: string;
  setManualTitularDni: (v: string) => void;
  manualTitularNombre: string;
  setManualTitularNombre: (v: string) => void;
  manualTitularApellido: string;
  setManualTitularApellido: (v: string) => void;
  manualTitularTelefono: string;
  setManualTitularTelefono: (v: string) => void;
  manualTitularEmail: string;
  setManualTitularEmail: (v: string) => void;
  manualTutorNombre: string;
  setManualTutorNombre: (v: string) => void;
  manualTutorDni: string;
  setManualTutorDni: (v: string) => void;
  manualTutorTelefono: string;
  setManualTutorTelefono: (v: string) => void;
  manualEquipoNumeroSerie: string;
  setManualEquipoNumeroSerie: (v: string) => void;
  manualEquipoMarca: string;
  setManualEquipoMarca: (v: string) => void;
  manualEquipoModelo: string;
  setManualEquipoModelo: (v: string) => void;
  manualEquipoCredencialesOffice: string;
  setManualEquipoCredencialesOffice: (v: string) => void;
}

export const FormularioBeneficiarioManual: React.FC<FormularioBeneficiarioManualProps> = ({
  forzarModoManual,
  manualTipoBeneficiario,
  setManualTipoBeneficiario,
  manualTitularDni,
  setManualTitularDni,
  manualTitularNombre,
  setManualTitularNombre,
  manualTitularApellido,
  setManualTitularApellido,
  manualTitularTelefono,
  setManualTitularTelefono,
  manualTitularEmail,
  setManualTitularEmail,
  manualTutorNombre,
  setManualTutorNombre,
  manualTutorDni,
  setManualTutorDni,
  manualTutorTelefono,
  setManualTutorTelefono,
  manualEquipoNumeroSerie,
  setManualEquipoNumeroSerie,
  manualEquipoMarca,
  setManualEquipoMarca,
  manualEquipoModelo,
  setManualEquipoModelo,
  manualEquipoCredencialesOffice,
  setManualEquipoCredencialesOffice
}) => {
  return (
    <>
      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200">
        {forzarModoManual
          ? 'El DNI o número de serie buscado no se encontró en el padrón de Maestros de América. Por favor, complete los datos del beneficiario y del equipo manualmente.'
          : 'Has seleccionado un programa distinto a Maestros de América. Por favor, carga los datos del beneficiario y el equipo manualmente.'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
            <User className="w-4.5 h-4.5" />
            <h3 className="text-sm font-semibold text-slate-800">Datos del Titular / Tutor</h3>
          </div>
          <div className="flex gap-4 pb-2 border-b border-slate-100">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="radio" name="tipoBenef" value={1} checked={manualTipoBeneficiario === 1} onChange={() => setManualTipoBeneficiario(1)} className="text-[#FF8200] focus:ring-[#FF8200]" />
              Alumno
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="radio" name="tipoBenef" value={2} checked={manualTipoBeneficiario === 2} onChange={() => setManualTipoBeneficiario(2)} className="text-[#FF8200] focus:ring-[#FF8200]" />
              Docente
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input type="radio" name="tipoBenef" value={3} checked={manualTipoBeneficiario === 3} onChange={() => setManualTipoBeneficiario(3)} className="text-[#FF8200] focus:ring-[#FF8200]" />
              Directivo
            </label>
          </div>
          <div className="space-y-3 text-xs">
            <div><label className="block text-slate-500 mb-1">DNI *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularDni} onChange={e => setManualTitularDni(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Nombre *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularNombre} onChange={e => setManualTitularNombre(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Apellido *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularApellido} onChange={e => setManualTitularApellido(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Teléfono *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularTelefono} onChange={e => setManualTitularTelefono(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Email (Opcional)</label><input type="email" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularEmail} onChange={e => setManualTitularEmail(e.target.value)} /></div>

            {manualTipoBeneficiario === 1 && (
              <div className="border-t border-slate-200 pt-3 mt-3 space-y-3 animate-fade-in">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Datos del Tutor Responsable</p>
                <div><label className="block text-slate-500 mb-1">Nombre del Tutor *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorNombre} onChange={e => setManualTutorNombre(e.target.value)} /></div>
                <div><label className="block text-slate-500 mb-1">DNI del Tutor *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorDni} onChange={e => setManualTutorDni(e.target.value)} /></div>
                <div><label className="block text-slate-500 mb-1">Teléfono del Tutor (Opcional)</label><input type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorTelefono} onChange={e => setManualTutorTelefono(e.target.value)} /></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
            <Laptop className="w-4.5 h-4.5" />
            <h3 className="text-sm font-semibold text-slate-800">Datos del Equipo</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div><label className="block text-slate-500 mb-1">Nro Serie</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoNumeroSerie} onChange={e => setManualEquipoNumeroSerie(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Marca</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoMarca} onChange={e => setManualEquipoMarca(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Modelo</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoModelo} onChange={e => setManualEquipoModelo(e.target.value)} /></div>
            <div><label className="block text-slate-500 mb-1">Credenciales Office (Opcional)</label><input type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoCredencialesOffice} onChange={e => setManualEquipoCredencialesOffice(e.target.value)} /></div>
          </div>
        </div>
      </div>
    </>
  );
};
