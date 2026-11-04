import React, { useState, useEffect } from 'react';
import type { Reparacion } from '../../types';
import { API_BASE_URL } from '../../config';
import { imprimirComprobante } from '../../utils/printHelpers';
import { SidebarListaReparacionesTecnico } from '../../components/Tecnico/SidebarListaReparacionesTecnico';
import { ModalGarantiaMasiva } from '../../components/Tecnico/ModalGarantiaMasiva';
import { ModalGestionTecnica } from '../../components/Tecnico/ModalGestionTecnica';

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

  const [proveedorGarantia, setProveedorGarantia] = useState('');
  const [remitoGarantia, setRemitoGarantia] = useState('');
  const [fechaEsperadaGarantia, setFechaEsperadaGarantia] = useState('');

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>([]);
  const [bulkEstado] = useState('En_Garantia_Externa');
  const [bulkProveedorGarantia, setBulkProveedorGarantia] = useState('');
  const [bulkRemitoGarantia, setBulkRemitoGarantia] = useState('');
  const [bulkFechaEsperadaGarantia, setBulkFechaEsperadaGarantia] = useState('');
  const [bulkDiagnostico, setBulkDiagnostico] = useState('');
  const [bulkObservaciones, setBulkObservaciones] = useState('');

  const [escuelas, setEscuelas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [escuelaFiltroId, setEscuelaFiltroId] = useState('');
  const [programaFiltroId, setProgramaFiltroId] = useState('');
  const [fallaFiltroId, setFallaFiltroId] = useState('');
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
  const [fechaFinFiltro, setFechaFinFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const resEscuelas = await fetch(`${API_BASE_URL}/Escuelas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resEscuelas.ok) setEscuelas(await resEscuelas.json());

        const resProgramas = await fetch(`${API_BASE_URL}/Programas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resProgramas.ok) setProgramas(await resProgramas.json());
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: Reparacion[] = await response.json();
        setRepairs(data.filter(r => r.estado !== 'Entregado'));
      }
    } catch {
      setRepairs([]);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar las notebooks. Verifique la conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

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

        try {
          const resHistorial = await fetch(`${API_BASE_URL}/Reparaciones/${selectedRepair.id}/historial`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resHistorial.ok) setHistorial(await resHistorial.json());
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
        const errorData = await response.json().catch(() => null);
        setMensaje({ tipo: 'error', texto: errorData?.error || errorData?.message || 'Error al actualizar la orden en el servidor.' });
      }
    } catch {
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

        if (response.ok) successCount++;
        else failCount++;
      } catch {
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const nuevaEvidencia = await response.json();
        setEvidencias(prev => [...prev, nuevaEvidencia]);
        setMensaje({ tipo: 'exito', texto: 'Archivo de evidencia cargado exitosamente al servidor.' });
      } else {
        setMensaje({ tipo: 'error', texto: `Error en la subida: ${await response.text()}` });
      }
    } catch {
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
        <SidebarListaReparacionesTecnico
          repairs={repairs}
          loading={loading}
          isBulkMode={isBulkMode}
          setIsBulkMode={setIsBulkMode}
          selectedRepair={selectedRepair}
          setSelectedRepair={setSelectedRepair}
          selectedRepairIds={selectedRepairIds}
          setSelectedRepairIds={setSelectedRepairIds}
          setMensaje={setMensaje}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          escuelaFiltroId={escuelaFiltroId}
          setEscuelaFiltroId={setEscuelaFiltroId}
          programaFiltroId={programaFiltroId}
          setProgramaFiltroId={setProgramaFiltroId}
          fallaFiltroId={fallaFiltroId}
          setFallaFiltroId={setFallaFiltroId}
          fechaInicioFiltro={fechaInicioFiltro}
          setFechaInicioFiltro={setFechaInicioFiltro}
          fechaFinFiltro={fechaFinFiltro}
          setFechaFinFiltro={setFechaFinFiltro}
          escuelas={escuelas}
          programas={programas}
          fetchRepairs={fetchRepairs}
          handleSelectRepair={handleSelectRepair}
        />

        <div className="lg:col-span-2">
          {isBulkMode ? (
            <ModalGarantiaMasiva
              mensaje={mensaje}
              selectedRepairIds={selectedRepairIds}
              bulkProveedorGarantia={bulkProveedorGarantia}
              setBulkProveedorGarantia={setBulkProveedorGarantia}
              bulkRemitoGarantia={bulkRemitoGarantia}
              setBulkRemitoGarantia={setBulkRemitoGarantia}
              bulkFechaEsperadaGarantia={bulkFechaEsperadaGarantia}
              setBulkFechaEsperadaGarantia={setBulkFechaEsperadaGarantia}
              bulkDiagnostico={bulkDiagnostico}
              setBulkDiagnostico={setBulkDiagnostico}
              bulkObservaciones={bulkObservaciones}
              setBulkObservaciones={setBulkObservaciones}
              loading={loading}
              onSubmit={handleBulkDerive}
              onGenerateRemito={handleGenerateRemito}
              onCancel={() => {
                setIsBulkMode(false);
                setSelectedRepairIds([]);
              }}
            />
          ) : selectedRepair ? (
            <ModalGestionTecnica
              selectedRepair={selectedRepair}
              nombreTecnico={nombreTecnico}
              mensaje={mensaje}
              diagnostico={diagnostico}
              setDiagnostico={setDiagnostico}
              accionesRealizadas={accionesRealizadas}
              setAccionesRealizadas={setAccionesRealizadas}
              observaciones={observaciones}
              setObservaciones={setObservaciones}
              nuevoEstado={nuevoEstado}
              setNuevoEstado={setNuevoEstado}
              proveedorGarantia={proveedorGarantia}
              setProveedorGarantia={setProveedorGarantia}
              remitoGarantia={remitoGarantia}
              setRemitoGarantia={setRemitoGarantia}
              fechaEsperadaGarantia={fechaEsperadaGarantia}
              setFechaEsperadaGarantia={setFechaEsperadaGarantia}
              evidencias={evidencias}
              setEvidencias={setEvidencias}
              historial={historial}
              loading={loading}
              onSubmit={handleSaveDiagnosis}
              onFileUpload={handleFileUpload}
              onTriggerFileInput={triggerFileInput}
              onClose={() => setSelectedRepair(null)}
            />
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
