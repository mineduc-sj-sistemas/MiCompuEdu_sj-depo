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
  Plus,
  Printer,
  ShieldCheck,
  Info
} from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';
import { DigitalSignatureCanvas } from '../../components/Signature/DigitalSignatureCanvas';
import { DocumentoIdentidadSection } from '../../components/Scanner/DocumentoIdentidadSection';
import type { ScannedDniData } from '../../utils/dniParser';



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
  
  const [fechaIngreso, setFechaIngreso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [soloCargador, setSoloCargador] = useState(false);

  // Campos del tutor manual
  const [manualTutorNombre, setManualTutorNombre] = useState('');
  const [manualTutorDni, setManualTutorDni] = useState('');
  const [manualTutorTelefono, setManualTutorTelefono] = useState('');

  // Persona que entrega el equipo en depósito (Ingreso: solo Tutor o Tercero para alumnos)
  const [personaEntregaTipo, setPersonaEntregaTipo] = useState<'Tutor' | 'Tercero'>('Tutor');
  const [personaEntregaNombre, setPersonaEntregaNombre] = useState('');
  const [personaEntregaDni, setPersonaEntregaDni] = useState('');
  const [personaEntregaTelefono, setPersonaEntregaTelefono] = useState('');
  const [personaEntregaParentesco, setPersonaEntregaParentesco] = useState('Tutor Responsable');
  const [docIdentidadIngresoBase64, setDocIdentidadIngresoBase64] = useState<string | null>(null);
  const [firmaIngresoBase64, setFirmaIngresoBase64] = useState<string | null>(null);
  const [ultimoComprobante, setUltimoComprobante] = useState<any | null>(null);

  // Registro de nuevo equipo en modo nominal
  const [registrarNuevoEquipo, setRegistrarNuevoEquipo] = useState(false);
  const [customSerial, setCustomSerial] = useState('');
  const [customMarca, setCustomMarca] = useState('');
  const [customModelo, setCustomModelo] = useState('');
  const [customCredencialesOffice, setCustomCredencialesOffice] = useState('');

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

    if (!cleanDni.includes('@')) {
      cleanDni = cleanDni.replace(/[^\d]/g, '');
      if (cleanDni.length < 6 || cleanDni.length > 11) {
        return;
      }
    }

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
        const rawTipo = Number(data.tipoBeneficiario);
        data.tipoBeneficiario = (rawTipo === 2 || rawTipo === 3) ? rawTipo : 1;
        setBeneficiario(data);
        setSelectedEscuelaId(data.escuelaId || '');

        const isAlumno = data.tipoBeneficiario === 1;

        if (scanInfo) {
          setMensajeExito(`DNI Escaneado: ${scanInfo.nombre} ${scanInfo.apellido} (DNI ${scanInfo.dni})`);
          setPersonaEntregaNombre(`${scanInfo.nombre} ${scanInfo.apellido}`);
          setPersonaEntregaDni(scanInfo.dni);
          if (data.dniTutor && data.dniTutor === scanInfo.dni) {
            setPersonaEntregaTipo('Tutor');
            setPersonaEntregaParentesco('Tutor Responsable');
            setPersonaEntregaTelefono(data.telefonoTutor || data.telefono || '');
          } else if (!isAlumno && data.dni === scanInfo.dni) {
            setPersonaEntregaTipo('Tutor');
            setPersonaEntregaParentesco('Titular Responsable');
            setPersonaEntregaTelefono(data.telefono || '');
          } else {
            setPersonaEntregaTipo('Tercero');
            setPersonaEntregaParentesco(data.dni === scanInfo.dni ? '' : 'Familiar / Autorizado');
          }
        } else {
          setPersonaEntregaTipo('Tutor');
          if (isAlumno) {
            setPersonaEntregaNombre(data.nombreTutor || '');
            setPersonaEntregaDni(data.dniTutor || '');
            setPersonaEntregaTelefono(data.telefonoTutor || data.telefono || '');
            setPersonaEntregaParentesco('Tutor Responsable');
          } else {
            setPersonaEntregaNombre(`${data.nombre} ${data.apellido}`);
            setPersonaEntregaDni(data.dni);
            setPersonaEntregaTelefono(data.telefono || '');
            setPersonaEntregaParentesco('Titular Responsable');
          }
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
          setPersonaEntregaNombre(`${scanInfo.nombre} ${scanInfo.apellido}`);
          setPersonaEntregaDni(scanInfo.dni);
          setPersonaEntregaTipo('Tercero');
          setPersonaEntregaParentesco('Familiar / Autorizado');

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

  const aplicarPersonaEntrega = (tipo: 'Tutor' | 'Tercero', targetBeneficiario?: Beneficiario | null) => {
    const ben = targetBeneficiario !== undefined ? targetBeneficiario : beneficiario;
    const isAlumno = isManualMode ? manualTipoBeneficiario === 1 : (ben?.tipoBeneficiario ?? 1) === 1;
    setPersonaEntregaTipo(tipo);
    if (tipo === 'Tutor') {
      if (isAlumno) {
        const nom = ben?.nombreTutor || manualTutorNombre || '';
        const dni = ben?.dniTutor || manualTutorDni || '';
        const tel = ben?.telefonoTutor || ben?.telefono || manualTutorTelefono || '';
        setPersonaEntregaNombre(nom);
        setPersonaEntregaDni(dni);
        setPersonaEntregaTelefono(tel);
        setPersonaEntregaParentesco('Tutor Responsable');
      } else {
        const nom = ben ? `${ben.nombre} ${ben.apellido}` : `${manualTitularNombre} ${manualTitularApellido}`.trim();
        const dni = ben ? ben.dni : manualTitularDni;
        const tel = ben ? ben.telefono : manualTitularTelefono;
        setPersonaEntregaNombre(nom);
        setPersonaEntregaDni(dni);
        setPersonaEntregaTelefono(tel || '');
        setPersonaEntregaParentesco('Titular Responsable');
      }
    } else {
      // Tercero / Familiar Autorizado: vaciamos los campos para que se puedan cargar
      setPersonaEntregaNombre('');
      setPersonaEntregaDni('');
      setPersonaEntregaTelefono('');
      setPersonaEntregaParentesco('');
    }
  };

  const handleDniEscaneadoQuienEntrega = (scanned: ScannedDniData) => {
    setPersonaEntregaNombre(`${scanned.nombre} ${scanned.apellido}`);
    setPersonaEntregaDni(scanned.dni);
    const tutorDniActual = isManualMode ? manualTutorDni : beneficiario?.dniTutor;
    const titularDniActual = isManualMode ? manualTitularDni : beneficiario?.dni;
    const isAlumno = isManualMode ? manualTipoBeneficiario === 1 : (beneficiario?.tipoBeneficiario ?? 1) === 1;

    if (tutorDniActual && tutorDniActual === scanned.dni) {
      setPersonaEntregaTipo('Tutor');
      setPersonaEntregaParentesco('Tutor Responsable');
    } else if (!isAlumno && titularDniActual && titularDniActual === scanned.dni) {
      setPersonaEntregaTipo('Tutor');
      setPersonaEntregaParentesco('Titular Responsable');
    } else {
      setPersonaEntregaTipo('Tercero');
      setPersonaEntregaParentesco('Familiar / Autorizado');
    }
  };

  const handleIngresarNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualMode && !beneficiario) return;

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
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso + 'T12:00:00Z').toISOString() : null,
        soloCargador,
        tutorNombre: manualTipoBeneficiario === 1 ? manualTutorNombre : null,
        tutorDni: manualTipoBeneficiario === 1 ? manualTutorDni : null,
        tutorTelefono: manualTipoBeneficiario === 1 ? manualTutorTelefono : null,
        personaEntregaTipo,
        personaEntregaNombre: personaEntregaNombre.trim() || null,
        personaEntregaDni: personaEntregaDni.trim() || null,
        personaEntregaTelefono: personaEntregaTelefono.trim() || null,
        personaEntregaParentesco: personaEntregaParentesco.trim() || null,
        docIdentidadIngresoBase64,
        firmaIngresoBase64
      } : {
        equipoId: registrarNuevoEquipo ? '00000000-0000-0000-0000-000000000000' : (beneficiario!.equipo?.id || '00000000-0000-0000-0000-000000000000'),
        equipoMarca: registrarNuevoEquipo ? customMarca : (beneficiario!.equipo?.marca || null),
        equipoModelo: registrarNuevoEquipo ? customModelo : (beneficiario!.equipo?.modelo || null),
        fallaReportada,
        fallaCatalogoId,
        observaciones,
        escuelaId: selectedEscuelaId || null,
        programaEducativoId: selectedProgramaInicialId || null,
        ubicacionDepositoId: selectedUbicacionId || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso + 'T12:00:00Z').toISOString() : null,
        soloCargador,
        tipoBeneficiario: beneficiario!.tipoBeneficiario,
        nuevoEquipoNumeroSerie: registrarNuevoEquipo ? customSerial : null,
        nuevoEquipoMarca: registrarNuevoEquipo ? customMarca : null,
        nuevoEquipoModelo: registrarNuevoEquipo ? customModelo : null,
        nuevoEquipoCredencialesOffice: registrarNuevoEquipo ? customCredencialesOffice : null,
        tutorNombre: (beneficiario!.tipoBeneficiario ?? 1) === 1 ? (beneficiario!.nombreTutor || '') : null,
        tutorDni: (beneficiario!.tipoBeneficiario ?? 1) === 1 ? (beneficiario!.dniTutor || '') : null,
        tutorTelefono: (beneficiario!.tipoBeneficiario ?? 1) === 1 ? (beneficiario!.telefonoTutor || beneficiario!.telefono || '') : null,
        titularTelefono: beneficiario!.telefono || null,
        personaEntregaTipo,
        personaEntregaNombre: personaEntregaNombre.trim() || null,
        personaEntregaDni: personaEntregaDni.trim() || null,
        personaEntregaTelefono: personaEntregaTelefono.trim() || null,
        personaEntregaParentesco: personaEntregaParentesco.trim() || null,
        docIdentidadIngresoBase64,
        firmaIngresoBase64
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
        const numSerie = isManualMode 
          ? manualEquipoNumeroSerie 
          : registrarNuevoEquipo 
            ? customSerial 
            : (beneficiario!.equipo?.numeroSerie || 'S/N');
        const nombreBenef = isManualMode ? `${manualTitularNombre} ${manualTitularApellido}` : `${beneficiario!.nombre} ${beneficiario!.apellido}`;
        const dniBenef = isManualMode ? manualTitularDni : beneficiario!.dni;
        const telefonoBenef = isManualMode ? manualTitularTelefono : beneficiario!.telefono;
        const marcaMod = isManualMode 
          ? `${manualEquipoMarca} ${manualEquipoModelo}` 
          : registrarNuevoEquipo 
            ? `${customMarca} ${customModelo}` 
            : `${beneficiario!.equipo?.marca || ''} ${beneficiario!.equipo?.modelo || ''}`;
        
        setMensajeExito(`Ingreso de notebook ${numSerie} registrado exitosamente. Se archivó la constancia digital y escaneo de DNI.`);
        
        const comprobanteData = {
          tipo: 'Ingreso',
          numeroMovimiento: data.id.substring(0, 8).toUpperCase(),
          fecha: new Date(fechaIngreso + 'T12:00:00Z').toISOString(),
          escuela: escuelas.find(e => e.id === selectedEscuelaId)?.nombre || 'Sin Asignar',
          operador: nombreOperador,
          motivo: 'Reparación / Diagnóstico',
          tutor: {
            nombre: personaEntregaNombre || (isManualMode && manualTipoBeneficiario === 1 && manualTutorNombre ? manualTutorNombre : nombreBenef),
            dni: personaEntregaDni || (isManualMode && manualTipoBeneficiario === 1 && manualTutorDni ? manualTutorDni : dniBenef),
            telefono: personaEntregaTelefono || telefonoBenef,
            alumno: nombreBenef,
            personaEntregaRetiro: personaEntregaNombre,
            parentesco: personaEntregaParentesco
          },
          equipos: [{
            numeroSerie: numSerie,
            marcaModelo: marcaMod + (soloCargador ? ' (SOLO CARGADOR)' : ''),
            estado: 'Ingresado',
            fallaReportada: fallaReportada || (fallaCatalogoId === 6 ? 'Otra' : 'Falla catalogada')
          }]
        };
        setUltimoComprobante(comprobanteData);

        setBeneficiario(null);
        setDniInput('');
        setFallaReportada('');
        setObservaciones('');
        setSelectedUbicacionId('');
        setFechaIngreso(new Date().toISOString().split('T')[0]);
        setSoloCargador(false);
        setRegistrarNuevoEquipo(false);
        setCustomSerial('');
        setCustomMarca('');
        setCustomModelo('');
        setCustomCredencialesOffice('');
        setPersonaEntregaTipo('Tutor');
        setPersonaEntregaNombre('');
        setPersonaEntregaDni('');
        setPersonaEntregaTelefono('');
        setPersonaEntregaParentesco('Tutor Responsable');
        setDocIdentidadIngresoBase64(null);
        setFirmaIngresoBase64(null);

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
          setManualTutorNombre('');
          setManualTutorDni('');
          setManualTutorTelefono('');
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
          <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-green-600" />
              <span>{mensajeExito}</span>
            </div>
            {ultimoComprobante && (
              <button
                type="button"
                onClick={() => imprimirComprobante(ultimoComprobante)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Comprobante (Opcional)
              </button>
            )}
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
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="tipoBenef" value={3} checked={manualTipoBeneficiario === 3} onChange={() => setManualTipoBeneficiario(3)} className="text-[#FF8200] focus:ring-[#FF8200]" />
                    Directivo
                  </label>
                </div>
                <div className="space-y-3 text-xs">
                  <div><label className="block text-slate-500 mb-1">DNI</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularDni} onChange={e => setManualTitularDni(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Nombre</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularNombre} onChange={e => setManualTitularNombre(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Apellido</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularApellido} onChange={e => setManualTitularApellido(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Teléfono</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularTelefono} onChange={e => setManualTitularTelefono(e.target.value)} /></div>
                  <div><label className="block text-slate-500 mb-1">Email</label><input required type="email" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTitularEmail} onChange={e => setManualTitularEmail(e.target.value)} /></div>
                  
                  {manualTipoBeneficiario === 1 && (
                    <div className="border-t border-slate-200 pt-3 mt-3 space-y-3 animate-fade-in">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Datos del Tutor Responsable</p>
                      <div><label className="block text-slate-500 mb-1">Nombre del Tutor *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorNombre} onChange={e => setManualTutorNombre(e.target.value)} /></div>
                      <div><label className="block text-slate-500 mb-1">DNI del Tutor *</label><input required type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorDni} onChange={e => setManualTutorDni(e.target.value)} /></div>
                      <div><label className="block text-slate-500 mb-1">Teléfono del Tutor (Opcional)</label><input type="text" className="w-full bg-white border border-slate-200 rounded px-2 py-1.5" value={manualTutorTelefono} onChange={e => setManualTutorTelefono(e.target.value)} /></div>
                    </div>
                  )}
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
                    <option value={3}>Bloqueo de Seguridad</option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Fecha de Ingreso (Carga Retroactiva)</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-750 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soloCargador}
                      onChange={(e) => setSoloCargador(e.target.checked)}
                      className="text-[#FF8200] focus:ring-[#FF8200] rounded"
                    />
                    Ingreso de Solo Cargador (Hardware)
                  </label>
                </div>
              </div>
            </div>

            {/* Persona que Entrega el Equipo en Depósito + Escaneo DNI + Firma Digital */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="w-5 h-5 text-[#FF8200]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">¿Quién presenta / entrega el equipo en depósito?</h3>
                    <p className="text-[11px] text-slate-500">
                      {manualTipoBeneficiario === 1 
                        ? 'Los alumnos no pueden entregar equipos directamente. Seleccione el tutor o cargue los datos de un tercero autorizado.' 
                        : 'Registre a la persona física que asiste a dejar el equipo en depósito.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => aplicarPersonaEntrega('Tutor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      personaEntregaTipo === 'Tutor' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {manualTipoBeneficiario === 1 ? 'Es el Tutor Responsable' : 'Es el Titular'}
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPersonaEntrega('Tercero')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      personaEntregaTipo === 'Tercero' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tercero / Familiar Autorizado
                  </button>
                </div>
              </div>

              {personaEntregaTipo === 'Tercero' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    El equipo es entregado por un tercero o familiar autorizado. Complete sus datos a continuación:
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nombre y Apellido *</label>
                  <input
                    required
                    type="text"
                    placeholder="Nombre completo"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaNombre}
                    onChange={(e) => setPersonaEntregaNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">DNI *</label>
                  <input
                    required
                    type="text"
                    placeholder="DNI de quien entrega"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaDni}
                    onChange={(e) => setPersonaEntregaDni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Teléfono Contacto</label>
                  <input
                    type="text"
                    placeholder="Teléfono de quien entrega"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaTelefono}
                    onChange={(e) => setPersonaEntregaTelefono(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Parentesco / Relación *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Madre, Tío, Hermano mayor, Autorizado..."
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaParentesco}
                    onChange={(e) => setPersonaEntregaParentesco(e.target.value)}
                  />
                </div>
              </div>

              <DocumentoIdentidadSection
                documentoBase64={docIdentidadIngresoBase64}
                onDocumentoChange={setDocIdentidadIngresoBase64}
                onDniParsed={handleDniEscaneadoQuienEntrega}
                label="Digitalización del DNI de quien entrega"
                descripcion="Escanee el código de barras PDF417, capture una foto con la cámara web o cargue el archivo del documento."
              />

              <DigitalSignatureCanvas
                onSignatureChange={setFirmaIngresoBase64}
                title="Firma Digital en Pantalla"
                subtitle="El presentante puede firmar con el dedo (táctil) o ratón para registrar el ingreso sin requerir papel."
              />
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
            {/* Beneficiario / Alumno y Tutor Responsable */}
            {(() => {
              const isAlumnoActual = (Number(beneficiario.tipoBeneficiario) || 1) === 1;
              return (
                <div className={`grid gap-4 ${isAlumnoActual ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Alumno / Titular Column */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2 text-[#FF8200]">
                        <User className="w-4.5 h-4.5" />
                        <h3 className="text-sm font-semibold text-slate-800">
                          {isAlumnoActual ? 'Datos del Alumno (Titular)' : `Datos del Titular (${beneficiario.tipoBeneficiario === 2 ? 'Docente' : 'Directivo'})`}
                        </h3>
                      </div>
                      <select
                        value={beneficiario.tipoBeneficiario || 1}
                        onChange={(e) => {
                          const nuevoTipo = Number(e.target.value);
                          const updated = { ...beneficiario, tipoBeneficiario: nuevoTipo };
                          setBeneficiario(updated);
                          aplicarPersonaEntrega('Tutor', updated);
                        }}
                        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8200]"
                      >
                        <option value={1}>Alumno</option>
                        <option value={2}>Docente</option>
                        <option value={3}>Directivo</option>
                      </select>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">DNI {isAlumnoActual ? 'Alumno' : 'Titular'}:</span>
                        <span className="font-mono font-bold text-slate-900">{beneficiario.dni}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nombre Completo:</span>
                        <span className="font-semibold text-slate-900">{beneficiario.nombre} {beneficiario.apellido}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          Teléfono {isAlumnoActual ? 'Alumno' : 'Titular'}:
                        </span>
                        <input
                          type="text"
                          placeholder="Teléfono (opcional)"
                          value={beneficiario.telefono || ''}
                          onChange={(e) => setBeneficiario({ ...beneficiario, telefono: e.target.value })}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF8200] w-1/2 text-right"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email Escolar:</span>
                        <span className="font-medium text-slate-900 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {beneficiario.email || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tutor Column (solo cuando es Alumno) */}
                  {isAlumnoActual && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2 text-[#FF8200]">
                          <ShieldCheck className="w-4.5 h-4.5" />
                          <h3 className="text-sm font-semibold text-slate-800">Tutor Responsable (Padrón)</h3>
                        </div>
                        {(!beneficiario.nombreTutor || !beneficiario.dniTutor) && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1">Nombre y Apellido del Tutor *</label>
                          <input
                            required
                            type="text"
                            placeholder="Nombre del tutor registrado"
                            value={beneficiario.nombreTutor || ''}
                            onChange={(e) => setBeneficiario({ ...beneficiario, nombreTutor: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-500 mb-1">DNI Tutor *</label>
                            <input
                              required
                              type="text"
                              placeholder="DNI del tutor"
                              value={beneficiario.dniTutor || ''}
                              onChange={(e) => setBeneficiario({ ...beneficiario, dniTutor: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Teléfono Tutor *</label>
                            <input
                              required
                              type="text"
                              placeholder="Teléfono de contacto"
                              value={beneficiario.telefonoTutor ?? beneficiario.telefono ?? ''}
                              onChange={(e) => setBeneficiario({ ...beneficiario, telefonoTutor: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

              {/* Notebook Column */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2 text-[#FF8200]">
                    <Laptop className="w-4.5 h-4.5" />
                    <h3 className="text-sm font-semibold text-slate-800">Equipo Asignado</h3>
                  </div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registrarNuevoEquipo}
                      onChange={(e) => setRegistrarNuevoEquipo(e.target.checked)}
                      className="text-[#FF8200] focus:ring-[#FF8200] rounded w-3 h-3"
                    />
                    Registrar nueva notebook
                  </label>
                </div>
                
                {registrarNuevoEquipo ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Nro de Serie *</label>
                      <input
                        required
                        type="text"
                        placeholder="SJMA025-..."
                        value={customSerial}
                        onChange={(e) => setCustomSerial(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Marca *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej: HP, Dell, Exo..."
                        value={customMarca}
                        onChange={(e) => setCustomMarca(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Modelo *</label>
                      <input
                        required
                        type="text"
                        placeholder="Modelo del equipo"
                        value={customModelo}
                        onChange={(e) => setCustomModelo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Credenciales Office (Opcional)</label>
                      <input
                        type="text"
                        value={customCredencialesOffice}
                        onChange={(e) => setCustomCredencialesOffice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                ) : beneficiario.equipo ? (
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
                    <option value={3}>Bloqueo de Seguridad</option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">Fecha de Ingreso (Carga Retroactiva)</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF8200] text-xs transition-colors"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-750 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soloCargador}
                      onChange={(e) => setSoloCargador(e.target.checked)}
                      className="text-[#FF8200] focus:ring-[#FF8200] rounded"
                    />
                    Ingreso de Solo Cargador (Hardware)
                  </label>
                </div>
              </div>
            </div>

            {/* Persona que Entrega el Equipo en Depósito + Escaneo DNI + Firma Digital */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="w-5 h-5 text-[#FF8200]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">¿Quién presenta / entrega el equipo en depósito?</h3>
                    <p className="text-[11px] text-slate-500">
                      {(beneficiario.tipoBeneficiario ?? 1) === 1
                        ? 'Los alumnos no pueden entregar equipos directamente. Seleccione el tutor registrado o cargue los datos de un tercero autorizado.'
                        : 'Registre a la persona física que asiste a dejar el equipo en depósito.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => aplicarPersonaEntrega('Tutor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      personaEntregaTipo === 'Tutor' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {(beneficiario.tipoBeneficiario ?? 1) === 1 ? 'Es el Tutor Responsable' : 'Es el Titular'}
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPersonaEntrega('Tercero')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      personaEntregaTipo === 'Tercero' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tercero / Familiar Autorizado
                  </button>
                </div>
              </div>

              {personaEntregaTipo === 'Tercero' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    El equipo es entregado por un tercero o familiar autorizado. Complete sus datos a continuación:
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nombre y Apellido *</label>
                  <input
                    required
                    type="text"
                    placeholder="Nombre completo"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaNombre}
                    onChange={(e) => setPersonaEntregaNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">DNI *</label>
                  <input
                    required
                    type="text"
                    placeholder="DNI de quien entrega"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaDni}
                    onChange={(e) => setPersonaEntregaDni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Teléfono Contacto</label>
                  <input
                    type="text"
                    placeholder="Teléfono de quien entrega"
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaTelefono}
                    onChange={(e) => setPersonaEntregaTelefono(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Parentesco / Relación *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Madre, Tío, Hermano mayor, Autorizado..."
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaEntregaTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                    value={personaEntregaParentesco}
                    onChange={(e) => setPersonaEntregaParentesco(e.target.value)}
                  />
                </div>
              </div>

              <DocumentoIdentidadSection
                documentoBase64={docIdentidadIngresoBase64}
                onDocumentoChange={setDocIdentidadIngresoBase64}
                onDniParsed={handleDniEscaneadoQuienEntrega}
                label="Digitalización del DNI de quien entrega"
                descripcion="Escanee el código de barras PDF417, capture una foto con la cámara web o cargue el archivo del documento."
              />

              <DigitalSignatureCanvas
                onSignatureChange={setFirmaIngresoBase64}
                title="Firma Digital en Pantalla"
                subtitle="El presentante puede firmar con el dedo (táctil) o ratón para registrar el ingreso sin requerir papel."
              />
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
