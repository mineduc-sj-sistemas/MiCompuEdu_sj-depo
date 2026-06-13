-- ==============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - PostgreSQL
-- PROYECTO: Sistema de Gestión de Notebooks Educativas (MiCompuEdu_sj)
-- MINISTERIO DE EDUCACIÓN DE SAN JUAN
-- ==============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. FUNCIÓN TRIGGER PARA ACTUALIZAR FECHAS DE MODIFICACIÓN
-- ==============================================================================
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CREACIÓN DE TABLAS
-- ==============================================================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CONSTRAINT chk_usuario_rol CHECK (rol IN ('Administrador', 'Supervisor', 'Tecnico', 'Operador')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER trg_usuarios_actualizado_en
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Tabla: beneficiarios
CREATE TABLE beneficiarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER trg_beneficiarios_actualizado_en
    BEFORE UPDATE ON beneficiarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Tabla: equipos
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    credenciales_office VARCHAR(255),
    beneficiario_id UUID NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_equipos_beneficiario FOREIGN KEY (beneficiario_id) 
        REFERENCES beneficiarios(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_equipos_actualizado_en
    BEFORE UPDATE ON equipos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Tabla: fallas_catalogo
CREATE TABLE fallas_catalogo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: reparaciones
CREATE TABLE reparaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_id UUID NOT NULL,
    operador_ingreso_id UUID NOT NULL,
    tecnico_asignado_id UUID,
    estado VARCHAR(30) NOT NULL DEFAULT 'Ingresado' 
        CONSTRAINT chk_reparacion_estado CHECK (estado IN (
            'Ingresado', 'En_Diagnostico', 'En_Reparacion', 
            'Esperando_Repuestos', 'Reparado', 'Listo_Para_Retirar', 
            'Entregado', 'No_Reparable'
        )),
    falla_reportada TEXT NOT NULL,
    falla_catalogo_id INTEGER,
    diagnostico TEXT,
    acciones_realizadas TEXT,
    observaciones TEXT,
    comprobante_url VARCHAR(255),
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_limite TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_reparaciones_equipo FOREIGN KEY (equipo_id) 
        REFERENCES equipos(id) ON DELETE CASCADE,
    CONSTRAINT fk_reparaciones_operador FOREIGN KEY (operador_ingreso_id) 
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reparaciones_tecnico FOREIGN KEY (tecnico_asignado_id) 
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_reparaciones_falla_catalogo FOREIGN KEY (falla_catalogo_id) 
        REFERENCES fallas_catalogo(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_reparaciones_actualizado_en
    BEFORE UPDATE ON reparaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Tabla: historial_movimientos
CREATE TABLE historial_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    estado_anterior VARCHAR(30)
        CONSTRAINT chk_historial_estado_ant CHECK (estado_anterior IS NULL OR estado_anterior IN (
            'Ingresado', 'En_Diagnostico', 'En_Reparacion', 
            'Esperando_Repuestos', 'Reparado', 'Listo_Para_Retirar', 
            'Entregado', 'No_Reparable'
        )),
    estado_nuevo VARCHAR(30) NOT NULL
        CONSTRAINT chk_historial_estado_nue CHECK (estado_nuevo IN (
            'Ingresado', 'En_Diagnostico', 'En_Reparacion', 
            'Esperando_Repuestos', 'Reparado', 'Listo_Para_Retirar', 
            'Entregado', 'No_Reparable'
        )),
    usuario_id UUID NOT NULL,
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_historial_reparacion FOREIGN KEY (reparacion_id) 
        REFERENCES reparaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Tabla: evidencias_reparacion
CREATE TABLE evidencias_reparacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    url_archivo VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(150) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_evidencias_reparacion FOREIGN KEY (reparacion_id) 
        REFERENCES reparaciones(id) ON DELETE CASCADE
);

-- Tabla: notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reparacion_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL 
        CONSTRAINT chk_notificacion_tipo CHECK (tipo IN ('WhatsApp', 'Email')),
    destinatario VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' 
        CONSTRAINT chk_notificacion_estado CHECK (estado IN ('Pendiente', 'Enviado', 'Fallido')),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    error_mensaje TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notificaciones_reparacion FOREIGN KEY (reparacion_id) 
        REFERENCES reparaciones(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 3. CREACIÓN DE ÍNDICES OPTIMIZADOS
-- ==============================================================================

-- Índices de búsqueda frecuente
CREATE INDEX idx_beneficiarios_dni ON beneficiarios(dni);
CREATE INDEX idx_equipos_numero_serie ON equipos(numero_serie);
CREATE INDEX idx_reparaciones_estado ON reparaciones(estado);
CREATE INDEX idx_reparaciones_fecha_ingreso ON reparaciones(fecha_ingreso);

-- Índices de Llaves Foráneas (evita Table Scans en Joins y Deletes)
CREATE INDEX idx_equipos_beneficiario_id ON equipos(beneficiario_id);
CREATE INDEX idx_reparaciones_equipo_id ON reparaciones(equipo_id);
CREATE INDEX idx_reparaciones_tecnico_id ON reparaciones(tecnico_asignado_id);
CREATE INDEX idx_historial_reparacion_id ON historial_movimientos(reparacion_id);
CREATE INDEX idx_notificaciones_reparacion_id ON notificaciones(reparacion_id);
CREATE INDEX idx_evidencias_reparacion_id ON evidencias_reparacion(reparacion_id);

-- ==============================================================================
-- 4. INSERCIÓN DE DATOS SEMILLA BÁSICOS (Seed Data)
-- ==============================================================================

-- Roles de sistema por defecto (Password por defecto en texto plano: Admin123! - Hashed)
-- En producción usar hash Argon2id o BCrypt de EF Core.
INSERT INTO usuarios (nombre_completo, nombre_usuario, email, password_hash, rol, activo)
VALUES 
('Administrador del Sistema', 'admin', 'admin.micompuedu@sanjuan.edu.ar', '$2a$12$e0M2G2nJ1G1tFp.v2uLd8OnFf33B3V3N3h3W3l3M3S3e3H3t3G3cO', 'Administrador', TRUE),
('Supervisor de Depósito', 'supervisor', 'supervisor.micompuedu@sanjuan.edu.ar', '$2a$12$e0M2G2nJ1G1tFp.v2uLd8OnFf33B3V3N3h3W3l3M3S3e3H3t3G3cO', 'Supervisor', TRUE),
('Técnico Reparador Alfa', 'tecnico1', 'tecnico1.micompuedu@sanjuan.edu.ar', '$2a$12$e0M2G2nJ1G1tFp.v2uLd8OnFf33B3V3N3h3W3l3M3S3e3H3t3G3cO', 'Tecnico', TRUE),
('Operador de Recepción Uno', 'operador1', 'operador1.micompuedu@sanjuan.edu.ar', '$2a$12$e0M2G2nJ1G1tFp.v2uLd8OnFf33B3V3N3h3W3l3M3S3e3H3t3G3cO', 'Operador', TRUE);

-- Catálogo inicial de fallas frecuentes
INSERT INTO fallas_catalogo (nombre, descripcion)
VALUES 
('No Enciende', 'El equipo no responde al botón de encendido y no muestra luces de carga.'),
('Pantalla Rota / Sin Imagen', 'La pantalla LCD tiene fisuras físicas o se retroilumina sin mostrar gráficos.'),
('Bloqueo de Seguridad Juana Manso / Conectar Igualdad', 'Pantalla de bloqueo roja/azul de seguridad por falta de sincronización con servidor de la escuela.'),
('Falla de Teclado', 'Faltan teclas, están trabadas o varios caracteres no se digitan.'),
('Problemas de Sistema Operativo', 'El sistema operativo (Huayra/Windows) no inicia o presenta bucles de reparación.'),
('Falla de Batería / No Carga', 'El equipo solo funciona enchufado o la batería se descarga en pocos minutos.'),
('Puerto de Carga Dañado', 'El conector Jack de alimentación está flojo o desoldado de la placa base.'),
('Falla de Conectividad (Wi-Fi)', 'El adaptador inalámbrico no detecta redes o se desconecta constantemente.');
