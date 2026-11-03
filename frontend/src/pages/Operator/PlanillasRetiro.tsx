import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import {
  Calendar, Upload, FileText, Image as ImageIcon, Search, Trash2,
  Eye, Download, Plus, CheckCircle2, AlertCircle, RefreshCw, X,
  Printer, ExternalLink, FolderOpen, FilePlus2, User
} from 'lucide-react';

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
  fecha: string; // YYYY-MM-DD
  observaciones?: string;
  subidoPorId?: string;
  subidoPorNombre: string;
  createdAt: string;
  archivos: ArchivoPlanilla[];
}

export const PlanillasRetiro: React.FC<PlanillaProps> = ({ token }) => {
  const hoyIso = new Date().toISOString().split('T')[0];

  // Estado de listado y búsqueda por día
  const [planillas, setPlanillas] = useState<PlanillaDiaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaBusqueda, setFechaBusqueda] = useState<string>('');
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  // Estado de formulario de carga
  const [fechaCarga, setFechaCarga] = useState<string>(hoyIso);
  const [observaciones, setObservaciones] = useState<string>('');
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [previewsLocales, setPreviewsLocales] = useState<{ file: File; previewUrl: string | null }[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estado del visor modal (Imagen o PDF)
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

  // Generar URLs de vista previa local para los archivos seleccionados antes de subir
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const getArchivoFullUrl = (archivoId: string) => {
    return `${API_BASE_URL}/PlanillasDiarias/archivo/${archivoId}`;
  };

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const nuevos = Array.from(e.target.files);
    setArchivosSeleccionados((prev) => [...prev, ...nuevos]);
    setMensajeError(null);
    setMensajeExito(null);
    // Reset input value so selecting the same file again works if needed
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const esPdf = (archivo: ArchivoPlanilla) => {
    return (
      archivo.tipoContenido?.toLowerCase().includes('pdf') ||
      archivo.nombreArchivo?.toLowerCase().endsWith('.pdf')
    );
  };

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
      {/* Encabezado Principal */}
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
        {/* Columna Izquierda: Adjuntar Hojas por Día */}
        <div ref={formCardRef} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FilePlus2 className="w-5 h-5 text-[#FF8200]" />
              <h2 className="font-bold text-base">Adjuntar Hojas Escaneadas</h2>
            </div>
            <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-full font-medium">
              Múltiples hojas / Imágenes o PDF
            </span>
          </div>

          <form onSubmit={handleSubirPlanilla} className="p-6 space-y-5">
            {/* 1. Selección del Día */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                1. Día de la Planilla Firmada <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={fechaCarga}
                  onChange={(e) => setFechaCarga(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent"
                />
              </div>

              {planillaExistenteParaFechaCarga && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    El día <strong>{formatearFechaCorta(fechaCarga)}</strong> ya tiene{' '}
                    <strong>{planillaExistenteParaFechaCarga.archivos.length} hoja(s)</strong> cargada(s). Las nuevas hojas que suba se agregarán a ese mismo día.
                  </span>
                </div>
              )}
            </div>

            {/* 2. Selector de Múltiples Archivos (Imágenes o PDF) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Hojas Escaneadas (JPG, PNG, WEBP o PDF) <span className="text-red-500">*</span>
                </label>
                {archivosSeleccionados.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setArchivosSeleccionados([])}
                    className="text-[11px] text-red-600 hover:underline font-semibold"
                  >
                    Limpiar selección ({archivosSeleccionados.length})
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={handleSeleccionarArchivos}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#FF8200] bg-slate-50/70 hover:bg-orange-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-[#FF8200]" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Haga clic para seleccionar una o varias hojas
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Puede elegir múltiples fotos/escaneos a la vez o archivos PDF de varias páginas
                </p>
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[#FF8200]/10 text-[#FF8200] text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  Seleccionar archivos del equipo
                </span>
              </div>

              {/* Lista de hojas seleccionadas listas para subir */}
              {previewsLocales.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Hojas listas para subir ({previewsLocales.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#FF8200] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar otra hoja
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {previewsLocales.map((item, idx) => (
                      <div
                        key={`${item.file.name}-${idx}`}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                              <span className="text-[9px] font-extrabold uppercase">PDF</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              Hoja #{idx + 1}: {item.file.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatearTamano(item.file.size)} • {item.previewUrl ? 'Imagen escaneada' : 'Documento PDF'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuitarArchivoSeleccionado(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Quitar de la lista"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Observaciones opcionales */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                3. Nota u Observación del Día (Opcional)
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Planillas turno mañana (Hoja 1 a 3) - Retiro docentes y alumnos..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200] focus:border-transparent"
              />
            </div>

            {mensajeError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{mensajeError}</span>
              </div>
            )}

            {mensajeExito && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{mensajeExito}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={subiendo || archivosSeleccionados.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                subiendo || archivosSeleccionados.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-[#FF8200] hover:bg-[#e67500] shadow-orange-500/20'
              }`}
            >
              {subiendo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando hojas escaneadas...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Guardar {archivosSeleccionados.length > 0 ? `${archivosSeleccionados.length} Hoja(s)` : 'Planilla'} en el Día {formatearFechaCorta(fechaCarga)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Buscador por Día y Archivo Histórico de Planillas */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Búsqueda por Día Específico */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#FF8200]" />
                  Buscar Planillas por Día
                </h2>
                <p className="text-xs text-slate-500">
                  Seleccione una fecha en el calendario para ver todas las hojas firmadas de ese día
                </p>
              </div>

              {/* Accesos rápidos de fecha */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFechaBusqueda(hoyIso)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fechaBusqueda === hoyIso
                      ? 'bg-[#FF8200] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ayer = new Date();
                    ayer.setDate(ayer.getDate() - 1);
                    setFechaBusqueda(ayer.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                >
                  Ayer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFechaBusqueda('');
                    setFiltroTexto('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fechaBusqueda === ''
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Ver Todos los Días
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Filtro por Fecha Exacta */}
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#FF8200] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={fechaBusqueda}
                  onChange={(e) => setFechaBusqueda(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
                />
                {fechaBusqueda && (
                  <button
                    type="button"
                    onClick={() => setFechaBusqueda('')}
                    title="Quitar filtro de fecha"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtro por palabra clave / nota / nombre de archivo */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  placeholder="Filtrar por nota, operador o nombre de archivo..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF8200]"
                />
              </div>
            </div>
          </div>

          {/* Resultados de Planillas por Día */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#FF8200] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Cargando planillas escaneadas...</p>
            </div>
          ) : planillasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {fechaBusqueda
                  ? `No hay planillas cargadas para el día ${formatearFechaCorta(fechaBusqueda)}`
                  : 'Aún no hay planillas escaneadas registradas'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {fechaBusqueda
                  ? 'Puede adjuntar las hojas firmadas de esta fecha desde el panel izquierdo o pulsar en "Ver Todos los Días".'
                  : 'Seleccione una fecha y suba las hojas firmadas (imágenes o PDF) en el formulario de la izquierda.'}
              </p>
              {fechaBusqueda && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAgregarMasHojasAlDia(fechaBusqueda)}
                    className="px-4 py-2 rounded-xl bg-[#FF8200] text-white text-xs font-bold hover:bg-[#e67500] transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Cargar hojas para el {formatearFechaCorta(fechaBusqueda)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFechaBusqueda('')}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    Ver todos los días
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {planillasFiltradas.map((planilla) => (
                <div
                  key={planilla.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Cabecera del Día */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF8200] text-white text-xs font-extrabold tracking-wide">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatearFechaCorta(planilla.fecha)}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 capitalize">
                          {formatearFechaLarga(planilla.fecha)}
                        </h3>
                        <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                          {planilla.archivos.length} {planilla.archivos.length === 1 ? 'hoja adjunta' : 'hojas adjuntas'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Cargado por: <strong className="text-slate-700">{planilla.subidoPorNombre || 'Operador'}</strong>
                        </span>
                        {planilla.observaciones && (
                          <span className="text-slate-600 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                            Nota: {planilla.observaciones}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAgregarMasHojasAlDia(planilla.fecha)}
                        className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF8200] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Adjuntar más hojas escaneadas a este mismo día"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar más hojas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarDiaCompleto(planilla)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar todas las hojas de este día"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grilla de Hojas Escaneadas del Día */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {planilla.archivos.map((archivo, idx) => {
                      const isPdfFile = esPdf(archivo);
                      const fileUrl = getArchivoFullUrl(archivo.id);

                      return (
                        <div
                          key={archivo.id}
                          className="group rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col justify-between hover:border-[#FF8200] hover:shadow-md transition-all"
                        >
                          {/* Vista previa de la hoja */}
                          <div
                            onClick={() =>
                              setArchivoEnVisor({
                                archivo,
                                fechaPlanilla: planilla.fecha,
                                indice: idx,
                                listaArchivos: planilla.archivos
                              })
                            }
                            className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer border-b border-slate-200"
                          >
                            <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                              Hoja #{idx + 1}
                            </span>

                            {isPdfFile ? (
                              <div className="flex flex-col items-center justify-center text-center p-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                                  <FileText className="w-8 h-8" />
                                </div>
                                <span className="text-xs font-extrabold uppercase tracking-wider text-red-600">
                                  Documento PDF
                                </span>
                                <span className="text-[11px] text-slate-500 mt-0.5">
                                  Clic para abrir visor
                                </span>
                              </div>
                            ) : (
                              <img
                                src={fileUrl}
                                alt={archivo.nombreArchivo}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}

                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-[#FF8200]" />
                                Ver Hoja
                              </span>
                            </div>
                          </div>

                          {/* Pie de tarjeta con nombre y acciones */}
                          <div className="p-3 bg-white space-y-2.5">
                            <div className="min-w-0">
                              <p
                                className="text-xs font-bold text-slate-800 truncate"
                                title={archivo.nombreArchivo}
                              >
                                {archivo.nombreArchivo}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                {isPdfFile ? (
                                  <FileText className="w-3 h-3 text-red-500 shrink-0" />
                                ) : (
                                  <ImageIcon className="w-3 h-3 text-blue-500 shrink-0" />
                                )}
                                <span>{formatearTamano(archivo.tamanoBytes)}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() =>
                                  setArchivoEnVisor({
                                    archivo,
                                    fechaPlanilla: planilla.fecha,
                                    indice: idx,
                                    listaArchivos: planilla.archivos
                                  })
                                }
                                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImprimirHoja(archivo, planilla.fecha)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Imprimir hoja"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={fileUrl}
                                download={archivo.nombreArchivo}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Descargar archivo original"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEliminarArchivo(archivo, planilla.fecha)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar esta hoja"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Visor de Hoja Escaneada (Imagen o PDF con navegación entre hojas del mismo día) */}
      {archivoEnVisor && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Barra superior del visor */}
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-[#FF8200] text-white text-xs font-extrabold">
                  {formatearFechaCorta(archivoEnVisor.fechaPlanilla)}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">
                    Hoja #{archivoEnVisor.indice + 1} de {archivoEnVisor.listaArchivos.length} — {archivoEnVisor.archivo.nombreArchivo}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {formatearTamano(archivoEnVisor.archivo.tamanoBytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {archivoEnVisor.listaArchivos.length > 1 && (
                  <div className="flex items-center gap-1 mr-2 bg-white/10 rounded-xl p-1">
                    <button
                      type="button"
                      disabled={archivoEnVisor.indice === 0}
                      onClick={() => {
                        const nuevoIdx = archivoEnVisor.indice - 1;
                        setArchivoEnVisor({
                          ...archivoEnVisor,
                          indice: nuevoIdx,
                          archivo: archivoEnVisor.listaArchivos[nuevoIdx]
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      disabled={archivoEnVisor.indice === archivoEnVisor.listaArchivos.length - 1}
                      onClick={() => {
                        const nuevoIdx = archivoEnVisor.indice + 1;
                        setArchivoEnVisor({
                          ...archivoEnVisor,
                          indice: nuevoIdx,
                          archivo: archivoEnVisor.listaArchivos[nuevoIdx]
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleImprimirHoja(archivoEnVisor.archivo, archivoEnVisor.fechaPlanilla)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>

                <a
                  href={getArchivoFullUrl(archivoEnVisor.archivo.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir en pestaña
                </a>

                <button
                  type="button"
                  onClick={() => setArchivoEnVisor(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500 text-white transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del visor */}
            <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4 min-h-[65vh]">
              {esPdf(archivoEnVisor.archivo) ? (
                <iframe
                  src={getArchivoFullUrl(archivoEnVisor.archivo.id)}
                  title={archivoEnVisor.archivo.nombreArchivo}
                  className="w-full h-[72vh] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <img
                  src={getArchivoFullUrl(archivoEnVisor.archivo.id)}
                  alt={archivoEnVisor.archivo.nombreArchivo}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
