import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';

interface EntregaNotebookProps {
  token: string;
}

export const EntregaNotebook: React.FC<EntregaNotebookProps> = ({ token }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  const fetchRepairsToDeliver = async () => {
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      // Pedimos las reparaciones en estado "Listo_Para_Retirar" o "No_Reparable"
      const response = await fetch('http://localhost:5110/api/v1/Reparaciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        // Filtrar localmente las que están listas para retirar o no reparables
        const deliverable = data.filter(r => r.estado === 'Listo_Para_Retirar' || r.estado === 'No_Reparable');
        setRepairs(deliverable);
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación de entregas.');
      // Fallback con datos estáticos para demo
      setRepairs([
        {
          id: 'mock-reparacion-1',
          equipoId: 'eq-1',
          numeroSerie: 'S-EDU-42123456-X',
          marcaModelo: 'Exo Juana Manso v2',
          nombreTutor: 'Juan Carlos Gómez',
          telefonoTutor: '+542644556677',
          estado: 'Listo_Para_Retirar',
          fallaReportada: 'No se conecta al Wi-Fi de la escuela.',
          diagnostico: 'Placa Wi-Fi dañada físicamente.',
          accionesRealizadas: 'Se reemplazó módulo Wi-Fi y se actualizó driver.',
          fechaIngreso: '2026-06-10T10:00:00Z'
        },
        {
          id: 'mock-reparacion-2',
          equipoId: 'eq-2',
          numeroSerie: 'S-EDU-39988776-X',
          marcaModelo: 'BGH Conectar Igualdad',
          nombreTutor: 'Laura Silvestri',
          telefonoTutor: '+542644112233',
          estado: 'No_Reparable',
          fallaReportada: 'Se mojó con gaseosa y no volvió a encender.',
          diagnostico: 'Cortocircuito generalizado en placa lógica principal con óxido avanzado.',
          accionesRealizadas: 'Limpieza por ultrasonido sin éxito. Placa muerta.',
          fechaIngreso: '2026-06-11T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async (reparacionId: string, numeroSerie: string) => {
    if (!window.confirm(`¿Confirmar la entrega física del dispositivo con Serie ${numeroSerie}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5110/api/v1/Reparaciones/${reparacionId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nuevoEstado: 'Entregado',
          observaciones: 'Entregado físicamente al tutor validando DNI original.'
        })
      });

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: `El equipo con Serie ${numeroSerie} ha sido entregado e inactivado correctamente.` });
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega en la base de datos.' });
      }
    } catch (error) {
      // Simulación local
      setRepairs(prev => prev.filter(r => r.id !== reparacionId));
      setMensaje({ tipo: 'exito', texto: `[SIMULACIÓN] Entrega física de equipo ${numeroSerie} procesada correctamente.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairsToDeliver();
  }, [token]);

  const filteredRepairs = repairs.filter(r => 
    r.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nombreTutor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-3xl font-extrabold text-white">Registrar Entrega de Notebook</h2>
        <p className="text-slate-400 mt-1">Busque y entregue notebooks reparadas o declaradas no reparables al beneficiario.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-lg text-sm border ${
          mensaje.tipo === 'exito' ? 'bg-green-950/40 border-green-800 text-green-300' : 'bg-red-950/40 border-red-800 text-red-300'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
        </div>
      )}

      {/* Search and List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Filtrar por número de serie o tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={fetchRepairsToDeliver}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg border border-slate-700 transition-colors"
          >
            🔄 Recargar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <span className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-slate-500 mt-2 text-sm">Cargando equipos en depósito...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-10 bg-slate-950 rounded-lg border border-slate-850">
            <p className="text-slate-400">No hay equipos listos para retirar que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRepairs.map((repair) => (
              <div key={repair.id} className="bg-slate-950 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold text-lg">{repair.numeroSerie}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      repair.estado === 'Listo_Para_Retirar' 
                        ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' 
                        : 'bg-rose-950/50 border-rose-800 text-rose-400'
                    }`}>
                      {repair.estado === 'Listo_Para_Retirar' ? 'Reparado - Listo' : 'No Reparable'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <p className="text-slate-300"><span className="text-slate-500">Tutor:</span> {repair.nombreTutor}</p>
                    <p className="text-slate-300"><span className="text-slate-500">Modelo:</span> {repair.marcaModelo}</p>
                    <p className="text-slate-300"><span className="text-slate-500">Falla:</span> {repair.fallaReportada}</p>
                    <p className="text-slate-300"><span className="text-slate-500">Acción técnica:</span> {repair.accionesRealizadas || 'Sin detalles'}</p>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleEntregar(repair.id, repair.numeroSerie)}
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
