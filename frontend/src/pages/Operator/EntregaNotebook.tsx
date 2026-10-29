import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { Search, RefreshCw, Laptop, User, MapPin, AlertTriangle, Check, Loader2, X, Calendar, Phone, Building2, FileText } from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';

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

  // Campos editables/obligatorios en el modal de entrega
  const [telefonoEntrega, setTelefonoEntrega] = useState('');
  const [tutorNombreEntrega, setTutorNombreEntrega] = useState('');
  const [tutorDniEntrega, setTutorDniEntrega] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const abrirModalEntrega = (repair: Reparacion) => {
    setSelectedRepair(repair);
    setTelefonoEntrega(repair.tutorResponsableTelefono || repair.telefonoTutor || '');
    setTutorNombreEntrega(repair.tutorResponsableNombre || '');
    setTutorDniEntrega(repair.tutorResponsableDni || '');
    setErrorModal('');
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
          tipoBeneficiario: 1, tutorResponsableNombre: 'María Gómez', tutorResponsableDni: '28111222',
          telefonoTutor: '+542644556677', escuelaNombre: 'Escuela Normal Superior Sarmiento',
          programaEducativoNombre: 'Maestros de América', estado: 'Listo_Para_Retirar',
          fallaReportada: 'No se conecta al Wi-Fi.', diagnostico: 'Placa Wi-Fi dañada.',
          accionesRealizadas: 'Se reemplazó módulo Wi-Fi.', fechaIngreso: '2026-06-10T10:00:00Z'
        },
        {
          id: 'mock-reparacion-2', equipoId: 'eq-2', numeroSerie: 'S-EDU-39988776-X',
          marcaModelo: 'Dell Notebook', nombreTutor: 'Laura Silvestri', titularDni: '30988776',
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
    if (!cleanPhone) {
      setErrorModal('El número de teléfono de contacto es obligatorio para registrar la entrega.');
      return;
    }

    const isAlumno = (selectedRepair.tipoBeneficiario ?? 1) === 1;
    if (isAlumno && (!tutorNombreEntrega.trim() || !tutorDniEntrega.trim())) {
      setErrorModal('Para un alumno, el nombre y DNI del tutor responsable son obligatorios.');
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
          observaciones: isAlumno
            ? `Entregado al tutor ${tutorNombreEntrega.trim()} (DNI: ${tutorDniEntrega.trim()}) - Tel: ${cleanPhone}.`
            : `Entregado al titular ${selectedRepair.nombreTutor} (DNI: ${selectedRepair.titularDni || '-'}) - Tel: ${cleanPhone}.`,
          telefonoContacto: cleanPhone,
          tutorNombre: isAlumno ? tutorNombreEntrega.trim() : null,
          tutorDni: isAlumno ? tutorDniEntrega.trim() : null
        })
      });
      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: `Equipo ${selectedRepair.numeroSerie} entregado correctamente.` });
        
        imprimirComprobante({
          tipo: 'Egreso',
          numeroMovimiento: selectedRepair.id.substring(0, 8).toUpperCase(),
          fecha: new Date().toISOString(),
          escuela: selectedRepair.escuelaNombre || selectedRepair.ubicacionDepositoCodigo || 'Depósito',
          operador: nombreOperador,
          motivo: selectedRepair.estado === 'Listo_Para_Retirar' ? 'Entrega de equipo reparado' : 'Devolución de equipo no reparable',
          tutor: {
            nombre: isAlumno ? `${tutorNombreEntrega.trim()} (Alumno: ${selectedRepair.nombreTutor})` : selectedRepair.nombreTutor,
            dni: isAlumno ? tutorDniEntrega.trim() : (selectedRepair.titularDni || '-'),
            telefono: cleanPhone
          },
          equipos: [{
            numeroSerie: selectedRepair.numeroSerie,
            marcaModelo: selectedRepair.marcaModelo,
            estado: 'Entregado',
            fallaReportada: selectedRepair.fallaReportada,
            diagnostico: selectedRepair.diagnostico
          }]
        });
        
        setSelectedRepair(null);
        fetchRepairsToDeliver();
      } else {
        setMensaje({ tipo: 'error', texto: 'No se pudo registrar la entrega.' });
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
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
          mensaje.tipo === 'exito'
            ? 'bg-green-50 border-green-100 text-green-700'
            : 'bg-red-50 border-red-100 text-[#E03C31]'
        }`}>
          {mensaje.tipo === 'exito' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {mensaje.texto}
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
                        <span className="font-semibold text-slate-700">{rolLabel}:</span> {repair.nombreTutor}{' '}
                        {repair.titularDni && <span className="text-slate-400 font-mono">(DNI: {repair.titularDni})</span>}
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

            {/* Información del Titular / Alumno */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF8200]" />
                  Datos del {getRolLabel(selectedRepair.tipoBeneficiario)}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800">
                  {getRolLabel(selectedRepair.tipoBeneficiario)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Nombre y Apellido</span>
                <span className="font-semibold text-slate-800">{selectedRepair.nombreTutor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DNI</span>
                <span className="font-mono font-semibold text-slate-800">{selectedRepair.titularDni || 'No registrado'}</span>
              </div>
              {selectedRepair.escuelaNombre && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />Escuela</span>
                  <span className="font-medium text-slate-700 text-right">{selectedRepair.escuelaNombre}</span>
                </div>
              )}
              {selectedRepair.programaEducativoNombre && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Programa</span>
                  <span className="font-medium text-slate-700">{selectedRepair.programaEducativoNombre}</span>
                </div>
              )}
            </div>

            {/* Datos del Tutor (si es Alumno) + Teléfono Obligatorio */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              {(selectedRepair.tipoBeneficiario ?? 1) === 1 && (
                <div className="space-y-2.5 pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Datos del Tutor que Retira</span>
                    <span className="text-[10px] text-[#FF8200] font-semibold">Obligatorio para Alumnos</span>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Nombre y Apellido del Tutor *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ingrese nombre completo del tutor"
                      value={tutorNombreEntrega}
                      onChange={(e) => setTutorNombreEntrega(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#FF8200]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">DNI del Tutor *</label>
                    <input
                      required
                      type="text"
                      placeholder="DNI del tutor"
                      value={tutorDniEntrega}
                      onChange={(e) => setTutorDniEntrega(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#FF8200]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#FF8200]" /> Número de Teléfono de Contacto *</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Campo Obligatorio</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: 2644123456"
                  value={telefonoEntrega}
                  onChange={(e) => setTelefonoEntrega(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#FF8200]"
                />
              </div>
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

