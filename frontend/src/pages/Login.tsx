import React, { useState } from 'react';
import type { User as UserType } from '../types';
import { LogoSanJuan } from '../components/Shared/LogoSanJuan';
import { API_BASE_URL } from '../config';
import { User, KeyRound, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombreUsuario: username, password }),
      });

      if (response.ok) {
        const data: UserType = await response.json();
        onLoginSuccess(data);
      } else {
        const errText = await response.text();
        setError(errText || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.warn('API no disponible. Usando fallback de simulación local.');
      if (password === 'Admin123!') {
        let role: UserType['rol'] = 'Administrador';
        let nombre = 'Administrador Demo';
        
        if (username === 'admin') {
          role = 'Administrador';
          nombre = 'Administrador del Sistema';
        } else if (username === 'supervisor') {
          role = 'Supervisor';
          nombre = 'Supervisor de Depósito';
        } else if (username === 'tecnico') {
          role = 'Tecnico';
          nombre = 'Técnico Reparador Alfa';
        } else if (username === 'operador') {
          role = 'Operador';
          nombre = 'Operador de Recepción Uno';
        } else {
          setError('Usuario desconocido en simulación local.');
          setLoading(false);
          return;
        }

        onLoginSuccess({
          token: 'mock-jwt-token-for-demo',
          nombreCompleto: nombre,
          nombreUsuario: username,
          rol: role,
          email: `${username}@sanjuan.edu.ar`
        });
      } else {
        setError('Error de conexión. Intente con contraseña "Admin123!".');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

        {/* Logo dentro de la tarjeta, centrado */}
        <div className="flex justify-center mb-8">
          <LogoSanJuan height={160} heightMobile={100} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ingreso al Sistema</h1>
          <p className="text-slate-400 mt-1 text-xs">
            Portal del Ministerio de Educación • Depósito de Notebooks
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1.5" htmlFor="username">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all flex justify-center items-center text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} Ministerio de Educación. Gobierno de San Juan.
          </p>
          <p className="text-[9px] text-[#FF8200] font-semibold mt-1 uppercase tracking-wider">
            Demo pass: Admin123!
          </p>
        </div>
      </div>
    </div>
  );
};
