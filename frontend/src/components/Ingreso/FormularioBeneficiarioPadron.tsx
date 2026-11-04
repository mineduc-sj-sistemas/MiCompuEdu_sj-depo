import React from 'react';
import type { Beneficiario } from '../../types';
import { User, Phone, Mail, ShieldCheck, Laptop } from 'lucide-react';

interface FormularioBeneficiarioPadronProps {
  beneficiario: Beneficiario;
  setBeneficiario: (b: Beneficiario) => void;
  aplicarPersonaEntrega: (tipo: 'Tutor' | 'Tercero', targetBeneficiario?: Beneficiario | null) => void;
  registrarNuevoEquipo: boolean;
  setRegistrarNuevoEquipo: (v: boolean) => void;
  customSerial: string;
  setCustomSerial: (v: string) => void;
  customMarca: string;
  setCustomMarca: (v: string) => void;
  customModelo: string;
  setCustomModelo: (v: string) => void;
  customCredencialesOffice: string;
  setCustomCredencialesOffice: (v: string) => void;
}

export const FormularioBeneficiarioPadron: React.FC<FormularioBeneficiarioPadronProps> = ({
  beneficiario,
  setBeneficiario,
  aplicarPersonaEntrega,
  registrarNuevoEquipo,
  setRegistrarNuevoEquipo,
  customSerial,
  setCustomSerial,
  customMarca,
  setCustomMarca,
  customModelo,
  setCustomModelo,
  customCredencialesOffice,
  setCustomCredencialesOffice
}) => {
  const isAlumnoActual = (Number(beneficiario.tipoBeneficiario) || 1) === 1;

  return (
    <>
      <div className={`grid gap-4 ${isAlumnoActual ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2 text-[#FF8200]">
              <User className="w-4.5 h-4.5" />
              <h3 className="text-sm font-semibold text-slate-800">
                {isAlumnoActual ? 'Datos del Alumno (Titular)' : `Datos del Titular (${beneficiario.tipoBeneficiario === 2 ? 'Docente' : 'Directivo'})`}
              </h3>
            </div>
            <select
              value={beneficiario.tipoBeneficiario || 1}
              onChange={(e) => {
                const nuevoTipo = Number(e.target.value);
                const updated = { ...beneficiario, tipoBeneficiario: nuevoTipo };
                setBeneficiario(updated);
                aplicarPersonaEntrega('Tutor', updated);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8200]"
            >
              <option value={1}>Alumno</option>
              <option value={2}>Docente</option>
              <option value={3}>Directivo</option>
            </select>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">DNI {isAlumnoActual ? 'Alumno' : 'Titular'}:</span>
              <span className="font-mono font-bold text-slate-900">{beneficiario.dni}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nombre Completo:</span>
              <span className="font-semibold text-slate-900">{beneficiario.nombre} {beneficiario.apellido}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                Teléfono {isAlumnoActual ? 'Alumno' : 'Titular'}:
              </span>
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={beneficiario.telefono || ''}
                onChange={(e) => setBeneficiario({ ...beneficiario, telefono: e.target.value })}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-1/2 text-right"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email Escolar:</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {beneficiario.email || '-'}
              </span>
            </div>
          </div>
        </div>

        {isAlumnoActual && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2 text-[#FF8200]">
                <ShieldCheck className="w-4.5 h-4.5" />
                <h3 className="text-sm font-semibold text-slate-800">Tutor Responsable (Padrón)</h3>
              </div>
              {(!beneficiario.nombreTutor || !beneficiario.dniTutor) && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  Obligatorio
                </span>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Nombre y Apellido del Tutor *</label>
                <input
                  required
                  type="text"
                  placeholder="Nombre del tutor registrado"
                  value={beneficiario.nombreTutor || ''}
                  onChange={(e) => setBeneficiario({ ...beneficiario, nombreTutor: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">DNI Tutor *</label>
                  <input
                    required
                    type="text"
                    placeholder="DNI del tutor"
                    value={beneficiario.dniTutor || ''}
                    onChange={(e) => setBeneficiario({ ...beneficiario, dniTutor: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono Tutor *</label>
                  <input
                    required
                    type="text"
                    placeholder="Teléfono de contacto"
                    value={beneficiario.telefonoTutor ?? beneficiario.telefono ?? ''}
                    onChange={(e) => setBeneficiario({ ...beneficiario, telefonoTutor: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
          <div className="flex items-center gap-2 text-[#FF8200]">
            <Laptop className="w-4.5 h-4.5" />
            <h3 className="text-sm font-semibold text-slate-800">Equipo Asignado</h3>
          </div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={registrarNuevoEquipo}
              onChange={(e) => setRegistrarNuevoEquipo(e.target.checked)}
              className="text-[#FF8200] focus:ring-[#FF8200] rounded w-3 h-3"
            />
            Registrar nueva notebook
          </label>
        </div>

        {registrarNuevoEquipo ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Nro de Serie *</label>
              <input
                required
                type="text"
                placeholder="SJMA025-..."
                value={customSerial}
                onChange={(e) => setCustomSerial(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Marca *</label>
              <input
                required
                type="text"
                placeholder="Ej: HP, Dell, Exo..."
                value={customMarca}
                onChange={(e) => setCustomMarca(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Modelo *</label>
              <input
                required
                type="text"
                placeholder="Modelo del equipo"
                value={customModelo}
                onChange={(e) => setCustomModelo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Credenciales Office (Opcional)</label>
              <input
                type="text"
                value={customCredencialesOffice}
                onChange={(e) => setCustomCredencialesOffice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        ) : beneficiario.equipo ? (
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Nro Serie</span>
              <span className="font-mono font-bold text-slate-900">{beneficiario.equipo.numeroSerie}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400">Marca</span>
              <input
                type="text"
                value={beneficiario.equipo.marca}
                onChange={(e) => setBeneficiario({ ...beneficiario, equipo: { ...beneficiario.equipo!, marca: e.target.value } })}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-2/3 text-right"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-400">Modelo</span>
              <input
                type="text"
                value={beneficiario.equipo.modelo}
                onChange={(e) => setBeneficiario({ ...beneficiario, equipo: { ...beneficiario.equipo!, modelo: e.target.value } })}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-2/3 text-right"
              />
            </div>
            {beneficiario.equipo.credencialesOffice && (
              <div className="flex justify-between">
                <span className="text-slate-400">Office</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">{beneficiario.equipo.credencialesOffice}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-yellow-600">Sin notebook registrada en el padrón.</p>
        )}
      </div>
    </>
  );
};
