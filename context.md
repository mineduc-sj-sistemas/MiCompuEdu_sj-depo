# Contexto del Proyecto: MiCompuEdu_sj

Este documento sirve como registro de contexto y arquitectura del sistema **MiCompuEdu_sj** (Sistema de Gestión y Trazabilidad de Dispositivos Educativos para el Depósito del Ministerio de Educación de San Juan). Será actualizado con cada cambio relevante en la base de código.

---

## 1. Descripción General

**MiCompuEdu_sj** es una plataforma web integral diseñada para automatizar el flujo de trabajo de recepción, diagnóstico, reparación, trazabilidad y entrega de dispositivos tecnológicos (notebooks de los programas *Conectar Igualdad*, *Juana Manso*, etc.) en el depósito central del Ministerio de Educación de San Juan.

### Problemas que resuelve:
1. **Registro manual ineficiente**: Errores en la transcripción de datos de beneficiarios y números de serie de equipos.
2. **Falta de trazabilidad**: Dificultad para conocer el estado y el historial de reparaciones de un equipo en tiempo real.
3. **Pérdida de información**: Datos sin validar contra el padrón nominal del Ministerio.
4. **Fallas de comunicación**: Equipos archivados indefinidamente debido a la falta de comunicación efectiva para el retiro.

### Soluciones clave:
- Búsqueda y autocompletado asistido por escaneo del código de barras (PDF417) de los DNI.
- Integración nominal con el padrón del Ministerio.
- Gestión digital de reparaciones con asignación de técnicos y cambio de estados.
- Notificaciones automáticas al tutor por WhatsApp Business API (en cambios a "Listo para retirar" y "No reparable").
- Generación de comprobante de ingreso en PDF con código QR único para seguimiento.
- Dashboard de métricas e indicadores de rendimiento técnico para supervisores.

---

## 2. Arquitectura Tecnológica

El sistema se compone de dos componentes principales (Backend y Frontend):

### Backend (`/backend`)
- **Framework**: .NET 8.
- **Patrón de Arquitectura**: **Clean Architecture** (Arquitectura Limpia) organizada en 4 proyectos desacoplados:
  - `MiCompuEdu.Domain`: Contiene entidades puras, enumeraciones y lógica de dominio (0 dependencias externas).
  - `MiCompuEdu.Application`: Contiene casos de uso, interfaces, DTOs, validaciones y mediadores (**CQRS** con **MediatR**).
  - `MiCompuEdu.Infrastructure`: Implementación de base de datos con **Entity Framework Core** y servicios externos (WhatsApp, generación de PDF).
  - `MiCompuEdu.WebApi`: Controladores REST que exponen la API, middleware de manejo global de excepciones y autenticación/autorización JWT.
- **Base de Datos**: PostgreSQL (configurada vía EF Core).
- **Seguridad**: Autenticación mediante tokens JWT (expiración de 8 horas) y control de accesos basado en roles (*Administrador, Supervisor, Técnico, Operador*).

### Frontend (`/frontend`)
- **Framework**: React 19 + Vite 8.
- **Lenguaje**: TypeScript.
- **Estilos**: Tailwind CSS v4 (integrado vía plugin nativo `@tailwindcss/vite`).
- **Navegación / Rutas**: Renderizado condicional en `App.tsx` basado en el rol del usuario guardado en la sesión local.

---

## 3. Modelo de Datos (DER)

Las entidades clave definidas en `MiCompuEdu.Domain/Entities` y mapeadas en `ApplicationDbContext` son:

- **Usuario**: Representa al personal del depósito. Roles: `Administrador`, `Supervisor`, `Tecnico`, `Operador`.
- **Beneficiario**: Tutor o estudiante titular del dispositivo (contiene DNI único, nombre, teléfono, email).
- **Equipo**: Dispositivo asignado al beneficiario (número de serie único, marca, modelo, credenciales).
- **Reparacion**: Registro de la orden de soporte. Almacena estado actual, falla reportada, diagnóstico, acciones realizadas e historial.
- **FallaCatalogo**: Estandarización de fallas comunes para tipificar los diagnósticos.
- **HistorialMovimiento**: Registro inmutable de cada cambio de estado, fecha y usuario responsable de la acción.
- **EvidenciaReparacion**: Imágenes adjuntas por el técnico para justificar componentes dañados o reparaciones realizadas.
- **Notificacion**: Registro de los mensajes automáticos (WhatsApp) encolados y enviados.

---

## 4. Estructura de Directorios

