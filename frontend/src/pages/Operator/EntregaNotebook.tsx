import React, { useState, useEffect, useRef } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { Search, RefreshCw, Laptop, User, MapPin, AlertTriangle, Check, Loader2, X, Trash2 } from 'lucide-react';

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
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) { onChange(null); return; }
    onChange(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-700">Firma del Tutor (Retiro de Equipo)</label>
        <button type="button" onClick={clearCanvas} className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Limpiar
        </button>
      </div>
      <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data.filter(r => r.estado === 'Listo_Para_Retirar' || r.estado === 'No_Reparable'));
      }
    } catch {
      setRepairs([
        {
          id: 'mock-reparacion-1', equipoId: 'eq-1', numeroSerie: 'S-EDU-42123456-X',
          marcaModelo: 'Exo Juana Manso v2', nombreTutor: 'Juan Carlos Gómez',
          telefonoTutor: '+542644556677', estado: 'Listo_Para_Retirar',
          fallaReportada: 'No se conecta al Wi-Fi.', diagnostico: 'Placa Wi-Fi dañada.',
          accionesRealizadas: 'Se reemplazó módulo Wi-Fi.', fechaIngreso: '2026-06-10T10:00:00Z'
        },
        {
          id: 'mock-reparacion-2', equipoId: 'eq-2', numeroSerie: 'S-EDU-39988776-X',
          marcaModelo: 'BGH Conectar Igualdad', nombreTutor: 'Laura Silvestri',
          telefonoTutor: '+542644112233', estado: 'No_Reparable',
          fallaReportada: 'Se mojó y no enciende.', diagnostico: 'Cortocircuito en placa.',
          accionesRealizadas: 'Sin reparación posible.', fechaIngreso: '2026-06-11T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async (reparacionId: string, numeroSerie: string) => {
    if (!firmaEntregaBase64) {
      alert('Por favor, el tutor debe firmar antes de realizar la entrega.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones/${reparacionId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nuevoEstado: 'Entregado', observaciones: 'Entregado al tutor validando DNI.', firmaEntregaBase64 })
      });
      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: `Equipo ${numeroSerie} entregado correctamente.` });
        setSelectedRepair(null);
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega.' });
      }
    } catch {
      setRepairs(prev => prev.filter(r => r.id !== reparacionId));
      setSelectedRepair(null);
      setMensaje({ tipo: 'exito', texto: `[SIMULACIÓN] Entrega de equipo ${numeroSerie} procesada.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRepairsToDeliver(); }, [token]);

  const filteredRepairs = repairs.filter(r =>
    r.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nombreTutor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Entrega de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca y entrega notebooks reparadas o declaradas no reparables al beneficiario.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
          mensaje.tipo === 'exito'
            ? 'bg-green-50 border-green-100 text-green-700'
            : 'bg-red-50 border-red-100 text-[#E03C31]'
        }`}>
          {mensaje.tipo === 'exito' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
              placeholder="Filtrar por serie o nombre de tutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchRepairsToDeliver}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium px-4 py-2.5 rounded-lg border border-slate-200 transition-colors text-sm flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 border-[#FF8200] animate-spin mx-auto text-[#FF8200]" />
            <p className="text-slate-400 mt-2 text-xs">Cargando equipos en depósito...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
            <Laptop className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No hay equipos listos para retirar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRepairs.map((repair) => (
              <div key={repair.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-slate-900 font-bold text-sm">{repair.numeroSerie}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      repair.estado === 'Listo_Para_Retirar'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-100 text-[#E03C31]'
                    }`}>
                      {repair.estado === 'Listo_Para_Retirar' ? 'Reparado — Listo' : 'No Reparable'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-500">
                    <span><span className="font-medium text-slate-700">Tutor:</span> {repair.nombreTutor}</span>
                    <span><span className="font-medium text-slate-700">Modelo:</span> {repair.marcaModelo}</span>
                    <span><span className="font-medium text-slate-700">Falla:</span> {repair.fallaReportada}</span>
                    <span><span className="font-medium text-slate-700">Depósito:</span> <span className="text-[#FF8200] font-semibold">{repair.ubicacionDepositoCodigo || 'No asignada'}</span></span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedRepair(repair); setFirmaEntregaBase64(null); }}
                  className="bg-[#FF8200] hover:bg-[#e07200] text-white font-medium px-5 py-2 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  Confirmar Entrega
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Entrega de Equipo</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Serie: {selectedRepair.numeroSerie}</p>
              </div>
              <button onClick={() => setSelectedRepair(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />Tutor</span>
                <span className="font-semibold text-slate-800">{selectedRepair.nombreTutor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Laptop className="w-3 h-3" />Dispositivo</span>
                <span className="font-medium text-slate-700">{selectedRepair.marcaModelo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />Depósito</span>
                <span className="font-semibold text-[#FF8200]">{selectedRepair.ubicacionDepositoCodigo || 'No asignada'}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 mb-0.5">Diagnóstico técnico</p>
                <p className="text-slate-700">{selectedRepair.diagnostico || 'Sin diagnóstico'}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <SignaturePad onChange={(base64) => setFirmaEntregaBase64(base64)} />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedRepair(null)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-xs border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleEntregar(selectedRepair.id, selectedRepair.numeroSerie)}
                disabled={loading || !firmaEntregaBase64}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entregar y Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
