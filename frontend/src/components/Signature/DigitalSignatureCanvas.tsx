import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, Check } from 'lucide-react';

interface DigitalSignatureCanvasProps {
  onSignatureChange: (base64: string | null) => void;
  label?: string;
  title?: string;
  subtitle?: string;
  initialSignature?: string | null;
}

export const DigitalSignatureCanvas: React.FC<DigitalSignatureCanvasProps> = ({
  onSignatureChange,
  label,
  title,
  subtitle,
  initialSignature = null
}) => {
  const displayLabel = title || label || 'Firma Digital de Conformidad (En Pantalla)';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (initialSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
        };
        img.src = initialSignature;
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [initialSignature]);

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
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-[#FF8200]" />
          {displayLabel}
        </label>
        <div className="flex items-center gap-2">
          {hasSignature ? (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Firma lista
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Opcional si se adjunta foto de DNI
            </span>
          )}
          {hasSignature && (
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[11px] text-slate-400 hover:text-red-500 font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Borrar firma"
            >
              <Trash2 className="w-3 h-3" /> Borrar
            </button>
          )}
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden h-60 touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none relative z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Baseline signature guide */}
        <div className="absolute bottom-7 left-8 right-8 border-b-2 border-dashed border-slate-300 pointer-events-none z-0 flex justify-between items-center text-xs text-slate-400 font-medium select-none">
          <span>✕ Firma de conformidad</span>
          <span className="text-[11px] text-slate-400">Espacio amplio para firmar</span>
        </div>
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs select-none gap-2 z-0 pb-6">
            <PenTool className="w-7 h-7 text-slate-300" />
            <span className="font-medium">Firme aquí en pantalla con el dedo o mouse</span>
            <span className="text-[11px] text-slate-400">Área ampliada para firma táctil</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        {subtitle || 'Esta firma digital queda archivada en el sistema como constancia oficial sin necesidad de imprimir papel.'}
      </p>
    </div>
  );
};
