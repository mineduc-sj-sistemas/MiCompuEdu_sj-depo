using System;
using MiCompuEdu.Application.Reparaciones.Commands;
using MiCompuEdu.Domain.Enums;

namespace MiCompuEdu.Application.DTOs
{
    public record CreateReparacionRequest(
        Guid EquipoId,
        string? EquipoMarca,
        string? EquipoModelo,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null,
        DateTime? FechaIngreso = null,
        bool SoloCargador = false,
        TipoBeneficiario? TipoBeneficiario = null,
        string? NuevoEquipoNumeroSerie = null,
        string? NuevoEquipoMarca = null,
        string? NuevoEquipoModelo = null,
        string? NuevoEquipoCredencialesOffice = null,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null,
        string? TitularTelefono = null,
        string? PersonaEntregaTipo = null,
        string? PersonaEntregaNombre = null,
        string? PersonaEntregaDni = null,
        string? PersonaEntregaTelefono = null,
        string? PersonaEntregaParentesco = null,
        string? DocIdentidadIngresoBase64 = null
    )
    {
        public RegistrarIngresoCommand ToCommand(Guid operadorId) => new(
            EquipoId, EquipoMarca, EquipoModelo, FallaReportada, FallaCatalogoId, Observaciones,
            operadorId, EscuelaId, ProgramaEducativoId, UbicacionDepositoId, FirmaIngresoBase64,
            FechaIngreso, SoloCargador, TipoBeneficiario, NuevoEquipoNumeroSerie, NuevoEquipoMarca,
            NuevoEquipoModelo, NuevoEquipoCredencialesOffice, TutorNombre, TutorDni, TutorTelefono,
            TitularTelefono, PersonaEntregaTipo, PersonaEntregaNombre, PersonaEntregaDni,
            PersonaEntregaTelefono, PersonaEntregaParentesco, DocIdentidadIngresoBase64
        );
    }

    public record CreateReparacionManualRequest(
        string TitularDni,
        string TitularNombre,
        string TitularApellido,
        string TitularTelefono,
        string TitularEmail,
        TipoBeneficiario TipoBeneficiario,
        string EquipoNumeroSerie,
        string EquipoMarca,
        string EquipoModelo,
        string? EquipoCredencialesOffice,
        string FallaReportada,
        int? FallaCatalogoId,
        string? Observaciones,
        Guid? EscuelaId = null,
        Guid? ProgramaEducativoId = null,
        Guid? UbicacionDepositoId = null,
        string? FirmaIngresoBase64 = null,
        DateTime? FechaIngreso = null,
        bool SoloCargador = false,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? TutorTelefono = null,
        string? PersonaEntregaTipo = null,
        string? PersonaEntregaNombre = null,
        string? PersonaEntregaDni = null,
        string? PersonaEntregaTelefono = null,
        string? PersonaEntregaParentesco = null,
        string? DocIdentidadIngresoBase64 = null
    )
    {
        public RegistrarIngresoManualCommand ToCommand(Guid operadorId) => new(
            TitularDni, TitularNombre, TitularApellido, TitularTelefono, TitularEmail,
            TipoBeneficiario, EquipoNumeroSerie, EquipoMarca, EquipoModelo, EquipoCredencialesOffice,
            FallaReportada, FallaCatalogoId, Observaciones, operadorId, EscuelaId,
            ProgramaEducativoId, UbicacionDepositoId, FirmaIngresoBase64, FechaIngreso,
            SoloCargador, TutorNombre, TutorDni, TutorTelefono, PersonaEntregaTipo,
            PersonaEntregaNombre, PersonaEntregaDni, PersonaEntregaTelefono, PersonaEntregaParentesco,
            DocIdentidadIngresoBase64
        );
    }

    public record UpdateEstadoRequest(
        string NuevoEstado,
        string? Diagnostico,
        string? AccionesRealizadas,
        string? Observaciones,
        string? ProveedorGarantia = null,
        string? RemitoGarantia = null,
        DateTime? FechaEsperadaGarantia = null,
        string? FirmaEntregaBase64 = null,
        string? TelefonoContacto = null,
        string? TutorNombre = null,
        string? TutorDni = null,
        string? PersonaRetiroTipo = null,
        string? PersonaRetiroNombre = null,
        string? PersonaRetiroDni = null,
        string? PersonaRetiroTelefono = null,
        string? PersonaRetiroParentesco = null,
        string? DocIdentidadEntregaBase64 = null
    )
    {
        public ActualizarEstadoCommand ToCommand(Guid id, EstadoEquipo parsedEstado, Guid usuarioId) => new(
            id, parsedEstado, Diagnostico, AccionesRealizadas, Observaciones, usuarioId,
            ProveedorGarantia, RemitoGarantia, FechaEsperadaGarantia, FirmaEntregaBase64,
            TelefonoContacto, TutorNombre, TutorDni, PersonaRetiroTipo, PersonaRetiroNombre,
            PersonaRetiroDni, PersonaRetiroTelefono, PersonaRetiroParentesco, DocIdentidadEntregaBase64
        );
    }
}
