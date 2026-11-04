using System;
using System.IO;
using System.Linq;

namespace MiCompuEdu.Application.Common.Security
{
    public static class FileSecurityValidator
    {
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };
        public const long MaxFileSizeBytes = 15 * 1024 * 1024; // 15 MB por archivo individual

        public static (bool IsValid, string ErrorMessage, string SafeExtension, string ContentType) ValidateFile(
            string fileName,
            byte[] fileBytes)
        {
            if (fileBytes == null || fileBytes.Length == 0)
            {
                return (false, "El archivo está vacío.", string.Empty, string.Empty);
            }

            if (fileBytes.Length > MaxFileSizeBytes)
            {
                return (false, "El archivo supera el tamaño máximo permitido de 15 MB.", string.Empty, string.Empty);
            }

            var ext = Path.GetExtension(fileName)?.ToLowerInvariant() ?? string.Empty;
            if (!AllowedExtensions.Contains(ext))
            {
                return (false, "Extensión de archivo no permitida. Solo se aceptan JPG, PNG, WEBP y PDF.", string.Empty, string.Empty);
            }

            // Validación de Magic Bytes (firma binaria real del archivo)
            if (IsJpeg(fileBytes))
            {
                return (true, string.Empty, ".jpg", "image/jpeg");
            }

            if (IsPng(fileBytes))
            {
                return (true, string.Empty, ".png", "image/png");
            }

            if (IsWebp(fileBytes))
            {
                return (true, string.Empty, ".webp", "image/webp");
            }

            if (IsPdf(fileBytes))
            {
                return (true, string.Empty, ".pdf", "application/pdf");
            }

            return (false, "La firma binaria (magic bytes) del archivo no coincide con una imagen o PDF válido.", string.Empty, string.Empty);
        }

        private static bool IsJpeg(byte[] bytes) =>
            bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;

        private static bool IsPng(byte[] bytes) =>
            bytes.Length >= 8 &&
            bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
            bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;

        private static bool IsWebp(byte[] bytes) =>
            bytes.Length >= 12 &&
            bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 && // RIFF
            bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50; // WEBP

        private static bool IsPdf(byte[] bytes) =>
            bytes.Length >= 4 &&
            bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46; // %PDF
    }
}
