import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ManagedUser } from '../../types';
import { API_BASE_URL } from '../../config';
import { ModalFormularioUsuario } from '../../components/Usuarios/ModalFormularioUsuario';
import {
  Plus,
  Pencil,
  Check,
  AlertTriangle,
  Loader2,
  Users,
  Search,
  X,
  Mail,
  ShieldCheck,
  BarChart3,
  Wrench,
  ClipboardList,
  Trash2,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';

interface GestionUsuariosProps {
  token: string;
}

export const GestionUsuarios: React.FC<GestionUsuariosProps> = ({ token }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Todos' | ManagedUser['rol']>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');

  // Estado del formulario modal
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<ManagedUser['rol']>('Operador');
  const [formLoading, setFormLoading] = useState(false);

  // Confirmación de eliminación
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const mockUsers: ManagedUser[] = [
    { id: '1', nombreCompleto: 'Administrador del Sistema', nombreUsuario: 'admin', email: 'admin@sanjuan.edu.ar', rol: 'Administrador', activo: true },
    { id: '2', nombreCompleto: 'Supervisor de Depósito', nombreUsuario: 'supervisor', email: 'supervisor@sanjuan.edu.ar', rol: 'Supervisor', activo: true },
    { id: '3', nombreCompleto: 'Técnico Reparador Alfa', nombreUsuario: 'tecnico', email: 'tecnico@sanjuan.edu.ar', rol: 'Tecnico', activo: true },
    { id: '4', nombreCompleto: 'Operador de Recepción Uno', nombreUsuario: 'operador', email: 'operador@sanjuan.edu.ar', rol: 'Operador', activo: true },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data: ManagedUser[] = await response.json();
        setUsers(data);
      } else {
        throw new Error();
      }
    } catch {
      const localData = localStorage.getItem('micompuedu_users');
      if (localData) {
        setUsers(JSON.parse(localData));
      } else {
        setUsers(mockUsers);
        localStorage.setItem('micompuedu_users', JSON.stringify(mockUsers));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombreCompleto('');
    setNombreUsuario('');
    setEmail('');
    setPassword('');
    setRol('Operador');
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setNombreCompleto(user.nombreCompleto);
    setNombreUsuario(user.nombreUsuario);
    setEmail(user.email);
    setPassword('');
    setRol(user.rol);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nombreCompleto.trim() || !nombreUsuario.trim() || !email.trim() || (!editingUser && !password.trim())) {
      setError('Complete todos los campos obligatorios.');
      return;
    }
    setFormLoading(true);
    try {
      const url = editingUser ? `${API_BASE_URL}/usuarios/${editingUser.id}` : `${API_BASE_URL}/usuarios`;
      const method = editingUser ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombreCompleto, nombreUsuario, email, password: password || undefined, rol }),
      });
      if (response.ok) {
        setSuccess(editingUser ? `Perfil de @${editingUser.nombreUsuario} actualizado correctamente.` : `Usuario @${nombreUsuario} creado con éxito.`);
        setShowForm(false);
        fetchUsers();
      } else {
        const msg = await response.text();
        throw new Error(msg || 'No se pudo guardar el usuario.');
      }
    } catch {
      const localUsers = [...users];
      if (editingUser) {
        const idx = localUsers.findIndex((u) => u.id === editingUser.id);
        if (idx !== -1) {
          localUsers[idx] = { ...localUsers[idx], nombreCompleto, email, rol };
        }
        setSuccess('Usuario actualizado.');
      } else {
        if (localUsers.some((u) => u.nombreUsuario.toLowerCase() === nombreUsuario.toLowerCase())) {
          setError('El nombre de usuario ya existe.');
          setFormLoading(false);
          return;
        }
        localUsers.push({ id: Math.random().toString(), nombreCompleto, nombreUsuario, email, rol, activo: true });
        setSuccess('Usuario creado.');
      }
      setUsers(localUsers);
      localStorage.setItem('micompuedu_users', JSON.stringify(localUsers));
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${user.id}/toggle-active`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSuccess(`Estado de @${user.nombreUsuario} actualizado.`);
        fetchUsers();
      } else {
        throw new Error();
      }
    } catch {
      const localUsers = users.map((u) => (u.id === user.id ? { ...u, activo: !u.activo } : u));
      setUsers(localUsers);
      localStorage.setItem('micompuedu_users', JSON.stringify(localUsers));
      setSuccess(`Estado de @${user.nombreUsuario} actualizado.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSuccess(`Usuario @${userToDelete.nombreUsuario} eliminado correctamente.`);
        setUserToDelete(null);
        fetchUsers();
      } else {
        const body = await response.json().catch(() => null);
        setError(body?.detail || 'No se puede eliminar un usuario con historial de reparaciones. Desactívelo con el interruptor.');
        setUserToDelete(null);
      }
    } catch {
      const filtered = users.filter((u) => u.id !== userToDelete.id);
      setUsers(filtered);
      localStorage.setItem('micompuedu_users', JSON.stringify(filtered));
      setSuccess(`Usuario @${userToDelete.nombreUsuario} eliminado.`);
      setUserToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const testAccounts = useMemo(
    () =>
      users.filter(
        (u) =>
          u.nombreCompleto.toLowerCase().includes('pruebas automatizadas') ||
          u.nombreUsuario.toLowerCase().startsWith('operador_test')
      ),
    [users]
  );

  const handlePurgeTestUsers = async () => {
    if (testAccounts.length === 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    for (const acc of testAccounts) {
      try {
        await fetch(`${API_BASE_URL}/usuarios/${acc.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignorar errores individuales
      }
    }
    const remaining = users.filter((u) => !testAccounts.some((t) => t.id === u.id));
    localStorage.setItem('micompuedu_users', JSON.stringify(remaining));
    await fetchUsers();
    setSuccess(`Se limpiaron ${testAccounts.length} cuentas de prueba automatizada.`);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const activos = users.filter((u) => u.activo).length;
    const adminsYSupervisores = users.filter((u) => u.rol === 'Administrador' || u.rol === 'Supervisor').length;
    const tecnicos = users.filter((u) => u.rol === 'Tecnico').length;
    const operadores = users.filter((u) => u.rol === 'Operador').length;
    return { total, activos, inactivos: total - activos, adminsYSupervisores, tecnicos, operadores };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.nombreUsuario.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'Todos' || u.rol === roleFilter;
      const matchesStatus =
        statusFilter === 'Todos' ||
        (statusFilter === 'Activos' && u.activo) ||
        (statusFilter === 'Inactivos' && !u.activo);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const roleStyle: Record<
    ManagedUser['rol'],
    { badge: string; avatar: string; label: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    Administrador: {
      badge: 'bg-purple-50 text-purple-700 border border-purple-200/80',
      avatar: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Administrador',
      icon: ShieldCheck,
    },
    Supervisor: {
      badge: 'bg-blue-50 text-blue-700 border border-blue-200/80',
      avatar: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Supervisor',
      icon: BarChart3,
    },
    Tecnico: {
      badge: 'bg-teal-50 text-teal-700 border border-teal-200/80',
      avatar: 'bg-teal-100 text-teal-700 border-teal-200',
      label: 'Técnico',
      icon: Wrench,
    },
    Operador: {
      badge: 'bg-orange-50 text-orange-700 border border-orange-200/80',
      avatar: 'bg-orange-100 text-orange-700 border-orange-200',
      label: 'Operador',
      icon: ClipboardList,
    },
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Cabecera Institucional */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8200] to-amber-500 text-white flex items-center justify-center shadow-md shadow-[#FF8200]/25 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {stats.total} {stats.total === 1 ? 'cuenta' : 'cuentas'}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Administre credenciales, roles operativos y estados de acceso del depósito ministerial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {testAccounts.length > 0 && (
            <button
              type="button"
              onClick={handlePurgeTestUsers}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Eliminar usuarios creados por pruebas automatizadas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Limpiar {testAccounts.length} de prueba
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-[#FF8200] hover:bg-[#e07200] text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shadow-md shadow-[#FF8200]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setRoleFilter('Todos');
            setStatusFilter('Todos');
          }}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            roleFilter === 'Todos' && statusFilter === 'Todos'
              ? 'border-[#FF8200] ring-2 ring-[#FF8200]/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Personal</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-emerald-600">{stats.activos} activos</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'Administrador' ? 'Todos' : 'Administrador')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            roleFilter === 'Administrador' || roleFilter === 'Supervisor'
              ? 'border-purple-500 ring-2 ring-purple-500/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección / Sup.</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.adminsYSupervisores}</span>
            <span className="text-[11px] text-slate-400">Gestión y auditoría</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'Tecnico' ? 'Todos' : 'Tecnico')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            roleFilter === 'Tecnico'
              ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo Técnico</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.tecnicos}</span>
            <span className="text-[11px] text-slate-400">Laboratorio y taller</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'Operador' ? 'Todos' : 'Operador')}
          className={`text-left bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
            roleFilter === 'Operador'
              ? 'border-[#FF8200] ring-2 ring-[#FF8200]/10 shadow-xs'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mesa Operativa</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.operadores}</span>
            <span className="text-[11px] text-slate-400">Recepción y entregas</span>
          </div>
        </button>
      </div>

      {/* Alertas de Feedback */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-[#E03C31] rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, @usuario o correo electrónico..."
            className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['Todos', 'Administrador', 'Supervisor', 'Tecnico', 'Operador'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'Tecnico' ? 'Técnico' : r}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['Todos', 'Activos', 'Inactivos'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Personal */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col justify-center items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF8200]" />
          <span className="text-xs font-medium text-slate-400">Cargando nómina de personal...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No se encontraron integrantes</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Intente ajustar los filtros de búsqueda o registre un nuevo usuario.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Integrante</th>
                  <th className="py-3.5 px-5">Usuario y Contacto</th>
                  <th className="py-3.5 px-5">Rol Asignado</th>
                  <th className="py-3.5 px-5">Estado de Acceso</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const cfg = roleStyle[u.rol] || roleStyle.Operador;
                  const RoleIcon = cfg.icon;
                  const isMainAdmin = u.nombreUsuario.toLowerCase() === 'admin';
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        u.activo ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-100/50 opacity-75'
                      }`}
                    >
                      {/* Integrante con Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`w-10 h-10 rounded-xl border font-bold text-xs flex items-center justify-center ${cfg.avatar}`}
                            >
                              {getInitials(u.nombreCompleto)}
                            </div>
                            <span
                              className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                                u.activo ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={u.activo ? 'Cuenta activa' : 'Cuenta suspendida'}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{u.nombreCompleto}</span>
                              {isMainAdmin && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                  Principal
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 md:hidden font-mono">@{u.nombreUsuario}</span>
                          </div>
                        </div>
                      </td>

                      {/* Usuario y Correo */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <span className="inline-block text-xs font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                            @{u.nombreUsuario}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[240px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            disabled={isMainAdmin}
                            onClick={() => handleToggleActive(u)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                              isMainAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            } ${u.activo ? 'bg-[#FF8200]' : 'bg-slate-200'}`}
                            title={
                              isMainAdmin
                                ? 'La cuenta principal de administración permanece siempre activa'
                                : u.activo
                                ? 'Activo — clic para suspender acceso'
                                : 'Suspendido — clic para reactivar acceso'
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ${
                                u.activo ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              u.activo ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {u.activo ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Activo
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5 text-slate-400" /> Inactivo
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="text-slate-600 hover:text-[#FF8200] font-semibold text-xs bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 p-1.5 rounded-xl transition-all cursor-pointer"
                              title={`Eliminar a @${u.nombreUsuario}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      {showForm && (
        <ModalFormularioUsuario
          editingUser={editingUser}
          nombreCompleto={nombreCompleto}
          setNombreCompleto={setNombreCompleto}
          nombreUsuario={nombreUsuario}
          setNombreUsuario={setNombreUsuario}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          rol={rol}
          setRol={setRol}
          error={error}
          formLoading={formLoading}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {userToDelete &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setUserToDelete(null);
            }}
          >
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">¿Eliminar cuenta de usuario?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Está por eliminar a <strong className="text-slate-800">{userToDelete.nombreCompleto}</strong> (
                    <span className="font-mono">@{userToDelete.nombreUsuario}</span>). Si sólo desea revocar su acceso
                    temporalmente, puede desactivar el interruptor de estado.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirmar eliminación
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
