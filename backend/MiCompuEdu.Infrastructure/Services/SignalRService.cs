using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MiCompuEdu.Infrastructure.Services
{
    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<ReparacionHub> _hubContext;

        public SignalRService(IHubContext<ReparacionHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendStatusUpdateAsync(string reparacionId, string nuevoEstado)
        {
            await _hubContext.Clients.All.SendAsync("StatusUpdated", reparacionId, nuevoEstado);
        }

        public async Task SendSignatureReceivedAsync(string reparacionId, string tipoFirma)
        {
            await _hubContext.Clients.Group(reparacionId).SendAsync("SignatureReceived", reparacionId, tipoFirma);
            await _hubContext.Clients.All.SendAsync("SignatureReceivedGlobal", reparacionId, tipoFirma);
        }
    }
}
