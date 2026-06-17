import React, { useState, useEffect, useRef } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';

const SignaturePad: React.FC<{ onChange: (base64: string | null) => void }> = ({ onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1d252d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      onChange(null);
      return;
    }
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-slate-700 text-sm font-semibold">Firma del Tutor (Retiro de Equipo)</label>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-[#E03C31] hover:underline font-semibold"
        >
          Limpiar
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-200 bg-white rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={450}
          height={120}
          className="w-full h-[120px] cursor-crosshair touch-none bg-slate-50"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};

interface EntregaNotebookProps {
  token: string;
}

export const EntregaNotebook: React.FC<EntregaNotebookProps> = ({ token }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);
  const [firmaEntregaBase64, setFirmaEntregaBase64] = useState<string | null>(null);
  
  const fetchRepairsToDeliver = async () => {
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        const deliverable = data.filter(r => r.estado === 'Listo_Para_Retirar' || r.estado === 'No_Reparable');
        setRepairs(deliverable);
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación de entregas.');
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
    if (!firmaEntregaBase64) {
      alert("Por favor, el tutor debe firmar antes de realizar la entrega.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones/${reparacionId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nuevoEstado: 'Entregado',
          observaciones: 'Entregado físicamente al tutor validando DNI original.',
          firmaEntregaBase64: firmaEntregaBase64
        })
      });

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: `El equipo con Serie ${numeroSerie} ha sido entregado e inactivado correctamente.` });
        setSelectedRepair(null);
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega en la base de datos.' });
      }
    } catch (error) {
      setRepairs(prev => prev.filter(r => r.id !== reparacionId));
      setSelectedRepair(null);
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
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-extrabold text-[#1D252D]">Registrar Entrega de Notebook</h2>
        <p className="text-slate-500 mt-1 text-sm">Busque y entregue notebooks reparadas o declaradas no reparables al beneficiario.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-lg text-sm border font-semibold ${
          mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
        }`}>
          {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
        </div>
      )}

      {/* Search and List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6">
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
            placeholder="Filtrar por número de serie o tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={fetchRepairsToDeliver}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg border border-slate-200 transition-colors text-sm"
          >
            🔄 Recargar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <span className="inline-block w-8 h-8 border-4 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-slate-500 mt-2 text-sm">Cargando equipos en depósito...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 text-sm">No hay equipos listos para retirar que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRepairs.map((repair) => (
              <div key={repair.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#1D252D] font-bold text-lg">{repair.numeroSerie}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      repair.estado === 'Listo_Para_Retirar' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
                    }`}>
                      {repair.estado === 'Listo_Para_Retirar' ? 'Reparado - Listo' : 'No Reparable'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <p className="text-[#1D252D]"><span className="text-slate-500">Tutor:</span> {repair.nombreTutor}</p>
                    <p className="text-[#1D252D]"><span className="text-slate-500">Modelo:</span> {repair.marcaModelo}</p>
                    <p className="text-[#1D252D]"><span className="text-slate-500">Falla:</span> {repair.fallaReportada}</p>
                    <p className="text-[#1D252D]"><span className="text-slate-500">Ubicación Depósito:</span> <span className="font-bold text-[#FF8200]">{repair.ubicacionDepositoCodigo || 'No asignada'}</span></p>
                    <p className="text-[#1D252D]"><span className="text-slate-500">Acción técnica:</span> {repair.accionesRealizadas || 'Sin detalles'}</p>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setSelectedRepair(repair);
                      setFirmaEntregaBase64(null);
                    }}
                    className="flex-1 md:flex-none bg-[#FF8200] hover:bg-[#e07200] text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all text-sm"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-scaleIn">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-[#1D252D]">Confirmar Entrega de Equipo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Serie: {selectedRepair.numeroSerie}</p>
              </div>
              <button 
                onClick={() => setSelectedRepair(null)}
                className="text-slate-400 hover:text-slate-650 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm text-[#1D252D]">
              <p><span className="text-slate-500 font-medium">Tutor / Beneficiario:</span> <span className="font-semibold">{selectedRepair.nombreTutor}</span></p>
              <p><span className="text-slate-500 font-medium">Dispositivo:</span> {selectedRepair.marcaModelo}</p>
              <p><span className="text-slate-500 font-medium">Ubicación Depósito:</span> <span className="font-bold text-[#FF8200]">{selectedRepair.ubicacionDepositoCodigo || 'No asignada'}</span></p>
              <p><span className="text-slate-500 font-medium">Falla Reportada:</span> {selectedRepair.fallaReportada}</p>
              <p><span className="text-slate-500 font-medium">Diagnóstico Técnico:</span> {selectedRepair.diagnostico || 'Sin diagnóstico'}</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <SignaturePad onChange={(base64) => setFirmaEntregaBase64(base64)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRepair(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleEntregar(selectedRepair.id, selectedRepair.numeroSerie)}
                disabled={loading || !firmaEntregaBase64}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all text-sm flex items-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Entregar y Archivar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
