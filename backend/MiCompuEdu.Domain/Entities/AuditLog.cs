using System;

namespace MiCompuEdu.Domain.Entities
{
    /// <summary>
    /// Log inmutable global de auditoría para cambios a nivel de fila.
    /// Registra quién, cuándo y qué datos cambiaron de forma dinámica.
    /// </summary>
    public class AuditLog
    {
        public long Id { get; set; }
        
        /// <summary>Nombre de la tabla afectada (ej. usuarios, reparaciones).</summary>
        public string Tabla { get; set; } = string.Empty;
        
        /// <summary>ID de la clave primaria (UUID) del registro afectado.</summary>
        public Guid RegistroId { get; set; }
        
        /// <summary>Acción realizada: Insert, Update o Delete.</summary>
        public string Accion { get; set; } = string.Empty;
        
        /// <summary>Usuario que ejecutó el cambio (si aplica).</summary>
        public Guid? UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        
        /// <summary>Valores de las columnas antes del cambio (formato JSON).</summary>
        public string? DatosAnteriores { get; set; }
        
        /// <summary>Valores de las columnas después del cambio (formato JSON).</summary>
        public string? DatosNuevos { get; set; }
        
        /// <summary>Fecha y hora en la que se efectuó el cambio en el servidor.</summary>
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}
