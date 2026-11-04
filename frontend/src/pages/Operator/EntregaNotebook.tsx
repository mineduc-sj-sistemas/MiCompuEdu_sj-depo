import React, { useState, useEffect, useMemo } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { Search, RefreshCw, Laptop, AlertTriangle, Check, Loader2, Calendar, Printer } from 'lucide-react';
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
    setMensaje({ tipo: '', texto: '' });
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

    const finalRetiroNombre = personaRetiroNombre.trim() || (isAlumno ? tutorNombreEntrega.trim() : selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor);
    const finalRetiroDni = personaRetiroDni.trim() || (isAlumno ? tutorDniEntrega.trim() : selectedRepair.alumnoDni || selectedRepair.titularDni || '-');
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
          motivo: selectedRepair.estado === 'Listo_Para_Retirar' ? 'Entrega de equipo reparado' : 'Devolución de equipo no reparable',
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

  const countDia = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= startOfToday).length;
  const countSemana = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= sevenDaysAgo).length;
  const countMes = repairs.filter((r) => new Date(r.fechaIngreso).getTime() >= thirtyDaysAgo).length;

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
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
  }, [repairs, searchTerm, filtroTiempo, startOfToday, sevenDaysAgo, thirtyDaysAgo]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registrar Entrega de Notebook</h2>
        <p className="text-slate-400 mt-1 text-xs">Busca y entrega notebooks reparadas o declaradas no reparables al titular o tutor responsable.</p>
      </div>

      {mensaje.texto && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 flex-wrap border ${
            mensaje.tipo === 'exito' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-[#E03C31]'
          }`}
        >
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
              Imprimir Comprobante de Retiro
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

        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tiempo:
          </span>
          {(['todos', 'dia', 'semana', 'mes'] as FiltroTiempo[]).map((f) => {
            const counts: Record<FiltroTiempo, number> = { todos: repairs.length, dia: countDia, semana: countSemana, mes: countMes };
            const labels: Record<FiltroTiempo, string> = { todos: 'Todos', dia: 'Hoy / Día', semana: 'Esta Semana', mes: 'Este Mes' };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFiltroTiempo(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTiempo === f ? 'bg-[#FF8200] text-white shadow-sm font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[f]}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filtroTiempo === f ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF8200]" />
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
                <div
                  key={repair.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-900 font-bold text-sm">{repair.numeroSerie}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          repair.estado === 'Listo_Para_Retirar' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-100 text-[#E03C31]'
                        }`}
                      >
                        {repair.estado === 'Listo_Para_Retirar' ? 'Reparado — Listo' : 'No Reparable'}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200/80 text-slate-700">{rolLabel}</span>
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
                        {(repair.alumnoDni || repair.titularDni) && <span className="text-slate-400 font-mono">(DNI: {repair.alumnoDni || repair.titularDni})</span>}
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
                      <span>
                        <span className="font-semibold text-slate-700">Teléfono:</span>{' '}
                        {telContacto ? <span className="font-medium text-slate-800">{telContacto}</span> : <span className="text-amber-600 font-medium">Sin teléfono (Obligatorio al entregar)</span>}
                      </span>
                      {repair.escuelaNombre && (
                        <span>
                          <span className="font-semibold text-slate-700">Escuela:</span> {repair.escuelaNombre}
                        </span>
                      )}
                      <span>
                        <span className="font-semibold text-slate-700">Falla / Diagnóstico:</span> {repair.diagnostico || repair.fallaReportada}
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
