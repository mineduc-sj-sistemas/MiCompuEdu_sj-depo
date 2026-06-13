import React, { useState } from 'react';
import type { User } from '../types';
import { LogoSanJuan } from '../components/Shared/LogoSanJuan';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
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
      const response = await fetch('http://localhost:5110/api/v1/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombreUsuario: username, password }),
      });

      if (response.ok) {
        const data: User = await response.json();
        onLoginSuccess(data);
      } else {
        const errText = await response.text();
        setError(errText || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.warn('API no disponible. Usando fallback de simulación local.');
      if (password === 'Admin123!') {
        let role: User['rol'] = 'Administrador';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      {/* Soft background shape */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FBDD40]/5 rounded-bl-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-[#FF8200]/5 rounded-tr-[80px] -z-10"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative z-10">
        <div className="flex justify-center mb-8">
          <LogoSanJuan className="max-w-[340px]" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1D252D] tracking-tight">Ingreso al Sistema</h1>
          <p className="text-slate-500 mt-1.5 text-xs">
            Portal del Ministerio de Educación • Depósito de Notebooks
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-[#E03C31]/10 border border-[#E03C31]/30 text-[#E03C31] rounded-lg text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#1D252D] text-xs font-bold uppercase tracking-wider mb-2" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[#1D252D] text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[#1D252D] placeholder-slate-400 focus:outline-none focus:border-[#FF8200] transition-colors text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg shadow-orange-500/10 transition-all flex justify-center items-center text-sm"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} Ministerio de Educación. Gobierno de San Juan.
          </p>
          <p className="text-[9px] text-[#FF8200] font-bold mt-1 uppercase tracking-wider">
            Demo pass: Admin123!
          </p>
        </div>
      </div>
    </div>
  );
};
