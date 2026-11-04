import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import {
  History, RefreshCw, CheckCircle2, AlertTriangle,
  Laptop, Calendar, Printer, Eye,
  ShieldCheck, School
} from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';
import { FiltrosHistorialEntregas } from '../../components/Historial/FiltrosHistorialEntregas';
import type { FiltroResultado, FiltroTiempo } from '../../components/Historial/FiltrosHistorialEntregas';
import { ModalDetalleEntrega } from '../../components/Historial/ModalDetalleEntrega';

interface HistorialEntregasProps {
  token: string;
  nombreUsuario: string;
  userRol: string;
}

export const HistorialEntregas: React.FC<HistorialEntregasProps> = ({ token, nombreUsuario }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroResultado, setFiltroResultado] = useState<FiltroResultado>('todos');
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('todos');
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroEscuela, setFiltroEscuela] = useState('');

  // Catálogos
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);

  // Modal de Detalle
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);
  const [historialMovimientos, setHistorialMovimientos] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Modal de visualización de imagen/documento escaneado
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  useEffect(() => {
    fetchEntregas();
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    try {
      const [resEscuelas, resProgramas] = await Promise.all([
        fetch(`${API_BASE_URL}/Escuelas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ProgramasEducativos`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resEscuelas.ok) setEscuelas(await resEscuelas.json());
      if (resProgramas.ok) setProgramas(await resProgramas.json());
    } catch {
      // Ignorar fallback
    }
  };

  const fetchEntregas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones?estado=Entregado`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (repair: Reparacion) => {
    setSelectedRepair(repair);
    setLoadingHistorial(true);
    try {
      const res = await fetch(`${API_BASE_URL}/Reparaciones/${repair.id}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistorialMovimientos(await res.json());
      } else {
        setHistorialMovimientos([]);
      }
    } catch {
      setHistorialMovimientos([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleReimprimirComprobante = (repair: Reparacion) => {
    const tutorNombre = repair.personaRetiroNombre || repair.tutorResponsableNombre || repair.nombreTutor || 'Tutor Responsable';
    const tutorDni = repair.personaRetiroDni || repair.tutorResponsableDni || repair.titularDni || '';
    const tutorTel = repair.personaRetiroTelefono || repair.tutorResponsableTelefono || repair.telefonoTutor || '';
    const alumnoNom = repair.alumnoNombreCompleto || repair.nombreTutor || '';

    const esReparada = repair.fueReparado !== false && repair.resultadoEntrega !== 'No Reparable';

    imprimirComprobante({
      tipo: 'Egreso',
      numeroMovimiento: `EGR-${repair.numeroSerie}`,
      fecha: repair.fechaEntrega ? new Date(repair.fechaEntrega).toLocaleString('es-AR') : new Date().toLocaleString('es-AR'),
      escuela: repair.escuelaNombre || 'Ministerio de Educación',
      operador: nombreUsuario,
      motivo: esReparada
        ? `Devolución formal de notebook reparada a satisfacción del titular/tutor.`
        : `Devolución formal de equipo diagnosticado como NO REPARABLE.`,
      tutor: {
        nombre: tutorNombre,
        dni: tutorDni,
        telefono: tutorTel,
        alumno: alumnoNom,
        personaEntregaRetiro: repair.personaRetiroNombre,
        parentesco: repair.personaRetiroParentesco || 'Tutor Responsable'
      },
      equipos: [{
        numeroSerie: repair.numeroSerie,
        marcaModelo: repair.marcaModelo,
        estado: esReparada ? 'Reparada' : 'No Reparable',
        fallaReportada: repair.fallaReportada,
        diagnostico: repair.diagnostico || (esReparada ? 'Equipo reacondicionado y funcional.' : 'Sin posibilidad de reparación.'),
        proveedor: repair.proveedorGarantia,
        remitoGuia: repair.remitoGarantia
      }]
    });
  };

  const filteredRepairs = repairs.filter(r => {
    const esReparada = r.fueReparado !== false && r.resultadoEntrega !== 'No Reparable';

    if (filtroResultado === 'reparados' && !esReparada) return false;
    if (filtroResultado === 'no_reparables' && esReparada) return false;

    if (filtroPrograma && r.programaEducativoId !== filtroPrograma) return false;
    if (filtroEscuela && r.escuelaId !== filtroEscuela) return false;

    if (filtroTiempo !== 'todos' && r.fechaEntrega) {
      const fechaEnt = new Date(r.fechaEntrega);
      const ahora = new Date();
      if (filtroTiempo === 'hoy') {
        if (fechaEnt.toDateString() !== ahora.toDateString()) return false;
      } else if (filtroTiempo === 'semana') {
        const hace7Dias = new Date();
        hace7Dias.setDate(ahora.getDate() - 7);
        if (fechaEnt < hace7Dias) return false;
      } else if (filtroTiempo === 'mes') {
        if (fechaEnt.getMonth() !== ahora.getMonth() || fechaEnt.getFullYear() !== ahora.getFullYear()) return false;
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchSerie = r.numeroSerie?.toLowerCase().includes(term);
      const matchAlumno = r.alumnoNombreCompleto?.toLowerCase().includes(term);
      const matchAlumnoDni = r.alumnoDni?.includes(term);
      const matchTutor = r.tutorResponsableNombre?.toLowerCase().includes(term) || r.nombreTutor?.toLowerCase().includes(term);
      const matchTutorDni = r.tutorResponsableDni?.includes(term) || r.titularDni?.includes(term);
      const matchRetirado = r.personaRetiroNombre?.toLowerCase().includes(term);
      const matchRetiradoDni = r.personaRetiroDni?.includes(term);
      const matchEscuela = r.escuelaNombre?.toLowerCase().includes(term);

      if (!matchSerie && !matchAlumno && !matchAlumnoDni && !matchTutor && !matchTutorDni && !matchRetirado && !matchRetiradoDni && !matchEscuela) {
        return false;
      }
    }

    return true;
  });

  const totalEntregadas = repairs.length;
  const totalReparadas = repairs.filter(r => r.fueReparado !== false && r.resultadoEntrega !== 'No Reparable').length;
  const totalNoReparables = repairs.filter(r => r.fueReparado === false || r.resultadoEntrega === 'No Reparable').length;
  const ahora = new Date();
  const entregadasEsteMes = repairs.filter(r => {
    if (!r.fechaEntrega) return false;
    const f = new Date(r.fechaEntrega);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-[#FF8200] rounded-xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Historial de Equipos Entregados</h1>
              <p className="text-sm text-slate-500">Registro histórico de todas las computadoras devueltas (reparadas y no reparables).</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntregas}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF8200]' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Entregadas</p>
            <p className="text-2xl font-bold text-slate-800">{totalEntregadas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Reparadas con Éxito</p>
            <p className="text-2xl font-bold text-emerald-700">{totalReparadas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">No Reparables</p>
            <p className="text-2xl font-bold text-rose-700">{totalNoReparables}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-orange-50 text-[#FF8200] rounded-lg shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Entregadas este Mes</p>
            <p className="text-2xl font-bold text-[#FF8200]">{entregadasEsteMes}</p>
          </div>
        </div>
      </div>

      <FiltrosHistorialEntregas
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filtroResultado={filtroResultado}
        setFiltroResultado={setFiltroResultado}
        filtroTiempo={filtroTiempo}
        setFiltroTiempo={setFiltroTiempo}
        filtroPrograma={filtroPrograma}
        setFiltroPrograma={setFiltroPrograma}
        filtroEscuela={filtroEscuela}
        setFiltroEscuela={setFiltroEscuela}
        totalRepairs={repairs.length}
        totalReparadas={totalReparadas}
        totalNoReparables={totalNoReparables}
        programas={programas}
        escuelas={escuelas}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-[#FF8200]" />
            <p className="text-sm font-medium">Cargando historial de entregas...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Laptop className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-base font-semibold text-slate-700">No se encontraron entregas</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || filtroResultado !== 'todos' || filtroTiempo !== 'todos'
                ? 'Ninguna entrega coincide con los filtros especificados.'
                : 'Aún no se han registrado entregas de computadoras.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Equipo / Serie</th>
                  <th className="py-3 px-4">Beneficiario / Escuela</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Retirado Por</th>
                  <th className="py-3 px-4">Fechas</th>
                  <th className="py-3 px-4">Constancias</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRepairs.map((repair) => {
                  const esReparada = repair.fueReparado !== false && repair.resultadoEntrega !== 'No Reparable';
                  const fechaIng = new Date(repair.fechaIngreso);
                  const fechaEnt = repair.fechaEntrega ? new Date(repair.fechaEntrega) : null;

                  let diasTardo: number | null = null;
                  if (fechaEnt) {
                    const diffTime = Math.abs(fechaEnt.getTime() - fechaIng.getTime());
                    diasTardo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }

                  const personaRetiro = repair.personaRetiroNombre || repair.tutorResponsableNombre || repair.nombreTutor || 'No especificado';
                  const parentescoRetiro = repair.personaRetiroParentesco || (repair.tipoBeneficiario === 1 ? 'Tutor Responsable' : 'Titular');

                  return (
                    <tr key={repair.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {repair.numeroSerie}
                        </div>
                        <div className="text-xs text-slate-600 font-medium truncate max-w-[180px]">
                          {repair.marcaModelo}
                        </div>
                        {repair.programaEducativoNombre && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {repair.programaEducativoNombre}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs truncate max-w-[200px]">
                          {repair.alumnoNombreCompleto || repair.nombreTutor}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          DNI {repair.alumnoDni || repair.titularDni}
                        </div>
                        {repair.escuelaNombre && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                            <School className="w-3 h-3 text-slate-400 shrink-0" />
                            {repair.escuelaNombre}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {esReparada ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Reparada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            No Reparable
                          </span>
                        )}
                        {repair.fallaCatalogoNombre && (
                          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">
                            {repair.fallaCatalogoNombre}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs truncate max-w-[180px]">
                          {personaRetiro}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {repair.personaRetiroDni ? `DNI ${repair.personaRetiroDni}` : (repair.tutorResponsableDni ? `DNI ${repair.tutorResponsableDni}` : '')}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {parentescoRetiro}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-700">
                          <span className="font-bold text-emerald-700">Egreso:</span> {fechaEnt ? fechaEnt.toLocaleDateString('es-AR') : '-'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          <span>Ingreso:</span> {fechaIng.toLocaleDateString('es-AR')}
                        </div>
                        {diasTardo !== null && (
                          <span className="inline-block text-[10px] text-slate-400 font-medium mt-0.5">
                            {diasTardo === 0 ? 'Mismo día' : `${diasTardo} día(s)`}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          {repair.firmaEntregaBase64 ? (
                            <button
                              onClick={() => {
                                setPreviewDocUrl(repair.firmaEntregaBase64!);
                                setPreviewDocTitle(`Firma de Retiro - Serie ${repair.numeroSerie}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-all"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Firma Digital
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin firma digital</span>
                          )}

                          {repair.docIdentidadEntregaUrl ? (
                            <button
                              onClick={() => {
                                const fullUrl = repair.docIdentidadEntregaUrl!.startsWith('http')
                                  ? repair.docIdentidadEntregaUrl!
                                  : `${API_BASE_URL.replace('/api/v1', '')}${repair.docIdentidadEntregaUrl}`;
                                setPreviewDocUrl(fullUrl);
                                setPreviewDocTitle(`DNI de Quien Retiró - Serie ${repair.numeroSerie}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-all"
                            >
                              <Eye className="w-3 h-3 text-blue-600" />
                              Ver DNI
                            </button>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerDetalle(repair)}
                            className="p-1.5 text-slate-500 hover:text-[#FF8200] hover:bg-orange-50 rounded-lg transition-all"
                            title="Ver detalles completos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReimprimirComprobante(repair)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Reimprimir Comprobante de Egreso"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalDetalleEntrega
        selectedRepair={selectedRepair}
        onClose={() => setSelectedRepair(null)}
        historialMovimientos={historialMovimientos}
        loadingHistorial={loadingHistorial}
        onReimprimirComprobante={handleReimprimirComprobante}
        previewDocUrl={previewDocUrl}
        previewDocTitle={previewDocTitle}
        onOpenPreviewDoc={(url, title) => {
          setPreviewDocUrl(url);
          setPreviewDocTitle(title);
        }}
        onClosePreviewDoc={() => setPreviewDocUrl(null)}
      />
    </div>
  );
};
