import type { Reparacion } from '../types';

export interface EquipoMovimiento {
  numeroSerie: string;
  marcaModelo: string;
  estado: string;
  fallaReportada?: string;
  diagnostico?: string;
  proveedor?: string;
  remitoGuia?: string;
}

export interface PrintData {
  tipo: 'Ingreso' | 'Egreso' | 'Derivación';
  numeroMovimiento: string;
  fecha: string;
  escuela?: string;
  operador: string;
  motivo: string;
  tutor?: {
    nombre: string;
    dni: string;
    telefono?: string;
    alumno?: string;
    personaEntregaRetiro?: string;
    parentesco?: string;
  };
  equipos: EquipoMovimiento[];
}

export const LOGO_SAN_JUAN_SVG = `
  <svg viewBox="0 0 390 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="height: 60px;">
    <g transform="translate(5, -8)">
      <circle cx="45" cy="27" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="63" cy="35" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="71" cy="53" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="63" cy="71" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="45" cy="79" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="27" cy="71" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="19" cy="53" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="27" cy="35" r="16" fill="#FBDD40" stroke="#FFFFFF" stroke-width="2.5" />
      
      <circle cx="45" cy="33" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="59" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="65" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="59" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="45" cy="73" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="31" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="25" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      <circle cx="31" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2.5" />
      
      <circle cx="45" cy="53" r="14" fill="#E03C31" stroke="#FFFFFF" stroke-width="2.5" />
    </g>
    <text x="110" y="44" fill="#1D252D" font-size="23" font-weight="800" font-family="Arial, sans-serif" letter-spacing="-0.5">San Juan</text>
    <text x="110" y="64" fill="#1D252D" font-size="19" font-weight="300" font-family="Arial, sans-serif">Gobierno</text>
    
    <line x1="225" y1="15" x2="225" y2="70" stroke="#1D252D" stroke-width="2" opacity="0.8" />
    <text x="245" y="38" fill="#1D252D" font-size="11" font-weight="bold" font-family="Arial, sans-serif" letter-spacing="0.5">MINISTERIO DE</text>
    <text x="245" y="60" fill="#1D252D" font-size="21" font-weight="800" font-family="Arial, sans-serif" letter-spacing="-0.5">EDUCACIÓN</text>
  </svg>
`;

