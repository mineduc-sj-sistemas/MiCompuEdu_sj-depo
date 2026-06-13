import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';

interface PanelTecnicoProps {
  token: string;
  nombreTecnico: string;
}

export const PanelTecnico: React.FC<PanelTecnicoProps> = ({ token, nombreTecnico }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [accionesRealizadas, setAccionesRealizadas] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En_Diagnostico');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [evidencias, setEvidencias] = useState<string[]>([]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5110/api/v1/Reparaciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data.filter(r => r.estado !== 'Entregado'));
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación para técnicos.');
      setRepairs([
        {
          id: 'mock-reparacion-101',
          equipoId: 'eq-101',
          numeroSerie: 'S-EDU-41002233-X',
          marcaModelo: 'Exo Juana Manso v2',
          nombreTutor: 'Roberto Carlos Díaz',
          telefonoTutor: '+542644990011',
          estado: 'Ingresado',
          fallaReportada: 'El equipo se apaga solo luego de 5 minutos.',
          fechaIngreso: '2026-06-12T09:00:00Z'
        },
        {
          id: 'mock-reparacion-102',
          equipoId: 'eq-102',
          numeroSerie: 'S-EDU-45129843-X',
          marcaModelo: 'BGH Conectar Igualdad',
          nombreTutor: 'Gabriela Sabatini',
          telefonoTutor: '+542644223344',
          estado: 'En_Diagnostico',
          fallaReportada: 'Bloqueo de seguridad Juana Manso. Muestra pantalla roja.',
          diagnostico: 'Falta de sincronización con servidor escolar.',
          fechaIngreso: '2026-06-12T11:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepair = (repair: Reparacion) => {
    setSelectedRepair(repair);
    setDiagnostico(repair.diagnostico || '');
    setAccionesRealizadas(repair.accionesRealizadas || '');
    setObservaciones(repair.observaciones || '');
    setNuevoEstado(repair.estado);
    setEvidencias([]);
    setMensaje({ tipo: '', texto: '' });
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await fetch(`http://localhost:5110/api/v1/Reparaciones/${selectedRepair.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nuevoEstado,
          diagnostico,
          accionesRealizadas,
          observaciones
        })
      });

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: 'Orden de trabajo actualizada correctamente.' });
        fetchRepairs();
        setSelectedRepair(prev => prev ? { ...prev, estado: nuevoEstado, diagnostico, accionesRealizadas, observaciones } : null);
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al actualizar la orden en el servidor.' });
      }
    } catch (error) {
      setRepairs(prev => prev.map(r => r.id === selectedRepair.id 
        ? { ...r, estado: nuevoEstado, diagnostico, accionesRealizadas, observaciones } 
        : r
      ));
      setMensaje({ tipo: 'exito', texto: `[SIMULACIÓN] Cambios guardados localmente. Estado: ${nuevoEstado}` });
    } finally {
      setLoading(false);
    }
  };

  const simulateAddEvidence = () => {
    const images = [
      'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=500&q=80',
      'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?w=500&q=80'
    ];
    const selectedImage = images[evidencias.length % images.length];
    setEvidencias(prev => [...prev, selectedImage]);
    setMensaje({ tipo: 'exito', texto: 'Archivo de evidencia cargado exitosamente.' });
  };

  useEffect(() => {
    fetchRepairs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1D252D]">Panel de Trabajo del Técnico</h2>
          <p className="text-slate-500 mt-1 text-sm">Hola {nombreTecnico}, gestione sus diagnósticos y reparaciones asignadas.</p>
        </div>
        <button
          onClick={fetchRepairs}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-200 transition-colors text-sm"
        >
          🔄 Actualizar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repairs List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-[#1D252D] mb-2">Notebooks Activas</h3>
          {loading && repairs.length === 0 ? (
            <div className="text-center py-6">
              <span className="inline-block w-6 h-6 border-2 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : repairs.length === 0 ? (
            <p className="text-slate-400 text-sm">No tiene equipos asignados pendientes.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {repairs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRepair(r)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                    selectedRepair?.id === r.id
                      ? 'bg-[#FF8200]/5 border-[#FF8200] shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[#1D252D] font-bold text-sm">{r.numeroSerie}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      r.estado === 'Ingresado' ? 'bg-blue-550/10 border-blue-200 text-blue-700' :
                      r.estado === 'En_Diagnostico' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      r.estado === 'En_Reparacion' ? 'bg-orange-50 border-orange-200 text-[#FF8200]' :
                      r.estado === 'Esperando_Repuestos' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                      'bg-green-50 border-green-200 text-green-700'
                    }`}>
                      {r.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">Tutor: {r.nombreTutor}</p>
                  <p className="text-xs text-slate-400">Modelo: {r.marcaModelo}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Diagnosis Form */}
        <div className="lg:col-span-2">
          {selectedRepair ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#1D252D]">Orden: {selectedRepair.numeroSerie}</h3>
                  <p className="text-xs text-slate-500 mt-1">Tutor: {selectedRepair.nombreTutor} ({selectedRepair.telefonoTutor})</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Fecha Ingreso</p>
                  <p className="text-xs text-slate-700 font-mono font-bold">{new Date(selectedRepair.fechaIngreso).toLocaleDateString()}</p>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm border font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
                }`}>
                  {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSaveDiagnosis} className="space-y-6">
                <div>
                  <label className="block text-slate-650 text-sm font-semibold mb-2">Falla Reportada Inicial</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1D252D] italic font-semibold">
                    "{selectedRepair.fallaReportada}"
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Diagnóstico Técnico</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Detallar la falla real detectada..."
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Acciones Realizadas</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Describir las reparaciones o reparaciones efectuadas..."
                      value={accionesRealizadas}
                      onChange={(e) => setAccionesRealizadas(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Próximo Estado de Soporte</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                    >
                      <option value="En_Diagnostico">En Diagnóstico</option>
                      <option value="En_Reparacion">En Reparación</option>
                      <option value="Esperando_Repuestos">Esperando Repuestos</option>
                      <option value="Reparado">Reparado</option>
                      <option value="Listo_Para_Retirar">Listo para retirar (Notificar WhatsApp)</option>
                      <option value="No_Reparable">No Reparable (Notificar WhatsApp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Observaciones Internas</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Ej: Faltan tornillos, carcasa rallada..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </div>
                </div>

                {/* Evidencia Area */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-700 text-sm font-semibold">Evidencia Fotográfica / Archivos</label>
                    <button
                      type="button"
                      onClick={simulateAddEvidence}
                      className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#FF8200] font-bold px-3 py-1.5 rounded transition-colors"
                    >
                      📷 Adjuntar Foto
                    </button>
                  </div>

                  {evidencias.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-xs">
                      No hay archivos cargados. Arrastre sus imágenes aquí.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {evidencias.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded bg-slate-100 overflow-hidden border border-slate-200">
                          <img src={url} alt="Evidencia" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEvidencias(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold transition-all text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRepair(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Cerrar Detalle
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[150px] text-sm"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Guardar Diagnóstico (F10)'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-slate-450 text-sm">
              Seleccione una orden de notebook de la lista de la izquierda para comenzar el diagnóstico y reparación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
