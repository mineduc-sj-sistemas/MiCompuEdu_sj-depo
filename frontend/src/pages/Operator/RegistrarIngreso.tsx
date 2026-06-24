import React, { useState, useRef, useEffect } from 'react';
import type { Beneficiario } from '../../types';
import { API_BASE_URL } from '../../config';
import { parseDniScan } from '../../utils/dniParser';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Laptop, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Loader2, 
  FileText
} from 'lucide-react';

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
        <label className="block text-slate-700 text-xs font-semibold">Firma Digital del Tutor / Beneficiario</label>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpiar Firma
        </button>
      </div>
      <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
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

interface RegistrarIngresoProps {
  token: string;
}

export const RegistrarIngreso: React.FC<RegistrarIngresoProps> = ({ token }) => {
  const [dniInput, setDniInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [fallaReportada, setFallaReportada] = useState('');
  const [fallaCatalogoId, setFallaCatalogoId] = useState<number>(1);
  const [observaciones, setObservaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [firmaIngresoBase64, setFirmaIngresoBase64] = useState<string | null>(null);

  // Catálogos
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<string>('');
  const [selectedProgramaId, setSelectedProgramaId] = useState<string>('');
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<string>('');
  
  const dniInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resEscuelas = await fetch(`${API_BASE_URL}/Escuelas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resEscuelas.ok) {
          setEscuelas(await resEscuelas.json());
        }
        
        const resProgramas = await fetch(`${API_BASE_URL}/Programas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resProgramas.ok) {
          setProgramas(await resProgramas.json());
        }

        const resUbicaciones = await fetch(`${API_BASE_URL}/Ubicaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resUbicaciones.ok) {
          setUbicaciones(await resUbicaciones.json());
        }
      } catch (e) {
        console.warn('Error crítico: backend no disponible.', e);
        setMensajeError('No se pudieron cargar los catálogos del sistema. Verifique la conexión con el servidor.');
      }
    };
    cargarCatalogos();
  }, [token]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarBeneficiario();
    }
  };

  const handleDniInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDniInput(value);
    
    if (value.includes('@') && value.trim().length > 20) {
      const parsed = parseDniScan(value);
      if (parsed) {
        setDniInput(parsed.dni);
        setTimeout(() => {
          buscarBeneficiario(parsed.dni, parsed);
        }, 50);
      }
    }
  };

  const buscarBeneficiario = async (overrideDni?: string, scannedData?: any) => {
    const rawInput = overrideDni || dniInput.trim();
    let cleanDni = rawInput;
    let scanInfo = scannedData;

    if (!scanInfo && cleanDni.includes('@')) {
      const parsed = parseDniScan(cleanDni);
      if (parsed) {
        cleanDni = parsed.dni;
        scanInfo = parsed;
        setDniInput(cleanDni);
      }
    }

    if (!cleanDni) return;
    setLoading(true);
    setMensajeError('');
    setMensajeExito('');
    setBeneficiario(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/Beneficiarios/${cleanDni}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data: Beneficiario = await response.json();
        
        if (scanInfo) {
          data.nombre = scanInfo.nombre;
          data.apellido = scanInfo.apellido;
        }
        
        setBeneficiario(data);
        setSelectedEscuelaId(data.escuelaId || '');
        setSelectedProgramaId(data.equipo?.programaEducativoId || '');
        if (scanInfo) {
          setMensajeExito(`DNI Escaneado: ${scanInfo.nombre} ${scanInfo.apellido}`);
        }
      } else {
        if (scanInfo) {
          setBeneficiario({
            id: 'mock-scanned-id',
            dni: scanInfo.dni,
            nombre: scanInfo.nombre,
            apellido: scanInfo.apellido,
            telefono: '+542644998877',
            email: `${scanInfo.nombre.toLowerCase().replace(/ /g, '')}@sanjuan.edu.ar`,
            equipo: {
              id: 'mock-equipo-id',
              numeroSerie: `S-EDU-${scanInfo.dni}-X`,
              marca: 'Exo',
              modelo: 'Juana Manso v2',
              credencialesOffice: `${scanInfo.nombre.toLowerCase().replace(/ /g, '')}.${scanInfo.dni} / passOffice2026`
            }
          });
          setSelectedEscuelaId('');
          setSelectedProgramaId('');
          setMensajeExito(`DNI Escaneado (Carga temporal de la tarjeta): ${scanInfo.nombre} ${scanInfo.apellido}`);
        } else {
          setMensajeError('DNI no encontrado en el padrón nominal del Ministerio.');
        }
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación.');
      const scanOrManual = scanInfo || (cleanDni.length >= 7 && cleanDni.length <= 9 ? { dni: cleanDni, nombre: 'Ana María', apellido: 'González' } : null);
      
      if (scanOrManual) {
        setBeneficiario({
          id: 'mock-beneficiario-id',
          dni: scanOrManual.dni,
          nombre: scanOrManual.nombre,
          apellido: scanOrManual.apellido,
          telefono: '+542644998877',
          email: 'anamaria@sanjuan.edu.ar',
          equipo: {
            id: 'mock-equipo-id',
            numeroSerie: `S-EDU-${scanOrManual.dni}-X`,
            marca: 'BGH',
            modelo: 'Conectar Igualdad v3',
            credencialesOffice: `${scanOrManual.nombre.toLowerCase().replace(/ /g, '')}.${scanOrManual.dni} / passOffice2026`
          }
        });
        setSelectedEscuelaId('1');
        setSelectedProgramaId('2');
        if (scanInfo) {
          setMensajeExito(`[SIMULACIÓN] DNI escaneado: ${scanInfo.nombre} ${scanInfo.apellido}`);
        }
      } else {
        setMensajeError('Formato de DNI inválido (debe contener 7 u 8 dígitos).');
      }
    }
    setLoading(false);
  };

  const handleIngresarNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiario || !beneficiario.equipo) return;

    setLoading(true);
    setMensajeError('');

    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          equipoId: beneficiario.equipo.id,
          fallaReportada,
          fallaCatalogoId,
          observaciones,
          escuelaId: selectedEscuelaId || null,
          programaEducativoId: selectedProgramaId || null,
          ubicacionDepositoId: selectedUbicacionId || null,
          firmaIngresoBase64: firmaIngresoBase64 || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMensajeExito(`Ingreso de notebook ${beneficiario.equipo.numeroSerie} registrado.`);
        setTimeout(() => {
          alert(`Descargando Comprobante Digital:\n\nOrden ID: ${data.id}\nBeneficiario: ${beneficiario.nombre} ${beneficiario.apellido}\nEquipo Serie: ${beneficiario.equipo?.numeroSerie}`);
        }, 500);

        setBeneficiario(null);
        setDniInput('');
        setFallaReportada('');
        setObservaciones('');
        setSelectedUbicacionId('');
        setFirmaIngresoBase64(null);
        dniInputRef.current?.focus();
      } else {
        setMensajeError('Error al guardar el ingreso en el sistema.');
      }
    } catch (error) {
      setMensajeExito(`[SIMULACIÓN] Ingreso de notebook ${beneficiario.equipo.numeroSerie} registrado.`);
      setBeneficiario(null);
      setDniInput('');
      setFallaReportada('');
      setObservaciones('');
      setSelectedUbicacionId('');
      setFirmaIngresoBase64(null);
      dniInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dniInputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Ingreso de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca o escanea el DNI físico del tutor para registrar una orden de servicio.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-slate-700 text-xs font-semibold mb-2">
            Escaneo de DNI (PDF417) / Búsqueda Manual
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={dniInputRef}
                type="text"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#FF8200] transition-colors"
                placeholder="Escanee código de DNI o escriba el número..."
                value={dniInput}
                onChange={handleDniInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              {dniInput && (
                <button 
                  onClick={() => setDniInput('')} 
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => buscarBeneficiario()}
              disabled={loading || !dniInput}
              className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium px-5 py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Tip: Coloca el cursor en el campo de texto y lee el código de barras del DNI.
          </p>
        </div>

        {mensajeError && (
          <div className="p-3 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {mensajeExito}
          </div>
        )}

        {beneficiario && (
          <form onSubmit={handleIngresarNotebook} className="space-y-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tutor Column */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                  <User className="w-4.5 h-4.5" />
                  <h3 className="text-sm font-semibold text-slate-800">Titular / Tutor</h3>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DNI</span>
                    <span className="font-medium text-slate-900">{beneficiario.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nombre</span>
                    <span className="font-medium text-slate-900">{beneficiario.nombre} {beneficiario.apellido}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teléfono</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{beneficiario.telefono}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{beneficiario.email}</span>
                  </div>
                </div>
              </div>

              {/* Notebook Column */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                  <Laptop className="w-4.5 h-4.5" />
                  <h3 className="text-sm font-semibold text-slate-800">Equipo Asignado</h3>
                </div>
                {beneficiario.equipo ? (
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nro Serie</span>
                      <span className="font-mono font-bold text-slate-900">{beneficiario.equipo.numeroSerie}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Marca</span>
                      <span className="font-medium text-slate-900">{beneficiario.equipo.marca}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modelo</span>
                      <span className="font-medium text-slate-900">{beneficiario.equipo.modelo}</span>
                    </div>
                    {beneficiario.equipo.credencialesOffice && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Office</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">{beneficiario.equipo.credencialesOffice}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-yellow-600">Sin notebook registrada en el padrón.</p>
                )}
              </div>
            </div>

            {/* Catalog Associations (Escuelas y Programas) */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                <FileText className="w-4.5 h-4.5" />
                <h3 className="text-sm font-semibold text-slate-800">Ubicación y Distribución</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Escuela</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={selectedEscuelaId}
                    onChange={(e) => setSelectedEscuelaId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Escuela --</option>
                    {escuelas.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nombre} (CUE: {esc.cue})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Programa</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={selectedProgramaId}
                    onChange={(e) => setSelectedProgramaId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Programa --</option>
                    {programas.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Ubicación Depósito</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={selectedUbicacionId}
                    onChange={(e) => setSelectedUbicacionId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Estantería --</option>
                    {ubicaciones.map((ub) => (
                      <option key={ub.id} value={ub.id}>
                        {ub.codigo} ({ub.estanteria} - Fila {ub.fila})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Falla Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Detalles del Soporte</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Falla Común</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={fallaCatalogoId}
                    onChange={(e) => setFallaCatalogoId(Number(e.target.value))}
                  >
                    <option value={1}>No Enciende</option>
                    <option value={2}>Pantalla Rota / Sin Imagen</option>
                    <option value={3}>Bloqueo de Seguridad Juana Manso</option>
                    <option value={4}>Falla de Teclado</option>
                    <option value={5}>Problemas de Sistema Operativo</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Descripción de Falla</label>
                  <textarea
                    required
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    placeholder="Escriba los detalles de la falla reportada..."
                    value={fallaReportada}
                    onChange={(e) => setFallaReportada(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">Observaciones Estéticas / Accesorios</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                  placeholder="Ej: Trae cargador original. Tapa rayada."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            {/* Signature */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <SignaturePad onChange={(base64) => setFirmaIngresoBase64(base64)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBeneficiario(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[150px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Registrar Ingreso'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
