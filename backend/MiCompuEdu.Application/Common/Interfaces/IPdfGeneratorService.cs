using System.Threading.Tasks;
using MiCompuEdu.Domain.Entities;

namespace MiCompuEdu.Application.Common.Interfaces
{
    public interface IPdfGeneratorService
    {
        Task<string> GenerateReceiptPdfAsync(Reparacion reparacion);
    }
}
