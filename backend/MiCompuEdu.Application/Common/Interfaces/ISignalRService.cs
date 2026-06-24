using System.Threading.Tasks;

namespace MiCompuEdu.Application.Common.Interfaces
{
    public interface ISignalRService
    {
        Task SendStatusUpdateAsync(string reparacionId, string nuevoEstado);
        Task SendSignatureReceivedAsync(string reparacionId, string tipoFirma);
    }
}
