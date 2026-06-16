import React, { useState, useEffect } from 'react';
import type { ManagedUser } from '../../types';

interface GestionUsuariosProps {
  token: string;
}

export const GestionUsuarios: React.FC<GestionUsuariosProps> = ({ token }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'Administrador' | 'Supervisor' | 'Tecnico' | 'Operador'>('Operador');
  const [formLoading, setFormLoading] = useState(false);

  const mockUsers: ManagedUser[] = [
    { id: '1', nombreCompleto: 'Administrador del Sistema', nombreUsuario: 'admin', email: 'admin.micompuedu@sanjuan.edu.ar', rol: 'Administrador', activo: true },
    { id: '2', nombreCompleto: 'Supervisor de Depósito', nombreUsuario: 'supervisor', email: 'supervisor.micompuedu@sanjuan.edu.ar', rol: 'Supervisor', activo: true },
    { id: '3', nombreCompleto: 'Técnico Reparador Alfa', nombreUsuario: 'tecnico', email: 'tecnico1.micompuedu@sanjuan.edu.ar', rol: 'Tecnico', activo: true },
    { id: '4', nombreCompleto: 'Operador de Recepción Uno', nombreUsuario: 'operador', email: 'operador1.micompuedu@sanjuan.edu.ar', rol: 'Operador', activo: true }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5110/api/v1/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('No se pudo obtener la lista de usuarios de la API.');
      }
    } catch {
      console.warn('API no disponible. Usando fallback de usuarios locales.');
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
    setPassword(''); // No mostrar contraseña anterior
    setRol(user.rol);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!nombreCompleto.trim() || !nombreUsuario.trim() || !email.trim() || (!editingUser && !password.trim())) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    setFormLoading(true);

    try {
      const url = editingUser 
        ? `http://localhost:5110/api/v1/usuarios/${editingUser.id}` 
        : 'http://localhost:5110/api/v1/usuarios';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombreCompleto,
          nombreUsuario,
          email,
          password: password || undefined,
          rol
        })
      });

      if (response.ok) {
        setSuccess(editingUser ? 'Usuario actualizado con éxito.' : 'Usuario creado con éxito.');
        setShowForm(false);
        fetchUsers();
      } else {
        const errText = await response.text();
        throw new Error(errText || 'Error en el servidor.');
      }
    } catch (err: any) {
      console.warn('API no disponible. Procesando cambio en almacenamiento local.');
      const localUsers = [...users];
      
      if (editingUser) {
        // Editar mock
        const index = localUsers.findIndex(u => u.id === editingUser.id);
        if (index !== -1) {
          localUsers[index] = {
            ...localUsers[index],
            nombreCompleto,
            email,
            rol
          };
          setSuccess('Usuario actualizado con éxito (Local).');
        }
      } else {
        // Crear mock
        const existe = localUsers.some(u => u.nombreUsuario.toLowerCase() === nombreUsuario.toLowerCase());
        if (existe) {
          setError('El nombre de usuario ya está registrado.');
          setFormLoading(false);
          return;
        }
        
        const nuevo: ManagedUser = {
          id: Math.random().toString(),
          nombreCompleto,
          nombreUsuario,
          email,
          rol,
          activo: true
        };
        localUsers.push(nuevo);
        setSuccess('Usuario creado con éxito (Local).');
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
      const response = await fetch(`http://localhost:5110/api/v1/usuarios/${user.id}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchUsers();
      } else {
        throw new Error('Error al cambiar el estado en el servidor.');
      }
    } catch {
      console.warn('API no disponible. Cambiando estado localmente.');
      const localUsers = users.map(u => 
        u.id === user.id ? { ...u, activo: !u.activo } : u
      );
      setUsers(localUsers);
      localStorage.setItem('micompuedu_users', JSON.stringify(localUsers));
      setSuccess(`Estado del usuario ${user.nombreUsuario} actualizado.`);
    }
  };

  const getRoleBadgeColor = (userRol: ManagedUser['rol']) => {
    switch (userRol) {
      case 'Administrador': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'Supervisor': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Tecnico': return 'bg-teal-100 text-teal-700 border border-teal-200';
      default: return 'bg-orange-100 text-orange-700 border border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-[#1D252D] tracking-tight">Gestión de Personal</h1>
          <p className="text-slate-500 text-sm mt-1">Administra las cuentas, roles y accesos del depósito de notebooks.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#FF8200] hover:bg-[#e07200] text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all text-sm flex items-center gap-1.5"
        >
          ➕ Agregar Usuario
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#E03C31]/10 border border-[#E03C31]/30 text-[#E03C31] rounded-lg text-xs font-semibold">
          ❌ {error}
        </div>
      )}

      {/* Users Table / Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-10 h-10 border-4 border-[#FF8200] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Nombre Completo</th>
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Correo Electrónico</th>
                <th className="py-4 px-6">Rol</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{u.nombreCompleto}</td>
                  <td className="py-4 px-6 text-slate-600">@{u.nombreUsuario}</td>
                  <td className="py-4 px-6 text-slate-500">{u.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(u.rol)}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        u.activo ? 'bg-[#FF8200]' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          u.activo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="text-[#FF8200] hover:text-[#e07200] font-bold text-xs bg-orange-50 hover:bg-orange-100/75 px-3 py-1.5 rounded-md transition-colors"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#1D252D]">
                {editingUser ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {editingUser ? `Modificando la cuenta de @${editingUser.nombreUsuario}` : 'Registra un nuevo integrante para el personal del depósito.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200]"
                  placeholder="Juan Pérez"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    required
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200]"
                    placeholder="juanp"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200]"
                  placeholder="juan@sanjuan.edu.ar"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">
                  Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">Rol *</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200]"
                >
                  <option value="Operador">Operador (Ingresos / Entregas / Diagnósticos)</option>
                  <option value="Tecnico">Técnico (Diagnósticos)</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Administrador">Administrador (Total + Usuarios)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-[#FF8200] hover:bg-[#e07200] text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex justify-center items-center"
                >
                  {formLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
