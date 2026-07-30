using System;
using System.IO;
using System.Threading.Tasks;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

using Microsoft.Extensions.Configuration;

namespace MiCompuEdu.Infrastructure.Services
{
    public class PdfGeneratorService : IPdfGeneratorService
    {
        private readonly IConfiguration _configuration;

        public PdfGeneratorService(IConfiguration configuration)
        {
            _configuration = configuration;
            // Registrar licencia de QuestPDF (requerido para versión comunitaria)
            try
            {
                QuestPDF.Settings.License = LicenseType.Community;
            }
            catch
            {
                // Evitar fallas si ya se registró previamente
            }
        }

        public Task<string> GenerateReceiptPdfAsync(Reparacion reparacion)
        {
            var equipo = reparacion.Equipo;
            var beneficiario = equipo?.Beneficiario;

            if (equipo == null || beneficiario == null)
            {
                throw new ArgumentException("La reparación debe incluir las entidades de Equipo y Beneficiario cargadas.");
            }

            // Decodificar firma del tutor si existe
            byte[]? signatureBytes = null;
            if (!string.IsNullOrEmpty(reparacion.FirmaIngresoBase64))
            {
                try
                {
                    var base64Data = reparacion.FirmaIngresoBase64;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
                    }
                    signatureBytes = Convert.FromBase64String(base64Data);
                }
                catch
                {
                    // Ignorar errores de decodificación
                }
            }

            // Generar código QR
            byte[] qrCodeBytes;
            string frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            string statusUrl = $"{frontendUrl.TrimEnd('/')}/consulta?id={reparacion.Id}";
            using (var qrGenerator = new QRCodeGenerator())
            using (var qrCodeData = qrGenerator.CreateQrCode(statusUrl, QRCodeGenerator.ECCLevel.Q))
            using (var pngByteQrCode = new PngByteQRCode(qrCodeData))
            {
                qrCodeBytes = pngByteQrCode.GetGraphic(20);
            }

            // Crear el documento QuestPDF
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A5); // Formato recibo
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial").FontColor(Colors.Grey.Darken4));

                    // Encabezado
                    page.Header().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Row(row =>
                    {
                        row.RelativeItem().Column(column =>
                        {
                            column.Item().Text("MINISTERIO DE EDUCACIÓN").Bold().FontSize(12).FontColor(Colors.Orange.Darken3);
                            column.Item().Text("Gobierno de San Juan").Bold().FontSize(9).FontColor(Colors.Grey.Darken2);
                            column.Item().Text("Depósito Central de Notebooks").FontSize(8).Italic().FontColor(Colors.Grey.Darken1);
                        });
                        row.ConstantItem(50).Height(50).Image(qrCodeBytes);
                    });

                    // Contenido
                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Text($"Comprobante de Ingreso #{reparacion.Id.ToString().Substring(0, 8).ToUpper()}").Bold().FontSize(11).FontColor(Colors.Grey.Darken4);
                        col.Item().PaddingTop(5);

                        if (reparacion.SoloCargador)
                        {
                            col.Item().Background(Colors.Red.Lighten5).Border(1).BorderColor(Colors.Red.Lighten2).Padding(4).AlignCenter().Text("*** INGRESO DE SOLO CARGADOR (HARDWARE) ***").Bold().FontSize(10).FontColor(Colors.Red.Darken3);
                            col.Item().PaddingTop(5);
                        }

                        // Fila de datos del Tutor
                        col.Item().Background(Colors.Grey.Lighten4).Padding(5).Column(tutorCol =>
                        {
                            tutorCol.Item().Text("DATOS DEL TUTOR / BENEFICIARIO").Bold().FontSize(8).FontColor(Colors.Grey.Darken3);
                            tutorCol.Item().Text($"Nombre: {beneficiario.Nombre} {beneficiario.Apellido}");
                            tutorCol.Item().Text($"DNI: {beneficiario.Dni}    |    Teléfono: {beneficiario.Telefono}");
                            if (!string.IsNullOrEmpty(beneficiario.NombreTutor))
                            {
                                tutorCol.Item().Text($"Tutor/Responsable: {beneficiario.NombreTutor} (DNI: {beneficiario.DniTutor ?? "-"})");
                            }
                            tutorCol.Item().Text($"Email: {beneficiario.Email}");
                        });

                        col.Item().PaddingTop(10);

                        // Fila de datos del Equipo
                        col.Item().Background(Colors.Grey.Lighten4).Padding(5).Column(equipoCol =>
                        {
                            equipoCol.Item().Text("DATOS DEL DISPOSITIVO").Bold().FontSize(8).FontColor(Colors.Grey.Darken3);
                            equipoCol.Item().Text($"Marca / Modelo: {equipo.Marca} {equipo.Modelo}");
                            equipoCol.Item().Text($"Número de Serie: {equipo.NumeroSerie}");
                        });

                        col.Item().PaddingTop(10);

                        // Detalles del soporte
                        col.Item().Column(detalleCol =>
                        {
                            detalleCol.Item().Text("DETALLES DE RECEPCIÓN").Bold().FontSize(8).FontColor(Colors.Grey.Darken3);
                            detalleCol.Item().Text($"Fecha de Ingreso: {reparacion.FechaIngreso.ToLocalTime():dd/MM/yyyy HH:mm}");
                            detalleCol.Item().Text($"Falla Reportada: {reparacion.FallaReportada}");
                            if (!string.IsNullOrEmpty(reparacion.Observaciones))
                            {
                                detalleCol.Item().Text($"Observaciones Estéticas: {reparacion.Observaciones}");
                            }
                        });
                    });

                    // Pie de página
                    page.Footer().BorderTop(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingTop(5).Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem(1.5f).Column(footerCol =>
                            {
                                footerCol.Item().Text("Escanee el código QR superior para ver el estado de su reparación.").FontSize(7).Italic();
                                footerCol.Item().Text("Horario de retiro: Lunes a Viernes de 8 a 13 hs.").FontSize(7);
                            });

                            row.RelativeItem(1.2f).AlignRight().Column(tutorFirmaCol =>
                            {
                                if (signatureBytes != null)
                                {
                                    tutorFirmaCol.Item().Height(30).Image(signatureBytes);
                                }
                                else
                                {
                                    tutorFirmaCol.Item().PaddingTop(15);
                                }
                                tutorFirmaCol.Item().BorderTop(0.5f).PaddingTop(2).Text("Firma del Tutor").FontSize(7).Bold();
                            });

                            row.ConstantItem(15);

                            row.RelativeItem(1.2f).AlignRight().Column(firmaCol =>
                            {
                                firmaCol.Item().PaddingTop(15);
                                firmaCol.Item().BorderTop(0.5f).PaddingTop(2).Text("Firma del Operador").FontSize(7).Bold();
                            });
                        });
                    });
                });
            });

            // Directorio físico de guardado
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "comprobantes");
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, $"{reparacion.Id}.pdf");
            document.GeneratePdf(filePath);

            return Task.FromResult($"/comprobantes/{reparacion.Id}.pdf");
        }
    }
}