```
MiCompuEdu_sj-depo/
├── backend/
│   ├── MiCompuEdu.Domain/           # Entidades, Enums y Lógica pura
│   ├── MiCompuEdu.Application/      # DTOs, Interfaces, CQRS (Commands/Queries)
│   ├── MiCompuEdu.Infrastructure/   # DB Context, Servicios (WhatsApp, PDF)
│   ├── MiCompuEdu.WebApi/           # API Controllers, Middlewares, Program.cs
│   └── Dockerfile                   # Configuración de compilación y empaquetado .NET
├── frontend/
│   ├── public/                      # Recursos estáticos públicos
│   ├── src/
│   │   ├── assets/                  # Logos e imágenes
│   │   ├── components/              # Componentes de UI compartidos
│   │   ├── pages/                   # Login, Operator, Supervisor, Technician
│   │   ├── types.ts                 # Definiciones de tipos TS
│   │   ├── App.tsx                  # Componente principal con enrutamiento de roles
│   │   └── main.tsx                 # Punto de entrada de React
│   ├── Dockerfile                   # Configuración de empaquetado de producción
│   └── nginx.conf                   # Servidor web para SPA routing
├── docs/                            # Planos de arquitectura, SQL, y documentación
├── docker-compose.yml               # Orquestación de Postgres, Backend y Frontend
└── context.md                       # Este archivo de contexto
```

---

## 5. Datos de Sembrado y Cuentas de Acceso

En el inicio de la API (`Program.cs`), si la base de datos está vacía, se siembran los siguientes usuarios con la contraseña común `Admin123!`:

| Nombre Completo | Nombre de Usuario | Rol | Propósito |
|---|---|---|---|
| Administrador del Sistema | `admin` | Administrador | Configuración global y gestión de usuarios. |
| Supervisor de Depósito | `supervisor` | Supervisor | Asignación de tareas y dashboard de control. |
| Técnico Reparador Alfa | `tecnico` | Tecnico | Diagnóstico, reparación y carga de evidencias. |
| Operador de Recepción Uno | `operador` | Operador | Registro de ingresos y entregas físicas. |

Fallas sembradas en el catálogo inicial:
1. *No Enciende*
2. *Pantalla Rota / Sin Imagen*
3. *Bloqueo de Seguridad Juana Manso*
4. *Falla de Teclado*
5. *Problemas de Sistema Operativo*

---

## 6. Catálogo de Endpoints REST (API RESTful)

Las rutas de la API están prefijadas con `/api/v1`.

### 6.1. Módulo de Autenticación (`/api/v1/auth`)
- **POST `/login`**: Permite el ingreso de usuarios. Retorna el JWT token y datos del usuario.

### 6.2. Módulo de Beneficiarios (`/api/v1/beneficiarios`)
- **GET `/{dni}`**: Recupera la información nominal del beneficiario y su notebook asignada buscando por DNI.

### 6.3. Módulo de Reparaciones (`/api/v1/reparaciones`)
- **POST `/`**: Registra el ingreso de una notebook y genera el comprobante PDF real con QR.
- **GET `/`**: Obtiene la lista filtrable de reparaciones.
- **PUT `/{id}/estado`**: Actualiza el estado, diagnóstico y observaciones de la orden, y dispara notificaciones de WhatsApp.

### 6.4. Módulo de Usuarios (`/api/v1/usuarios`)
- **GET `/`**: Obtiene el listado completo de usuarios registrados (Exclusivo Administrador).
- **POST `/`**: Registra un nuevo usuario encriptando la contraseña con BCrypt (Exclusivo Administrador).
- **PUT `/{id}`**: Modifica datos de un usuario existente (Exclusivo Administrador).
- **PUT `/{id}/toggle-active`**: Activa o desactiva la cuenta de un usuario (Exclusivo Administrador).

---

## 7. Registro de Cambios Recientes

- **2026-06-16**: Implementación del módulo de **Gestión de Usuarios (CRUD)**: creación de endpoints en [UsuariosController.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.WebApi/Controllers/UsuariosController.cs), comandos de aplicación, y la vista frontend [GestionUsuarios.tsx](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/frontend/src/pages/Supervisor/GestionUsuarios.tsx) para Administradores.
- **2026-06-16**: Integración de la llamada real HTTP a la API de WhatsApp Business (Meta Graph API) en [WhatsAppService.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Infrastructure/Services/WhatsAppService.cs).
- **2026-06-16**: Implementación de la generación real de comprobantes PDF con códigos QR empleando `QuestPDF` y `QRCoder` en [PdfGeneratorService.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Infrastructure/Services/PdfGeneratorService.cs) y consumo en [RegistrarIngresoCommand.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.Application/Reparaciones/Commands/RegistrarIngresoCommand.cs).
- **2026-06-16**: Modificación del backend ([ReparacionesController.cs](file:///C:/Users/Docente/Desktop/MiCompuEdu_sj-depo/backend/MiCompuEdu.WebApi/Controllers/ReparacionesController.cs)) para autorizar al rol `Operador` a cambiar los estados de reparación y registrar diagnósticos técnicos. Esto consolida el flujo simplificado de 2 roles (Operador y Administrador).
- **2026-06-16**: Clonación inicial del repositorio y creación de este documento de contexto (`context.md`).
