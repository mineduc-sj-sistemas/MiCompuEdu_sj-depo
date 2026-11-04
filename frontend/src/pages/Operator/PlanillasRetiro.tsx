import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { FileText, RefreshCw } from 'lucide-react';
import { FormularioSubirPlanilla } from '../../components/Planillas/FormularioSubirPlanilla';
import { ListadoPlanillasPorDia } from '../../components/Planillas/ListadoPlanillasPorDia';
import { ModalVisorPlanilla } from '../../components/Planillas/ModalVisorPlanilla';

interface PlanillaProps {
  token: string;
  nombreUsuario: string;
  userRol: string;
}

export interface ArchivoPlanilla {
  id: string;
  nombreArchivo: string;
  tipoContenido: string;
  tamanoBytes: number;
  createdAt: string;
  url: string;
}

export interface PlanillaDiaria {
  id: string;
  fecha: string;
  observaciones?: string;
  subidoPorId?: string;
  subidoPorNombre: string;
  createdAt: string;
  archivos: ArchivoPlanilla[];
}

export const PlanillasRetiro: React.FC<PlanillaProps> = ({ token }) => {
  const hoyIso = new Date().toISOString().split('T')[0];

  const [planillas, setPlanillas] = useState<PlanillaDiaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaBusqueda, setFechaBusqueda] = useState<string>('');
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  const [fechaCarga, setFechaCarga] = useState<string>(hoyIso);
  const [observaciones, setObservaciones] = useState<string>('');
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [previewsLocales, setPreviewsLocales] = useState<{ file: File; previewUrl: string | null }[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [archivoEnVisor, setArchivoEnVisor] = useState<{
    archivo: ArchivoPlanilla;
    fechaPlanilla: string;
    indice: number;
    listaArchivos: ArchivoPlanilla[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPlanillas();
  }, [fechaBusqueda]);

  useEffect(() => {
    const nuevosPreviews = archivosSeleccionados.map((file) => {
      const isImage = file.type.startsWith('image/');
      return {
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : null
      };
    });
    setPreviewsLocales(nuevosPreviews);

    return () => {
      nuevosPreviews.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [archivosSeleccionados]);

  const fetchPlanillas = async (fechaOverride?: string) => {
    setLoading(true);
    setMensajeError(null);
    try {
      const f = fechaOverride !== undefined ? fechaOverride : fechaBusqueda;
      const query = f ? `?fecha=${encodeURIComponent(f)}` : '';
      const response = await fetch(`${API_BASE_URL}/PlanillasDiarias${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: PlanillaDiaria[] = await response.json();
        setPlanillas(data);
      } else {
        setMensajeError('No se pudieron obtener las planillas cargadas.');
      }
    } catch {
      setMensajeError('Error de conexión al consultar las planillas de retiro.');
    } finally {
      setLoading(false);
    }
  };

  const getArchivoFullUrl = (archivoId: string) => `${API_BASE_URL}/PlanillasDiarias/archivo/${archivoId}`;

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const nuevos = Array.from(e.target.files);
    setArchivosSeleccionados((prev) => [...prev, ...nuevos]);
    setMensajeError(null);
    setMensajeExito(null);
    e.target.value = '';
  };

  const handleQuitarArchivoSeleccionado = (index: number) => {
    setArchivosSeleccionados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubirPlanilla = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!fechaCarga) {
      setMensajeError('Debe seleccionar el día al que pertenecen las hojas escaneadas.');
      return;
    }

    if (archivosSeleccionados.length === 0) {
      setMensajeError('Debe adjuntar al menos una hoja escaneada (imagen o PDF).');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('fecha', fechaCarga);
      if (observaciones.trim()) {
        formData.append('observaciones', observaciones.trim());
      }
      archivosSeleccionados.forEach((file) => {
        formData.append('archivos', file);
      });

      const response = await fetch(`${API_BASE_URL}/PlanillasDiarias`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const cant = archivosSeleccionados.length;
        setMensajeExito(
          `Se adjuntaron correctamente ${cant} ${cant === 1 ? 'hoja escaneada' : 'hojas escaneadas'} para el día ${formatearFechaCorta(fechaCarga)}.`
        );
        setArchivosSeleccionados([]);
        setObservaciones('');
        await fetchPlanillas();
      } else {
        const errorText = await response.text();
        setMensajeError(errorText || 'Ocurrió un error al subir los archivos.');
      }
    } catch {
      setMensajeError('Error de red al intentar subir las hojas escaneadas.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminarArchivo = async (archivo: ArchivoPlanilla, fecha: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la hoja "${archivo.nombreArchivo}" del día ${formatearFechaCorta(fecha)}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/PlanillasDiarias/archivo/${archivo.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (archivoEnVisor?.archivo.id === archivo.id) {
          setArchivoEnVisor(null);
        }
        await fetchPlanillas();
      } else {
        alert('No se pudo eliminar el archivo seleccionado.');
      }
    } catch {
      alert('Error de conexión al intentar eliminar el archivo.');
    }
  };

  const handleEliminarDiaCompleto = async (planilla: PlanillaDiaria) => {
    if (!window.confirm(`¿Desea eliminar todas las hojas (${planilla.archivos.length}) cargadas del día ${formatearFechaCorta(planilla.fecha)}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/PlanillasDiarias/${planilla.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchPlanillas();
      } else {
        alert('No se pudo eliminar el registro del día.');
      }
    } catch {
      alert('Error de conexión al eliminar el registro.');
    }
  };

  const handleAgregarMasHojasAlDia = (fecha: string) => {
    setFechaCarga(fecha);
    setMensajeExito(null);
    setMensajeError(null);
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 300);
  };

  const handleImprimirHoja = (archivo: ArchivoPlanilla, fecha: string) => {
    const url = getArchivoFullUrl(archivo.id);
    if (archivo.tipoContenido === 'application/pdf' || archivo.nombreArchivo.toLowerCase().endsWith('.pdf')) {
      window.open(url, '_blank');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Planilla de Retiro - ${formatearFechaCorta(fecha)} - ${archivo.nombreArchivo}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; display: flex; flex-direction: column; align-items: center; font-family: sans-serif; }
            .header { font-size: 12px; color: #475569; margin-bottom: 8px; width: 100%; display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            img { max-width: 100%; max-height: 92vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="header">
            <span><strong>Planilla Firmada de Retiros</strong> — Fecha: ${formatearFechaCorta(fecha)}</span>
            <span>Archivo: ${archivo.nombreArchivo}</span>
          </div>
          <img src="${url}" onload="window.print();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatearFechaCorta = (fechaIso: string) => {
    const partes = fechaIso.split('T')[0].split('-');
    if (partes.length !== 3) return fechaIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatearFechaLarga = (fechaIso: string) => {
    const partes = fechaIso.split('T')[0].split('-');
    if (partes.length !== 3) return fechaIso;
    const date = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const esPdf = (archivo: ArchivoPlanilla) =>
    archivo.tipoContenido?.toLowerCase().includes('pdf') ||
    archivo.nombreArchivo?.toLowerCase().endsWith('.pdf');

  const planillasFiltradas = planillas.filter((p) => {
    if (!filtroTexto.trim()) return true;
    const q = filtroTexto.toLowerCase();
    const coincideObs = p.observaciones?.toLowerCase().includes(q);
    const coincideUsuario = p.subidoPorNombre?.toLowerCase().includes(q);
    const coincideFecha = formatearFechaCorta(p.fecha).includes(q) || p.fecha.includes(q);
    const coincideArchivo = p.archivos.some((a) => a.nombreArchivo.toLowerCase().includes(q));
    return coincideObs || coincideUsuario || coincideFecha || coincideArchivo;
  });

  const planillaExistenteParaFechaCarga = planillas.find((p) => p.fecha === fechaCarga);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-[#FF8200]/10 text-[#FF8200] shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Planillas Firmadas de Retiro
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Adjunte una o múltiples hojas escaneadas (imágenes o PDF) firmadas al retirar equipos, vinculadas a una fecha específica para su consulta e impresión en cualquier momento.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchPlanillas()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF8200]' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <FormularioSubirPlanilla
          formCardRef={formCardRef}
          fileInputRef={fileInputRef}
          fechaCarga={fechaCarga}
          setFechaCarga={setFechaCarga}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          archivosSeleccionados={archivosSeleccionados}
          setArchivosSeleccionados={setArchivosSeleccionados}
          previewsLocales={previewsLocales}
          subiendo={subiendo}
          mensajeExito={mensajeExito}
          mensajeError={mensajeError}
          planillaExistenteParaFechaCarga={planillaExistenteParaFechaCarga}
          handleSeleccionarArchivos={handleSeleccionarArchivos}
          handleQuitarArchivoSeleccionado={handleQuitarArchivoSeleccionado}
          handleSubirPlanilla={handleSubirPlanilla}
          formatearFechaCorta={formatearFechaCorta}
          formatearTamano={formatearTamano}
        />

        <ListadoPlanillasPorDia
          hoyIso={hoyIso}
          fechaBusqueda={fechaBusqueda}
          setFechaBusqueda={setFechaBusqueda}
          filtroTexto={filtroTexto}
          setFiltroTexto={setFiltroTexto}
          loading={loading}
          planillasFiltradas={planillasFiltradas}
          formatearFechaCorta={formatearFechaCorta}
          formatearFechaLarga={formatearFechaLarga}
          formatearTamano={formatearTamano}
          esPdf={esPdf}
          getArchivoFullUrl={getArchivoFullUrl}
          handleAgregarMasHojasAlDia={handleAgregarMasHojasAlDia}
          handleEliminarDiaCompleto={handleEliminarDiaCompleto}
          handleEliminarArchivo={handleEliminarArchivo}
          handleImprimirHoja={handleImprimirHoja}
          onOpenVisor={setArchivoEnVisor}
        />
      </div>

      <ModalVisorPlanilla
        archivoEnVisor={archivoEnVisor}
        onClose={() => setArchivoEnVisor(null)}
        onChangeVisor={setArchivoEnVisor}
        formatearFechaCorta={formatearFechaCorta}
        formatearTamano={formatearTamano}
        esPdf={esPdf}
        getArchivoFullUrl={getArchivoFullUrl}
        handleImprimirHoja={handleImprimirHoja}
      />
    </div>
  );
};
