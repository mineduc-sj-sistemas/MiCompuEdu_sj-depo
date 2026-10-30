import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { Search, RefreshCw, Laptop, User, MapPin, AlertTriangle, Check, Loader2, X, Calendar, FileText, ShieldCheck, Printer, Info } from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';
import { DigitalSignatureCanvas } from '../../components/Signature/DigitalSignatureCanvas';
import { DocumentoIdentidadSection } from '../../components/Scanner/DocumentoIdentidadSection';
import type { ScannedDniData } from '../../utils/dniParser';

interface EntregaNotebookProps {
  token: string;
  nombreOperador: string;
}

type FiltroTiempo = 'todos' | 'dia' | 'semana' | 'mes';

const getRolLabel = (tipo?: number) => {
  if (tipo === 2) return 'Docente';
  if (tipo === 3) return 'Directivo';
  return 'Alumno';
};

export const EntregaNotebook: React.FC<EntregaNotebookProps> = ({ token, nombreOperador }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('todos');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);

  // Campos editables en el modal de entrega
  const [telefonoEntrega, setTelefonoEntrega] = useState('');
  const [tutorNombreEntrega, setTutorNombreEntrega] = useState('');
  const [tutorDniEntrega, setTutorDniEntrega] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Persona que retira el equipo en depósito
  const [personaRetiroTipo, setPersonaRetiroTipo] = useState<'Tutor' | 'Alumno' | 'MismaPersonaEntrega' | 'Tercero'>('Tutor');
  const [personaRetiroNombre, setPersonaRetiroNombre] = useState('');
  const [personaRetiroDni, setPersonaRetiroDni] = useState('');
  const [personaRetiroTelefono, setPersonaRetiroTelefono] = useState('');
  const [personaRetiroParentesco, setPersonaRetiroParentesco] = useState('Tutor Responsable');
  const [docIdentidadEntregaBase64, setDocIdentidadEntregaBase64] = useState<string | null>(null);
  const [firmaEntregaBase64, setFirmaEntregaBase64] = useState<string | null>(null);
  const [ultimoComprobanteEgreso, setUltimoComprobanteEgreso] = useState<any | null>(null);

  const aplicarPersonaRetiro = (tipo: 'Tutor' | 'Alumno' | 'MismaPersonaEntrega' | 'Tercero', targetRepair?: Reparacion | null) => {
    const rep = targetRepair !== undefined ? targetRepair : selectedRepair;
    if (!rep) return;
    setPersonaRetiroTipo(tipo);
    if (tipo === 'Tutor') {
      const nom = rep.tutorResponsableNombre || tutorNombreEntrega || rep.nombreTutor || '';
      const dni = rep.tutorResponsableDni || tutorDniEntrega || '';
      const tel = rep.tutorResponsableTelefono || rep.telefonoTutor || telefonoEntrega || '';
      setPersonaRetiroNombre(nom);
      setPersonaRetiroDni(dni);
      setPersonaRetiroTelefono(tel);
      setPersonaRetiroParentesco('Tutor Responsable');
    } else if (tipo === 'Alumno') {
      const nom = rep.alumnoNombreCompleto || rep.nombreTutor || '';
      const dni = rep.alumnoDni || rep.titularDni || '';
      const tel = rep.alumnoTelefono || rep.telefonoTutor || telefonoEntrega || '';
      setPersonaRetiroNombre(nom);
      setPersonaRetiroDni(dni);
      setPersonaRetiroTelefono(tel);
      setPersonaRetiroParentesco('Titular / Alumno');
    } else if (tipo === 'MismaPersonaEntrega') {
      setPersonaRetiroNombre(rep.personaEntregaNombre || '');
      setPersonaRetiroDni(rep.personaEntregaDni || '');
      setPersonaRetiroTelefono(rep.personaEntregaTelefono || rep.telefonoTutor || telefonoEntrega || '');
      setPersonaRetiroParentesco(rep.personaEntregaParentesco || 'Persona que entregó');
    } else {
      setPersonaRetiroNombre('');
      setPersonaRetiroDni('');
      setPersonaRetiroTelefono('');
      setPersonaRetiroParentesco('');
    }
  };

  const handleDniEscaneadoQuienRetira = (scanned: ScannedDniData) => {
    setPersonaRetiroNombre(`${scanned.nombre} ${scanned.apellido}`);
    setPersonaRetiroDni(scanned.dni);
    if (selectedRepair) {
      const isAlumno = (selectedRepair.tipoBeneficiario ?? 1) === 1;
      if (selectedRepair.tutorResponsableDni && selectedRepair.tutorResponsableDni === scanned.dni) {
        setPersonaRetiroTipo('Tutor');
        setPersonaRetiroParentesco('Tutor Responsable');
      } else if (!isAlumno && (selectedRepair.alumnoDni || selectedRepair.titularDni) === scanned.dni) {
        setPersonaRetiroTipo('Alumno');
        setPersonaRetiroParentesco('Titular');
      } else if (selectedRepair.personaEntregaDni && selectedRepair.personaEntregaDni === scanned.dni) {
        setPersonaRetiroTipo('MismaPersonaEntrega');
        setPersonaRetiroParentesco(selectedRepair.personaEntregaParentesco || 'Persona que entregó');
      } else {
        setPersonaRetiroTipo('Tercero');
        setPersonaRetiroParentesco('Familiar / Autorizado');
      }
    }
  };

  const abrirModalEntrega = (repair: Reparacion) => {
    setSelectedRepair(repair);
    const tel = repair.tutorResponsableTelefono || repair.telefonoTutor || '';
    const tutNom = repair.tutorResponsableNombre || '';
    const tutDni = repair.tutorResponsableDni || '';
    setTelefonoEntrega(tel);
    setTutorNombreEntrega(tutNom);
    setTutorDniEntrega(tutDni);
    setDocIdentidadEntregaBase64(null);
    setFirmaEntregaBase64(null);
    setErrorModal('');

    // Pre-poblar quien retira de manera inteligente
    const isAlumno = (repair.tipoBeneficiario ?? 1) === 1;
    if (repair.personaEntregaNombre) {
      setPersonaRetiroTipo('MismaPersonaEntrega');
      setPersonaRetiroNombre(repair.personaEntregaNombre);
      setPersonaRetiroDni(repair.personaEntregaDni || '');
      setPersonaRetiroTelefono(repair.personaEntregaTelefono || tel);
      setPersonaRetiroParentesco(repair.personaEntregaParentesco || 'Persona que entregó');
    } else if (isAlumno) {
      setPersonaRetiroTipo('Tutor');
      setPersonaRetiroNombre(tutNom);
      setPersonaRetiroDni(tutDni);
      setPersonaRetiroTelefono(tel);
      setPersonaRetiroParentesco('Tutor Responsable');
    } else {
      setPersonaRetiroTipo('Alumno');
      setPersonaRetiroNombre(repair.alumnoNombreCompleto || repair.nombreTutor);
      setPersonaRetiroDni(repair.alumnoDni || repair.titularDni || '');
      setPersonaRetiroTelefono(tel);
      setPersonaRetiroParentesco('Titular');
    }
  };

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
          marcaModelo: 'Exo Juana Manso v2', nombreTutor: 'Juan Carlos Gómez', titularDni: '45123456',
          alumnoNombreCompleto: 'Juan Carlos Gómez', alumnoDni: '45123456',
          tipoBeneficiario: 1, tutorResponsableNombre: 'María Gómez', tutorResponsableDni: '28111222',
          telefonoTutor: '+542644556677', escuelaNombre: 'Escuela Normal Superior Sarmiento',
          programaEducativoNombre: 'Maestros de América', estado: 'Listo_Para_Retirar',
          fallaReportada: 'No se conecta al Wi-Fi.', diagnostico: 'Placa Wi-Fi dañada.',
          accionesRealizadas: 'Se reemplazó módulo Wi-Fi.', fechaIngreso: '2026-06-10T10:00:00Z',
          personaEntregaNombre: 'María Gómez', personaEntregaDni: '28111222', personaEntregaParentesco: 'Tutor Responsable'
        },
        {
          id: 'mock-reparacion-2', equipoId: 'eq-2', numeroSerie: 'S-EDU-39988776-X',
          marcaModelo: 'Dell Notebook', nombreTutor: 'Laura Silvestri', titularDni: '30988776',
          alumnoNombreCompleto: 'Laura Silvestri', alumnoDni: '30988776',
          tipoBeneficiario: 2, escuelaNombre: 'Colegio Provincial de Concepción',
          programaEducativoNombre: 'Maestros de América',
          telefonoTutor: '+542644112233', estado: 'No_Reparable',
          fallaReportada: 'Se mojó y no enciende.', diagnostico: 'Cortocircuito en placa.',
          accionesRealizadas: 'Sin reparación posible.', fechaIngreso: '2026-06-11T14:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;

    const cleanPhone = telefonoEntrega.trim();
    const isAlumno = (selectedRepair.tipoBeneficiario ?? 1) === 1;

    const finalRetiroNombre = personaRetiroNombre.trim() || (isAlumno ? tutorNombreEntrega.trim() : (selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor));
    const finalRetiroDni = personaRetiroDni.trim() || (isAlumno ? tutorDniEntrega.trim() : (selectedRepair.alumnoDni || selectedRepair.titularDni || '-'));
    const finalRetiroTelefono = personaRetiroTelefono.trim() || cleanPhone;
    const finalRetiroParentesco = personaRetiroParentesco.trim() || (isAlumno ? 'Tutor Responsable' : 'Titular');

    if (!finalRetiroNombre || !finalRetiroDni) {
      setErrorModal('El nombre y DNI de la persona que retira el equipo son obligatorios.');
      return;
    }

    if (!finalRetiroTelefono) {
      setErrorModal('El número de teléfono de contacto es obligatorio para registrar la entrega.');
      return;
    }

    setLoading(true);
    setErrorModal('');
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones/${selectedRepair.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          nuevoEstado: 'Entregado',
          observaciones: `Retirado por ${finalRetiroNombre} (DNI: ${finalRetiroDni}, ${finalRetiroParentesco}) - Tel: ${finalRetiroTelefono}.`,
          telefonoContacto: finalRetiroTelefono,
          tutorNombre: isAlumno ? (tutorNombreEntrega.trim() || selectedRepair.tutorResponsableNombre || null) : null,
          tutorDni: isAlumno ? (tutorDniEntrega.trim() || selectedRepair.tutorResponsableDni || null) : null,
          personaRetiroTipo,
          personaRetiroNombre: finalRetiroNombre,
          personaRetiroDni: finalRetiroDni,
          personaRetiroTelefono: finalRetiroTelefono,
          personaRetiroParentesco: finalRetiroParentesco,
          docIdentidadEntregaBase64: docIdentidadEntregaBase64 || firmaEntregaBase64
        })
      });
      if (response.ok) {
        const nombreAlumno = selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor;
        const comprobanteEgreso = {
          tipo: 'Egreso' as const,
          numeroMovimiento: selectedRepair.id.substring(0, 8).toUpperCase(),
          fecha: new Date().toISOString(),
          escuela: selectedRepair.escuelaNombre || selectedRepair.ubicacionDepositoCodigo || 'Depósito Central',
          operador: nombreOperador,
          motivo: selectedRepair.estado === 'Listo_Para_Retirar' ? 'Entrega de equipo reparado' : 'Devolución de equipo no reparable',
          tutor: {
            nombre: finalRetiroNombre,
            dni: finalRetiroDni,
            telefono: finalRetiroTelefono,
            alumno: nombreAlumno,
            personaEntregaRetiro: finalRetiroNombre,
            parentesco: finalRetiroParentesco
          },
          equipos: [{
            numeroSerie: selectedRepair.numeroSerie,
            marcaModelo: selectedRepair.marcaModelo,
            estado: 'Entregado',
            fallaReportada: selectedRepair.fallaReportada,
            diagnostico: selectedRepair.diagnostico
          }]
        };

        setUltimoComprobanteEgreso(comprobanteEgreso);
        setMensaje({ tipo: 'exito', texto: `Equipo ${selectedRepair.numeroSerie} entregado exitosamente. Se archivó la constancia digital de retiro.` });
        setSelectedRepair(null);
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega en el servidor.' });
      }
    } catch {
      setRepairs(prev => prev.filter(r => r.id !== selectedRepair.id));
      setSelectedRepair(null);
      setMensaje({ tipo: 'exito', texto: `[SIMULACIÓN] Entrega de equipo ${selectedRepair.numeroSerie} procesada.` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRepairsToDeliver(); }, [token]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const countDia = repairs.filter(r => new Date(r.fechaIngreso).getTime() >= startOfToday).length;
  const countSemana = repairs.filter(r => new Date(r.fechaIngreso).getTime() >= sevenDaysAgo).length;
  const countMes = repairs.filter(r => new Date(r.fechaIngreso).getTime() >= thirtyDaysAgo).length;

  const filteredRepairs = repairs.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.numeroSerie.toLowerCase().includes(term) ||
      r.nombreTutor.toLowerCase().includes(term) ||
      (r.titularDni && r.titularDni.toLowerCase().includes(term)) ||
      (r.tutorResponsableNombre && r.tutorResponsableNombre.toLowerCase().includes(term)) ||
      (r.tutorResponsableDni && r.tutorResponsableDni.toLowerCase().includes(term)) ||
      (r.escuelaNombre && r.escuelaNombre.toLowerCase().includes(term));
    if (!matchesSearch) return false;

    if (filtroTiempo === 'todos') return true;
    const itemTime = new Date(r.fechaIngreso).getTime();
    if (isNaN(itemTime)) return true;

    if (filtroTiempo === 'dia') return itemTime >= startOfToday;
    if (filtroTiempo === 'semana') return itemTime >= sevenDaysAgo;
    if (filtroTiempo === 'mes') return itemTime >= thirtyDaysAgo;

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Entrega de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca y entrega notebooks reparadas o declaradas no reparables al titular o tutor responsable.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 flex-wrap border ${
          mensaje.tipo === 'exito'
            ? 'bg-green-50 border-green-100 text-green-700'
            : 'bg-red-50 border-red-100 text-[#E03C31]'
        }`}>
          <div className="flex items-center gap-2">
            {mensaje.tipo === 'exito' ? <Check className="w-4 h-4 shrink-0 text-green-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{mensaje.texto}</span>
          </div>
          {mensaje.tipo === 'exito' && ultimoComprobanteEgreso && (
            <button
              type="button"
              onClick={() => imprimirComprobante(ultimoComprobanteEgreso)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprobante de Retiro (Opcional)
            </button>
          )}
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
              placeholder="Filtrar por serie, DNI, nombre de alumno/docente, tutor o escuela..."
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

        {/* Filtros por tiempo: Día, Semana, Mes, Todos */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tiempo:
          </span>
          <button
            type="button"
            onClick={() => setFiltroTiempo('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroTiempo === 'todos'
                ? 'bg-[#FF8200] text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtroTiempo === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {repairs.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroTiempo('dia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroTiempo === 'dia'
                ? 'bg-[#FF8200] text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hoy / Día
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtroTiempo === 'dia' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countDia}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroTiempo('semana')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroTiempo === 'semana'
                ? 'bg-[#FF8200] text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Esta Semana
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtroTiempo === 'semana' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countSemana}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroTiempo('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroTiempo === 'mes'
                ? 'bg-[#FF8200] text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Este Mes
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filtroTiempo === 'mes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countMes}
            </span>
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
            <p className="text-slate-400 text-sm">No hay equipos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRepairs.map((repair) => {
              const isAlumno = (repair.tipoBeneficiario ?? 1) === 1;
              const rolLabel = getRolLabel(repair.tipoBeneficiario);
              const telContacto = repair.tutorResponsableTelefono || repair.telefonoTutor;
              return (
                <div key={repair.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-900 font-bold text-sm">{repair.numeroSerie}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        repair.estado === 'Listo_Para_Retirar'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-100 text-[#E03C31]'
                      }`}>
                        {repair.estado === 'Listo_Para_Retirar' ? 'Reparado — Listo' : 'No Reparable'}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200/80 text-slate-700">
                        {rolLabel}
                      </span>
                      {repair.programaEducativoNombre && (
                        <span className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded font-medium">
                          {repair.programaEducativoNombre}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Ingreso: {new Date(repair.fechaIngreso).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                      <span>
                        <span className="font-semibold text-slate-700">{isAlumno ? 'Alumno (Titular)' : rolLabel}:</span>{' '}
                        {repair.alumnoNombreCompleto || repair.nombreTutor}{' '}
                        {(repair.alumnoDni || repair.titularDni) && (
                          <span className="text-slate-400 font-mono">(DNI: {repair.alumnoDni || repair.titularDni})</span>
                        )}
                      </span>
                      <span>
                        <span className="font-semibold text-slate-700">Equipo:</span> {repair.marcaModelo}
                      </span>

                      {isAlumno && (
                        <span>
                          <span className="font-semibold text-slate-700">Tutor Responsable:</span>{' '}
                          {repair.tutorResponsableNombre ? (
                            <>
                              {repair.tutorResponsableNombre}{' '}
                              {repair.tutorResponsableDni && <span className="text-slate-400 font-mono">(DNI: {repair.tutorResponsableDni})</span>}
                            </>
                          ) : (
                            <span className="text-amber-600 font-medium">Pendiente de completar</span>
                          )}
                        </span>
                      )}

                      {repair.personaEntregaNombre && (
                        <span>
                          <span className="font-semibold text-slate-700">Presentó al ingreso:</span>{' '}
                          <span className="text-slate-800">{repair.personaEntregaNombre}</span>{' '}
                          <span className="text-slate-400 font-medium">({repair.personaEntregaParentesco || 'Entregó'})</span>
                        </span>
                      )}

                      <span>
                        <span className="font-semibold text-slate-700">Teléfono:</span>{' '}
                        {telContacto ? (
                          <span className="font-medium text-slate-800">{telContacto}</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Sin teléfono (Obligatorio al entregar)</span>
                        )}
                      </span>

                      {repair.escuelaNombre && (
                        <span>
                          <span className="font-semibold text-slate-700">Escuela:</span> {repair.escuelaNombre}
                        </span>
                      )}

                      <span>
                        <span className="font-semibold text-slate-700">Falla / Diagnóstico:</span>{' '}
                        {repair.diagnostico || repair.fallaReportada}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => abrirModalEntrega(repair)}
                    className="bg-[#FF8200] hover:bg-[#e07200] text-white font-medium px-5 py-2.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fade-in">
          <form onSubmit={handleEntregar} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Entrega de Equipo</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">Serie: {selectedRepair.numeroSerie} — {selectedRepair.marcaModelo}</p>
              </div>
              <button type="button" onClick={() => setSelectedRepair(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorModal && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#E03C31] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorModal}
              </div>
            )}

            {/* Información del Titular / Alumno y Tutor Registrado */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF8200]" />
                  Datos del {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? 'Alumno (Titular)' : getRolLabel(selectedRepair.tipoBeneficiario)}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800">
                  {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? 'Alumno' : getRolLabel(selectedRepair.tipoBeneficiario)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nombre y Apellido</span>
                  <span className="font-semibold text-slate-900">{selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DNI</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedRepair.alumnoDni || selectedRepair.titularDni || 'No registrado'}</span>
                </div>
                {selectedRepair.escuelaNombre && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Escuela</span>
                    <span className="font-medium text-slate-700">{selectedRepair.escuelaNombre}</span>
                  </div>
                )}
              </div>

              {(selectedRepair.tipoBeneficiario ?? 1) === 1 && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Tutor Responsable Registrado en Padrón
                  </span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">
                      {selectedRepair.tutorResponsableNombre || 'No registrado'}
                      {selectedRepair.tutorResponsableDni && ` (DNI: ${selectedRepair.tutorResponsableDni})`}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {selectedRepair.tutorResponsableTelefono || selectedRepair.telefonoTutor || 'Sin teléfono'}
                    </span>
                  </div>
                </div>
              )}

              {selectedRepair.personaEntregaNombre && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Presentó en depósito al momento del ingreso
                  </span>
                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-medium">
                      {selectedRepair.personaEntregaNombre}{' '}
                      {selectedRepair.personaEntregaDni && `(DNI: ${selectedRepair.personaEntregaDni})`}
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                      {selectedRepair.personaEntregaParentesco || 'Entregó'}
                    </span>
                  </div>
                  {selectedRepair.docIdentidadIngresoUrl && (
                    <div className="pt-1">
                      <a
                        href={selectedRepair.docIdentidadIngresoUrl.startsWith('http') ? selectedRepair.docIdentidadIngresoUrl : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadIngresoUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#FF8200] hover:underline font-bold flex items-center gap-1"
                      >
                        📄 Ver DNI escaneado al ingreso
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Persona que Retira el Equipo en Depósito + Escaneo DNI + Firma */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-[#FF8200]" />
                  <span className="font-bold text-slate-900 text-xs">¿Quién retira el equipo ahora?</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap">
                  {(selectedRepair.tipoBeneficiario ?? 1) === 1 ? (
                    <button
                      type="button"
                      onClick={() => aplicarPersonaRetiro('Tutor')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        personaRetiroTipo === 'Tutor' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Es el Tutor Responsable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => aplicarPersonaRetiro('Alumno')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        personaRetiroTipo === 'Alumno' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Es el Titular
                    </button>
                  )}
                  {selectedRepair.personaEntregaNombre && (
                    <button
                      type="button"
                      onClick={() => aplicarPersonaRetiro('MismaPersonaEntrega')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        personaRetiroTipo === 'MismaPersonaEntrega' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Misma persona que entregó (${selectedRepair.personaEntregaNombre})`}
                    >
                      Misma que entregó
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => aplicarPersonaRetiro('Tercero')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      personaRetiroTipo === 'Tercero' ? 'bg-[#FF8200] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tercero / Familiar Autorizado
                  </button>
                </div>
              </div>

              {personaRetiroTipo === 'Tercero' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    El equipo es retirado por un tercero o familiar autorizado. Complete sus datos a continuación:
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nombre y Apellido de quien retira *</label>
                  <input
                    required
                    type="text"
                    placeholder="Nombre completo"
                    value={personaRetiroNombre}
                    onChange={(e) => setPersonaRetiroNombre(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">DNI de quien retira *</label>
                  <input
                    required
                    type="text"
                    placeholder="DNI"
                    value={personaRetiroDni}
                    onChange={(e) => setPersonaRetiroDni(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Teléfono de Contacto *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: 2644123456"
                    value={personaRetiroTelefono || telefonoEntrega}
                    onChange={(e) => {
                      setPersonaRetiroTelefono(e.target.value);
                      setTelefonoEntrega(e.target.value);
                    }}
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Parentesco / Relación {personaRetiroTipo === 'Tercero' && '*'}
                  </label>
                  <input
                    required={personaRetiroTipo === 'Tercero'}
                    type="text"
                    placeholder="Ej: Madre, Tío, Hermano mayor, Autorizado..."
                    value={personaRetiroParentesco}
                    onChange={(e) => setPersonaRetiroParentesco(e.target.value)}
                    className={`w-full rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF8200] transition-colors ${
                      personaRetiroTipo === 'Tercero' ? 'bg-white border border-blue-300 ring-1 ring-blue-100' : 'bg-white border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <DocumentoIdentidadSection
                documentoBase64={docIdentidadEntregaBase64}
                onDocumentoChange={setDocIdentidadEntregaBase64}
                onDniParsed={handleDniEscaneadoQuienRetira}
                label="Digitalización del DNI de quien retira"
                descripcion="Escanee el DNI con pistola de código de barras, tome foto con la cámara o suba el archivo para la constancia digital."
              />

              <DigitalSignatureCanvas
                onSignatureChange={setFirmaEntregaBase64}
                title="Firma Digital de Recepción y Conformidad"
                subtitle="Firma en pantalla (dedo o ratón). Reemplaza la firma en papel y queda registrada en el expediente de la notebook."
              />
            </div>

            {/* Resumen Técnico */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 border-b border-slate-200/60 pb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FF8200]" />
                Detalle Técnico de la Reparación
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Falla reportada</span>
                <span className="text-slate-700 font-medium text-right">{selectedRepair.fallaReportada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Diagnóstico técnico</span>
                <span className="text-slate-700 font-medium text-right">{selectedRepair.diagnostico || 'Sin diagnóstico'}</span>
              </div>
              {selectedRepair.accionesRealizadas && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Acciones realizadas</span>
                  <span className="text-slate-700 font-medium text-right">{selectedRepair.accionesRealizadas}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />Ubicación Depósito</span>
                <span className="font-semibold text-[#FF8200]">{selectedRepair.ubicacionDepositoCodigo || 'Área Sistemas'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRepair(null)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-xs border border-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !telefonoEntrega.trim()}
                className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold px-6 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entregar y Archivar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

