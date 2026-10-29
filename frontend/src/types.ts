export interface User {
  token: string;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: 'Administrador' | 'Supervisor' | 'Tecnico' | 'Operador';
  email: string;
}

export interface Equipo {
  id: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  credencialesOffice?: string;
  programaEducativoId?: string;
  programaEducativoNombre?: string;
}

export interface Beneficiario {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  tipoBeneficiario?: number;
  escuelaId?: string;
  escuelaNombre?: string;
  dniTutor?: string;
  nombreTutor?: string;
  telefonoTutor?: string;
  grado?: string;
  seccion?: string;
  equipo?: Equipo;
}

export interface Reparacion {
  id: string;
  equipoId: string;
  numeroSerie: string;
  marcaModelo: string;
  nombreTutor: string;
  telefonoTutor: string;
  titularDni?: string;
  titularEmail?: string;
  tipoBeneficiario?: number;
  tutorResponsableNombre?: string;
  tutorResponsableDni?: string;
  tutorResponsableTelefono?: string;
  escuelaId?: string;
  escuelaNombre?: string;
  programaEducativoId?: string;
  programaEducativoNombre?: string;
  soloCargador?: boolean;
  estado: string;
  fallaReportada: string;
  diagnostico?: string;
  accionesRealizadas?: string;
  observaciones?: string;
  comprobanteUrl?: string;
  fechaIngreso: string;
  evidencias?: any[];
  fechaEntrega?: string;
  ubicacionDepositoId?: string;
  ubicacionDepositoCodigo?: string;
  proveedorGarantia?: string;
  remitoGarantia?: string;
  fechaEsperadaGarantia?: string;
}

export interface FallaFrecuente {
  falla: string;
  cantidad: number;
}

export interface ReparacionEscuela {
  escuela: string;
  cantidad: number;
}

export interface EfectividadTecnico {
  tecnico: string;
  reparados: number;
  tiempoPromedioDias: number;
}

export interface ReparacionesMensuales {
  mes: string;
  cantidad: number;
}

export interface DashboardStats {
  equiposIngresados: number;
  equiposPendientes: number;
  equiposEntregados: number;
  tiempoPromedioReparacionDias: number;
  fallasMasFrecuentes: FallaFrecuente[];
  equiposPorEstado: Record<string, number>;
  reparacionesPorEscuela: ReparacionEscuela[];
  efectividadTecnicos: EfectividadTecnico[];
  reparacionesPorMes: ReparacionesMensuales[];
}

export interface ManagedUser {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: 'Administrador' | 'Supervisor' | 'Tecnico' | 'Operador';
  email: string;
  activo: boolean;
}
