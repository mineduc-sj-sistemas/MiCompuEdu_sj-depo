import React, { useState, useEffect } from 'react';
import type { ManagedUser } from '../../types';
import { API_BASE_URL } from '../../config';
import { Plus, Pencil, Check, AlertTriangle, Loader2, X, Users } from 'lucide-react';

interface GestionUsuariosProps {
  token: string;
}

export const GestionUsuarios: React.FC<GestionUsuariosProps> = ({ token }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'Administrador' | 'Supervisor' | 'Tecnico' | 'Operador'>('Operador');
  const [formLoading, setFormLoading] = useState(false);

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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(await response.json());
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

  useEffect(() => { fetchUsers(); }, [token]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombreCompleto(''); setNombreUsuario(''); setEmail('');
    setPassword(''); setRol('Operador'); setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setNombreCompleto(user.nombreCompleto);
    setNombreUsuario(user.nombreUsuario);
    setEmail(user.email);
    setPassword(''); setRol(user.rol); setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombreCompleto, nombreUsuario, email, password: password || undefined, rol })
      });
      if (response.ok) {
        setSuccess(editingUser ? 'Usuario actualizado.' : 'Usuario creado.');
        setShowForm(false);
        fetchUsers();
      } else {
        throw new Error(await response.text());
      }
    } catch {
      const localUsers = [...users];
      if (editingUser) {
        const idx = localUsers.findIndex(u => u.id === editingUser.id);
        if (idx !== -1) { localUsers[idx] = { ...localUsers[idx], nombreCompleto, email, rol }; }
        setSuccess('Usuario actualizado (local).');
      } else {
        if (localUsers.some(u => u.nombreUsuario.toLowerCase() === nombreUsuario.toLowerCase())) {
          setError('El nombre de usuario ya existe.'); setFormLoading(false); return;
        }
        localUsers.push({ id: Math.random().toString(), nombreCompleto, nombreUsuario, email, rol, activo: true });
        setSuccess('Usuario creado (local).');
      }
      setUsers(localUsers);
      localStorage.setItem('micompuedu_users', JSON.stringify(localUsers));
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    setError(''); setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${user.id}/toggle-active`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) { fetchUsers(); } else { throw new Error(); }
    } catch {
      const localUsers = users.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u);
      setUsers(localUsers);
      localStorage.setItem('micompuedu_users', JSON.stringify(localUsers));
      setSuccess(`Estado de @${user.nombreUsuario} actualizado.`);
    }
  };

  const roleBadge: Record<ManagedUser['rol'], string> = {
    Administrador: 'bg-purple-50 text-purple-700 border border-purple-200',
    Supervisor: 'bg-blue-50 text-blue-700 border border-blue-200',
    Tecnico: 'bg-teal-50 text-teal-700 border border-teal-200',
    Operador: 'bg-orange-50 text-orange-700 border border-orange-200',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="pb-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#FF8200]" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h1>
            <p className="text-slate-400 text-xs mt-0.5">Administra cuentas, roles y accesos del depósito.</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#FF8200] hover:bg-[#e07200] text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF8200]" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Nombre</th>
                <th className="py-3.5 px-5">Usuario</th>
                <th className="py-3.5 px-5 hidden md:table-cell">Correo</th>
                <th className="py-3.5 px-5">Rol</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">{u.nombreCompleto}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500 font-mono">@{u.nombreUsuario}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-400 hidden md:table-cell">{u.email}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleBadge[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        u.activo ? 'bg-[#FF8200]' : 'bg-slate-200'
                      }`}
                      title={u.activo ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          u.activo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="text-slate-500 hover:text-[#FF8200] font-medium text-xs bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-100 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {editingUser
                    ? `Modificando la cuenta de @${editingUser.nombreUsuario}`
                    : 'Registra un nuevo integrante del personal.'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Nombre Completo *', id: 'nc', type: 'text', value: nombreCompleto, onChange: setNombreCompleto, placeholder: 'Juan Pérez', required: true },
                ...(!editingUser ? [{ label: 'Usuario *', id: 'nu', type: 'text', value: nombreUsuario, onChange: setNombreUsuario, placeholder: 'juanp', required: true }] : []),
                { label: 'Correo Electrónico *', id: 'em', type: 'email', value: email, onChange: setEmail, placeholder: 'juan@sanjuan.edu.ar', required: true },
                { label: editingUser ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *', id: 'pw', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••', required: !editingUser },
              ].map((field) => (
                <div key={field.id}>
                  <label className="block text-slate-700 text-xs font-semibold mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200] transition-colors"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1.5">Rol *</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF8200] transition-colors"
                >
                  <option value="Operador">Operador (Ingresos / Entregas)</option>
                  <option value="Tecnico">Técnico (Diagnósticos)</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Administrador">Administrador (Total)</option>
                </select>
              </div>

              {error && (
                <p className="text-xs text-[#E03C31] bg-red-50 border border-red-100 p-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-2.5 rounded-lg text-sm transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex justify-center items-center cursor-pointer"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
