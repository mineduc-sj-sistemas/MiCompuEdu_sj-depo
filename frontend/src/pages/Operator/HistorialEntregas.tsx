import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { 
  History, Search, RefreshCw, CheckCircle2, AlertTriangle, 
  User, Laptop, Calendar, FileText, Printer, Eye, X, 
  Clock, ShieldCheck, ArrowRight, Phone, School
} from 'lucide-react';
import { imprimirComprobante } from '../../utils/printHelpers';

interface HistorialEntregasProps {
  token: string;
  nombreUsuario: string;
  userRol: string;
}

type FiltroResultado = 'todos' | 'reparados' | 'no_reparables';
type FiltroTiempo = 'todos' | 'hoy' | 'semana' | 'mes';

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

  // Filtrado
  const filteredRepairs = repairs.filter(r => {
    const esReparada = r.fueReparado !== false && r.resultadoEntrega !== 'No Reparable';

    if (filtroResultado === 'reparados' && !esReparada) return false;
    if (filtroResultado === 'no_reparables' && esReparada) return false;

    if (filtroPrograma && r.programaEducativoId !== filtroPrograma) return false;
    if (filtroEscuela && r.escuelaId !== filtroEscuela) return false;

    // Filtro tiempo sobre fechaEntrega
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

  // Métricas
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
      {/* Encabezado Principal */}
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

      {/* Tarjetas de Métricas */}
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

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° de serie, alumno, tutor, DNI o escuela..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF8200]/20 focus:border-[#FF8200] transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Resultado */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setFiltroResultado('todos')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filtroResultado === 'todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({repairs.length})
            </button>
            <button
              onClick={() => setFiltroResultado('reparados')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filtroResultado === 'reparados' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reparadas ({totalReparadas})
            </button>
            <button
              onClick={() => setFiltroResultado('no_reparables')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filtroResultado === 'no_reparables' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              No Reparables ({totalNoReparables})
            </button>
          </div>
        </div>

        {/* Filtros Secundarios */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Período:</span>
            <select
              value={filtroTiempo}
              onChange={(e) => setFiltroTiempo(e.target.value as FiltroTiempo)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200]"
            >
              <option value="todos">Todo el Historial</option>
              <option value="hoy">Entregadas Hoy</option>
              <option value="semana">Últimos 7 Días</option>
              <option value="mes">Este Mes</option>
            </select>
          </div>

          {programas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Programa:</span>
              <select
                value={filtroPrograma}
                onChange={(e) => setFiltroPrograma(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200]"
              >
                <option value="">Todos los programas</option>
                {programas.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {escuelas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Escuela:</span>
              <select
                value={filtroEscuela}
                onChange={(e) => setFiltroEscuela(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none focus:border-[#FF8200] max-w-xs truncate"
              >
                <option value="">Todas las escuelas</option>
                {escuelas.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || filtroResultado !== 'todos' || filtroTiempo !== 'todos' || filtroPrograma || filtroEscuela) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroResultado('todos');
                setFiltroTiempo('todos');
                setFiltroPrograma('');
                setFiltroEscuela('');
              }}
              className="text-xs text-[#FF8200] hover:underline font-semibold ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Equipos Entregados */}
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
                      {/* Equipo */}
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

                      {/* Beneficiario */}
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

                      {/* Resultado */}
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

                      {/* Retirado Por */}
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

                      {/* Fechas */}
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

                      {/* Constancias / Firmas */}
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

                      {/* Acciones */}
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

      {/* Modal de Detalle Completo de la Entrega */}
      {selectedRepair && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">Orden de Entrega #{selectedRepair.numeroSerie}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedRepair.fueReparado !== false && selectedRepair.resultadoEntrega !== 'No Reparable' ? 'Reparada' : 'No Reparable'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedRepair.marcaModelo} - {selectedRepair.programaEducativoNombre || 'Plan Conectar / Provincial'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRepair(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Sección 1: Beneficiario y Retiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Titular del Equipo
                  </p>
                  <div>
                    <p className="font-bold text-slate-800">{selectedRepair.alumnoNombreCompleto || selectedRepair.nombreTutor}</p>
                    <p className="text-xs text-slate-500">DNI: <span className="font-mono font-semibold">{selectedRepair.alumnoDni || selectedRepair.titularDni}</span></p>
                    <p className="text-xs text-slate-500">Escuela: <span className="font-medium text-slate-700">{selectedRepair.escuelaNombre || 'No informada'}</span></p>
                    {selectedRepair.tutorResponsableNombre && (
                      <p className="text-xs text-slate-500 pt-1">
                        Tutor Registrado: <span className="font-medium text-slate-700">{selectedRepair.tutorResponsableNombre} (DNI {selectedRepair.tutorResponsableDni})</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Persona que Retiró
                  </p>
                  <div>
                    <p className="font-bold text-slate-800">{selectedRepair.personaRetiroNombre || selectedRepair.tutorResponsableNombre || selectedRepair.nombreTutor}</p>
                    <p className="text-xs text-slate-500">DNI: <span className="font-mono font-semibold">{selectedRepair.personaRetiroDni || selectedRepair.tutorResponsableDni || 'No registrado'}</span></p>
                    <p className="text-xs text-slate-500">Vínculo: <span className="font-medium text-slate-700">{selectedRepair.personaRetiroParentesco || 'Tutor Responsable'}</span></p>
                    {selectedRepair.personaRetiroTelefono && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedRepair.personaRetiroTelefono}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Informe Técnico */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> Informe Técnico y Diagnóstico
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Falla Reportada en Ingreso:</span>
                    <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                      {selectedRepair.fallaReportada || 'Sin detalle de falla reportada.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Diagnóstico Técnico:</span>
                    <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                      {selectedRepair.diagnostico || 'Sin diagnóstico registrado.'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500">Acciones Realizadas / Reparación:</span>
                  <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                    {selectedRepair.accionesRealizadas || 'Sin acciones registradas.'}
                  </p>
                </div>

                {selectedRepair.observaciones && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Observaciones Generales:</span>
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 italic">
                      {selectedRepair.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Sección 3: Firmas y Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Firma Digital */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firma Digital de Recepción
                  </p>
                  {selectedRepair.firmaEntregaBase64 ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <img 
                        src={selectedRepair.firmaEntregaBase64} 
                        alt="Firma Entrega" 
                        className="max-h-28 object-contain" 
                      />
                      <span className="text-[10px] text-slate-400 font-mono mt-1">Conformidad de entrega firmada</span>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                      No se registró firma digital manuscrita.
                    </div>
                  )}
                </div>

                {/* Documento Escaneado */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Documento de Identidad
                  </p>
                  {selectedRepair.docIdentidadEntregaUrl ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center gap-2">
                      <button
                        onClick={() => {
                          const fullUrl = selectedRepair.docIdentidadEntregaUrl!.startsWith('http') 
                            ? selectedRepair.docIdentidadEntregaUrl! 
                            : `${API_BASE_URL.replace('/api/v1', '')}${selectedRepair.docIdentidadEntregaUrl}`;
                          setPreviewDocUrl(fullUrl);
                          setPreviewDocTitle(`DNI Retiro - ${selectedRepair.personaRetiroNombre || selectedRepair.numeroSerie}`);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Documento Escaneado Completo
                      </button>
                      <span className="text-[10px] text-slate-400">DNI escaneado en el momento de la entrega</span>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                      No se adjuntó escaneo de documento.
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 4: Historial de Movimientos de la Orden */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Trazabilidad de Estados
                </p>
                {loadingHistorial ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#FF8200]" />
                  </div>
                ) : historialMovimientos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay historial disponible.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {historialMovimientos.map((m: any, idx: number) => (
                      <div key={m.id || idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{m.estadoAnterior || 'Inicio'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{m.estadoNuevo}</span>
                          {m.observaciones && <span className="text-slate-500 italic truncate max-w-xs ml-2">({m.observaciones})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(m.fechaMovimiento).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Fecha entrega: {selectedRepair.fechaEntrega ? new Date(selectedRepair.fechaEntrega).toLocaleString('es-AR') : '-'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReimprimirComprobante(selectedRepair)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Comprobante Oficial
                </button>
                <button
                  onClick={() => setSelectedRepair(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Vista Previa de Documento / Firma */}
      {previewDocUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm">{previewDocTitle}</h4>
              <button 
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4 max-h-[70vh] overflow-hidden">
              <img 
                src={previewDocUrl} 
                alt="Documento" 
                className="max-h-[60vh] max-w-full object-contain rounded shadow"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-all"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
