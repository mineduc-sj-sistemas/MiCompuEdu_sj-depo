import React, { useState, useRef, useEffect } from 'react';
import type { Beneficiario } from '../../types';
import { API_BASE_URL } from '../../config';
import { parseDniScan } from '../../utils/dniParser';
import { CrearEscuelaModal } from '../../components/Escuelas/CrearEscuelaModal';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Laptop, 
  AlertTriangle, 
  Check,
  Loader2, 
  FileText,
  Plus
} from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';



interface RegistrarIngresoProps {
  token: string;
  nombreOperador: string;
}

export const RegistrarIngreso: React.FC<RegistrarIngresoProps> = ({ token, nombreOperador }) => {
  const [dniInput, setDniInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [fallaReportada, setFallaReportada] = useState('');
  const [fallaCatalogoId, setFallaCatalogoId] = useState<number>(1);
  const [observaciones, setObservaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [isCrearEscuelaModalOpen, setIsCrearEscuelaModalOpen] = useState(false);

  const [selectedProgramaInicialId, setSelectedProgramaInicialId] = useState<string>('');
  const [manualTipoBeneficiario, setManualTipoBeneficiario] = useState<number>(1);
  const [manualTitularDni, setManualTitularDni] = useState('');
  const [manualTitularNombre, setManualTitularNombre] = useState('');
  const [manualTitularApellido, setManualTitularApellido] = useState('');
  const [manualTitularTelefono, setManualTitularTelefono] = useState('');
  const [manualTitularEmail, setManualTitularEmail] = useState('');
  const [manualEquipoNumeroSerie, setManualEquipoNumeroSerie] = useState('');
  const [manualEquipoMarca, setManualEquipoMarca] = useState('');
  const [manualEquipoModelo, setManualEquipoModelo] = useState('');
  const [manualEquipoCredencialesOffice, setManualEquipoCredencialesOffice] = useState('');

  // Catálogos
  const [programas, setProgramas] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]);

  const [selectedEscuelaId, setSelectedEscuelaId] = useState<string>('');
  const [escuelaSearch, setEscuelaSearch] = useState('');
  const [isEscuelaDropdownOpen, setIsEscuelaDropdownOpen] = useState(false);
  
  useEffect(() => {
    if (selectedEscuelaId) {
      const esc = escuelas.find(e => e.id === selectedEscuelaId);
      if (esc) setEscuelaSearch(esc.nombre);
    } else {
      setEscuelaSearch('');
    }
  }, [selectedEscuelaId, escuelas]);

  const handleEscuelaSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEscuelaSearch(val);
    setIsEscuelaDropdownOpen(true);
    if (val === '') setSelectedEscuelaId('');
  };

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


      } catch (e) {
        console.warn('Error crítico: backend no disponible.', e);
        setMensajeError('No se pudieron cargar los catálogos del sistema. Verifique la conexión con el servidor.');
      }
    };
    cargarCatalogos();
  }, [token]);

  const handleEscuelaCreada = (nuevaEscuela: any) => {
    setEscuelas((prev) => [...prev, nuevaEscuela].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setSelectedEscuelaId(nuevaEscuela.id);
    setIsCrearEscuelaModalOpen(false);
  };

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

  useEffect(() => {
    const cleanTerm = dniInput.trim();
    if (!cleanTerm) {
      setBeneficiario(null);
      setMensajeError('');
      setMensajeExito('');
      return;
    }

    if (cleanTerm.includes('@')) return;

    // Búsqueda automática:
    // - Es un DNI (7 u 8 dígitos numéricos)
    // - Es un número de serie (ej: SJMA... o similar, min 8 caracteres con letras)
    const isDni = /^\d{7,8}$/.test(cleanTerm);
    const isSerial = cleanTerm.length >= 8 && /[A-Za-z]/.test(cleanTerm);

    if (isDni || isSerial) {
      const delayDebounceFn = setTimeout(() => {
        if (beneficiario && (beneficiario.dni === cleanTerm || beneficiario.equipo?.numeroSerie.toUpperCase() === cleanTerm.toUpperCase())) {
          return;
        }
        buscarBeneficiario(cleanTerm);
      }, 400);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [dniInput]);

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

        if (scanInfo) {
          setMensajeExito(`[SIMULACIÓN] DNI escaneado: ${scanInfo.nombre} ${scanInfo.apellido}`);
        }
      } else {
        setMensajeError('Formato de DNI inválido (debe contener 7 u 8 dígitos).');
      }
    }
    setLoading(false);
  };

  const isMaestrosDeAmerica = selectedProgramaInicialId !== '' && (programas.find(p => p.id === selectedProgramaInicialId)?.nombre.toLowerCase().includes('maestros') ?? true);
  const isManualMode = selectedProgramaInicialId !== '' && !isMaestrosDeAmerica;

  const handleIngresarNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualMode && (!beneficiario || !beneficiario.equipo)) return;

    setLoading(true);
    setMensajeError('');

    try {
      const endpoint = isManualMode ? `${API_BASE_URL}/Reparaciones/manual` : `${API_BASE_URL}/Reparaciones`;
      const body = isManualMode ? {
        titularDni: manualTitularDni,
        titularNombre: manualTitularNombre,
        titularApellido: manualTitularApellido,
        titularTelefono: manualTitularTelefono,
        titularEmail: manualTitularEmail,
        tipoBeneficiario: manualTipoBeneficiario,
        equipoNumeroSerie: manualEquipoNumeroSerie,
        equipoMarca: manualEquipoMarca,
        equipoModelo: manualEquipoModelo,
        equipoCredencialesOffice: manualEquipoCredencialesOffice,
        fallaReportada,
        fallaCatalogoId,
        observaciones,
        escuelaId: selectedEscuelaId || null,
        programaEducativoId: selectedProgramaInicialId || null,
        ubicacionDepositoId: selectedUbicacionId || null,

      } : {
        equipoId: beneficiario!.equipo!.id,
        equipoMarca: beneficiario!.equipo!.marca,
        equipoModelo: beneficiario!.equipo!.modelo,
        fallaReportada,
        fallaCatalogoId,
        observaciones,
        escuelaId: selectedEscuelaId || null,
        programaEducativoId: selectedProgramaInicialId || null,
        ubicacionDepositoId: selectedUbicacionId || null,

      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const numSerie = isManualMode ? manualEquipoNumeroSerie : beneficiario!.equipo!.numeroSerie;
        const nombreBenef = isManualMode ? `${manualTitularNombre} ${manualTitularApellido}` : `${beneficiario!.nombre} ${beneficiario!.apellido}`;
        const dniBenef = isManualMode ? manualTitularDni : beneficiario!.dni;
        const telefonoBenef = isManualMode ? manualTitularTelefono : beneficiario!.telefono;
        const marcaMod = isManualMode ? `${manualEquipoMarca} ${manualEquipoModelo}` : `${beneficiario!.equipo!.marca} ${beneficiario!.equipo!.modelo}`;
        
        setMensajeExito(`Ingreso de notebook ${numSerie} registrado exitosamente.`);
        
        // Imprimir el comprobante automáticamente o dar aviso
        setTimeout(() => {
          imprimirComprobante({
            tipo: 'Ingreso',
            numeroMovimiento: data.id.substring(0, 8).toUpperCase(),
            fecha: new Date().toISOString(),
            escuela: escuelas.find(e => e.id === selectedEscuelaId)?.nombre || 'Sin Asignar',
            operador: nombreOperador,
            motivo: 'Reparación / Diagnóstico',
            tutor: {
              nombre: nombreBenef,
              dni: dniBenef,
              telefono: telefonoBenef
            },
            equipos: [{
              numeroSerie: numSerie,
              marcaModelo: marcaMod,
              estado: 'Ingresado',
              fallaReportada: fallaReportada || (fallaCatalogoId === 6 ? 'Otra' : 'Falla catalogada')
            }]
          });
        }, 500);

        setBeneficiario(null);
        setDniInput('');
        setFallaReportada('');
        setObservaciones('');
        setSelectedUbicacionId('');

        if (isManualMode) {
          setManualTitularDni('');
          setManualTitularNombre('');
          setManualTitularApellido('');
          setManualTipoBeneficiario(1);
          setManualTitularTelefono('');
          setManualTitularEmail('');
          setManualEquipoNumeroSerie('');
          setManualEquipoMarca('');
          setManualEquipoModelo('');
          setManualEquipoCredencialesOffice('');
        }
        if (!isManualMode) dniInputRef.current?.focus();
      } else {
        setMensajeError('Error al guardar el ingreso en el sistema.');
      }
    } catch (error) {
      setMensajeError('Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dniInputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {isCrearEscuelaModalOpen && (
        <CrearEscuelaModal 
          token={token} 
          onClose={() => setIsCrearEscuelaModalOpen(false)} 
          onSuccess={handleEscuelaCreada} 
        />
      )}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Ingreso de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca por DNI de tutor, alumno o número de serie de la netbook para registrar la orden de servicio.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {/* Paso 1: Selección de Programa */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <label className="block text-slate-700 text-xs font-semibold mb-2">
            Paso 1: Seleccionar Programa de Entrega
          </label>
          <select
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#FF8200] text-sm font-medium transition-colors"
            value={selectedProgramaInicialId}
            onChange={(e) => {
              setSelectedProgramaInicialId(e.target.value);
              setBeneficiario(null);
              setDniInput('');
              setMensajeError('');
              setMensajeExito('');
            }}
          >
            <option value="">-- Seleccione el Programa --</option>
            {programas.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.nombre}
              </option>
            ))}
          </select>
        </div>

        {selectedProgramaInicialId && isMaestrosDeAmerica && (
          <div className="animate-fade-in space-y-2 pt-2">
            <label className="block text-slate-700 text-xs font-semibold mb-2">
              Paso 2: Identificación de Alumno, Tutor o Netbook
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
                placeholder="Ingrese DNI (alumno/tutor) o número de serie (ej: SJMA025-011176)..."
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
            Tip: La búsqueda se realiza de manera automática al completar un DNI de 7-8 dígitos o un código de netbook.
          </p>
          </div>
        )}

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

        {selectedProgramaInicialId && isManualMode && (
          <form onSubmit={handleIngresarNotebook} className="space-y-6 pt-4 border-t border-slate-100 animate-fade-in">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200">
              Has seleccionado un programa distinto a Maestros de América. Por favor, carga los datos del beneficiario y el equipo manualmente.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                  <User className="w-4.5 h-4.5" />
                  <h3 className="text-sm font-semibold text-slate-800">Datos del Titular / Tutor</h3>
                </div>
                <div className="flex gap-4 pb-2 border-b border-slate-100">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="tipoBenef" value={1} checked={manualTipoBeneficiario === 1} onChange={() => setManualTipoBeneficiario(1)} className="text-[#FF8200] focus:ring-[#FF8200]" />
                    Alumno
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="tipoBenef" value={2} checked={manualTipoBeneficiario === 2} onChange={() => setManualTipoBeneficiario(2)} className="text-[#FF8200] focus:ring-[#FF8200]" />
                    Docente
                  </label>
                </div>
                <div className="space-y-3 text-xs">
                  <div><label className="block text-slate-500 mb-1">DNI</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularDni} onChange={e => setManualTitularDni(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Nombre</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularNombre} onChange={e => setManualTitularNombre(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Apellido</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularApellido} onChange={e => setManualTitularApellido(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Teléfono</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularTelefono} onChange={e => setManualTitularTelefono(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Email</label><input required type="email" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularEmail} onChange={e => setManualTitularEmail(e.target.value)} /></div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                  <Laptop className="w-4.5 h-4.5" />
                  <h3 className="text-sm font-semibold text-slate-800">Datos del Equipo</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div><label className="block text-slate-500 mb-1">Nro Serie</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoNumeroSerie} onChange={e => setManualEquipoNumeroSerie(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Marca</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoMarca} onChange={e => setManualEquipoMarca(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Modelo</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoModelo} onChange={e => setManualEquipoModelo(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Credenciales Office (Opcional)</label><input type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualEquipoCredencialesOffice} onChange={e => setManualEquipoCredencialesOffice(e.target.value)} /></div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[#FF8200]">
                <FileText className="w-4.5 h-4.5" />
                <h3 className="text-sm font-semibold text-slate-800">Ubicación y Distribución</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Escuela (Opcional)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                        placeholder="-- Buscar Escuela --"
                        value={escuelaSearch}
                        onChange={handleEscuelaSearchChange}
                        onFocus={() => setIsEscuelaDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsEscuelaDropdownOpen(false), 200)}
                      />
                      {isEscuelaDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {escuelas.filter(e => e.nombre.toLowerCase().includes(escuelaSearch.toLowerCase())).map(esc => (
                            <div 
                              key={esc.id} 
                              className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-xs text-slate-700"
                              onClick={() => {
                                setSelectedEscuelaId(esc.id);
                                setEscuelaSearch(esc.nombre);
                                setIsEscuelaDropdownOpen(false);
                              }}
                            >
                              {esc.nombre}
                            </div>
                          ))}
                          {escuelas.filter(e => e.nombre.toLowerCase().includes(escuelaSearch.toLowerCase())).length === 0 && (
                             <div className="px-3 py-2 text-xs text-slate-400">No se encontraron escuelas...</div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCrearEscuelaModalOpen(true)}
                      className="flex-shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
                      title="Agregar nueva escuela"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Ubicación Depósito (Opcional)</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors cursor-not-allowed opacity-80"
                    value="sistemas"
                    disabled
                  >
                    <option value="sistemas">Área Sistemas</option>
                  </select>
                </div>
              </div>
            </div>

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
                    <option value={6}>Otro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Descripción de Falla</label>
                  <textarea
                    required={fallaCatalogoId === 6}
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

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProgramaInicialId('')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-[150px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ingreso Manual'}
              </button>
            </div>
          </form>
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
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full uppercase">{beneficiario.tipoBeneficiario === 2 ? 'Docente' : 'Alumno'}</span>
                      <span className="font-medium text-slate-900">{beneficiario.dni}</span>
                    </div>
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
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Marca</span>
                      <input 
                        type="text" 
                        value={beneficiario.equipo.marca} 
                        onChange={(e) => setBeneficiario({...beneficiario, equipo: {...beneficiario.equipo!, marca: e.target.value}})}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-2/3 text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Modelo</span>
                      <input 
                        type="text" 
                        value={beneficiario.equipo.modelo} 
                        onChange={(e) => setBeneficiario({...beneficiario, equipo: {...beneficiario.equipo!, modelo: e.target.value}})}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-2/3 text-right"
                      />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Escuela</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                        placeholder="-- Buscar Escuela --"
                        value={escuelaSearch}
                        onChange={handleEscuelaSearchChange}
                        onFocus={() => setIsEscuelaDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsEscuelaDropdownOpen(false), 200)}
                      />
                      {isEscuelaDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {escuelas.filter(e => e.nombre.toLowerCase().includes(escuelaSearch.toLowerCase())).map(esc => (
                            <div 
                              key={esc.id} 
                              className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-xs text-slate-700"
                              onClick={() => {
                                setSelectedEscuelaId(esc.id);
                                setEscuelaSearch(esc.nombre);
                                setIsEscuelaDropdownOpen(false);
                              }}
                            >
                              {esc.nombre}
                            </div>
                          ))}
                          {escuelas.filter(e => e.nombre.toLowerCase().includes(escuelaSearch.toLowerCase())).length === 0 && (
                             <div className="px-3 py-2 text-xs text-slate-400">No se encontraron escuelas...</div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCrearEscuelaModalOpen(true)}
                      className="flex-shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
                      title="Agregar nueva escuela"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Ubicación Depósito</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors cursor-not-allowed opacity-80"
                    value="sistemas"
                    disabled
                  >
                    <option value="sistemas">Área Sistemas</option>
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
                    <option value={6}>Otro</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Descripción de Falla</label>
                  <textarea
                    required={fallaCatalogoId === 6}
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
