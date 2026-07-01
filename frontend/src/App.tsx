import { useState, useEffect } from 'react'
import type { User as UserType } from './types'
import { Login } from './pages/Login'
import { RegistrarIngreso } from './pages/Operator/RegistrarIngreso'
import { EntregaNotebook } from './pages/Operator/EntregaNotebook'
import { PanelTecnico } from './pages/Technician/PanelTecnico'
import { Dashboard } from './pages/Supervisor/Dashboard'
import { LogoSanJuan } from './components/Shared/LogoSanJuan'
import { GestionUsuarios } from './pages/Supervisor/GestionUsuarios'
import { ImportarPadron } from './pages/Supervisor/ImportarPadron'

import { ConsultaPublica } from './pages/ConsultaPublica'
import { HealthCheckBanner } from './components/Shared/HealthCheckBanner'
import { Download, Upload, Wrench, BarChart3, Users, LogOut, User as UserIcon, Database } from 'lucide-react'

function App() {

  const isConsulta = window.location.pathname === '/consulta';
  if (isConsulta) {
    return <ConsultaPublica />;
  }

  const [user, setUser] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('');

  useEffect(() => {
    const session = localStorage.getItem('micompuedu_session');
    if (session) {
      try {
        const parsed: UserType = JSON.parse(session);
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

  const handleLoginSuccess = (userData: UserType) => {
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-[#1D252D]">
      <HealthCheckBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 z-10">
          <div className="space-y-8">
            {/* Logo Oficial San Juan */}
            <LogoSanJuan showMinistry={false} className="max-w-[180px]" />

            {/* Navigation Links */}
            <nav className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 px-3">Menú de Gestión</p>
              
              {/* Operator Actions */}
              {(user.rol === 'Operador' || user.rol === 'Supervisor' || user.rol === 'Administrador') && (
                <>
                  <button
                    onClick={() => setCurrentPage('ingreso')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                      currentPage === 'ingreso'
                        ? 'bg-slate-100 text-[#FF8200] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Download className="w-4 h-4 text-current" />
                    Registrar Ingreso
                  </button>
                  <button
                    onClick={() => setCurrentPage('entrega')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                      currentPage === 'entrega'
                        ? 'bg-slate-100 text-[#FF8200] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-current" />
                    Entregar Notebook
                  </button>
                </>
              )}

              {/* Technician Actions */}
              {(user.rol === 'Tecnico' || user.rol === 'Supervisor' || user.rol === 'Administrador' || user.rol === 'Operador') && (
                <button
                  onClick={() => setCurrentPage('diagnostico')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                    currentPage === 'diagnostico'
                      ? 'bg-slate-100 text-[#FF8200] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-current" />
                  Soporte y Garantía
                </button>
              )}

              {/* Supervisor Actions */}
              {(user.rol === 'Supervisor' || user.rol === 'Administrador') && (
                <>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                      currentPage === 'dashboard'
                        ? 'bg-slate-100 text-[#FF8200] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-current" />
                    Dashboard Estadístico
                  </button>
                  <button
                    onClick={() => setCurrentPage('importar')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                      currentPage === 'importar'
                        ? 'bg-slate-100 text-[#FF8200] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="w-4 h-4 text-current" />
                    Importar Padrón
                  </button>
                </>
              )}

              {/* Admin Actions */}
              {user.rol === 'Administrador' && (
                <button
                  onClick={() => setCurrentPage('usuarios')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 ${
                    currentPage === 'usuarios'
                      ? 'bg-slate-100 text-[#FF8200] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-current" />
                  Gestión de Personal
                </button>
              )}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="px-3 flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-900 font-semibold text-sm truncate">{user.nombreCompleto}</p>
                <span className="text-[10px] text-[#FF8200] font-semibold uppercase tracking-wider">{user.rol}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-[#E03C31] border border-slate-200 hover:border-red-100 font-medium py-2 rounded-lg transition-all text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-48px)] bg-slate-50">
          {currentPage === 'ingreso' && <RegistrarIngreso token={user.token} />}
          {currentPage === 'entrega' && <EntregaNotebook token={user.token} />}
          {currentPage === 'diagnostico' && <PanelTecnico token={user.token} nombreTecnico={user.nombreCompleto} />}
          {currentPage === 'dashboard' && <Dashboard token={user.token} />}
          {currentPage === 'importar' && <ImportarPadron token={user.token} />}
          {currentPage === 'usuarios' && <GestionUsuarios token={user.token} />}
        </main>
      </div>
    </div>
  )
}

export default App
