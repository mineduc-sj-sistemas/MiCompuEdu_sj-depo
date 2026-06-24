import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const FirmaRemota: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const reparacionId = params.get('id') || '';
  const secureToken = params.get('token') || '';
  const tipoFirma = params.get('tipo') || 'Ingreso';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCtx = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#1d252d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    setupCtx();
    window.addEventListener('resize', setupCtx);
    return () => window.removeEventListener('resize', setupCtx);
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
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
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
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
    if (canvas.toDataURL() === blank.toDataURL()) { setFirmaBase64(null); return; }
    setFirmaBase64(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaBase64(null);
  };

  const handleEnviarFirma = async () => {
    if (!firmaBase64) { setError('Por favor dibuje su firma antes de enviar.'); return; }
    if (!reparacionId || !secureToken) { setError('Enlace inválido. Falta ID o token de seguridad.'); return; }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/FirmaRemota/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reparacionId, token: secureToken, firmaBase64, tipoFirma })
      });
      if (response.ok) {
        setSuccess(true);
      } else {
        setError((await response.text()) || 'Error al guardar la firma.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full space-y-6">
          <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">¡Firma Enviada!</h2>
            <p className="text-slate-400 text-sm mt-2">
              La firma de {tipoFirma.toLowerCase()} fue recibida correctamente por el operador en el depósito.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-left space-y-1">
            <p><span className="font-medium text-slate-700">Tipo:</span> Acta de {tipoFirma}</p>
            <p><span className="font-medium text-slate-700">Estado:</span> Completado</p>
          </div>
          <p className="text-[10px] text-slate-400">Puede cerrar esta ventana en su navegador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 px-6 py-4 text-center">
        <h1 className="text-base font-bold text-[#FF8200]">MiCompuEdu</h1>
        <p className="text-[10px] text-slate-400">Ministerio de Educación · San Juan</p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col justify-center p-6 max-w-sm w-full mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Firma de Conformidad</h2>
          <p className="text-xs text-slate-400 mt-1">
            Dibuje su firma en el recuadro para confirmar el acta de <strong>{tipoFirma.toLowerCase()}</strong>.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold">Espacio para firmar</span>
            <button
              onClick={clearCanvas}
              className="text-xs text-slate-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden h-[200px] bg-slate-50">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            {firmaBase64 ? '✓ Firma capturada — puede editarla o enviarla.' : 'Toque y arrastre para dibujar su firma.'}
          </p>
        </div>

        <button
          onClick={handleEnviarFirma}
          disabled={loading || !firmaBase64}
          className="w-full bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center text-sm cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Firma Digital'}
        </button>
      </main>

      <footer className="text-center py-4 text-[10px] text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} Gobierno de San Juan · Conexión segura.
      </footer>
    </div>
  );
};
