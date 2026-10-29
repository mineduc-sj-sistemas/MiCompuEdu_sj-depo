# Registro de Feedback Funcional — MiCompuEdu_sj

Cada pedido recibido (jefatura, áreas usuarias, personal de depósito y tutores) con su origen y criterio de aceptación **antes** de pasarlo al equipo.  
Estados: ✅ Implementado · 🟡 Parcial · ❌ No implementado · ⏸️ Postergado/Rechazado · 🔁 Cambió el alcance.

| ID | Fecha | Quién | Canal | Texto original | Criterio de aceptación | Estado | Commit | Verif. código | Prueba manual |
|---|---|---|---|---|---|---|---|---|---|
| FB-001 | 2026-10-25 | Área de Depósito | Reunión de seguimiento | "Necesitamos que al registrar el ingreso sea obligatorio cargar los datos del tutor si es un alumno, porque si no no sabemos a quién entregar ni a quién notificar." | Validar campos de tutor obligatorios si el tipo de beneficiario es alumno o menor de edad tanto en frontend como en el comando de backend. | ✅ Implementado | `6780cf2` | `RegistrarIngresoCommand.cs:45` | OP-03 |
| FB-002 | 2026-10-26 | Servicio Técnico | Solicitud interna | "Poder enviar varias netbooks juntas a la garantía externa e imprimir un remito oficial con el listado completo de los números de serie." | Implementar modo masivo en panel técnico, con selector múltiple, proveedor y generación de remito imprimible. | ✅ Implementado | `c94343b` | `PanelTecnico.tsx:280` | TEC-05 |

> Si un pedido choca con las reglas del proyecto o con la seguridad institucional, marcarlo **CONFLICTO** y elevarlo para decisión antes de implementarlo.
