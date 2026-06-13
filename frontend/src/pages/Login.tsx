import React, { useState } from 'react';
import type { User } from '../types';

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
      // Intentamos consumir la API real
      const response = await fetch('http://localhost:5194/api/v1/Auth/login', {
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
        setError(errText || 'Credenciales inválidas.');
      }
    } catch (err) {
      // Fallback local instantáneo para desarrollo o si la API no está corriendo
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-400 mb-3 text-3xl font-extrabold tracking-wider">
            MEC
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">MiCompuEdu</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Gestión de Soporte Técnico Escolar • San Juan
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="username">
              Usuario de Sistema
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ej: admin, tecnico, operador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex justify-center items-center"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-850 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Ministerio de Educación de San Juan.
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Demo: contraseña estándar "Admin123!"
          </p>
        </div>
      </div>
    </div>
  );
};
