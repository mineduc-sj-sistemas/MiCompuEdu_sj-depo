using System;

namespace MiCompuEdu.Application.DTOs
{
    public class UbicacionDepositoDto
    {
        public Guid Id { get; set; }
        public string Estanteria { get; set; } = string.Empty;
        public int Fila { get; set; }
        public int Posicion { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }
}
