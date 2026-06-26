import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { LogoSanJuan } from '../components/Shared/LogoSanJuan';
import { CheckCircle2, Circle, Clock, AlertCircle, ShieldAlert, Laptop } from 'lucide-react';

interface EstadoPublicoInfo {
  numeroSerie: string;
  marcaModelo: string;
  estado: string;
  fechaIngreso: string;
  fechaLimite: string | null;
}

export const ConsultaPublica: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<EstadoPublicoInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    if (!idParam) {
      setError('No se proporcionó un código de consulta válido en la URL.');
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Reparaciones/${idParam}/estado-publico`);
        if (response.ok) {
          const data = await response.json();
          setInfo(data);
        } else if (response.status === 404) {
          setError('No se encontró ninguna orden de reparación activa con el código ingresado.');
        } else {
          setError('Ocurrió un problema en el servidor al consultar el estado.');
        }
      } catch (err) {
        setError('No se pudo conectar con el servidor de trazabilidad. Verifique su conexión de red.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Pasos de la máquina de estados a mostrar al tutor
  const steps = [
    { label: 'Ingresado', value: 'Ingresado', desc: 'El dispositivo ingresó al depósito central.' },
    { label: 'En Diagnóstico', value: 'En_Diagnostico', desc: 'El equipo está siendo evaluado por un técnico.' },
    { label: 'En Reparación', value: 'En_Reparacion', desc: 'Se están realizando tareas de soporte de hardware o software.' },
    { label: 'Garantía Externa', value: 'En_Garantia_Externa', desc: 'Derivado al servicio oficial del fabricante por garantía.' },
    { label: 'Listo para Retirar', value: 'Listo_Para_Retirar', desc: '¡Listo! Puede pasar a retirarlo con DNI físico del tutor.' },
    { label: 'Entregado', value: 'Entregado', desc: 'El equipo fue devuelto al tutor con éxito.' }
  ];

  const getStepIndex = (currentStatus: string) => {
    if (currentStatus === 'No_Reparable') return 4; // Mostrar como listo para retirar para que lo devuelvan
    if (currentStatus === 'Apartado_Para_Garantia') return 3;
    if (currentStatus === 'Esperando_Repuestos') return 2;
    if (currentStatus === 'Reparado') return 4;
    return steps.findIndex(s => s.value === currentStatus);
  };

  const currentStepIdx = info ? getStepIndex(info.estado) : -1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-[#1D252D] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-center items-center shadow-sm shrink-0">
        <LogoSanJuan showMinistry={true} className="max-w-[240px]" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        {loading ? (
          <div className="text-center space-y-3 py-10">
            <span className="inline-block w-8 h-8 border-3 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-sm text-slate-500 font-semibold">Consultando estado de trazabilidad...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 text-red-500 rounded-full">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Consulta de Estado Fallida</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
            <p className="text-xs text-slate-400">Si considera que esto es un error, por favor verifique el comprobante impreso.</p>
          </div>
        ) : info ? (
          <div className="space-y-6 animate-fade-in">
            {/* Card de Información Principal */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#FF8200] font-bold uppercase tracking-wider">Seguimiento de Reparación</span>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-slate-700" />
                    {info.numeroSerie}
                  </h2>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                    info.estado === 'Listo_Para_Retirar' || info.estado === 'Reparado' ? 'bg-green-50 border-green-200 text-green-700' :
                    info.estado === 'Entregado' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    info.estado === 'No_Reparable' ? 'bg-red-50 border-red-200 text-red-700' :
                    'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                  }`}>
                    {info.estado.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Modelo de Equipo</p>
                  <p className="text-slate-800 font-bold mt-0.5">{info.marcaModelo}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Fecha de Ingreso</p>
                  <p className="text-slate-800 font-bold mt-0.5">{new Date(info.fechaIngreso).toLocaleDateString()}</p>
                </div>
                {info.fechaLimite && (
                  <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#FF8200]" />
                    <span>Fecha estimada de resolución: <strong>{new Date(info.fechaLimite).toLocaleDateString()}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Visualizador de Pasos (Timeline) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
              <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Historial de Progreso</h3>
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIdx;
                  const isCurrent = index === currentStepIdx;
                  
                  return (
                    <div key={index} className="relative pl-6">
                      {/* Círculo indicador */}
                      <span className={`absolute -left-[11px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-[#FF8200] text-white ring-4 ring-orange-100' :
                        'bg-white border-2 border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-current" />
                        ) : (
                          <Circle className="w-2.5 h-2.5 fill-current text-current" />
                        )}
                      </span>
                      
                      <div className="space-y-0.5">
                        <h4 className={`text-sm font-bold ${isCurrent ? 'text-[#FF8200]' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-xs ${isCurrent ? 'text-slate-650' : 'text-slate-400'}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mensaje Informativo para Retirar */}
            {(info.estado === 'Listo_Para_Retirar' || info.estado === 'No_Reparable') && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm flex gap-3.5 text-green-800 animate-bounce-subtle">
                <AlertCircle className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm">¡Ya puedes pasar a retirar el dispositivo!</p>
                  <p>Preséntate en el depósito central del Ministerio de Educación de San Juan de Lunes a Viernes en el horario de 8:00 a 13:00 hs. Es requisito obligatorio presentar el <strong>DNI físico del tutor</strong>.</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-450 border-t border-slate-200 bg-white shrink-0">
        <p>© 2026 Ministerio de Educación de San Juan - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
