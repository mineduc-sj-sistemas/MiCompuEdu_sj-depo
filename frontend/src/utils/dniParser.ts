// Utilidad para parsear el código de barras PDF417 de los DNI Argentinos.
// Los lectores de códigos de barras USB emulan un teclado y escriben los datos crudos separados por '@'.
// Formato moderno habitual:
// 00123456789@APELLIDO@NOMBRE@M@DNI@COPIAS@FECHA_NACIMIENTO@FECHA_EMISION@CUIL

export interface ScannedDniData {
  dni: string;
  nombre: string;
  apellido: string;
  sexo?: string;
  fechaNacimiento?: string;
}

/**
 * Detecta si una cadena cruda corresponde a un escaneo de DNI y extrae los datos.
 * Retorna null si la cadena no cumple con el patrón de código de barras DNI.
 */
export function parseDniScan(rawData: string): ScannedDniData | null {
  if (!rawData || rawData.trim().length < 15) {
    return null;
  }

  const cleanInput = rawData.trim();

  // El DNI argentino en su versión PDF417 utiliza '@' como delimitador
  if (cleanInput.includes('@')) {
    const parts = cleanInput.split('@');
    if (parts.length >= 5) {
      // Intentamos ubicar el DNI. En el formato estándar es el índice 4.
      let dniCandidate = parts[4] ? parts[4].trim() : '';
      let apellido = parts[1] ? parts[1].trim() : '';
      let nombre = parts[2] ? parts[2].trim() : '';
      let sexo = parts[3] ? parts[3].trim() : '';
      let fechaNacimiento = parts[6] ? parts[6].trim() : '';

      // Validación de DNI: Debe ser un número de entre 7 y 8 dígitos
      const dniRegex = /^\d{7,8}$/;
      if (!dniRegex.test(dniCandidate)) {
        // Si no está en el índice 4, buscamos en todas las partes del array
        const found = parts.find(p => dniRegex.test(p.trim()));
        if (found) {
          dniCandidate = found.trim();
        }
      }

      // Si aún no encontramos un DNI válido, retornamos null
      if (!dniRegex.test(dniCandidate)) {
        return null;
      }

      // Normalizar nombres y apellidos (ej: JUAN CARLOS -> Juan Carlos, PEREZ -> Perez)
      const titleCase = (str: string) => {
        if (!str) return '';
        return str
          .toLowerCase()
          .split(' ')
          .filter(word => word.length > 0)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      return {
        dni: dniCandidate,
        nombre: titleCase(nombre),
        apellido: titleCase(apellido),
        sexo: sexo || undefined,
        fechaNacimiento: fechaNacimiento || undefined
      };
    }
  }

  return null;
}
