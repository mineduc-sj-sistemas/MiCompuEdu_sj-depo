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
        // Filtrar las no entregadas
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
        // Actualizar vista seleccionada
        setSelectedRepair(prev => prev ? { ...prev, estado: nuevoEstado, diagnostico, accionesRealizadas, observaciones } : null);
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al actualizar la orden en el servidor.' });
      }
    } catch (error) {
      // Simulación local exitosa
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
    // Agrega una imagen de evidencia al azar
    const selectedImage = images[evidencias.length % images.length];
    setEvidencias(prev => [...prev, selectedImage]);
    setMensaje({ tipo: 'exito', texto: 'Archivo de evidencia cargado exitosamente.' });
  };

  useEffect(() => {
    fetchRepairs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Panel de Trabajo del Técnico</h2>
          <p className="text-slate-400 mt-1">Hola {nombreTecnico}, gestione sus diagnósticos y reparaciones asignadas.</p>
        </div>
        <button
          onClick={fetchRepairs}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors text-sm"
        >
          🔄 Actualizar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repairs List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Notebooks Pendientes</h3>
          {loading && repairs.length === 0 ? (
            <div className="text-center py-6">
              <span className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : repairs.length === 0 ? (
            <p className="text-slate-500 text-sm">No tiene equipos asignados pendientes.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {repairs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRepair(r)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                    selectedRepair?.id === r.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-650/5'
                      : 'bg-slate-900 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-200 font-bold text-sm">{r.numeroSerie}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      r.estado === 'Ingresado' ? 'bg-blue-950/50 border-blue-800 text-blue-400' :
                      r.estado === 'En_Diagnostico' ? 'bg-amber-950/50 border-amber-800 text-amber-400' :
                      r.estado === 'En_Reparacion' ? 'bg-indigo-950/50 border-indigo-800 text-indigo-400' :
                      r.estado === 'Esperando_Repuestos' ? 'bg-purple-950/50 border-purple-800 text-purple-400' :
                      'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                    }`}>
                      {r.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">Tutor: {r.nombreTutor}</p>
                  <p className="text-xs text-slate-500">Modelo: {r.marcaModelo}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Diagnosis Form */}
        <div className="lg:col-span-2">
          {selectedRepair ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="border-b border-slate-850 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Orden: {selectedRepair.numeroSerie}</h3>
                  <p className="text-xs text-slate-400 mt-1">Tutor: {selectedRepair.nombreTutor} ({selectedRepair.telefonoTutor})</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Fecha Ingreso</p>
                  <p className="text-xs text-slate-300 font-mono">{new Date(selectedRepair.fechaIngreso).toLocaleDateString()}</p>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm border ${
                  mensaje.tipo === 'exito' ? 'bg-green-950/40 border-green-800 text-green-300' : 'bg-red-950/40 border-red-800 text-red-300'
                }`}>
                  {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSaveDiagnosis} className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Falla Reportada Inicial</label>
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-300 italic">
                    "{selectedRepair.fallaReportada}"
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Diagnóstico Técnico</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                      placeholder="Detallar la falla real detectada..."
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Acciones Realizadas</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                      placeholder="Describir las reparaciones o reparaciones efectuadas..."
                      value={accionesRealizadas}
                      onChange={(e) => setAccionesRealizadas(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Próximo Estado de Soporte</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
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
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Observaciones Internas</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                      placeholder="Ej: Faltan tornillos, carcasa rallada..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </div>
                </div>

                {/* Evidencia Area */}
                <div className="border-t border-slate-850 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-300 text-sm font-semibold">Evidencia Fotográfica / Archivos</label>
                    <button
                      type="button"
                      onClick={simulateAddEvidence}
                      className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-750 text-indigo-400 font-semibold px-3 py-1.5 rounded transition-colors"
                    >
                      📷 Adjuntar Foto
                    </button>
                  </div>

                  {evidencias.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 text-xs">
                      No hay archivos cargados. Arrastre sus imágenes aquí.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {evidencias.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded bg-slate-950 overflow-hidden border border-slate-800">
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

                <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRepair(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cerrar Detalle
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center min-w-[150px]"
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
            <div className="bg-slate-900/50 border border-slate-850 rounded-xl p-10 text-center text-slate-500">
              Seleccione una orden de notebook de la lista de la izquierda para comenzar el diagnóstico y reparación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
