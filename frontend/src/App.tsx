import { useState, useEffect } from 'react'
import type { User } from './types'
import { Login } from './pages/Login'
import { RegistrarIngreso } from './pages/Operator/RegistrarIngreso'
import { EntregaNotebook } from './pages/Operator/EntregaNotebook'
import { PanelTecnico } from './pages/Technician/PanelTecnico'
import { Dashboard } from './pages/Supervisor/Dashboard'

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');

  // Cargar sesión del storage
  useEffect(() => {
    const session = localStorage.getItem('micompuedu_session');
    if (session) {
      try {
        const parsed: User = JSON.parse(session);
        setUser(parsed);
      } catch {
        localStorage.removeItem('micompuedu_session');
      }
    }
  }, []);

  // Set default page on login
  useEffect(() => {
    if (user) {
      if (user.rol === 'Operador') {
        setCurrentPage('ingreso');
      } else if (user.rol === 'Tecnico') {
        setCurrentPage('diagnostico');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [user]);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('micompuedu_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('micompuedu_session');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#080b11]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0e131f] border-r border-slate-900 flex flex-col justify-between p-5">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              M
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight leading-none">MiCompuEdu</h2>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">San Juan</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 px-3">Menú Principal</p>
            
            {/* Operator Actions */}
            {(user.rol === 'Operador' || user.rol === 'Supervisor' || user.rol === 'Administrador') && (
              <>
                <button
                  onClick={() => setCurrentPage('ingreso')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                    currentPage === 'ingreso'
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  📥 Registrar Ingreso
                </button>
                <button
                  onClick={() => setCurrentPage('entrega')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                    currentPage === 'entrega'
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  📤 Entregar Notebook
                </button>
              </>
            )}

            {/* Technician Actions */}
            {(user.rol === 'Tecnico' || user.rol === 'Supervisor' || user.rol === 'Administrador') && (
              <button
                onClick={() => setCurrentPage('diagnostico')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  currentPage === 'diagnostico'
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                🔧 Panel de Diagnóstico
              </button>
            )}

            {/* Supervisor Actions */}
            {(user.rol === 'Supervisor' || user.rol === 'Administrador') && (
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  currentPage === 'dashboard'
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                📊 Dashboard Estadístico
              </button>
            )}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-slate-900 pt-4 space-y-3">
          <div className="px-3">
            <p className="text-slate-200 font-bold text-sm truncate">{user.nombreCompleto}</p>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{user.rol}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 font-bold py-2 rounded-lg transition-all text-xs"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {currentPage === 'ingreso' && <RegistrarIngreso token={user.token} />}
        {currentPage === 'entrega' && <EntregaNotebook token={user.token} />}
        {currentPage === 'diagnostico' && <PanelTecnico token={user.token} nombreTecnico={user.nombreCompleto} />}
        {currentPage === 'dashboard' && <Dashboard token={user.token} />}
      </main>
    </div>
  )
}

export default App
