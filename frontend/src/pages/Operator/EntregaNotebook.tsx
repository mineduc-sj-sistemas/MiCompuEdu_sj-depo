import React, { useState, useEffect, useMemo } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import {
  Search,
  RefreshCw,
  Laptop,
  AlertTriangle,
  Check,
  Loader2,
  Calendar,
  Printer,
  PackageCheck,
  CheckCircle2,
  XCircle,
  GraduationCap,
  X,
  Phone,
  MapPin,
  School,
  Wrench,
} from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';
import type { PrintData } from '../../utils/printHelpers';
import { ModalConfirmarEntrega } from '../../components/Entrega/ModalConfirmarEntrega';
import type { PersonaRetiroTipo } from '../../components/Entrega/ModalConfirmarEntrega';
import type { ScannedDniData } from '../../utils/dniParser';

interface EntregaNotebookProps {
  token: string;
  nombreOperador: string;
}

type FiltroTiempo = 'todos' | 'dia' | 'semana' | 'mes';
type FiltroEstadoEntrega = 'todos' | 'Listo_Para_Retirar' | 'No_Reparable';

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
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoEntrega>('todos');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);

  const [telefonoEntrega, setTelefonoEntrega] = useState('');
  const [tutorNombreEntrega, setTutorNombreEntrega] = useState('');
  const [tutorDniEntrega, setTutorDniEntrega] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const [personaRetiroTipo, setPersonaRetiroTipo] = useState<PersonaRetiroTipo>('Tutor');
  const [personaRetiroNombre, setPersonaRetiroNombre] = useState('');
  const [personaRetiroDni, setPersonaRetiroDni] = useState('');
  const [personaRetiroTelefono, setPersonaRetiroTelefono] = useState('');
  const [personaRetiroParentesco, setPersonaRetiroParentesco] = useState('Tutor Responsable');
  const [docIdentidadEntregaBase64, setDocIdentidadEntregaBase64] = useState<string | null>(null);
  const [firmaEntregaBase64, setFirmaEntregaBase64] = useState<string | null>(null);
  const [ultimoComprobanteEgreso, setUltimoComprobanteEgreso] = useState<PrintData | null>(null);

  const aplicarPersonaRetiro = (tipo: PersonaRetiroTipo, targetRepair?: Reparacion | null) => {
    const rep = targetRepair !== undefined ? targetRepair : selectedRepair;
    if (!rep) return;
    setPersonaRetiroTipo(tipo);
    if (tipo === 'Tutor') {
      setPersonaRetiroNombre(rep.tutorResponsableNombre || tutorNombreEntrega || rep.nombreTutor || '');
      setPersonaRetiroDni(rep.tutorResponsableDni || tutorDniEntrega || '');
      setPersonaRetiroTelefono(rep.tutorResponsableTelefono || rep.telefonoTutor || telefonoEntrega || '');
      setPersonaRetiroParentesco('Tutor Responsable');
    } else if (tipo === 'Alumno') {
      setPersonaRetiroNombre(rep.alumnoNombreCompleto || rep.nombreTutor || '');
      setPersonaRetiroDni(rep.alumnoDni || rep.titularDni || '');
      setPersonaRetiroTelefono(rep.alumnoTelefono || rep.telefonoTutor || telefonoEntrega || '');
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
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data.filter((r) => r.estado === 'Listo_Para_Retirar' || r.estado === 'No_Reparable'));
      }
    } catch {
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;

    const cleanPhone = telefonoEntrega.trim();
    const isAlumno = (selectedRepair.tipoBeneficiario ?? 1) === 1;

    const finalRetiroNombre =
      personaRetiroNombre.trim() ||
      (isAlumno ? tutorNombreEntrega.trim() : selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor);
    const finalRetiroDni =
      personaRetiroDni.trim() ||
      (isAlumno ? tutorDniEntrega.trim() : selectedRepair.alumnoDni || selectedRepair.titularDni || '-');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nuevoEstado: 'Entregado',
          observaciones: `Retirado por ${finalRetiroNombre} (DNI: ${finalRetiroDni}, ${finalRetiroParentesco}) - Tel: ${finalRetiroTelefono}.`,
          telefonoContacto: finalRetiroTelefono,
          tutorNombre: isAlumno ? tutorNombreEntrega.trim() || selectedRepair.tutorResponsableNombre || null : null,
          tutorDni: isAlumno ? tutorDniEntrega.trim() || selectedRepair.tutorResponsableDni || null : null,
          personaRetiroTipo,
          personaRetiroNombre: finalRetiroNombre,
          personaRetiroDni: finalRetiroDni,
          personaRetiroTelefono: finalRetiroTelefono,
          personaRetiroParentesco: finalRetiroParentesco,
          docIdentidadEntregaBase64: docIdentidadEntregaBase64 || firmaEntregaBase64,
        }),
      });
      if (response.ok) {
        const nombreAlumno = selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor;
        setUltimoComprobanteEgreso({
          tipo: 'Egreso' as const,
          numeroMovimiento: selectedRepair.id.substring(0, 8).toUpperCase(),
          fecha: new Date().toISOString(),
          escuela: selectedRepair.escuelaNombre || selectedRepair.ubicacionDepositoCodigo || 'Depósito Central',
          operador: nombreOperador,
          motivo:
            selectedRepair.estado === 'Listo_Para_Retirar'
              ? 'Entrega de equipo reparado'
              : 'Devolución de equipo no reparable',
          tutor: {
            nombre: finalRetiroNombre,
            dni: finalRetiroDni,
            telefono: finalRetiroTelefono,
            alumno: nombreAlumno,
            personaEntregaRetiro: finalRetiroNombre,
            parentesco: finalRetiroParentesco,
          },
          equipos: [
            {
              numeroSerie: selectedRepair.numeroSerie,
              marcaModelo: selectedRepair.marcaModelo,
              estado: 'Entregado',
              fallaReportada: selectedRepair.fallaReportada,
              diagnostico: selectedRepair.diagnostico,
            },
          ],
        });
        setMensaje({ tipo: 'exito', texto: `Equipo ${selectedRepair.numeroSerie} entregado exitosamente.` });
        setSelectedRepair(null);
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega en el servidor.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de red al registrar la entrega.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairsToDeliver();
  }, [token]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const stats = useMemo(() => {
    const total = repairs.length;
    const listos = repairs.filter((r) => r.estado === 'Listo_Para_Retirar').length;
    const noReparables = repairs.filter((r) => r.estado === 'No_Reparable').length;
    const alumnos = repairs.filter((r) => (r.tipoBeneficiario ?? 1) === 1).length;
    const countDia = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= startOfToday).length;
    const countSemana = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= sevenDaysAgo).length;
    const countMes = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= thirtyDaysAgo).length;
    return { total, listos, noReparables, alumnos, countDia, countSemana, countMes };
  }, [repairs, startOfToday, sevenDaysAgo, thirtyDaysAgo]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        r.numeroSerie.toLowerCase().includes(term) ||
        r.nombreTutor.toLowerCase().includes(term) ||
        (r.alumnoNombreCompleto && r.alumnoNombreCompleto.toLowerCase().includes(term)) ||
        (r.titularDni && r.titularDni.toLowerCase().includes(term)) ||
        (r.alumnoDni && r.alumnoDni.toLowerCase().includes(term)) ||
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
  }, [repairs, searchTerm, filtroTiempo, filtroEstado, startOfToday, sevenDaysAgo, thirtyDaysAgo]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Cabecera Institucional */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8200] to-amber-500 text-white flex items-center justify-center shadow-md shadow-[#FF8200]/25 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Registrar Entrega de Notebook
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF8200] border border-orange-200/70">
                {stats.total} {stats.total === 1 ? 'equipo para retiro' : 'equipos para retiro'}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Busque y entregue notebooks reparadas o declaradas no reparables al titular o tutor responsable.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRepairsToDeliver}
          className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all text-xs flex items-center gap-2 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF8200]' : ''}`} />
          Actualizar bandeja
        </button>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setFiltroEstado('todos')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            filtroEstado === 'todos'
              ? 'border-[#FF8200] ring-2 ring-[#FF8200]/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bandeja Salida</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF8200] flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-400">en estantería</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'Listo_Para_Retirar' ? 'todos' : 'Listo_Para_Retirar')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            filtroEstado === 'Listo_Para_Retirar'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reparados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.listos}</span>
            <span className="text-[11px] font-semibold text-emerald-600">listos para retirar</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'No_Reparable' ? 'todos' : 'No_Reparable')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            filtroEstado === 'No_Reparable'
              ? 'border-red-500 ring-2 ring-red-500/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Reparables</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.noReparables}</span>
            <span className="text-[11px] text-slate-400">para devolución</span>
          </div>
        </button>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alumnos / Doc.</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.alumnos}</span>
            <span className="text-[11px] text-slate-400">
              alumnos • {stats.total - stats.alumnos} doc.
            </span>
          </div>
        </div>
      </div>

      {mensaje.texto && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 flex-wrap border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-[#E03C31]'
          }`}
        >
          <div className="flex items-center gap-2">
            {mensaje.tipo === 'exito' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{mensaje.texto}</span>
          </div>
          {mensaje.tipo === 'exito' && ultimoComprobanteEgreso && (
            <button
              type="button"
              onClick={() => imprimirComprobante(ultimoComprobanteEgreso)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprobante de Retiro
            </button>
          )}
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm transition-all"
            placeholder="Filtrar por serie, DNI, nombre de alumno/docente, tutor o escuela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 px-2">
            <Calendar className="w-3.5 h-3.5 text-[#FF8200]" />
            Período:
          </span>
          {(['todos', 'dia', 'semana', 'mes'] as FiltroTiempo[]).map((f) => {
            const counts: Record<FiltroTiempo, number> = {
              todos: repairs.length,
              dia: stats.countDia,
              semana: stats.countSemana,
              mes: stats.countMes,
            };
            const labels: Record<FiltroTiempo, string> = {
              todos: 'Todos',
              dia: 'Hoy',
              semana: 'Semana',
              mes: 'Mes',
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFiltroTiempo(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTiempo === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labels[f]}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filtroTiempo === f ? 'bg-[#FF8200] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado de Equipos Listos para Entregar */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF8200]" />
          <p className="text-slate-400 text-xs font-medium">Cargando equipos listos para entregar...</p>
        </div>
      ) : filteredRepairs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Laptop className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No se encontraron equipos</h3>
          <p className="text-slate-400 text-xs">No hay notebooks pendientes de retiro con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRepairs.map((repair) => {
            const isAlumno = (repair.tipoBeneficiario ?? 1) === 1;
            const rolLabel = getRolLabel(repair.tipoBeneficiario);
            const telContacto = repair.tutorResponsableTelefono || repair.telefonoTutor;
            const isReparado = repair.estado === 'Listo_Para_Retirar';

            return (
              <div
                key={repair.id}
                className="bg-white border border-slate-200/90 hover:border-orange-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-slate-900 font-extrabold text-sm bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                      {repair.numeroSerie}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        isReparado
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-red-50 border-red-200 text-[#E03C31]'
                      }`}
                    >
                      {isReparado ? '✓ Reparado — Listo' : '✕ No Reparable'}
                    </span>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                      {rolLabel}
                    </span>
                    {repair.programaEducativoNombre && (
                      <span className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full font-semibold">
                        {repair.programaEducativoNombre}
                      </span>
                    )}
                    {repair.ubicacionDepositoCodigo && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3 text-[#FF8200]" />
                        {repair.ubicacionDepositoCodigo}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                      Ingreso: {new Date(repair.fechaIngreso).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-700">{isAlumno ? 'Alumno (Titular)' : rolLabel}:</span>{' '}
                      <span className="text-slate-900 font-semibold">
                        {repair.alumnoNombreCompleto || repair.nombreTutor}
                      </span>{' '}
                      {(repair.alumnoDni || repair.titularDni) && (
                        <span className="text-slate-400 font-mono">(DNI: {repair.alumnoDni || repair.titularDni})</span>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-slate-700">Equipo:</span>{' '}
                      <span className="text-slate-800">{repair.marcaModelo}</span>
                    </div>

                    {isAlumno && (
                      <div>
                        <span className="font-bold text-slate-700">Tutor Responsable:</span>{' '}
                        {repair.tutorResponsableNombre ? (
                          <span className="text-slate-800">
                            {repair.tutorResponsableNombre}{' '}
                            {repair.tutorResponsableDni && (
                              <span className="text-slate-400 font-mono">(DNI: {repair.tutorResponsableDni})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Se completa al retirar</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700">Teléfono:</span>{' '}
                      {telContacto ? (
                        <span className="font-mono font-semibold text-slate-800">{telContacto}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Obligatorio al entregar</span>
                      )}
                    </div>

                    {repair.escuelaNombre && (
                      <div className="flex items-center gap-1 truncate">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-700">Escuela:</span>{' '}
                        <span className="truncate">{repair.escuelaNombre}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 truncate">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700">Diagnóstico:</span>{' '}
                      <span className="truncate">{repair.diagnostico || repair.fallaReportada}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => abrirModalEntrega(repair)}
                  className="w-full lg:w-auto bg-[#FF8200] hover:bg-[#e07200] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm shadow-[#FF8200]/20 transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <PackageCheck className="w-4 h-4" />
                  Confirmar Entrega
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedRepair && (
        <ModalConfirmarEntrega
          selectedRepair={selectedRepair}
          loading={loading}
          errorModal={errorModal}
          telefonoEntrega={telefonoEntrega}
          setTelefonoEntrega={setTelefonoEntrega}
          personaRetiroTipo={personaRetiroTipo}
          aplicarPersonaRetiro={(t) => aplicarPersonaRetiro(t)}
          personaRetiroNombre={personaRetiroNombre}
          setPersonaRetiroNombre={setPersonaRetiroNombre}
          personaRetiroDni={personaRetiroDni}
          setPersonaRetiroDni={setPersonaRetiroDni}
          personaRetiroTelefono={personaRetiroTelefono}
          setPersonaRetiroTelefono={setPersonaRetiroTelefono}
          personaRetiroParentesco={personaRetiroParentesco}
          setPersonaRetiroParentesco={setPersonaRetiroParentesco}
          docIdentidadEntregaBase64={docIdentidadEntregaBase64}
          setDocIdentidadEntregaBase64={setDocIdentidadEntregaBase64}
          setFirmaEntregaBase64={setFirmaEntregaBase64}
          onDniScanned={handleDniEscaneadoQuienRetira}
          onSubmit={handleEntregar}
          onClose={() => setSelectedRepair(null)}
        />
      )}
    </div>
  );
};
