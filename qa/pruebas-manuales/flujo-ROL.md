# Plan de Pruebas Manuales por Rol — MiCompuEdu_sj

> Alcance vigente: ver `qa/alcance.md`. Ejecutar exclusivamente en entornos de prueba con datos ficticios.
> Registrar resultado: ✅ (Aprobado), 🟡 (Parcial/Observación), ❌ (Falla). Cada falla genera un hallazgo `AUD-NNN` o pedido `FB-NNN`.

---

## 1. Rol: Operador (Recepción, Ingreso y Entrega)

### A. Recepción y Registro de Ingreso (`RegistrarIngreso.tsx`)
| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| OP-01 | Escaneo de DNI con PDF417 | Simular o escanear código de barras de DNI argentino en el campo correspondiente. | Decodifica DNI, nombre, apellido, sexo y fecha de nacimiento autocompletando el formulario. | ⬜ |
| OP-02 | Búsqueda en Padrón Ministerial | Ingresar un DNI registrado en el padrón. | Trae datos nominales del titular y de la notebook asignada (serie, modelo, escuela). | ⬜ |
| OP-03 | Validación de Tutor para Menores | Registrar ingreso para un alumno/menor de edad. | El sistema exige obligatoriamente Nombre, DNI y Teléfono del tutor. Impide avanzar si faltan datos. | ⬜ |
| OP-04 | Generación de Comprobante QR | Completar el ingreso del equipo e indicar falla declarada y accesorios (cargador). | Se genera el comprobante PDF oficial con QR descargable e imprimible; la orden queda en estado "Ingresado". | ⬜ |

### B. Entrega de Notebook (`EntregaNotebook.tsx`)
| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| OP-05 | Búsqueda de Orden Lista | Filtrar por DNI o N° de serie de equipo en estado "Listo para Retirar". | Muestra los datos de la orden, diagnóstico final aplicado y estado de reparación. | ⬜ |
| OP-06 | Validación de Identidad al Retiro | Verificar datos del tutor o titular antes de confirmar entrega. | Exige confirmación de identidad y número de teléfono verificado. | ⬜ |
| OP-07 | Firma Digital y Cierre | Capturar firma digital (en pantalla o remota) y pulsar "Confirmar Entrega". | La orden pasa a estado "Entregado", sale de la cola activa y se registra el movimiento con timestamp. | ⬜ |

---

## 2. Rol: Técnico (Diagnóstico, Soporte y Garantía)

### A. Panel Técnico (`PanelTecnico.tsx`)
| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| TEC-01 | Bandeja de Reparaciones Activas | Iniciar sesión como Técnico y acceder a la pestaña "Soporte y Garantía". | Lista únicamente órdenes activas (`!= 'Entregado'`), con filtros por estado y buscador por serie/DNI. | ⬜ |
| TEC-02 | Actualización de Diagnóstico | Seleccionar una orden en "Ingresado", asignar falla técnica y cambiar estado a "En Reparación". | Actualiza el estado inmediatamente, guarda el diagnóstico técnico y agrega fila al historial. | ⬜ |
| TEC-03 | Carga de Evidencias Fotográficas | Subir una imagen (JPG/PNG) del daño físico del equipo. | La imagen se almacena en el servidor, se visualiza en la galería de evidencias de la orden. | ⬜ |
| TEC-04 | Notificación Automática de Retiro | Cambiar el estado a "Listo para Retirar". | Se encola y envía la notificación de WhatsApp al tutor/titular informando que puede retirar el equipo. | ⬜ |
| TEC-05 | Derivación Masiva a Garantía | Activar "Modo Masivo", seleccionar múltiples equipos, ingresar Proveedor de Garantía y N° de remito. | Todos los equipos pasan a "Derivado a Garantía" y se genera el remito oficial consolidado para impresión. | ⬜ |

---

## 3. Rol: Supervisor / Administrador

### A. Dashboard Estadístico (`Dashboard.tsx`)
| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| SUP-01 | Métricas Globales | Cargar el Dashboard como Supervisor o Administrador. | Muestra tarjetas con Total Ingresados, En Reparación, Listos para Retirar, Entregados y Garantía. | ⬜ |
| SUP-02 | Tiempos de Reparación | Verificar el indicador de días promedio de permanencia en depósito. | Cálculo correcto según la diferencia entre fecha de ingreso y fecha de resolución. | ⬜ |

### B. Gestión de Personal (`GestionUsuarios.tsx`)
| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| ADM-01 | Alta de Nuevo Personal | Como Administrador, registrar un nuevo usuario con rol "Operador". | El usuario se guarda con contraseña encriptada con BCrypt y queda habilitado para loguearse. | ⬜ |
| ADM-02 | Desactivación de Cuenta | Cambiar el switch de activo a inactivo en un usuario. | El usuario ya no puede iniciar sesión (retorna 401). Se registra en `audit_log`. | ⬜ |

---

## 4. Consulta Pública (`ConsultaPublica.tsx`)

| # | Caso de Prueba | Pasos a Ejecutar | Resultado Esperado | Estado |
|---|---|---|---|---|
| PUB-01 | Consulta por URL con ID | Abrir `/consulta?id=<guid>` escaneando el código QR de un comprobante. | Muestra únicamente el estado del equipo, modelo, serie y fecha estimada, sin exponer contraseñas ni datos sensibles de otros beneficiarios. | ⬜ |
