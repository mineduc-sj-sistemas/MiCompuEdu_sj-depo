import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { imprimirComprobante, imprimirFichaEstado, imprimirIngresoComprobante } from '../../utils/printHelpers';
import { Printer, FileText, CheckCircle2, Clock, Sparkles, Camera } from 'lucide-react';

interface PanelTecnicoProps {
  token: string;
  nombreTecnico: string;
}

const PLANTILLAS_RAPIDAS = [
  {
    label: 'Desbloqueo Juana Manso',
    icono: '🔓',
    diag: 'Bloqueo de seguridad por certificado o ciclos.',
    acciones: 'Generación de código de desbloqueo oficial y sincronización de fecha/hora de BIOS.',
    estado: 'Listo_Para_Retirar'
  },
  {
    label: 'Cambio de Pantalla',
    icono: '🖥️',
    diag: 'Display LCD quebrado o flex con falso contacto.',
    acciones: 'Reemplazo de pantalla LCD por módulo nuevo y testeo de imagen.',
    estado: 'Reparado'
  },
  {
    label: 'Cambio de Teclado',
    icono: '⌨️',
    diag: 'Teclas trabadas o matriz sin respuesta.',
    acciones: 'Sustitución de teclado y verificación completa de pulsaciones.',
    estado: 'Reparado'
  },
  {
    label: 'Reinstalación SO',
    icono: '💾',
    diag: 'Fallo de booteo o corrupción de sistema operativo.',
    acciones: 'Clonado con imagen oficial del Ministerio de Educación.',
    estado: 'Listo_Para_Retirar'
  },
  {
    label: 'Pin de Carga / Fuente',
    icono: '🔌',
    diag: 'Conector de carga averiado o cargador defectuoso.',
    acciones: 'Reparación de jack de alimentación y prueba de ciclos de carga.',
    estado: 'Reparado'
  },
  {
    label: 'Espera de Repuesto',
    icono: '⏳',
    diag: 'Requiere repuesto específico no disponible en stock.',
    acciones: 'Solicitud interna de insumos técnicos.',
    estado: 'Esperando_Repuestos'
  }
];

const ESTADOS_SOPORTE = [
  { id: 'Listo_Para_Retirar', label: 'Listo para Retirar', sub: 'Notifica WhatsApp', color: 'bg-green-600 border-green-600 text-white' },
  { id: 'Reparado', label: 'Reparado', sub: 'Listo en taller', color: 'bg-emerald-600 border-emerald-600 text-white' },
  { id: 'En_Reparacion', label: 'En Reparación', sub: 'En banco', color: 'bg-blue-600 border-blue-600 text-white' },
  { id: 'Esperando_Repuestos', label: 'Esperando Repuesto', sub: 'Insumo faltante', color: 'bg-amber-500 border-amber-500 text-white' },
  { id: 'En_Garantia_Externa', label: 'Garantía Externa', sub: 'Derivado', color: 'bg-cyan-600 border-cyan-600 text-white' },
  { id: 'No_Reparable', label: 'No Reparable', sub: 'Notifica WhatsApp', color: 'bg-red-600 border-red-600 text-white' },
];

