import { useState, useRef, useEffect } from 'react';
import type { Beneficiario } from '../types';
import { API_BASE_URL } from '../config';
import { parseDniScan } from '../utils/dniParser';
import type { ScannedDniData } from '../utils/dniParser';

export function useRegistrarIngresoForm(token: string, nombreOperador: string) {
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

  const [manualTutorNombre, setManualTutorNombre] = useState('');
  const [manualTutorDni, setManualTutorDni] = useState('');
  const [manualTutorTelefono, setManualTutorTelefono] = useState('');

  const [personaEntregaTipo, setPersonaEntregaTipo] = useState<'Tutor' | 'Tercero'>('Tutor');
  const [personaEntregaNombre, setPersonaEntregaNombre] = useState('');
  const [personaEntregaDni, setPersonaEntregaDni] = useState('');
  const [personaEntregaTelefono, setPersonaEntregaTelefono] = useState('');
  const [personaEntregaParentesco, setPersonaEntregaParentesco] = useState('Tutor Responsable');
  const [docIdentidadIngresoBase64, setDocIdentidadIngresoBase64] = useState<string | null>(null);
  const [firmaIngresoBase64, setFirmaIngresoBase64] = useState<string | null>(null);
  const [ultimoComprobante, setUltimoComprobante] = useState<any | null>(null);

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

  const [programas, setProgramas] = useState<any[]>([]);
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<string>('');
  const [escuelaSearch, setEscuelaSearch] = useState('');
  const [isEscuelaDropdownOpen, setIsEscuelaDropdownOpen] = useState(false);
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<string>('');
  const [forzarModoManual, setForzarModoManual] = useState(false);

  const dniInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resEscuelas = await fetch(`${API_BASE_URL}/Escuelas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resEscuelas.ok) setEscuelas(await resEscuelas.json());

        const resProgramas = await fetch(`${API_BASE_URL}/Programas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resProgramas.ok) setProgramas(await resProgramas.json());
      } catch {
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
      if (cleanDni.length < 6 || cleanDni.length > 11) return;
    }

    setLoading(true);
    setMensajeError('');
    setMensajeExito('');
    setBeneficiario(null);

    try {
      const response = await fetch(`${API_BASE_URL}/Beneficiarios/${cleanDni}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data: Beneficiario = await response.json();
        const rawTipo = Number(data.tipoBeneficiario);
        data.tipoBeneficiario = (rawTipo === 2 || rawTipo === 3) ? rawTipo : 1;

        if (scanInfo) {
          data.nombre = scanInfo.nombre;
          data.apellido = scanInfo.apellido;
        }

        setForzarModoManual(false);
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
        setBeneficiario(null);
        setForzarModoManual(true);
        if (/^\d{6,9}$/.test(cleanDni)) setManualTitularDni(cleanDni);
        else setManualEquipoNumeroSerie(cleanDni);

        if (scanInfo) {
          setManualTitularDni(scanInfo.dni || cleanDni);
          setManualTitularNombre(scanInfo.nombre || '');
          setManualTitularApellido(scanInfo.apellido || '');
          setPersonaEntregaNombre(`${scanInfo.nombre} ${scanInfo.apellido}`);
          setPersonaEntregaDni(scanInfo.dni);
          setPersonaEntregaTipo('Tercero');
          setPersonaEntregaParentesco('Familiar / Autorizado');
          setMensajeExito(`DNI Escaneado no encontrado en padrón (${scanInfo.nombre} ${scanInfo.apellido}). Complete los datos manualmente.`);
        } else {
          setMensajeError('DNI o Serie no encontrado en el padrón de Maestros de América. Se habilitó la carga manual.');
        }
      }
    } catch {
      setBeneficiario(null);
      setForzarModoManual(true);
      if (/^\d{6,9}$/.test(cleanDni)) setManualTitularDni(cleanDni);
      else setManualEquipoNumeroSerie(cleanDni);
      setMensajeError('No se pudo encontrar en el padrón. Puede ingresar los datos manualmente a continuación.');
    }
    setLoading(false);
  };

  const isMaestrosDeAmerica = selectedProgramaInicialId !== '' && (programas.find(p => p.id === selectedProgramaInicialId)?.nombre.toLowerCase().includes('maestros') ?? true);
  const isManualMode = selectedProgramaInicialId !== '' && (!isMaestrosDeAmerica || forzarModoManual);

  const aplicarPersonaEntrega = (tipo: 'Tutor' | 'Tercero', targetBeneficiario?: Beneficiario | null) => {
    const ben = targetBeneficiario !== undefined ? targetBeneficiario : beneficiario;
    const isAlumno = isManualMode ? manualTipoBeneficiario === 1 : (ben?.tipoBeneficiario ?? 1) === 1;
    setPersonaEntregaTipo(tipo);
    if (tipo === 'Tutor') {
      if (isAlumno) {
        setPersonaEntregaNombre(ben?.nombreTutor || manualTutorNombre || '');
        setPersonaEntregaDni(ben?.dniTutor || manualTutorDni || '');
        setPersonaEntregaTelefono(ben?.telefonoTutor || ben?.telefono || manualTutorTelefono || '');
        setPersonaEntregaParentesco('Tutor Responsable');
      } else {
        setPersonaEntregaNombre(ben ? `${ben.nombre} ${ben.apellido}` : `${manualTitularNombre} ${manualTitularApellido}`.trim());
        setPersonaEntregaDni(ben ? ben.dni : manualTitularDni);
        setPersonaEntregaTelefono((ben ? ben.telefono : manualTitularTelefono) || '');
        setPersonaEntregaParentesco('Titular Responsable');
      }
    } else {
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

        setUltimoComprobante({
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
        });

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
          setForzarModoManual(false);
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
    } catch {
      setMensajeError('Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dniInputRef.current?.focus();
  }, []);

  return {
    dniInput, setDniInput,
    loading,
    beneficiario, setBeneficiario,
    fallaReportada, setFallaReportada,
    fallaCatalogoId, setFallaCatalogoId,
    observaciones, setObservaciones,
    mensajeError, setMensajeError,
    mensajeExito, setMensajeExito,
    fechaIngreso, setFechaIngreso,
    soloCargador, setSoloCargador,
    manualTutorNombre, setManualTutorNombre,
    manualTutorDni, setManualTutorDni,
    manualTutorTelefono, setManualTutorTelefono,
    personaEntregaTipo,
    personaEntregaNombre, setPersonaEntregaNombre,
    personaEntregaDni, setPersonaEntregaDni,
    personaEntregaTelefono, setPersonaEntregaTelefono,
    personaEntregaParentesco, setPersonaEntregaParentesco,
    docIdentidadIngresoBase64, setDocIdentidadIngresoBase64,
    setFirmaIngresoBase64,
    ultimoComprobante,
    registrarNuevoEquipo, setRegistrarNuevoEquipo,
    customSerial, setCustomSerial,
    customMarca, setCustomMarca,
    customModelo, setCustomModelo,
    customCredencialesOffice, setCustomCredencialesOffice,
    isCrearEscuelaModalOpen, setIsCrearEscuelaModalOpen,
    selectedProgramaInicialId, setSelectedProgramaInicialId,
    manualTipoBeneficiario, setManualTipoBeneficiario,
    manualTitularDni, setManualTitularDni,
    manualTitularNombre, setManualTitularNombre,
    manualTitularApellido, setManualTitularApellido,
    manualTitularTelefono, setManualTitularTelefono,
    manualTitularEmail, setManualTitularEmail,
    manualEquipoNumeroSerie, setManualEquipoNumeroSerie,
    manualEquipoMarca, setManualEquipoMarca,
    manualEquipoModelo, setManualEquipoModelo,
    manualEquipoCredencialesOffice, setManualEquipoCredencialesOffice,
    programas,
    escuelas,
    setSelectedEscuelaId,
    escuelaSearch, setEscuelaSearch,
    isEscuelaDropdownOpen, setIsEscuelaDropdownOpen,
    forzarModoManual, setForzarModoManual,
    dniInputRef,
    handleEscuelaSearchChange,
    handleEscuelaCreada,
    handleKeyDown,
    handleDniInputChange,
    buscarBeneficiario,
    isMaestrosDeAmerica,
    isManualMode,
    aplicarPersonaEntrega,
    handleDniEscaneadoQuienEntrega,
    handleIngresarNotebook
  };
}
