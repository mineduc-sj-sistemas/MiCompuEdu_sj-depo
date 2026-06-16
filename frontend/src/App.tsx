import { useState, useEffect } from 'react'
import type { User } from './types'
import { Login } from './pages/Login'
import { RegistrarIngreso } from './pages/Operator/RegistrarIngreso'
import { EntregaNotebook } from './pages/Operator/EntregaNotebook'
import { PanelTecnico } from './pages/Technician/PanelTecnico'
import { Dashboard } from './pages/Supervisor/Dashboard'
import { LogoSanJuan } from './components/Shared/LogoSanJuan'
import { GestionUsuarios } from './pages/Supervisor/GestionUsuarios'

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');

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
    <div className="flex min-h-screen bg-white text-[#1D252D]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-8">
          {/* Logo Oficial San Juan */}
          <LogoSanJuan showMinistry={false} className="max-w-[180px]" />

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">Menú de Gestión</p>
            
            {/* Operator Actions */}
            {(user.rol === 'Operador' || user.rol === 'Supervisor' || user.rol === 'Administrador') && (
              <>
                <button
                  onClick={() => setCurrentPage('ingreso')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                    currentPage === 'ingreso'
                      ? 'bg-[#FF8200]/10 text-[#FF8200] border-l-2 border-[#FF8200]'
                      : 'text-slate-600 hover:text-[#1D252D] hover:bg-slate-100'
                  }`}
                >
                  📥 Registrar Ingreso
                </button>
                <button
                  onClick={() => setCurrentPage('entrega')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                    currentPage === 'entrega'
                      ? 'bg-[#FF8200]/10 text-[#FF8200] border-l-2 border-[#FF8200]'
                      : 'text-slate-600 hover:text-[#1D252D] hover:bg-slate-100'
                  }`}
                >
                  📤 Entregar Notebook
                </button>
              </>
            )}

            {/* Technician Actions */}
            {(user.rol === 'Tecnico' || user.rol === 'Supervisor' || user.rol === 'Administrador' || user.rol === 'Operador') && (
              <button
                onClick={() => setCurrentPage('diagnostico')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  currentPage === 'diagnostico'
                    ? 'bg-[#FF8200]/10 text-[#FF8200] border-l-2 border-[#FF8200]'
                    : 'text-slate-600 hover:text-[#1D252D] hover:bg-slate-100'
                }`}
              >
                🔧 Soporte y Garantía
              </button>
            )}

            {/* Supervisor Actions */}
            {(user.rol === 'Supervisor' || user.rol === 'Administrador') && (
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  currentPage === 'dashboard'
                    ? 'bg-[#FF8200]/10 text-[#FF8200] border-l-2 border-[#FF8200]'
                    : 'text-slate-600 hover:text-[#1D252D] hover:bg-slate-100'
                }`}
              >
                📊 Dashboard Estadístico
              </button>
            )}

            {/* Admin Actions */}
            {user.rol === 'Administrador' && (
              <button
                onClick={() => setCurrentPage('usuarios')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  currentPage === 'usuarios'
                    ? 'bg-[#FF8200]/10 text-[#FF8200] border-l-2 border-[#FF8200]'
                    : 'text-slate-600 hover:text-[#1D252D] hover:bg-slate-100'
                }`}
              >
                👥 Gestión de Personal
              </button>
            )}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="px-3">
            <p className="text-[#1D252D] font-bold text-sm truncate">{user.nombreCompleto}</p>
            <span className="text-[10px] text-[#FF8200] font-bold uppercase tracking-wider">{user.rol}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-[#E03C31] border border-slate-200 hover:border-red-200 font-bold py-2 rounded-lg transition-all text-xs"
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
        {currentPage === 'usuarios' && <GestionUsuarios token={user.token} />}
      </main>
    </div>
  )
}

export default App
