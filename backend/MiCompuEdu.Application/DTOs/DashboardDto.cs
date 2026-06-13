using System.Collections.Generic;

namespace MiCompuEdu.Application.DTOs
{
    public class DashboardDto
    {
        public int EquiposIngresados { get; set; }
        public int EquiposPendientes { get; set; }
        public int EquiposEntregados { get; set; }
        public double TiempoPromedioReparacionDias { get; set; }
        public List<FallaFrecuenteDto> FallasMasFrecuentes { get; set; } = new();
        public Dictionary<string, int> EquiposPorEstado { get; set; } = new();
    }

    public class FallaFrecuenteDto
    {
        public string Falla { get; set; } = string.Empty;
        public int Cantidad { get; set; }
    }
}
