import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';

interface PanelTecnicoProps {
  token: string;
  nombreTecnico: string;
}

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
  const [bulkEstado, setBulkEstado] = useState('En_Garantia_Externa');
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

  const handleSelectRepair = (repair: Reparacion) => {
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
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const rows = selectedRepairs.map((r, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold; font-family: monospace;">${index + 1}</td>
        <td style="padding: 10px; font-weight: bold; font-family: monospace;">${r.numeroSerie}</td>
        <td style="padding: 10px;">${r.marcaModelo}</td>
        <td style="padding: 10px;">${r.nombreTutor}</td>
        <td style="padding: 10px;">${r.fallaReportada}</td>
        <td style="padding: 10px; font-weight: bold;">${bulkProveedorGarantia || r.proveedorGarantia || '-'}</td>
        <td style="padding: 10px;">${bulkRemitoGarantia || r.remitoGarantia || '-'}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(
      '<html>' +
        '<head>' +
          '<title>Remito de Derivación a Garantía Externa</title>' +
          '<style>' +
            'body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1D252D; margin: 40px; }' +
            '.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF8200; padding-bottom: 20px; margin-bottom: 30px; }' +
            '.title { font-size: 24px; font-weight: bold; color: #1D252D; }' +
            '.subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }' +
            '.meta { font-size: 14px; margin-bottom: 30px; line-height: 1.6; }' +
            '.meta span { font-weight: bold; }' +
            'table { width: 100%; border-collapse: collapse; margin-top: 20px; }' +
            'th { background-color: #f8fafc; text-align: left; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }' +
            'td { font-size: 13px; }' +
            '.footer { margin-top: 60px; display: flex; justify-content: space-between; }' +
            '.signature { border-top: 1px solid #cbd5e1; width: 200px; text-align: center; padding-top: 8px; font-size: 12px; color: #64748b; }' +
            '@media print { body { margin: 20px; } button { display: none; } }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div style="text-align: right; margin-bottom: 10px;">' +
            '<button onclick="window.print()" style="background-color: #FF8200; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">🖨️ Imprimir Remito</button>' +
          '</div>' +
          '<div class="header">' +
            '<div>' +
              '<div class="title">REMITO DE SALIDA / DERIVACIÓN</div>' +
              '<div class="subtitle">Ministerio de Educación de San Juan - Central de Trazabilidad</div>' +
            '</div>' +
            '<div style="text-align: right;">' +
              '<div style="font-weight: bold; color: #FF8200; font-size: 18px;">Nº ' + (bulkRemitoGarantia || 'TEMP-' + Date.now()) + '</div>' +
              '<div class="subtitle">Fecha: ' + new Date().toLocaleDateString() + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="meta">' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">' +
              '<div>' +
                '<div><span>Proveedor de Garantía:</span> ' + (bulkProveedorGarantia || 'Varios / Ver tabla') + '</div>' +
                '<div><span>Operador/Técnico Responsable:</span> ' + nombreTecnico + '</div>' +
              '</div>' +
              '<div>' +
                '<div><span>Estado de Derivación:</span> ' + (bulkEstado || 'Derivado').replace(/_/g, ' ') + '</div>' +
                '<div><span>Fecha Esperada de Retorno:</span> ' + (bulkFechaEsperadaGarantia ? new Date(bulkFechaEsperadaGarantia).toLocaleDateString() : 'No especificada') + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<h3>Dispositivos Derivados (' + selectedRepairs.length + ')</h3>' +
          '<table>' +
            '<thead>' +
              '<tr>' +
                '<th style="width: 5%">#</th>' +
                '<th style="width: 20%">Nº Serie</th>' +
                '<th style="width: 20%">Marca/Modelo</th>' +
                '<th style="width: 15%">Tutor</th>' +
                '<th style="width: 20%">Falla Reportada</th>' +
                '<th style="width: 10%">Proveedor</th>' +
                '<th style="width: 10%">Remito/Guía</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              rows +
            '</tbody>' +
          '</table>' +
          '<div class="footer">' +
            '<div class="signature" style="margin-top: 80px;">' +
              '<br/><br/>' +
              'Firma y Aclaración Responsable' +
            '</div>' +
            '<div class="signature" style="margin-top: 80px;">' +
              '<br/><br/>' +
              'Firma y Sello Receptor Garantía' +
            '</div>' +
          '</div>' +
        '</body>' +
      '</html>'
    );
    printWindow.document.close();
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
                    <option value="3">Bloqueo de Seguridad Juana Manso</option>
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
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Estado de Destino</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
                      value={bulkEstado}
                      onChange={(e) => setBulkEstado(e.target.value)}
                    >
                      <option value="En_Garantia_Externa">En Garantía Externa</option>
                      <option value="Apartado_Para_Garantia">Apartado para Garantía</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Fecha Esperada de Retorno</label>
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#1D252D]">Orden: {selectedRepair.numeroSerie}</h3>
                  <p className="text-xs text-slate-500 mt-1">Tutor: {selectedRepair.nombreTutor} ({selectedRepair.telefonoTutor})</p>
                  {selectedRepair.ubicacionDepositoCodigo && (
                    <span className="inline-block mt-2 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      📍 Ubicación: {selectedRepair.ubicacionDepositoCodigo}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Fecha Ingreso</p>
                  <p className="text-xs text-slate-700 font-mono font-bold">{new Date(selectedRepair.fechaIngreso).toLocaleDateString()}</p>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`p-4 rounded-lg text-sm border font-semibold ${
                  mensaje.tipo === 'exito' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#E03C31]/10 border-[#E03C31]/30 text-[#E03C31]'
                }`}>
                  {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSaveDiagnosis} className="space-y-6">
                <div>
                  <label className="block text-slate-650 text-sm font-semibold mb-2">Falla Reportada Inicial</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#1D252D] italic font-semibold">
                    "{selectedRepair.fallaReportada}"
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Diagnóstico Técnico</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Detallar la falla real detectada..."
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Acciones Realizadas</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Describir las reparaciones o reparaciones efectuadas..."
                      value={accionesRealizadas}
                      onChange={(e) => setAccionesRealizadas(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Próximo Estado de Soporte</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] focus:outline-none focus:border-[#FF8200]"
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                    >
                      <option value="En_Diagnostico">En Diagnóstico</option>
                      <option value="En_Reparacion">En Reparación / Soporte Local</option>
                      <option value="Esperando_Repuestos">Esperando Repuestos</option>
                      <option value="Apartado_Para_Garantia">Apartado para Garantía</option>
                      <option value="En_Garantia_Externa">En Garantía Externa</option>
                      <option value="Reparado">Reparado</option>
                      <option value="Listo_Para_Retirar">Listo para retirar (Notificar WhatsApp)</option>
                      <option value="No_Reparable">No Reparable (Notificar WhatsApp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-semibold mb-2">Observaciones Internas</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200]"
                      placeholder="Ej: Faltan tornillos, carcasa rallada..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    />
                  </div>
                </div>

                {(nuevoEstado === 'Apartado_Para_Garantia' || nuevoEstado === 'En_Garantia_Externa') && (
                  <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-slate-700 text-xs font-semibold mb-1">Proveedor de Garantía *</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF8200]"
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF8200]"
                        placeholder="Ej: R-0001-00045"
                        value={remitoGarantia}
                        onChange={(e) => setRemitoGarantia(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-xs font-semibold mb-1">Fecha Esperada Retorno</label>
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF8200]"
                        value={fechaEsperadaGarantia}
                        onChange={(e) => setFechaEsperadaGarantia(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Evidencia Area */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-700 text-sm font-semibold">Evidencia Fotográfica / Archivos</label>
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
                      className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#FF8200] font-bold px-3 py-1.5 rounded transition-colors"
                    >
                      📷 Adjuntar Foto
                    </button>
                  </div>

                  {evidencias.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-xs">
                      No hay archivos cargados. Seleccione imágenes o PDFs.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {evidencias.map((ev, i) => {
                        const fileUrl = ev.urlArchivo.startsWith('/') 
                          ? `${API_BASE_URL.replace('/api/v1', '')}${ev.urlArchivo}` 
                          : ev.urlArchivo;
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

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRepair(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Cerrar Detalle
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center min-w-[150px] text-sm"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Guardar Diagnóstico (F10)'
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
