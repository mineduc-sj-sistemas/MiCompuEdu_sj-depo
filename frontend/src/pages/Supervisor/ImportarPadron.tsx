import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { LogoSanJuan } from '../../components/Shared/LogoSanJuan';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  School, 
  Users, 
  Laptop, 
  RefreshCw, 
  FileText 
} from 'lucide-react';

interface ImportarPadronProps {
  token: string;
}

interface ImportResult {
  totalFilas: number;
  escuelasCreadas: number;
  escuelasExistentes: number;
  beneficiariosCreados: number;
  beneficiariosActualizados: number;
  equiposCreados: number;
  equiposActualizados: number;
  errores: number;
  detallesErrores: string[];
}

export const ImportarPadron: React.FC<ImportarPadronProps> = ({ token }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setErrorMessage('Formato de archivo no válido. Solo se admiten archivos de Excel (.xlsx, .xls)');
      setFile(null);
      setResult(null);
      return;
    }
    setFile(selectedFile);
    setErrorMessage(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const response = await fetch(`${API_BASE_URL}/Importacion/padron`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Error en la importación');
      }

      const resData = await response.json();
      setResult(resData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error inesperado al procesar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!result || result.detallesErrores.length === 0) return;
    const element = document.createElement("a");
    const fileContent = result.detallesErrores.join("\n");
    const file = new Blob([fileContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `errores_importacion_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <LogoSanJuan className="max-w-[280px]" showMinistry={false} />
          <div className="border-l border-slate-200 pl-4">
            <h2 className="text-xl font-bold text-slate-900">Importación Masiva de Padrón</h2>
            <p className="text-slate-400 text-xs mt-0.5">Sube el archivo Excel de netbooks entregadas para poblar el sistema.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Pane */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#FF8200]" />
              Archivo de Netbooks
            </h3>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={file ? undefined : triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                dragActive 
                  ? 'border-[#FF8200] bg-orange-50/50' 
                  : file 
                    ? 'border-green-300 bg-green-50/10 cursor-default' 
                    : 'border-slate-300 hover:border-[#FF8200] hover:bg-slate-50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleChange}
              />

              {file ? (
                <div className="space-y-4 w-full max-w-md">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800 truncate max-w-[280px]">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="bg-[#FF8200] hover:bg-[#E07300] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Comenzar Importación
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearFile}
                      disabled={loading}
                      className="bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-600 font-semibold px-5 py-2 rounded-lg transition-colors text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Arrastra tu planilla aquí o <span className="text-[#FF8200] underline">haz clic para buscar</span></p>
                    <p className="text-xs text-slate-400 mt-1">Soporta formatos .xlsx y .xls de Excel</p>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#E03C31] shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">Error de validación</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Resultados del Procesamiento
                </h3>
                <span className="text-xs text-slate-400 font-medium font-mono">Filas procesadas: {result.totalFilas}</span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <School className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Escuelas</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                      {result.escuelasCreadas + result.escuelasExistentes}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Nuevas: {result.escuelasCreadas}</span>
                      <span>Existentes: {result.escuelasExistentes}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Beneficiarios</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                      {result.beneficiariosCreados + result.beneficiariosActualizados}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Creados: {result.beneficiariosCreados}</span>
                      <span>Actualizados: {result.beneficiariosActualizados}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <Laptop className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Netbooks</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                      {result.equiposCreados + result.equiposActualizados}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Creadas: {result.equiposCreados}</span>
                      <span>Actualizadas: {result.equiposActualizados}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${result.errores > 0 ? 'text-[#FF8200]' : 'text-slate-400'}`} />
                    Inconsistencias y Errores ({result.errores})
                  </p>
                  {result.errores > 0 && (
                    <button
                      onClick={handleDownloadErrors}
                      className="text-[#FF8200] hover:text-[#E07300] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Reporte
                    </button>
                  )}
                </div>

                {result.detallesErrores.length > 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg max-h-[180px] overflow-y-auto p-3 space-y-1.5 font-mono text-[10px] text-slate-600">
                    {result.detallesErrores.map((err, i) => (
                      <div key={i} className="py-1 border-b border-slate-50 last:border-0 flex items-start gap-2">
                        <span className="text-[#E03C31] shrink-0 font-bold">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-2 italic text-center">¡No se detectaron inconsistencias! Todos los registros se importaron limpiamente.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions Pane */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-[#FF8200]" />
              Formato Requerido
            </h3>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              El sistema procesa automáticamente las columnas en el orden del reporte de entregas.
              Asegúrate de que el Excel contenga las siguientes columnas clave:
            </p>

            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columna 2 (B)</span>
                <span className="font-mono text-slate-400">Código Netbook (Serie)</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columna 3 (C)</span>
                <span className="font-mono text-slate-400">DNI Alumno</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columna 4 (D)</span>
                <span className="font-mono text-slate-400">Nombre Completo</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columna 5 (E)</span>
                <span className="font-mono text-slate-400">DNI Tutor</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columna 9 (I)</span>
                <span className="font-mono text-slate-400">Nombre de Escuela</span>
              </li>
              <li className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="font-semibold text-slate-700">Columnas 14-15 (N-O)</span>
                <span className="font-mono text-slate-400">Usuario y Clave O365</span>
              </li>
            </ul>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-[#E07300] space-y-1.5">
              <p className="font-semibold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                Actualización Inteligente (UPSERT)
              </p>
              <p className="leading-relaxed">
                Si un DNI de alumno o código de netbook ya existe en el sistema, sus datos se actualizarán con los valores del Excel, evitando la duplicación de registros.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
