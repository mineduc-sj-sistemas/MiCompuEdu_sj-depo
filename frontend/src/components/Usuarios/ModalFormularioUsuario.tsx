import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ManagedUser } from '../../types';
import {
  X,
  User,
  AtSign,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Wrench,
  ClipboardList,
  Check,
  AlertTriangle,
  Loader2,
  UserPlus,
  UserCog,
} from 'lucide-react';

interface ModalFormularioUsuarioProps {
  editingUser: ManagedUser | null;
  nombreCompleto: string;
  setNombreCompleto: (v: string) => void;
  nombreUsuario: string;
  setNombreUsuario: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rol: ManagedUser['rol'];
  setRol: (v: ManagedUser['rol']) => void;
  error: string;
  formLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ROLES_CONFIG: Array<{
  value: ManagedUser['rol'];
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  activeRing: string;
  iconColor: string;
}> = [
  {
    value: 'Operador',
    label: 'Operador',
    desc: 'Ingresos y entregas diarias',
    icon: ClipboardList,
    activeRing: 'border-[#FF8200] bg-orange-50/70 ring-2 ring-[#FF8200]/15',
    iconColor: 'text-orange-600 bg-orange-100',
  },
  {
    value: 'Tecnico',
    label: 'Técnico',
    desc: 'Diagnóstico, taller y garantías',
    icon: Wrench,
    activeRing: 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/15',
    iconColor: 'text-teal-700 bg-teal-100',
  },
  {
    value: 'Supervisor',
    label: 'Supervisor',
    desc: 'Métricas, padrón y trazabilidad',
    icon: BarChart3,
    activeRing: 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/15',
    iconColor: 'text-blue-700 bg-blue-100',
  },
  {
    value: 'Administrador',
    label: 'Administrador',
    desc: 'Control total del sistema y personal',
    icon: ShieldCheck,
    activeRing: 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/15',
    iconColor: 'text-purple-700 bg-purple-100',
  },
];

export const ModalFormularioUsuario: React.FC<ModalFormularioUsuarioProps> = ({
  editingUser,
  nombreCompleto,
  setNombreCompleto,
  nombreUsuario,
  setNombreUsuario,
  email,
  setEmail,
  password,
  setPassword,
  rol,
  setRol,
  error,
  formLoading,
  onClose,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Bloquear el scroll de la página de fondo y cerrar con Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleNombreChange = (val: string) => {
    setNombreCompleto(val);
    if (!editingUser && !usernameTouched) {
      const clean = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (clean.length === 1) {
        setNombreUsuario(clean[0].replace(/[^a-z0-9]/g, ''));
      } else if (clean.length >= 2) {
        const first = clean[0].replace(/[^a-z0-9]/g, '');
        const last = clean[clean.length - 1].replace(/[^a-z0-9]/g, '');
        setNombreUsuario(`${first.charAt(0)}${last}`);
      }
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`Sj#${randomPart}!`);
    setShowPassword(true);
  };

  const applyDomain = (domain: string) => {
    const localPart = (email.split('@')[0] || nombreUsuario || 'usuario').trim();
    setEmail(`${localPart}@${domain}`);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'US';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const passwordStrength = (() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Débil', color: 'bg-red-500', text: 'text-red-600', width: 'w-1/3' };
    if (score <= 2) return { label: 'Aceptable', color: 'bg-amber-500', text: 'text-amber-600', width: 'w-2/3' };
    return { label: 'Segura', color: 'bg-emerald-500', text: 'text-emerald-600', width: 'w-full' };
  })();

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Cabecera luminosa y limpia */}
        <div className="bg-gradient-to-r from-orange-50/80 via-white to-slate-50 border-b border-slate-200/80 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF8200] to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-[#FF8200]/25 shrink-0">
                {nombreCompleto.trim() ? (
                  <span>{getInitials(nombreCompleto)}</span>
                ) : editingUser ? (
                  <UserCog className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {editingUser ? 'Editar Perfil de Personal' : 'Registrar Nuevo Integrante'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#FF8200] border border-orange-200/70">
                    {rol}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {editingUser
                    ? `Actualizando datos y permisos de @${editingUser.nombreUsuario}`
                    : 'Complete los datos institucionales y asigne el nivel de acceso.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-3.5">
          {/* Nombre Completo y Usuario en grilla */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className={editingUser ? 'sm:col-span-12' : 'sm:col-span-7'}>
              <label className="block text-slate-700 text-xs font-bold mb-1">
                Nombre y Apellido <span className="text-[#FF8200]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  className="w-full bg-slate-50/60 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                  placeholder="Ej. Juan Carlos Pérez"
                  autoFocus
                />
              </div>
            </div>

            {!editingUser && (
              <div className="sm:col-span-5">
                <label className="block text-slate-700 text-xs font-bold mb-1">
                  Usuario <span className="text-[#FF8200]">*</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={nombreUsuario}
                    onChange={(e) => {
                      setUsernameTouched(true);
                      setNombreUsuario(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    }}
                    className="w-full bg-slate-50/60 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 transition-all"
                    placeholder="jperez"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Correo Electrónico + Dominios rápidos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 text-xs font-bold">
                Correo Electrónico Institucional <span className="text-[#FF8200]">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDomain('sanjuan.edu.ar')}
                  className="text-[10px] font-semibold text-slate-500 hover:text-[#FF8200] bg-slate-100 hover:bg-orange-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  @sanjuan.edu.ar
                </button>
                <button
                  type="button"
                  onClick={() => applyDomain('sanjuan.gob.ar')}
                  className="text-[10px] font-semibold text-slate-500 hover:text-[#FF8200] bg-slate-100 hover:bg-orange-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  @sanjuan.gob.ar
                </button>
              </div>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/60 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                placeholder="usuario@sanjuan.edu.ar"
              />
            </div>
          </div>

          {/* Contraseña con visibilidad y generador */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 text-xs font-bold">
                {editingUser ? (
                  <>
                    Nueva Contraseña <span className="text-slate-400 font-normal">(opcional)</span>
                  </>
                ) : (
                  <>
                    Contraseña de Acceso <span className="text-[#FF8200]">*</span>
                  </>
                )}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF8200] hover:text-[#e07200] bg-orange-50 hover:bg-orange-100/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Generar clave segura
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingUser}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/60 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                placeholder={editingUser ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordStrength && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`} />
                </div>
                <span className={`text-[10px] font-bold ${passwordStrength.text}`}>
                  Seguridad: {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Selector Visual de Rol en Tarjetas 2x2 */}
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">
              Rol y Nivel de Permisos <span className="text-[#FF8200]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES_CONFIG.map((item) => {
                const Icon = item.icon;
                const isSelected = rol === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRol(item.value)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? item.activeRing
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800">{item.label}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#FF8200] text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-[#E03C31] rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md shadow-[#FF8200]/20 transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
