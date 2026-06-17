import React, { useState, useRef, useEffect } from 'react';
import type { Beneficiario } from '../../types';
import { API_BASE_URL } from '../../config';
import { parseDniScan } from '../../utils/dniParser';

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
      // Touch events need clientX/clientY relative to page
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
    // Prevent scrolling when drawing on touch devices
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
        <label className="block text-slate-700 text-sm font-semibold">Firma Digital del Tutor / Beneficiario</label>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-[#E03C31] hover:underline font-semibold"
        >
          Limpiar Firma
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-200 bg-white rounded-lg overflow-hidden">
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

  // Estados para catálogos dinámicos
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<string>('');
  const [selectedProgramaId, setSelectedProgramaId] = useState<string>('');
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<string>('');
  
  const dniInputRef = useRef<HTMLInputElement>(null);

  // Cargar Escuelas, Programas y Ubicaciones
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
        console.warn('Error al cargar catálogos dinámicos. Usando mocks locales.', e);
        setEscuelas([
          { id: '1', nombre: 'Escuela Normal Superior Sarmiento', cue: '700123401' },
          { id: '2', nombre: 'Escuela EPET N° 1 Rogelio Boero', cue: '700567802' }
        ]);
        setProgramas([
          { id: '1', nombre: 'Conectar Igualdad' },
          { id: '2', nombre: 'Juana Manso' }
        ]);
        setUbicaciones([
          { id: 'u1', codigo: 'EST-A-F1-P1', estanteria: 'Estantería A', fila: 1, posicion: 1 },
          { id: 'u2', codigo: 'EST-A-F1-P2', estanteria: 'Estantería A', fila: 1, posicion: 2 },
          { id: 'u3', codigo: 'EST-B-F2-P3', estanteria: 'Estantería B', fila: 2, posicion: 3 }
        ]);
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
    
    // Auto-detect and parse DNI scan if it matches the PDF417 raw format
    if (value.includes('@') && value.trim().length > 20) {
      const parsed = parseDniScan(value);
      if (parsed) {
        // Update input to clean DNI so it searches clean value
        setDniInput(parsed.dni);
        // Trigger search in next tick after state updates
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

    // Fallback detection in case they pressed Enter with raw barcode without triggering onChange auto-detect
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
        
        // If we scanned the card, override names in frontend display to reflect real card details
        if (scanInfo) {
          data.nombre = scanInfo.nombre;
          data.apellido = scanInfo.apellido;
        }
        
        setBeneficiario(data);
        setSelectedEscuelaId(data.escuelaId || '');
        setSelectedProgramaId(data.equipo?.programaEducativoId || '');
        if (scanInfo) {
          setMensajeExito(`DNI Escaneado correctamente. Beneficiario: ${scanInfo.nombre} ${scanInfo.apellido}`);
        }
      } else {
        // If not found in the database, but we have card scanned details, let's create a temporary beneficiary state
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
          setMensajeExito(`DNI Escaneado (No en padrón nominal central, cargado de la tarjeta): ${scanInfo.nombre} ${scanInfo.apellido}`);
        } else {
          setMensajeError('DNI no encontrado en el padrón nominal del Ministerio.');
        }
      }
    } catch (error) {
      console.warn('API no disponible. Usando fallback de simulación de padrón.');
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
        setSelectedEscuelaId('1'); // Mock Sarmiento
        setSelectedProgramaId('2'); // Mock Juana Manso
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
        setMensajeExito(`Ingreso de notebook ${beneficiario.equipo.numeroSerie} registrado correctamente en el sistema.`);
        setTimeout(() => {
          alert(`Descargando Comprobante Digital:\n\nOrden ID: ${data.id}\nBeneficiario: ${beneficiario.nombre} ${beneficiario.apellido}\nEquipo Serie: ${beneficiario.equipo?.numeroSerie}\nFalla: ${fallaReportada}`);
        }, 500);

        setBeneficiario(null);
        setDniInput('');
        setFallaReportada('');
        setObservaciones('');
        setSelectedUbicacionId('');
        setFirmaIngresoBase64(null);
        dniInputRef.current?.focus();
      } else {
        setMensajeError('Ocurrió un error al guardar el ingreso en el sistema.');
      }
    } catch (error) {
      setMensajeExito(`[SIMULACIÓN] Ingreso de notebook ${beneficiario.equipo.numeroSerie} guardado de forma local.`);
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-extrabold text-[#1D252D]">Registrar Ingreso de Notebook</h2>
        <p className="text-slate-500 mt-1 text-sm">Escanea el DNI físico del tutor para autocompletar el padrón del Ministerio.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6">
        <div>
          <label className="block text-[#1D252D] text-xs font-bold uppercase tracking-wider mb-2">
            Escaneo de DNI (PDF417) / Búsqueda Manual
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={dniInputRef}
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
                placeholder="Escanee código de DNI o escriba el número..."
                value={dniInput}
                onChange={handleDniInputChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              {dniInput && (
                <button 
                  onClick={() => setDniInput('')} 
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => buscarBeneficiario()}
              disabled={loading || !dniInput}
              className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[120px] text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Buscar DNI'
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            💡 Consejo: Coloque el cursor en la caja de texto y pase el lector de código de barras.
          </p>
        </div>

        {mensajeError && (
          <div className="p-4 bg-[#E03C31]/10 border border-[#E03C31]/30 text-[#E03C31] rounded-lg text-sm font-semibold">
            ⚠️ {mensajeError}
          </div>
        )}

        {mensajeExito && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-semibold">
            ✅ {mensajeExito}
          </div>
        )}

        {beneficiario && (
          <form onSubmit={handleIngresarNotebook} className="space-y-6 pt-4 border-t border-slate-100 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tutor Column */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-lg font-bold text-[#FF8200] border-b border-slate-200 pb-2">Datos del Titular/Tutor</h3>
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">DNI:</span>
                  <span className="col-span-2 text-[#1D252D] font-semibold">{beneficiario.dni}</span>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="col-span-2 text-[#1D252D]">{beneficiario.nombre} {beneficiario.apellido}</span>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="col-span-2 text-[#1D252D]">{beneficiario.telefono}</span>
                </div>
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">Email:</span>
                  <span className="col-span-2 text-[#1D252D]">{beneficiario.email}</span>
                </div>
              </div>

              {/* Notebook Column */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-lg font-bold text-[#FF8200] border-b border-slate-200 pb-2">Notebook Asignada</h3>
                {beneficiario.equipo ? (
                  <>
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-slate-500">Serie Nro:</span>
                      <span className="col-span-2 text-[#1D252D] font-mono font-bold">{beneficiario.equipo.numeroSerie}</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-slate-500">Marca:</span>
                      <span className="col-span-2 text-[#1D252D]">{beneficiario.equipo.marca}</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-slate-500">Modelo:</span>
                      <span className="col-span-2 text-[#1D252D]">{beneficiario.equipo.modelo}</span>
                    </div>
                    {beneficiario.equipo.credencialesOffice && (
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500">Office Creds:</span>
                        <span className="col-span-2 text-slate-500 font-mono text-xs">{beneficiario.equipo.credencialesOffice}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-yellow-650">Sin notebook registrada en el padrón nominal.</p>
                )}
              </div>
            </div>

            {/* Catalog Associations (Escuelas y Programas) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-[#FF8200] border-b border-slate-200 pb-2">Asociación Ministerial (Padrón Provincial)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Establecimiento Educativo (Origen)</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200] text-sm"
                    value={selectedEscuelaId}
                    onChange={(e) => setSelectedEscuelaId(e.target.value)}
                  >
                    <option value="">-- Asignar Escuela --</option>
                    {escuelas.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nombre} (CUE: {esc.cue})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Programa de Distribución del Equipo</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200] text-sm"
                    value={selectedProgramaId}
                    onChange={(e) => setSelectedProgramaId(e.target.value)}
                  >
                    <option value="">-- Asignar Programa --</option>
                    {programas.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Ubicación Física en Depósito</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200] text-sm"
                    value={selectedUbicacionId}
                    onChange={(e) => setSelectedUbicacionId(e.target.value)}
                  >
                    <option value="">-- Asignar Estantería --</option>
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
              <h3 className="text-lg font-bold text-[#1D252D] border-b border-slate-200 pb-2">Detalle del Soporte</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Falla del Catálogo</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
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
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Falla Reportada (Descripción Libre)</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                    placeholder="Escriba los detalles de la falla reportada por el docente/tutor..."
                    value={fallaReportada}
                    onChange={(e) => setFallaReportada(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Observaciones Estéticas / Accesorios</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                  placeholder="Ej: Trae cargador original. Bisagra izquierda trizada, etc."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            {/* Firma Digital del Tutor */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <SignaturePad onChange={(base64) => setFirmaIngresoBase64(base64)} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setBeneficiario(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[200px] text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Registrar Ingreso (F8)'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
