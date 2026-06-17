using System;

namespace MiCompuEdu.Domain.Common
{
    public class ScannedDniData
    {
        public string Dni { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? Sexo { get; set; }
        public string? FechaNacimiento { get; set; }
    }

    public static class DniParser
    {
        public static ScannedDniData? ParseDniScan(string rawData)
        {
            if (string.IsNullOrWhiteSpace(rawData) || rawData.Trim().Length < 15)
            {
                return null;
            }

            var cleanInput = rawData.Trim();

            if (cleanInput.Contains("@"))
            {
                var parts = cleanInput.Split('@');
                if (parts.Length >= 5)
                {
                    var dniCandidate = parts.Length > 4 ? parts[4].Trim() : string.Empty;
                    var apellido = parts.Length > 1 ? parts[1].Trim() : string.Empty;
                    var nombre = parts.Length > 2 ? parts[2].Trim() : string.Empty;
                    var sexo = parts.Length > 3 ? parts[3].Trim() : string.Empty;
                    var fechaNacimiento = parts.Length > 6 ? parts[6].Trim() : string.Empty;

                    // Validación de DNI: Debe ser un número de entre 7 y 8 dígitos
                    var isDniValid = IsDniRegexMatch(dniCandidate);
                    if (!isDniValid)
                    {
                        // Si no está en el índice 4, buscamos en todas las partes del array
                        foreach (var part in parts)
                        {
                            var candidate = part.Trim();
                            if (IsDniRegexMatch(candidate))
                            {
                                dniCandidate = candidate;
                                isDniValid = true;
                                break;
                            }
                        }
                    }

                    if (!isDniValid)
                    {
                        return null;
                    }

                    return new ScannedDniData
                    {
                        Dni = dniCandidate,
                        Nombre = TitleCase(nombre),
                        Apellido = TitleCase(apellido),
                        Sexo = string.IsNullOrEmpty(sexo) ? null : sexo,
                        FechaNacimiento = string.IsNullOrEmpty(fechaNacimiento) ? null : fechaNacimiento
                    };
                }
            }

            return null;
        }

        private static bool IsDniRegexMatch(string value)
        {
            if (value.Length < 7 || value.Length > 8)
                return false;

            foreach (var c in value)
            {
                if (c < '0' || c > '9')
                    return false;
            }

            return true;
        }

        private static string TitleCase(string str)
        {
            if (string.IsNullOrWhiteSpace(str))
                return string.Empty;

            var words = str.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < words.Length; i++)
            {
                var w = words[i].ToLower();
                if (w.Length > 0)
                {
                    words[i] = char.ToUpper(w[0]) + w.Substring(1);
                }
            }

            return string.Join(" ", words);
        }
    }
}
