# EJEMPLO DE CÓDIGO DE ARQUITECTURA LIMPIA (CLEAN ARCHITECTURE)
## Implementación Práctica para MiCompuEdu_sj

A continuación se presentan ejemplos reales de la estructura de código para demostrar la implementación práctica de la arquitectura propuesta en .NET 8 (Backend) y React + TypeScript (Frontend).

---

## 1. BACKEND (.NET 8)

### 1.1. Capa de Dominio (Domain)
#### [Entities/Equipo.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Domain/Entities/Equipo.cs)
```csharp
using System;
using MiCompuEdu.Domain.Common;

namespace MiCompuEdu.Domain.Entities
{
    public class Equipo : BaseEntity
    {
        public string NumeroSerie { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public string? CredencialesOffice { get; set; }
        
        // Relación con el Beneficiario
        public Guid BeneficiarioId { get; set; }
        public Beneficiario Beneficiario { get; set; } = null!;
        
        // Relación con el historial de reparaciones
        public ICollection<Reparacion> Reparaciones { get; set; } = new List<Reparacion>();
    }
}
```

---

### 1.2. Capa de Aplicación (Application)
#### [DTOs/ReparacionDto.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Application/DTOs/ReparacionDto.cs)
```csharp
using System;

namespace MiCompuEdu.Application.DTOs
{
    public class ReparacionDto
    {
        public Guid Id { get; set; }
        public Guid EquipoId { get; set; }
        public string NumeroSerie { get; set; } = string.Empty;
        public string MarcaModelo { get; set; } = string.Empty;
        public string NombreTutor { get; set; } = string.Empty;
        public string TelefonoTutor { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string FallaReportada { get; set; } = string.Empty;
        public string? Diagnostico { get; set; }
        public DateTime FechaIngreso { get; set; }
    }
}
```

#### [Reparaciones/Commands/RegistrarIngresoCommand.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Application/Reparaciones/Commands/RegistrarIngresoCommand.cs)
```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MiCompuEdu.Application.Reparaciones.Commands
{
    // Command
    public record RegistrarIngresoCommand(
        Guid EquipoId,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid OperadorId
    ) : IRequest<ReparacionDto>;

    // Handler
    public class RegistrarIngresoCommandHandler : IRequestHandler<RegistrarIngresoCommand, ReparacionDto>
    {
        private readonly IApplicationDbContext _context;

        public RegistrarIngresoCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ReparacionDto> Handle(RegistrarIngresoCommand request, CancellationToken cancellationToken)
        {
            var equipo = await _context.Equipos
                .Include(e => e.Beneficiario)
                .FirstOrDefaultAsync(e => e.Id == request.EquipoId, cancellationToken);

            if (equipo == null)
            {
                throw new KeyNotFoundException($"El equipo con ID {request.EquipoId} no existe.");
            }

            var reparacion = new Reparacion
            {
                Id = Guid.NewGuid(),
                EquipoId = request.EquipoId,
                OperadorIngresoId = request.OperadorId,
                Estado = EstadoEquipo.Ingresado,
                FallaReportada = request.FallaReportada,
                FallaCatalogoId = request.FallaCatalogoId,
                Observaciones = request.Observaciones,
                FechaIngreso = DateTime.UtcNow
            };

            // Registro en Historial
            var movimiento = new HistorialMovimiento
            {
                Id = Guid.NewGuid(),
                ReparacionId = reparacion.Id,
                EstadoAnterior = null,
                EstadoNuevo = EstadoEquipo.Ingresado,
                UsuarioId = request.OperadorId,
                Observaciones = "Ingreso inicial registrado en sistema.",
                FechaMovimiento = DateTime.UtcNow
            };

            _context.Reparaciones.Add(reparacion);
            _context.HistorialMovimientos.Add(movimiento);
            
            await _context.SaveChangesAsync(cancellationToken);

            return new ReparacionDto
            {
                Id = reparacion.Id,
                EquipoId = equipo.Id,
                NumeroSerie = equipo.NumeroSerie,
                MarcaModelo = $"{equipo.Marca} {equipo.Modelo}",
                NombreTutor = $"{equipo.Beneficiario.Nombre} {equipo.Beneficiario.Apellido}",
                TelefonoTutor = equipo.Beneficiario.Telefono,
                Estado = reparacion.Estado.ToString(),
                FallaReportada = reparacion.FallaReportada,
                FechaIngreso = reparacion.FechaIngreso
            };
        }
    }
}
```

---

### 1.3. Capa de Presentación (Web API)
#### [Controllers/ReparacionesController.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.WebApi/Controllers/ReparacionesController.cs)
```csharp
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using MiCompuEdu.Application.DTOs;
using MiCompuEdu.Application.Reparaciones.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MiCompuEdu.WebApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReparacionesController : ControllerBase
    {
        private readonly ISender _mediator;

        public ReparacionesController(ISender mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        [Authorize(Roles = "Operador,Supervisor,Administrador")]
        public async Task<ActionResult<ReparacionDto>> RegistrarIngreso([FromBody] CreateReparacionRequest request)
        {
            // Extraer el ID del operador desde los Claims del JWT Token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var operadorId))
            {
                return Unauthorized("Token de autenticación no contiene un identificador de usuario válido.");
            }

            var command = new RegistrarIngresoCommand(
                request.EquipoId,
                request.FallaReportada,
                request.FallaCatalogoId,
                request.Observaciones,
                operadorId
            );

            var resultado = await _mediator.Send(command);
            
            return CreatedAtAction(nameof(RegistrarIngreso), new { id = resultado.Id }, resultado);
        }
    }

    public record CreateReparacionRequest(
        Guid EquipoId,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones
    );
}
```

