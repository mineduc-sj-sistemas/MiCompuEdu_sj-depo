-- =============================================================================
-- SCRIPT DDL DE REFERENCIA - BASE DE DATOS MICOMPUEDU_DB (POSTGRESQL)
-- Versión: 2.0 (Diseño Escalable y de Alta Performance)
-- Fecha: 2026-06-17
-- =============================================================================

-- Habilitar la extensión uuid-ossp si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABLA: escuelas (Escalabilidad)
-- -----------------------------------------------------------------------------
CREATE TABLE escuelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cue VARCHAR(20) NOT NULL,
    nombre VARCHAR(250) NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT ix_escuelas_cue UNIQUE (cue)
);

COMMENT ON TABLE escuelas IS 'Establecimientos educativos del sistema provincial vinculados con los beneficiarios.';
COMMENT ON COLUMN escuelas.cue IS 'Código Único de Establecimiento (CUE) provisto por el Ministerio de Educación.';

-- -----------------------------------------------------------------------------
-- 2. TABLA: programas_educativos (Escalabilidad)
-- -----------------------------------------------------------------------------
CREATE TABLE programas_educativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT ix_programas_educativos_nombre UNIQUE (nombre)
);

COMMENT ON TABLE programas_educativos IS 'Programas bajo los cuales se distribuyen las computadoras (ej. Conectar Igualdad, Juana Manso).';

-- -----------------------------------------------------------------------------
-- 3. TABLA: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(200) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT ix_usuarios_nombre_usuario UNIQUE (nombre_usuario),
    CONSTRAINT ix_usuarios_email UNIQUE (email),
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('Administrador', 'Supervisor', 'Tecnico', 'Operador'))
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema que operan o administran el depósito.';

-- -----------------------------------------------------------------------------
-- 4. TABLA: beneficiarios
-- -----------------------------------------------------------------------------
CREATE TABLE beneficiarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dni VARCHAR(15) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(200),
    escuela_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT ix_beneficiarios_dni UNIQUE (dni),
    CONSTRAINT fk_beneficiarios_escuelas_escuela_id FOREIGN KEY (escuela_id) REFERENCES escuelas(id) ON DELETE SET NULL
);

CREATE INDEX ix_beneficiarios_nombre ON beneficiarios (apellido, nombre);

COMMENT ON TABLE beneficiarios IS 'Alumnos, tutores o docentes que reciben o entregan los equipos.';

-- -----------------------------------------------------------------------------
-- 5. TABLA: equipos
-- -----------------------------------------------------------------------------
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_serie VARCHAR(100) NOT NULL,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(120) NOT NULL,
    credenciales_office VARCHAR(200),
    beneficiario_id UUID NOT NULL,
    programa_educativo_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT ix_equipos_numero_serie UNIQUE (numero_serie),
    CONSTRAINT fk_equipos_beneficiarios_beneficiario_id FOREIGN KEY (beneficiario_id) REFERENCES beneficiarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipos_programas_educativos_programa_id FOREIGN KEY (programa_educativo_id) REFERENCES programas_educativos(id) ON DELETE SET NULL
);

CREATE INDEX ix_equipos_beneficiario ON equipos (beneficiario_id);

COMMENT ON TABLE equipos IS 'Netbooks, computadoras o dispositivos de hardware registrados en el sistema.';

-- -----------------------------------------------------------------------------
-- 6. TABLA: fallas_catalogo
-- -----------------------------------------------------------------------------
CREATE TABLE fallas_catalogo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ix_fallas_catalogo_nombre UNIQUE (nombre)
);

COMMENT ON TABLE fallas_catalogo IS 'Catálogo estandarizado de fallas (ej. Pantalla rota, No enciende) para tipificación rápida.';

