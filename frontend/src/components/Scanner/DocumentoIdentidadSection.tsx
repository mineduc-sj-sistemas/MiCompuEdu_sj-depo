import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Eye, X, ShieldCheck, ScanLine, AlertCircle } from 'lucide-react';
import { parseDniScan } from '../../utils/dniParser';
import type { ScannedDniData } from '../../utils/dniParser';

interface DocumentoIdentidadSectionProps {
  titulo?: string;
  subtitulo?: string;
  label?: string;
  descripcion?: string;
  documentoBase64: string | null;
  onDocumentoChange: (base64: string | null) => void;
  onDniParsed?: (data: ScannedDniData) => void;
  documentoUrlActual?: string | null;
}

export const DocumentoIdentidadSection: React.FC<DocumentoIdentidadSectionProps> = ({
  titulo,
  subtitulo,
  label,
  descripcion,
  documentoBase64,
  onDocumentoChange,
  onDniParsed,
  documentoUrlActual = null
}) => {
  const displayTitle = label || titulo || 'Constancia Digital de Identidad (Escaneo de DNI)';
  const displaySubtitle = descripcion || subtitulo || 'Escanee el código de barras, fotografíe el DNI físico o suba un archivo para evitar imprimir acta de firma.';
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejo de lectura de código de barras USB
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarcodeInput(val);

    if (val.includes('@') && val.length > 20) {
      const parsed = parseDniScan(val);
      if (parsed) {
        if (onDniParsed) {
          onDniParsed(parsed);
        }
        setScanMessage(`✓ DNI Escaneado: ${parsed.nombre} ${parsed.apellido} (DNI ${parsed.dni})`);
        setBarcodeInput('');
        setTimeout(() => setScanMessage(''), 6000);
      }
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcodeInput.includes('@')) {
        const parsed = parseDniScan(barcodeInput);
        if (parsed) {
          if (onDniParsed) onDniParsed(parsed);
          setScanMessage(`✓ DNI Escaneado: ${parsed.nombre} ${parsed.apellido} (DNI ${parsed.dni})`);
          setBarcodeInput('');
          setTimeout(() => setScanMessage(''), 6000);
        }
      }
    }
  };

  // Manejo de la cámara web
  const startCamera = async () => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Error al iniciar cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Verifique los permisos del navegador o use la opción de subir archivo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onDocumentoChange(dataUrl);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Manejo de subida de archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Solo se permiten imágenes (JPG, PNG) o PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDocumentoChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeDoc = documentoBase64 || documentoUrlActual;

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#FF8200]" />
            {displayTitle}
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{displaySubtitle}</p>
        </div>
        {activeDoc && (
          <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            ✓ Documento Cargado
          </span>
        )}
      </div>

      {/* Escáner rápido de código de barras USB */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ScanLine className="w-3.5 h-3.5 text-[#FF8200]" />
            Pistola / Lector de Código de Barras (PDF417 de DNI)
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Autocompleta nombre y DNI</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
            placeholder="Pase el lector sobre el DNI aquí para autocompletar..."
            value={barcodeInput}
            onChange={handleBarcodeChange}
            onKeyDown={handleBarcodeKeyDown}
          />
        </div>
        {scanMessage && (
          <div className="p-1.5 rounded bg-green-50 border border-green-200 text-green-800 text-[11px] font-medium animate-fade-in flex items-center gap-1.5">
            {scanMessage}
          </div>
        )}
      </div>

      {/* Fotografía o Escaneo Físico del Documento */}
      <div className="space-y-2">
        {!activeDoc ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={startCamera}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm hover:border-slate-300"
            >
              <Camera className="w-4 h-4 text-[#FF8200]" />
              Tomar Foto con Cámara
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm hover:border-slate-300"
            >
              <Upload className="w-4 h-4 text-[#FF8200]" />
              Subir Escaneo / Imagen
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {activeDoc.startsWith('data:image') || activeDoc.startsWith('http') || activeDoc.startsWith('/') ? (
                <img
                  src={activeDoc}
                  alt="DNI Escaneado"
                  className="w-16 h-12 object-cover rounded border border-slate-200 cursor-pointer shadow-sm"
                  onClick={() => setIsPreviewModalOpen(true)}
                />
              ) : (
                <div className="w-16 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                  PDF / DOC
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-800">Copia de DNI Registrada</p>
                <p className="text-[10px] text-slate-500">Queda anexada como constancia digital de entrega.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Ver documento ampliado"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onDocumentoChange(null);
                }}
                className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                title="Eliminar y volver a capturar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Visor de Cámara */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#FF8200]" />
                Capturar Foto del DNI Físico
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-[#E03C31] text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {cameraError}
              </div>
            ) : (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Marco de encuadre para DNI */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-[#FF8200]/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Encuadre el DNI aquí
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2.5 bg-[#FF8200] hover:bg-[#e07200] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Tomar Foto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver imagen ampliada */}
      {isPreviewModalOpen && activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Vista de Documento de Identidad</h3>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-lg p-2">
              <img
                src={activeDoc}
                alt="Documento Ampliado"
                className="max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