---

## 2. FRONTEND (React + TypeScript)

### 2.1. Componente de Recepción (Escaneo de DNI)
#### [pages/Operator/RegistrarIngreso.tsx](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/frontend/src/pages/Operator/RegistrarIngreso.tsx)
```tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface BeneficiarioData {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  equipo: {
    id: string;
    numeroSerie: string;
    marca: string;
    modelo: string;
  };
}

export const RegistrarIngreso: React.FC = () => {
  const [dniInput, setDniInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [beneficiario, setBeneficiario] = useState<BeneficiarioData | null>(null);
  const [fallaReportada, setFallaReportada] = useState('');
  const [fallaCatalogoId, setFallaCatalogoId] = useState<number>(1);
  const [observaciones, setObservaciones] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  
  const dniInputRef = useRef<HTMLInputElement>(null);

  // Escucha del escáner físico de DNI (Envía un Enter al final de la lectura)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarBeneficiario();
    }
  };

  const buscarBeneficiario = async () => {
    if (!dniInput.trim()) return;
    setLoading(true);
    setMensajeError('');
    setBeneficiario(null);
    
    try {
      // Endpoint que consulta el padrón del Ministerio
      const response = await axios.get<BeneficiarioData>(`/api/v1/beneficiarios/${dniInput.trim()}`);
      setBeneficiario(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMensajeError('El DNI ingresado no está registrado en el padrón del Ministerio.');
      } else {
        setMensajeError('Ocurrió un error al consultar el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIngresarNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiario) return;

    try {
      const payload = {
        equipoId: beneficiario.equipo.id,
        fallaReportada,
        fallaCatalogoId,
        observaciones
      };

      const response = await axios.post('/api/v1/reparaciones', payload);
      setMensajeExito(`Ingreso registrado con éxito. Descargando comprobante PDF...`);
      window.open(response.data.comprobanteUrl, '_blank');
      
      // Limpiar formulario para nuevo registro
      setBeneficiario(null);
      setDniInput('');
      setFallaReportada('');
      setObservaciones('');
      dniInputRef.current?.focus();
    } catch (error) {
      setMensajeError('Error al guardar el ingreso en el sistema.');
    }
  };

  useEffect(() => {
    dniInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-indigo-400">Ingreso de Equipos - Depósito Central</h2>
        
        {/* Lector DNI */}
        <div className="mb-6 bg-slate-850 p-4 rounded-lg border border-slate-750">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Escanear Código de Barras DNI (PDF417)
          </label>
          <div className="flex gap-2">
            <input
              ref={dniInputRef}
              type="text"
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Enfoque aquí y pase el lector..."
              value={dniInput}
              onChange={(e) => setDniInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={buscarBeneficiario}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded transition-colors"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {mensajeError && <div className="p-4 mb-4 bg-red-900/40 text-red-300 border border-red-800 rounded">{mensajeError}</div>}
        {mensajeExito && <div className="p-4 mb-4 bg-green-900/40 text-green-300 border border-green-800 rounded">{mensajeExito}</div>}

        {/* Formulario de Ingreso */}
        {beneficiario && (
          <form onSubmit={handleIngresarNotebook} className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bloque Beneficiario */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <h3 className="text-lg font-bold text-indigo-300">Datos del Tutor</h3>
                <p><span className="text-slate-400">Nombre completo:</span> {beneficiario.nombre} {beneficiario.apellido}</p>
                <p><span className="text-slate-400">DNI:</span> {beneficiario.dni}</p>
                <p><span className="text-slate-400">Teléfono:</span> {beneficiario.telefono}</p>
                <p><span className="text-slate-400">Email:</span> {beneficiario.email}</p>
              </div>

              {/* Bloque Equipo */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <h3 className="text-lg font-bold text-indigo-300">Equipo Asignado</h3>
                <p><span className="text-slate-400">Nro. de Serie:</span> {beneficiario.equipo.numeroSerie}</p>
                <p><span className="text-slate-400">Marca:</span> {beneficiario.equipo.marca}</p>
                <p><span className="text-slate-400">Modelo:</span> {beneficiario.equipo.modelo}</p>
              </div>

            </div>

            {/* Inputs Falla */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Falla Reportada por el Tutor</label>
                <textarea
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  rows={3}
                  value={fallaReportada}
                  onChange={(e) => setFallaReportada(e.target.value)}
                  placeholder="Detallar la falla comentada..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Observaciones Estéticas de Recepción</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Rayas en la tapa, pantalla sucia..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setBeneficiario(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-6 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-2 rounded shadow-lg shadow-indigo-600/30"
              >
                Confirmar e Ingresar Equipo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