-- -----------------------------------------------------------------------------
-- 7. TABLA: reparaciones
-- -----------------------------------------------------------------------------
CREATE TABLE reparaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_id UUID NOT NULL,
    operador_ingreso_id UUID NOT NULL,
    tecnico_asignado_id UUID,
    estado VARCHAR(30) NOT NULL,
    falla_reportada TEXT NOT NULL,
    falla_catalogo_id INTEGER,
    diagnostico TEXT,
    acciones_realizadas TEXT,
    observaciones TEXT,
    comprobante_url VARCHAR(500),
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_limite TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT fk_reparaciones_equipos_equipo_id FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reparaciones_usuarios_operador_ingreso_id FOREIGN KEY (operador_ingreso_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reparaciones_usuarios_tecnico_asignado_id FOREIGN KEY (tecnico_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_reparaciones_fallas_catalogo_falla_catalogo_id FOREIGN KEY (falla_catalogo_id) REFERENCES fallas_catalogo(id) ON DELETE SET NULL,
    CONSTRAINT ck_reparaciones_estado CHECK (estado IN (
        'Ingresado', 'En_Diagnostico', 'En_Reparacion', 'Esperando_Repuestos', 
        'Apartado_Para_Garantia', 'En_Garantia_Externa', 'Reparado', 
        'Listo_Para_Retirar', 'Entregado', 'No_Reparable'
    ))
);

-- Índices optimizados para la cola de trabajo de reparación activa
CREATE INDEX ix_reparaciones_estado_activo ON reparaciones (estado) WHERE estado != 'Entregado';
CREATE INDEX ix_reparaciones_equipo ON reparaciones (equipo_id);
CREATE INDEX ix_reparaciones_fecha ON reparaciones (fecha_ingreso);

COMMENT ON TABLE reparaciones IS 'Órdenes de servicio o fichas de reparación de equipos en el taller.';

-- -----------------------------------------------------------------------------
-- 8. TABLA: historial_movimientos
-- -----------------------------------------------------------------------------
CREATE TABLE historial_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    usuario_id UUID NOT NULL,
    observaciones TEXT,
    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT fk_historial_movimientos_reparaciones_reparacion_id FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_movimientos_usuarios_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Índice compuesto optimizado para ver la trazabilidad de estados cronológicamente
CREATE INDEX ix_historial_reparacion_fecha ON historial_movimientos (reparacion_id, fecha_movimiento DESC);

COMMENT ON TABLE historial_movimientos IS 'Trazabilidad y auditoría cronológica de cambios de estado del equipo.';

-- -----------------------------------------------------------------------------
-- 9. TABLA: evidencias_reparacion
-- -----------------------------------------------------------------------------
CREATE TABLE evidencias_reparacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(200) NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT fk_evidencias_reparacion_reparaciones_reparacion_id FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE
);

COMMENT ON TABLE evidencias_reparacion IS 'Adjuntos, fotos o capturas cargados como evidencia técnica.';

-- -----------------------------------------------------------------------------
-- 10. TABLA: notificaciones
-- -----------------------------------------------------------------------------
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    destinatario VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha_envio TIMESTAMPTZ,
    error_mensaje TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ,
    CONSTRAINT fk_notificaciones_reparaciones_reparacion_id FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE,
    CONSTRAINT ck_notificaciones_tipo CHECK (tipo IN ('WhatsApp', 'Email')),
    CONSTRAINT ck_notificaciones_estado CHECK (estado IN ('Pendiente', 'Enviado', 'Fallido'))
);

-- Índice parcial optimizado para la cola de despacho automático de notificaciones
CREATE INDEX ix_notificaciones_pendientes ON notificaciones (estado) WHERE estado = 'Pendiente';

COMMENT ON TABLE notificaciones IS 'Notificaciones enviadas o en cola para envío a los beneficiarios/tutores.';

-- -----------------------------------------------------------------------------
-- 11. TABLA: audit_log (Escalabilidad / Auditoría Global Dinámica)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    tabla VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    accion VARCHAR(20) NOT NULL,
    usuario_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_audit_tabla_registro ON audit_log (tabla, registro_id);

COMMENT ON TABLE audit_log IS 'Log inmutable global para cambios a nivel de fila mediante JSONB.';
