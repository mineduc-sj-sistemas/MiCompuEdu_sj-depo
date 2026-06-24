using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace MiCompuEdu.Infrastructure.Hubs
{
    public class ReparacionHub : Hub
    {
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task SendStatusUpdate(string reparacionId, string nuevoEstado)
        {
            await Clients.All.SendAsync("StatusUpdated", reparacionId, nuevoEstado);
        }

        public async Task SendSignatureReceived(string reparacionId, string tipoFirma)
        {
            await Clients.Group(reparacionId).SendAsync("SignatureReceived", reparacionId, tipoFirma);
            await Clients.All.SendAsync("SignatureReceivedGlobal", reparacionId, tipoFirma);
        }
    }
}