export const imprimirComprobante = (data: PrintData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para generar el comprobante.");
    return;
  }

  const logoSVG = LOGO_SAN_JUAN_SVG;

  // Render rows
  const isDerivacion = data.tipo === 'Derivación';
  
  const tableHeaders = isDerivacion 
    ? '<th>#</th><th>Nº Serie</th><th>Marca/Modelo</th><th>Tutor / Diagnóstico</th><th>Proveedor</th><th>Remito/Guía</th>'
    : '<th>#</th><th>Nº Serie</th><th>Marca/Modelo</th><th>Estado</th><th>Falla Reportada</th>';

  const rows = data.equipos.map((eq, index) => {
    if (isDerivacion) {
      return `
        <tr>
          <td style="font-family: monospace;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${eq.numeroSerie}</td>
          <td>${eq.marcaModelo}</td>
          <td>
            <div style="font-size: 11px;">
              <strong>Falla:</strong> ${eq.fallaReportada || '-'}<br/>
              <strong>Diag:</strong> ${eq.diagnostico || '-'}
            </div>
          </td>
          <td style="font-weight: bold;">${eq.proveedor || '-'}</td>
          <td>${eq.remitoGuia || '-'}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="font-family: monospace;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${eq.numeroSerie}</td>
          <td>${eq.marcaModelo}</td>
          <td>${eq.estado.replace(/_/g, ' ')}</td>
          <td>${eq.fallaReportada || '-'}</td>
        </tr>
      `;
    }
  }).join('');

  const today = new Date(data.fecha);
  const formattedDate = today.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante de Movimiento - ${data.numeroMovimiento}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          color: #1D252D; 
          margin: 40px auto; 
          max-width: 900px;
          line-height: 1.5;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          border-bottom: 2px solid #FF8200; 
          padding-bottom: 15px; 
          margin-bottom: 30px; 
        }
        .header-right { 
          text-align: right; 
        }
        .title { 
          font-size: 24px; 
          font-weight: bold; 
          color: #1D252D; 
        }
        .subtitle { 
          font-size: 16px; 
          color: #64748b; 
        }
        
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .meta-item {
          display: flex;
        }
        .meta-item strong {
          min-width: 130px;
          color: #475569;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 40px; 
        }
        th { 
          background-color: #f8fafc; 
          text-align: left; 
          padding: 12px; 
          border-bottom: 2px solid #e2e8f0; 
          font-size: 13px; 
          text-transform: uppercase; 
          color: #64748b; 
        }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px; 
        }
        
        .footer { 
          display: flex; 
          justify-content: space-between; 
          margin-top: 80px;
        }
        .signature-box { 
          border-top: 1px solid #cbd5e1; 
          width: 250px; 
          text-align: center; 
          padding-top: 8px; 
          font-size: 13px; 
          color: #64748b; 
        }
        
        .print-btn-container {
          text-align: right;
          margin-bottom: 20px;
        }
        .print-btn {
          background-color: #FF8200; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 6px; 
          font-weight: bold; 
          cursor: pointer; 
          font-size: 14px;
          transition: background 0.2s;
        }
        .print-btn:hover {
          background-color: #e07200;
        }
        
        .tutor-info {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        
        @media print { 
          body { margin: 15px; max-width: 100%; }
          .print-btn-container { display: none; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir Comprobante</button>
      </div>
      
      <div class="header">
        <div class="logo">
          ${logoSVG}
        </div>
        <div class="header-right">
          <div class="title">Comprobante de Movimiento</div>
          <div class="subtitle">Tipo: <strong>${data.tipo}</strong> | #${data.numeroMovimiento}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">${formattedDate}</div>
        </div>
      </div>
      
      ${data.equipos.some(e => e.marcaModelo.toLowerCase().includes('cargador')) ? `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; font-weight: bold; text-align: center; border-left: 5px solid #d97706;">
          ⚠️ ATENCIÓN: ESTE INGRESO CORRESPONDE ÚNICAMENTE A CARGADOR (HARDWARE). NO SE RECIBE COMPUTADORA.
        </div>
      ` : ''}
      
      <div class="meta-grid">
        ${data.escuela ? `<div class="meta-item"><strong>Institución:</strong> <span>${data.escuela}</span></div>` : ''}
        <div class="meta-item"><strong>Registrado por:</strong> <span>${data.operador}</span></div>
        <div class="meta-item"><strong>Motivo:</strong> <span>${data.motivo}</span></div>
        <div class="meta-item"><strong>Fecha:</strong> <span>${formattedDate}</span></div>
      </div>
      
      ${data.tutor ? `
        <div class="tutor-info">
          <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">Identificación de Personas Involucradas</h4>
          <div class="meta-grid" style="margin-bottom: 0;">
            ${data.tutor.alumno ? `<div class="meta-item"><strong>Alumno / Titular:</strong> <span>${data.tutor.alumno}</span></div>` : ''}
            <div class="meta-item"><strong>${data.tipo === 'Ingreso' ? 'Presentado por:' : data.tipo === 'Egreso' ? 'Retirado por:' : 'Responsable:'}</strong> <span>${data.tutor.personaEntregaRetiro || data.tutor.nombre}</span></div>
            <div class="meta-item"><strong>DNI:</strong> <span>${data.tutor.dni}</span></div>
            ${data.tutor.parentesco ? `<div class="meta-item"><strong>Parentesco/Relación:</strong> <span>${data.tutor.parentesco}</span></div>` : ''}
            ${data.tutor.telefono ? `<div class="meta-item"><strong>Teléfono:</strong> <span>${data.tutor.telefono}</span></div>` : ''}
          </div>
        </div>
      ` : ''}
      
      <h3 style="margin-bottom: 10px; color: #334155;">Equipos Involucrados</h3>
      <table>
        <thead>
          <tr>
            ${tableHeaders}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div class="footer">
        <div class="signature-box">
          <br/><br/>
          ${data.tipo === 'Ingreso' 
            ? `Firma de quien entrega (${data.tutor?.personaEntregaRetiro || data.tutor?.nombre || 'Presentante'})` 
            : data.tipo === 'Egreso' 
            ? `Firma de quien recibe (${data.tutor?.personaEntregaRetiro || data.tutor?.nombre || 'Retirante'})` 
            : 'Firma y sello de quien entrega'}
        </div>
        <div class="signature-box">
          <br/><br/>
          ${data.tipo === 'Ingreso' ? 'Firma y sello del receptor (Operador)' : 
             data.tipo === 'Egreso' ? 'Firma y sello del directivo/operador' : 
             'Firma y sello del receptor (Garantía)'}
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const imprimirFichaEstado = (
  repair: Reparacion,
  tecnicoNombre: string,
  historial?: any[]
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para generar el comprobante.");
    return;
  }

  const today = new Date();
  const formattedDate = today.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  const fechaIngresoStr = repair.fechaIngreso
    ? new Date(repair.fechaIngreso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    : 'No registrada';

  const estadoBadgeColor = 
    repair.estado === 'Reparado' || repair.estado === 'Listo_Para_Retirar' ? '#16a34a' :
    repair.estado === 'No_Reparable' ? '#dc2626' :
    repair.estado === 'En_Garantia_Externa' ? '#0891b2' :
    repair.estado === 'Esperando_Repuestos' ? '#d97706' : '#ea580c';

  const estadoLegible = (repair.estado || '').replace(/_/g, ' ');

  const historyRows = (historial && historial.length > 0)
    ? historial.map((h) => `
        <tr>
          <td style="font-size: 11px; color: #64748b;">${h.fechaMovimiento ? new Date(h.fechaMovimiento).toLocaleString('es-AR') : '-'}</td>
          <td style="font-size: 11px; font-weight: 600;">${(h.estadoAnterior || h.estadoOrigen || 'Ingreso Inicial').replace(/_/g, ' ')}</td>
          <td style="font-size: 11px; font-weight: 700; color: #ea580c;">➜ ${(h.estadoNuevo || h.estadoDestino || '').replace(/_/g, ' ')}</td>
          <td style="font-size: 11px;">${h.usuarioNombre || h.operadorNombre || 'Personal'}</td>
          <td style="font-size: 11px; color: #475569;">${h.observaciones || '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align: center; color: #94a3b8; font-size: 11px;">Sin movimientos registrados</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ficha Técnica de Servicio - ${repair.numeroSerie}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1D252D; margin: 30px auto; max-width: 900px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #FF8200; padding-bottom: 15px; margin-bottom: 20px; }
        .header-right { text-align: right; }
        .title { font-size: 22px; font-weight: 800; color: #1D252D; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 2px; }
        .badge-estado { display: inline-block; background-color: ${estadoBadgeColor}; color: white; padding: 5px 12px; border-radius: 9999px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }
        .section-title { font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin: 18px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
        .meta-item { display: flex; }
        .meta-item strong { min-width: 140px; color: #475569; font-weight: 600; }
        .box-info { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 20px; }
        th { background-color: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        .footer { display: flex; justify-content: space-between; margin-top: 45px; }
        .signature-box { border-top: 1px solid #94a3b8; width: 240px; text-align: center; padding-top: 8px; font-size: 11px; color: #475569; }
        .print-btn-container { text-align: right; margin-bottom: 15px; }
        .print-btn { background-color: #FF8200; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
        .print-btn:hover { background-color: #e07200; }
        @media print {
          body { margin: 10px; max-width: 100%; }
          .print-btn-container { display: none; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir Ficha de Estado</button>
      </div>

      <div class="header">
        <div>${LOGO_SAN_JUAN_SVG}</div>
        <div class="header-right">
          <div class="title">Ficha Técnica de Servicio</div>
          <div class="subtitle">Orden: <strong>#${repair.numeroSerie}</strong> • ${formattedDate}</div>
          <div class="badge-estado">${estadoLegible}</div>
        </div>
      </div>

      <div class="section-title">1. Datos del Dispositivo y Beneficiario</div>
      <div class="box-info">
        <div class="meta-grid">
          <div class="meta-item"><strong>Nº de Serie:</strong> <span style="font-family: monospace; font-weight: 700;">${repair.numeroSerie}</span></div>
          <div class="meta-item"><strong>Marca / Modelo:</strong> <span>${repair.marcaModelo || '-'}</span></div>
          <div class="meta-item"><strong>Alumno / Titular:</strong> <span>${repair.alumnoNombreCompleto || repair.nombreTutor || '-'}</span></div>
          <div class="meta-item"><strong>DNI Alumno:</strong> <span>${repair.alumnoDni || repair.titularDni || '-'}</span></div>
          <div class="meta-item"><strong>Tutor Responsable:</strong> <span>${repair.tutorResponsableNombre || repair.nombreTutor || '-'}</span></div>
          <div class="meta-item"><strong>Teléfono Contacto:</strong> <span>${repair.tutorResponsableTelefono || repair.telefonoTutor || '-'}</span></div>
          ${repair.personaEntregaNombre ? `<div class="meta-item"><strong>Entregó en Depósito:</strong> <span>${repair.personaEntregaNombre} (${repair.personaEntregaParentesco || 'Entregó'})</span></div>` : ''}
          ${repair.personaRetiroNombre ? `<div class="meta-item"><strong>Retiró de Depósito:</strong> <span>${repair.personaRetiroNombre} (${repair.personaRetiroParentesco || 'Retiró'})</span></div>` : ''}
          <div class="meta-item"><strong>Depósito / Ubicación:</strong> <span style="font-weight: 700; color: #ea580c;">${repair.ubicacionDepositoCodigo || 'No asignada'}</span></div>
          <div class="meta-item"><strong>Fecha de Ingreso:</strong> <span>${fechaIngresoStr}</span></div>
        </div>
      </div>

      <div class="section-title">2. Diagnóstico Técnico y Reparación</div>
      <div class="box-info">
        <p style="margin: 0 0 6px 0;"><strong>Falla Reportada Inicial:</strong> <em>"${repair.fallaReportada || 'Sin reporte'}"</em></p>
        <p style="margin: 0 0 6px 0;"><strong>Diagnóstico Técnico:</strong> ${repair.diagnostico || '<span style="color: #94a3b8;">Pendiente de diagnóstico</span>'}</p>
        <p style="margin: 0 0 6px 0;"><strong>Acciones / Tareas Realizadas:</strong> ${repair.accionesRealizadas || '<span style="color: #94a3b8;">Sin registrar</span>'}</p>
        ${repair.observaciones ? `<p style="margin: 0 0 6px 0;"><strong>Observaciones Internas:</strong> ${repair.observaciones}</p>` : ''}
        ${repair.proveedorGarantia ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
            <strong>Derivación a Garantía:</strong> ${repair.proveedorGarantia} | <strong>Remito:</strong> ${repair.remitoGarantia || '-'} | <strong>Fecha Esperada:</strong> ${repair.fechaEsperadaGarantia ? new Date(repair.fechaEsperadaGarantia).toLocaleDateString() : '-'}
          </div>
        ` : ''}
      </div>

      <div class="section-title">3. Trazabilidad de Movimientos</div>
      <table>
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Estado Origen</th>
            <th>Estado Destino</th>
            <th>Operador / Técnico</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature-box">
          <br/><br/>
          Firma y Sello del Técnico Responsable<br/>
          <strong>${tecnicoNombre}</strong>
        </div>
        <div class="signature-box">
          <br/><br/>
          Control y Recepción del Depósito<br/>
          Ministerio de Educación de San Juan
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const imprimirIngresoComprobante = (repair: Reparacion, operadorNombre: string) => {
  imprimirComprobante({
    tipo: 'Ingreso',
    numeroMovimiento: repair.id.substring(0, 8).toUpperCase(),
    fecha: repair.fechaIngreso || new Date().toISOString(),
    escuela: repair.ubicacionDepositoCodigo || 'Depósito Central',
    operador: operadorNombre,
    motivo: `Ingreso a soporte técnico: ${repair.fallaReportada || 'Revisión inicial'}`,
    tutor: {
      nombre: repair.personaEntregaNombre || repair.tutorResponsableNombre || repair.nombreTutor || 'Presentante',
      dni: repair.personaEntregaDni || repair.tutorResponsableDni || repair.alumnoDni || repair.titularDni || '-',
      telefono: repair.personaEntregaTelefono || repair.tutorResponsableTelefono || repair.telefonoTutor,
      alumno: repair.alumnoNombreCompleto || repair.nombreTutor,
      personaEntregaRetiro: repair.personaEntregaNombre || repair.tutorResponsableNombre || repair.nombreTutor,
      parentesco: repair.personaEntregaParentesco || 'Presentante'
    },
    equipos: [{
      numeroSerie: repair.numeroSerie,
      marcaModelo: repair.marcaModelo,
      estado: repair.estado,
      fallaReportada: repair.fallaReportada,
      diagnostico: repair.diagnostico
    }]
  });
};