export const PanelTecnico: React.FC<PanelTecnicoProps> = ({ token, nombreTecnico }) => {
  const [repairs, setRepairs] = useState<Reparacion[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [accionesRealizadas, setAccionesRealizadas] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('En_Diagnostico');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [evidencias, setEvidencias] = useState<any[]>([]);

  // Estados de garantía externa individuales
  const [proveedorGarantia, setProveedorGarantia] = useState('');
  const [remitoGarantia, setRemitoGarantia] = useState('');
  const [fechaEsperadaGarantia, setFechaEsperadaGarantia] = useState('');

  // Estados para modo masivo
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>([]);
  const [bulkEstado] = useState('En_Garantia_Externa');
  const [bulkProveedorGarantia, setBulkProveedorGarantia] = useState('');
  const [bulkRemitoGarantia, setBulkRemitoGarantia] = useState('');
  const [bulkFechaEsperadaGarantia, setBulkFechaEsperadaGarantia] = useState('');
  const [bulkDiagnostico, setBulkDiagnostico] = useState('');
  const [bulkObservaciones, setBulkObservaciones] = useState('');

  // Estados de filtros y catálogos
  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [escuelaFiltroId, setEscuelaFiltroId] = useState('');
  const [programaFiltroId, setProgramaFiltroId] = useState('');
  const [fallaFiltroId, setFallaFiltroId] = useState('');
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
  const [fechaFinFiltro, setFechaFinFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Cargar Catálogos para los Filtros
  useEffect(() => {
    const loadCatalogs = async () => {
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
      } catch (err) {
        console.warn('Error crítico: backend no disponible.', err);
      }
    };
    loadCatalogs();
  }, [token]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (busqueda) queryParams.append('busqueda', busqueda);
      if (escuelaFiltroId) queryParams.append('escuelaId', escuelaFiltroId);
      if (programaFiltroId) queryParams.append('programaEducativoId', programaFiltroId);
      if (fallaFiltroId) queryParams.append('fallaCatalogoId', fallaFiltroId);
      if (fechaInicioFiltro) queryParams.append('fechaInicio', new Date(fechaInicioFiltro).toISOString());
      if (fechaFinFiltro) queryParams.append('fechaFin', new Date(fechaFinFiltro).toISOString());

      const url = `${API_BASE_URL}/Reparaciones?${queryParams.toString()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data.filter(r => r.estado !== 'Entregado'));
      }
    } catch (error) {
      console.warn('API no disponible.');
      setRepairs([]);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las notebooks. Verifique la conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const [historial, setHistorial] = useState<any[]>([]);

  const handleSelectRepair = async (repair: Reparacion) => {
    setSelectedRepair(repair);
    setDiagnostico(repair.diagnostico || '');
    setAccionesRealizadas(repair.accionesRealizadas || '');
    setObservaciones(repair.observaciones || '');
    setNuevoEstado(repair.estado);
    setEvidencias(repair.evidencias || []);
    setProveedorGarantia(repair.proveedorGarantia || '');
    setRemitoGarantia(repair.remitoGarantia || '');
    setFechaEsperadaGarantia(repair.fechaEsperadaGarantia ? repair.fechaEsperadaGarantia.split('T')[0] : '');
    setMensaje({ tipo: '', texto: '' });

    try {
      const resHistorial = await fetch(`${API_BASE_URL}/Reparaciones/${repair.id}/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resHistorial.ok) {
        setHistorial(await resHistorial.json());
      } else {
        setHistorial([]);
      }
    } catch {
      setHistorial([]);
    }
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones/${selectedRepair.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nuevoEstado,
          diagnostico,
          accionesRealizadas,
          observaciones,
          proveedorGarantia: nuevoEstado === 'Apartado_Para_Garantia' || nuevoEstado === 'En_Garantia_Externa' ? proveedorGarantia : null,
          remitoGarantia: nuevoEstado === 'Apartado_Para_Garantia' || nuevoEstado === 'En_Garantia_Externa' ? remitoGarantia : null,
          fechaEsperadaGarantia: (nuevoEstado === 'Apartado_Para_Garantia' || nuevoEstado === 'En_Garantia_Externa') && fechaEsperadaGarantia ? new Date(fechaEsperadaGarantia).toISOString() : null
        })
      });

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: 'Orden de trabajo actualizada correctamente.' });
        fetchRepairs();
        
        // Refresh history
        try {
          const resHistorial = await fetch(`${API_BASE_URL}/Reparaciones/${selectedRepair.id}/historial`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resHistorial.ok) {
            setHistorial(await resHistorial.json());
          }
        } catch {}

        setSelectedRepair(prev => prev ? {
          ...prev,
          estado: nuevoEstado,
          diagnostico,
          accionesRealizadas,
          observaciones,
          proveedorGarantia,
          remitoGarantia,
          fechaEsperadaGarantia: fechaEsperadaGarantia ? new Date(fechaEsperadaGarantia).toISOString() : undefined
        } : null);
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al actualizar la orden en el servidor.' });
      }
    } catch (error) {
      setRepairs(prev => prev.map(r => r.id === selectedRepair.id 
        ? {
            ...r,
            estado: nuevoEstado,
            diagnostico,
            accionesRealizadas,
            observaciones,
            proveedorGarantia,
            remitoGarantia,
            fechaEsperadaGarantia: fechaEsperadaGarantia ? new Date(fechaEsperadaGarantia).toISOString() : undefined
          } 
        : r
      ));
      setMensaje({ tipo: 'exito', texto: `[SIMULACIÓN] Cambios guardados localmente. Estado: ${nuevoEstado}` });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDerive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRepairIds.length === 0) return;

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedRepairIds) {
      try {
        const response = await fetch(`${API_BASE_URL}/Reparaciones/${id}/estado`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nuevoEstado: bulkEstado,
            diagnostico: bulkDiagnostico || 'Derivado a garantía externa.',
            accionesRealizadas: 'Ninguna (derivación a garantía externa).',
            observaciones: bulkObservaciones,
            proveedorGarantia: bulkProveedorGarantia,
            remitoGarantia: bulkRemitoGarantia,
            fechaEsperadaGarantia: bulkFechaEsperadaGarantia ? new Date(bulkFechaEsperadaGarantia).toISOString() : null
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    if (failCount === 0) {
      setMensaje({ tipo: 'exito', texto: `Se derivaron ${successCount} equipos exitosamente.` });
      setSelectedRepairIds([]);
      fetchRepairs();
    } else {
      setMensaje({ tipo: 'error', texto: `Derivación completada con detalles. Éxitos: ${successCount}, Fallas: ${failCount}.` });
      fetchRepairs();
    }
    setLoading(false);
  };

  const handleGenerateRemito = () => {
    const selectedRepairs = repairs.filter(r => selectedRepairIds.includes(r.id));
    if (selectedRepairs.length === 0) {
      alert("Seleccione al menos un equipo para generar el remito.");
      return;
    }
    
    imprimirComprobante({
      tipo: 'Derivación',
      numeroMovimiento: bulkRemitoGarantia || 'TEMP-' + Date.now(),
      fecha: new Date().toISOString(),
      operador: nombreTecnico,
      motivo: bulkEstado === 'En_Garantia_Externa' ? 'Derivación a Garantía Externa' : 'Apartado para Garantía',
      equipos: selectedRepairs.map(r => ({
        numeroSerie: r.numeroSerie,
        marcaModelo: r.marcaModelo,
        estado: r.estado,
        fallaReportada: r.fallaReportada,
        diagnostico: bulkDiagnostico || r.diagnostico,
        proveedor: bulkProveedorGarantia || r.proveedorGarantia,
        remitoGuia: bulkRemitoGarantia || r.remitoGarantia
      }))
    });
  };

  const triggerFileInput = () => {
    document.getElementById('file-evidence-upload')?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRepair) return;

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/Reparaciones/${selectedRepair.id}/evidencias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const nuevaEvidencia = await response.json();
        setEvidencias(prev => [...prev, nuevaEvidencia]);
        setMensaje({ tipo: 'exito', texto: 'Archivo de evidencia cargado exitosamente al servidor.' });
      } else {
        setMensaje({ tipo: 'error', texto: `Error en la subida: ${await response.text()}` });
      }
    } catch (err) {
      console.warn('Error al subir evidencia. Usando fallback local.', err);
      const mockUrl = URL.createObjectURL(file);
      setEvidencias(prev => [...prev, { id: 'mock-' + Date.now(), urlArchivo: mockUrl, nombreArchivo: file.name }]);
      setMensaje({ tipo: 'exito', texto: '[SIMULACIÓN] Evidencia cargada localmente en navegador.' });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [token]);

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1D252D] tracking-tight">Soporte Técnico y Garantía</h2>
          <p className="text-slate-500 mt-1 text-sm">Hola {nombreTecnico}, gestione los diagnósticos, desbloqueos y derivaciones a garantía.</p>
        </div>
        <button
          onClick={fetchRepairs}
          className="glass-card hover:bg-slate-100 text-[#1D252D] font-semibold px-4 py-2 rounded-xl transition-all text-sm flex items-center gap-2"
        >
          🔄 Actualizar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repairs List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-[#1D252D]">Notebooks Activas</h3>
            <button
              type="button"
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedRepairIds([]);
                setSelectedRepair(null);
                setMensaje({ tipo: '', texto: '' });
              }}
              className={`text-xs font-bold px-2 py-1 rounded transition-all ${
                isBulkMode
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-[#FF8200]/10 hover:bg-[#FF8200]/20 text-[#FF8200]'
              }`}
            >
              {isBulkMode ? '❌ Modo Individual' : '📦 Modo Masivo'}
            </button>
          </div>

          {/* Buscador y Filtros Avanzados */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                placeholder="Buscar serie o tutor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchRepairs(); }}
              />
              <button
                type="button"
                onClick={fetchRepairs}
                className="bg-[#FF8200] hover:bg-[#e07200] text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
              >
                Buscar
              </button>
            </div>
            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="text-[#FF8200] font-bold hover:underline"
              >
                {showFilters ? '▲ Ocultar Filtros' : '▼ Filtros Avanzados'}
              </button>
              {(escuelaFiltroId || programaFiltroId || fallaFiltroId || fechaInicioFiltro || fechaFinFiltro || busqueda) && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    setEscuelaFiltroId('');
                    setProgramaFiltroId('');
                    setFallaFiltroId('');
                    setFechaInicioFiltro('');
                    setFechaFinFiltro('');
                    setTimeout(fetchRepairs, 50);
                  }}
                  className="text-red-500 font-bold hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-2 pt-2 border-t border-slate-200 animate-fadeIn text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Escuela</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    value={escuelaFiltroId}
                    onChange={(e) => setEscuelaFiltroId(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {escuelas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Programa</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    value={programaFiltroId}
                    onChange={(e) => setProgramaFiltroId(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {programas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Falla del Catálogo</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    value={fallaFiltroId}
                    onChange={(e) => setFallaFiltroId(e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="1">No Enciende</option>
                    <option value="2">Pantalla Rota / Sin Imagen</option>
                    <option value="3">Bloqueo de Seguridad</option>
                    <option value="4">Falla de Teclado</option>
                    <option value="5">Problemas de Sistema Operativo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">F. Inicio</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      value={fechaInicioFiltro}
                      onChange={(e) => setFechaInicioFiltro(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">F. Fin</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      value={fechaFinFiltro}
                      onChange={(e) => setFechaFinFiltro(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchRepairs}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded transition-all text-center mt-2 border border-slate-300"
                >
                  Aplicar Filtros
                </button>
              </div>
            )}
          </div>

          {loading && repairs.length === 0 ? (
            <div className="text-center py-6">
              <span className="inline-block w-6 h-6 border-2 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : repairs.length === 0 ? (
            <p className="text-slate-400 text-sm">No tiene equipos asignados pendientes.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {isBulkMode && (
                <div className="flex justify-between items-center px-1 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRepairIds.length === repairs.length) {
                        setSelectedRepairIds([]);
                      } else {
                        setSelectedRepairIds(repairs.map(r => r.id));
                      }
                    }}
                    className="text-xs text-[#FF8200] font-bold hover:underline"
                  >
                    {selectedRepairIds.length === repairs.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                  <span className="text-xs text-slate-500 font-bold">{selectedRepairIds.length} seleccionados</span>
                </div>
              )}
              {repairs.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  {isBulkMode && (
                    <input
                      type="checkbox"
                      checked={selectedRepairIds.includes(r.id)}
                      onChange={() => {
                        if (selectedRepairIds.includes(r.id)) {
                          setSelectedRepairIds(prev => prev.filter(id => id !== r.id));
                        } else {
                          setSelectedRepairIds(prev => [...prev, r.id]);
                        }
                      }}
                      className="w-4 h-4 text-[#FF8200] focus:ring-[#FF8200] border-slate-350 rounded cursor-pointer shrink-0"
                    />
                  )}
                  <button
                    onClick={() => {
                      if (isBulkMode) {
                        if (selectedRepairIds.includes(r.id)) {
                          setSelectedRepairIds(prev => prev.filter(id => id !== r.id));
                        } else {
                          setSelectedRepairIds(prev => [...prev, r.id]);
                        }
                      } else {
                        handleSelectRepair(r);
                      }
                    }}
                    className={`flex-1 text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${
                      !isBulkMode && selectedRepair?.id === r.id
                        ? 'bg-[#FF8200]/5 border-[#FF8200] shadow-sm'
                        : selectedRepairIds.includes(r.id)
                        ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[#1D252D] font-bold text-sm">{r.numeroSerie}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        r.estado === 'Ingresado' ? 'bg-blue-550/10 border-blue-200 text-blue-700' :
                        r.estado === 'En_Diagnostico' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        r.estado === 'En_Reparacion' ? 'bg-orange-50 border-orange-200 text-[#FF8200]' :
                        r.estado === 'Esperando_Repuestos' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                        r.estado === 'Apartado_Para_Garantia' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        r.estado === 'En_Garantia_Externa' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' :
                        'bg-green-50 border-green-200 text-green-700'
                      }`}>
                        {r.estado.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 truncate mt-1">Tutor: {r.nombreTutor}</p>
                    <p className="text-xs text-slate-400">Modelo: {r.marcaModelo}</p>
                    {r.proveedorGarantia && (
                      <p className="text-[10px] font-semibold text-slate-550 mt-1">
                        🏢 Garantía: {r.proveedorGarantia} (Remito: {r.remitoGarantia || '-'})
                      </p>
                    )}
                    {r.ubicacionDepositoCodigo && (
                      <p className="text-[10px] font-semibold text-[#FF8200] mt-1 flex items-center gap-1">
                        <span>📍</span>
                        <span>{r.ubicacionDepositoCodigo}</span>
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnosis Form */}
        <div className="lg:col-span-2">
          {isBulkMode ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-[#1D252D]">Derivación Masiva a Garantía</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Derive múltiples notebooks a proveedor de garantía externo en un solo paso y genere el remito de salida.
                </p>
              </div>

              {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm border font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
                }`}>
                  {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleBulkDerive} className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1D252D] font-bold">
                  Equipos seleccionados para derivar: {selectedRepairIds.length}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Proveedor de Garantía *</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Ej: Exo, BGH, Lenovo..."
                      value={bulkProveedorGarantia}
                      onChange={(e) => setBulkProveedorGarantia(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Nº de Remito / Guía *</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Ej: R-0001-00045"
                      value={bulkRemitoGarantia}
                      onChange={(e) => setBulkRemitoGarantia(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Fecha Esperada de Retorno (Opcional)</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
                      value={bulkFechaEsperadaGarantia}
                      onChange={(e) => setBulkFechaEsperadaGarantia(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Diagnóstico Masivo</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Diagnóstico aplicable a los equipos a derivar..."
                      value={bulkDiagnostico}
                      onChange={(e) => setBulkDiagnostico(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Observaciones de Remisión</label>
                    <textarea
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Observaciones internas para la remisión..."
                      value={bulkObservaciones}
                      onChange={(e) => setBulkObservaciones(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={handleGenerateRemito}
                    disabled={selectedRepairIds.length === 0}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-6 py-3 rounded-lg font-bold border border-slate-200 transition-all text-sm flex items-center gap-2"
                  >
                    📄 Generar Remito PDF
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkMode(false);
                        setSelectedRepairIds([]);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || selectedRepairIds.length === 0}
                      className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[180px] text-sm"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        `Derivar Masivamente (${selectedRepairIds.length})`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : selectedRepair ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 animate-fadeIn">
              {/* Header con datos de la orden y botones de impresión */}
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#1D252D]">Orden: {selectedRepair.numeroSerie}</h3>
                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      {selectedRepair.marcaModelo}
                    </span>
                    {selectedRepair.ubicacionDepositoCodigo && (
                      <span className="bg-orange-50 border border-orange-200 text-[#FF8200] text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        📍 {selectedRepair.ubicacionDepositoCodigo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tutor: <span className="font-medium text-slate-700">{selectedRepair.nombreTutor}</span> ({selectedRepair.telefonoTutor}) • <span className="text-slate-400">Ingreso: {new Date(selectedRepair.fechaIngreso).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Botones de Impresión solicitados */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => imprimirIngresoComprobante(selectedRepair, nombreTecnico)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Imprimir Comprobante de Ingreso con QR"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#FF8200]" />
                    Imprimir Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => imprimirFichaEstado(selectedRepair, nombreTecnico, historial)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Imprimir Ficha Técnica de Servicio con el estado actual"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    Imprimir Estado Actual
                  </button>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`p-3 rounded-lg text-xs border font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
                }`}>
                  {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSaveDiagnosis} className="space-y-4">
                {/* Falla Reportada Inicial */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Falla Reportada Inicial</span>
                  <p className="text-xs font-semibold text-slate-800 italic">"{selectedRepair.fallaReportada}"</p>
                </div>

                {/* Plantillas Rápidas con 1 Clic para soporte eficiente */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF8200]" />
                    <span>Plantillas Rápidas de Diagnóstico (1 Clic)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {PLANTILLAS_RAPIDAS.map((plantilla, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setDiagnostico(plantilla.diag);
                          setAccionesRealizadas(plantilla.acciones);
                          setNuevoEstado(plantilla.estado);
                        }}
                        className="bg-slate-50 hover:bg-orange-50/70 hover:border-orange-200 border border-slate-200 p-2 rounded-lg text-left transition-all cursor-pointer group"
                      >
                        <span className="text-xs block mb-0.5">{plantilla.icono}</span>
                        <span className="text-[10px] font-semibold text-slate-700 group-hover:text-[#FF8200] block truncate">
                          {plantilla.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector Visual Rápido de Estado */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Próximo Estado de Soporte
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {ESTADOS_SOPORTE.map((est) => {
                      const isSelected = nuevoEstado === est.id;
                      return (
                        <button
                          key={est.id}
                          type="button"
                          onClick={() => setNuevoEstado(est.id)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? `${est.color} shadow-sm font-bold scale-[1.02]`
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[11px] font-bold leading-tight">{est.label}</span>
                          <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            {est.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Diagnóstico y Acciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">Diagnóstico Técnico</label>
                    <textarea
                      required={nuevoEstado === 'Reparado' || nuevoEstado === 'Listo_Para_Retirar' || nuevoEstado === 'No_Reparable'}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Detallar la falla real detectada..."
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">Acciones Realizadas</label>
                    <textarea
                      required={nuevoEstado === 'Reparado' || nuevoEstado === 'Listo_Para_Retirar' || nuevoEstado === 'No_Reparable'}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Describir las reparaciones o tareas efectuadas..."
                      value={accionesRealizadas}
                      onChange={(e) => setAccionesRealizadas(e.target.value)}
                    />
                  </div>
                </div>

                {/* Observaciones Internas */}
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">Observaciones Internas (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                    placeholder="Ej: Faltan tornillos, carcasa rallada..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>

                {nuevoEstado === 'En_Garantia_Externa' && (
                  <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                    <div>
                      <label className="block text-slate-700 text-xs font-semibold mb-1">Proveedor de Garantía *</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                        placeholder="Ej: Exo, BGH, Lenovo..."
                        value={proveedorGarantia}
                        onChange={(e) => setProveedorGarantia(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-semibold mb-1">Nº de Remito / Guía *</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                        placeholder="Ej: R-0001-00045"
                        value={remitoGarantia}
                        onChange={(e) => setRemitoGarantia(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-semibold mb-1">Fecha Esperada Retorno</label>
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF8200]"
                        value={fechaEsperadaGarantia}
                        onChange={(e) => setFechaEsperadaGarantia(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Secciones colapsables para Evidencias e Historial */}
                <div className="space-y-2 pt-1">
                  <details className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <summary className="p-2.5 text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#FF8200]" />
                        Evidencias Fotográficas ({evidencias.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Desplegar</span>
                    </summary>
                    <div className="p-3 border-t border-slate-200 bg-white space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Imágenes técnicas adjuntas</span>
                        <input
                          type="file"
                          id="file-evidence-upload"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#FF8200] font-bold px-3 py-1 rounded transition-colors"
                        >
                          📷 Adjuntar Foto
                        </button>
                      </div>

                      {evidencias.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-slate-400 text-xs">
                          No hay archivos cargados.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {evidencias.map((ev, i) => {
                            const fileUrl = ev.urlArchivo && ev.urlArchivo.startsWith('/') 
                              ? `${API_BASE_URL.replace('/api/v1', '')}${ev.urlArchivo}` 
                              : (ev.urlArchivo || '');
                            return (
                              <div key={ev.id || i} className="relative group aspect-square rounded bg-slate-100 overflow-hidden border border-slate-200">
                                <img src={fileUrl} alt={ev.nombreArchivo || 'Evidencia'} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setEvidencias(prev => prev.filter((_, idx) => idx !== i))}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold transition-all text-xs"
                                >
                                  Eliminar
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </details>

                  <details className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                    <summary className="p-2.5 text-xs font-bold text-slate-700 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FF8200]" />
                        Historial de Movimientos ({historial.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Desplegar</span>
                    </summary>
                    <div className="p-3 border-t border-slate-200 bg-white">
                      {historial.length === 0 ? (
                        <p className="text-xs text-slate-400">No hay movimientos registrados para esta orden.</p>
                      ) : (
                        <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-3">
                          {historial.map((item, idx) => (
                            <div key={item.id || idx} className="relative text-xs">
                              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#FF8200] border-2 border-white" />
                              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                                <span className="font-semibold text-slate-700">{item.usuarioNombre || item.operadorNombre || 'Personal'}</span>
                                <span>{item.fechaMovimiento ? new Date(item.fechaMovimiento).toLocaleString() : ''}</span>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                  {item.estadoAnterior || item.estadoOrigen ? (
                                    <>
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-850 text-[9px] font-bold rounded uppercase">
                                        {(item.estadoAnterior || item.estadoOrigen || '').replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-slate-400 text-[10px]">➜</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded uppercase">
                                        Ingreso Inicial
                                      </span>
                                      <span className="text-slate-400 text-[10px]">➜</span>
                                    </>
                                  )}
                                  <span className="px-2 py-0.5 bg-green-100 text-green-850 text-[9px] font-bold rounded uppercase">
                                    {(item.estadoNuevo || item.estadoDestino || 'Sin Estado').replace(/_/g, ' ')}
                                  </span>
                                </div>
                                {item.observaciones && (
                                  <p className="text-slate-650 font-medium mt-1">
                                    <strong className="text-slate-400">Obs:</strong> {item.observaciones}
                                  </p>
                                )}
                                {item.accionesRealizadas && (
                                  <p className="text-slate-650 mt-0.5">
                                    <strong className="text-slate-400">Acciones:</strong> {item.accionesRealizadas}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {/* Barra de Acciones */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRepair(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors text-xs cursor-pointer"
                  >
                    Cerrar Detalle
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[170px] text-xs cursor-pointer gap-1.5"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Guardar Diagnóstico (F10)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-slate-450 text-sm">
              Seleccione una orden de notebook de la lista de la izquierda para comenzar el diagnóstico y reparación.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
