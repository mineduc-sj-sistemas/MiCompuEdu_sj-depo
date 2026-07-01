import React, { useState } from 'react';
import { X, Loader2, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface CrearEscuelaModalProps {
  token: string;
  onClose: () => void;
  onSuccess: (nuevaEscuela: { id: string; nombre: string }) => void;
}

export function CrearEscuelaModal({ token, onClose, onSuccess }: CrearEscuelaModalProps) {
  const [nombre, setNombre] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/Escuelas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.title || 'Ocurrió un error al crear la escuela.');
      }

      const data = await response.json();
      onSuccess(data);
      
      setNombre('');
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#FF8200]">
            <Building2 className="w-5 h-5" />
            <h2 className="text-base font-semibold text-slate-800">Crear Nueva Escuela</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-[#E03C31] rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}
          
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nombre del Establecimiento *</label>
              <input
                required
                type="text"
                placeholder="Ej: Escuela Primaria N° 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF8200] transition-colors"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF8200] hover:bg-[#e07200] disabled:bg-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer min-w-[120px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Escuela'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
