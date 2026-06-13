using System.Threading.Tasks;

namespace MiCompuEdu.Application.Common.Interfaces
{
    public interface IWhatsAppService
    {
        Task<bool> SendNotificationAsync(string telefono, string mensaje);
    }
}
