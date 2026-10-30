using System;
using System.IO;

namespace MiCompuEdu.Application.Common
{
    public static class DocumentStorageHelper
    {
        public static string? GuardarDocumentoBase64(string? base64Content)
        {
            if (string.IsNullOrWhiteSpace(base64Content)) return null;

            try
            {
                var rawData = base64Content.Trim();
                var extension = ".jpg";

                if (rawData.Contains(","))
                {
                    var header = rawData.Substring(0, rawData.IndexOf(","));
                    if (header.Contains("png")) extension = ".png";
                    else if (header.Contains("webp")) extension = ".webp";
                    else if (header.Contains("pdf")) extension = ".pdf";

                    rawData = rawData.Substring(rawData.IndexOf(",") + 1);
                }

                var bytes = Convert.FromBase64String(rawData);
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "documentos");
                if (!Directory.Exists(folder))
                {
                    Directory.CreateDirectory(folder);
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(folder, fileName);
                File.WriteAllBytes(filePath, bytes);

                return $"/uploads/documentos/{fileName}";
            }
            catch
            {
                return null;
            }
        }
    }
}
