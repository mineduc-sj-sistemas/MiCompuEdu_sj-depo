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
}

export interface Beneficiario {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  equipo?: Equipo;
}

export interface Reparacion {
  id: string;
  equipoId: string;
  numeroSerie: string;
  marcaModelo: string;
  nombreTutor: string;
  telefonoTutor: string;
  estado: string;
  fallaReportada: string;
  diagnostico?: string;
  accionesRealizadas?: string;
  observaciones?: string;
  comprobanteUrl?: string;
  fechaIngreso: string;
  fechaEntrega?: string;
}

export interface FallaFrecuente {
  falla: string;
  cantidad: number;
}

export interface DashboardStats {
  equiposIngresados: number;
  equiposPendientes: number;
  equiposEntregados: number;
  tiempoPromedioReparacionDias: number;
  fallasMasFrecuentes: FallaFrecuente[];
  equiposPorEstado: Record<string, number>;
}

export interface ManagedUser {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: 'Administrador' | 'Supervisor' | 'Tecnico' | 'Operador';
  email: string;
  activo: boolean;
}
