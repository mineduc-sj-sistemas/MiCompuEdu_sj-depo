using ClosedXML.Excel;
using MediatR;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MiCompuEdu.Application.Beneficiarios.Commands
{
    public record ImportarPadronCommand(Stream ExcelStream) : IRequest<ImportarPadronResultDto>;

    public class ImportarPadronResultDto
    {
        public int TotalFilas { get; set; }
        public int EscuelasCreadas { get; set; }
        public int EscuelasExistentes { get; set; }
        public int BeneficiariosCreados { get; set; }
        public int BeneficiariosActualizados { get; set; }
        public int EquiposCreados { get; set; }
        public int EquiposActualizados { get; set; }
        public int Errores { get; set; }
        public List<string> DetallesErrores { get; set; } = new();
    }

    public class ImportarPadronCommandHandler : IRequestHandler<ImportarPadronCommand, ImportarPadronResultDto>
    {
        private readonly IApplicationDbContext _context;

        public ImportarPadronCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ImportarPadronResultDto> Handle(ImportarPadronCommand request, CancellationToken cancellationToken)
        {
            var result = new ImportarPadronResultDto();
            
            // 1. Obtener o crear el Programa Educativo por defecto
            var programa = await _context.ProgramasEducativos
                .FirstOrDefaultAsync(p => p.Nombre == "MiCompuEdu San Juan", cancellationToken);
            if (programa == null)
            {
                programa = new ProgramaEducativo
                {
                    Id = Guid.NewGuid(),
                    Nombre = "MiCompuEdu San Juan",
                    Descripcion = "Programa educativo provincial para la entrega de netbooks",
                    Activo = true,
                    CreadoEn = DateTime.UtcNow
                };
                _context.ProgramasEducativos.Add(programa);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // 2. Cargar en memoria catálogos para evitar consultas por cada fila (optimizando performance)
            var escuelasDict = await _context.Escuelas.ToDictionaryAsync(e => e.Nombre.Trim().ToUpper(), e => e, cancellationToken);
            var beneficiariosDict = await _context.Beneficiarios.ToDictionaryAsync(b => b.Dni.Trim(), b => b, cancellationToken);
            var equiposDict = await _context.Equipos.ToDictionaryAsync(e => e.NumeroSerie.Trim().ToUpper(), e => e, cancellationToken);

            int autoCueCounter = escuelasDict.Count + 1;

            using var workbook = new XLWorkbook(request.ExcelStream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null)
            {
                result.DetallesErrores.Add("El archivo Excel no tiene hojas.");
                result.Errores++;
                return result;
            }

            var rows = worksheet.RowsUsed().Skip(1); // Omitir encabezado
            int rowNum = 1;

            foreach (var row in rows)
            {
                rowNum++;
                try
                {
                    // Leer columnas
                    // 1: Id, 2: Netbook, 3: DNI alumno, 4: Nombre alumno, 5: DNI tutor, 6: Nombre tutor, 
                    // 7: DNI acompañante, 8: Nombre acompañante, 9: Escuela, 10: Grado, 11: Seccion,
                    // 12: Celular, 13: Email, 14: Usuario, 15: Passwd

                    var serialNum = row.Cell(2).GetString()?.Trim();
                    var dniAlumno = row.Cell(3).GetString()?.Trim();
                    var nombreAlumnoCompleto = row.Cell(4).GetString()?.Trim();
                    var dniTutor = row.Cell(5).GetString()?.Trim();
                    var nombreTutor = row.Cell(6).GetString()?.Trim();
                    var escuelaNombre = row.Cell(9).GetString()?.Trim();
                    var grado = row.Cell(10).GetString()?.Trim();
                    var seccion = row.Cell(11).GetString()?.Trim();
                    var celular = row.Cell(12).GetString()?.Trim();
                    var email = row.Cell(13).GetString()?.Trim();
                    var usuarioOffice = row.Cell(14).GetString()?.Trim();
                    var passwdOffice = row.Cell(15).GetString()?.Trim();

                    if (string.IsNullOrEmpty(dniAlumno) || string.IsNullOrEmpty(nombreAlumnoCompleto))
                    {
                        result.DetallesErrores.Add($"Fila {rowNum}: El DNI o Nombre del alumno está vacío.");
                        result.Errores++;
                        continue;
                    }

                    if (string.IsNullOrEmpty(serialNum))
                    {
                        result.DetallesErrores.Add($"Fila {rowNum}: El número de serie de la netbook está vacío.");
                        result.Errores++;
                        continue;
                    }

                    result.TotalFilas++;

                    // A. Procesar Escuela
                    Escuela? escuela = null;
                    if (!string.IsNullOrEmpty(escuelaNombre))
                    {
                        var escuelaKey = escuelaNombre.Trim().ToUpper();
                        if (escuelasDict.TryGetValue(escuelaKey, out var esc))
                        {
                            escuela = esc;
                            result.EscuelasExistentes++;
                        }
                        else
                        {
                            escuela = new Escuela
                            {
                                Id = Guid.NewGuid(),
                                Cue = $"AUTO-{autoCueCounter:D4}",
                                Nombre = escuelaNombre,
                                Localidad = "San Juan",
                                Departamento = "San Juan",
                                Activo = true,
                                CreadoEn = DateTime.UtcNow
                            };
                            autoCueCounter++;
                            _context.Escuelas.Add(escuela);
                            escuelasDict[escuelaKey] = escuela;
                            result.EscuelasCreadas++;
                        }
                    }

                    // B. Procesar Beneficiario (Alumno)
                    // Normalizar nombres a formato consistente
                    string nombre = nombreAlumnoCompleto;
                    string apellido = "";
                    var partesNombre = nombreAlumnoCompleto.Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (nombreAlumnoCompleto.Contains(","))
                    {
                        var partesComa = nombreAlumnoCompleto.Split(',');
                        apellido = partesComa[0].Trim();
                        nombre = string.Join(" ", partesComa.Skip(1)).Trim();
                    }
                    else if (partesNombre.Length > 1)
                    {
                        apellido = partesNombre[0];
                        nombre = string.Join(" ", partesNombre.Skip(1));
                    }

                    if (string.IsNullOrEmpty(apellido))
                    {
                        apellido = "Sin Apellido";
                    }

                    var dniKey = dniAlumno;
                    Beneficiario? beneficiario = null;

                    if (beneficiariosDict.TryGetValue(dniKey, out var ben))
                    {
                        beneficiario = ben;
                        beneficiario.Nombre = nombre;
                        beneficiario.Apellido = apellido;
                        beneficiario.Telefono = celular ?? "";
                        beneficiario.Email = email ?? "";
                        beneficiario.DniTutor = dniTutor;
                        beneficiario.NombreTutor = nombreTutor;
                        beneficiario.TelefonoTutor = celular; // Celular de contacto general
                        beneficiario.Grado = grado;
                        beneficiario.Seccion = seccion?.ToUpper();
                        if (escuela != null)
                        {
                            beneficiario.EscuelaId = escuela.Id;
                        }
                        beneficiario.ActualizadoEn = DateTime.UtcNow;
                        result.BeneficiariosActualizados++;
                    }
                    else
                    {
                        beneficiario = new Beneficiario
                        {
                            Id = Guid.NewGuid(),
                            Dni = dniAlumno,
                            Nombre = nombre,
                            Apellido = apellido,
                            Telefono = celular ?? "",
                            Email = email ?? "",
                            DniTutor = dniTutor,
                            NombreTutor = nombreTutor,
                            TelefonoTutor = celular,
                            Grado = grado,
                            Seccion = seccion?.ToUpper(),
                            EscuelaId = escuela?.Id,
                            CreadoEn = DateTime.UtcNow
                        };
                        _context.Beneficiarios.Add(beneficiario);
                        beneficiariosDict[dniKey] = beneficiario;
                        result.BeneficiariosCreados++;
                    }

                    // C. Procesar Equipo
                    var serialKey = serialNum.ToUpper();
                    // Modelo = prefijo del serial
                    var modelo = "SJMA025";
                    if (serialNum.Contains("-"))
                    {
                        modelo = serialNum.Split('-')[0];
                    }

                    // Credenciales de office concatenadas
                    string? credenciales = null;
                    if (!string.IsNullOrEmpty(usuarioOffice))
                    {
                        credenciales = $"{usuarioOffice} | {passwdOffice ?? ""}";
                    }

                    if (equiposDict.TryGetValue(serialKey, out var eq))
                    {
                        eq.Marca = "MiCompuEdu";
                        eq.Modelo = modelo;
                        eq.CredencialesOffice = credenciales;
                        eq.BeneficiarioId = beneficiario.Id;
                        eq.ProgramaEducativoId = programa.Id;
                        eq.ActualizadoEn = DateTime.UtcNow;
                        result.EquiposActualizados++;
                    }
                    else
                    {
                        var equipo = new Equipo
                        {
                            Id = Guid.NewGuid(),
                            NumeroSerie = serialNum,
                            Marca = "MiCompuEdu",
                            Modelo = modelo,
                            CredencialesOffice = credenciales,
                            BeneficiarioId = beneficiario.Id,
                            ProgramaEducativoId = programa.Id,
                            CreadoEn = DateTime.UtcNow
                        };
                        _context.Equipos.Add(equipo);
                        equiposDict[serialKey] = equipo;
                        result.EquiposCreados++;
                    }
                }
                catch (Exception ex)
                {
                    result.DetallesErrores.Add($"Fila {rowNum}: Error al procesar: {ex.Message}");
                    result.Errores++;
                }
            }

            // Guardar cambios finales en base de datos
            await _context.SaveChangesAsync(cancellationToken);

            return result;
        }
    }
}
