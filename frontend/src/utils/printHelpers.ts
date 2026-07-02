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
  };
  equipos: EquipoMovimiento[];
}

export const imprimirComprobante = (data: PrintData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes (pop-ups) para generar el comprobante.");
    return;
  }

  // Official logo SVG string from LogoSanJuan.tsx
  const logoSVG = `
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
        
        <circle cx="45" cy="33" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="59" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="65" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="59" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="45" cy="73" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="31" cy="67" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="25" cy="53" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        <circle cx="31" cy="39" r="15" fill="#FF8200" stroke="#FFFFFF" stroke-width="2" />
        
        <circle cx="45" cy="53" r="14" fill="#E03C31" stroke="#FFFFFF" stroke-width="2" />
      </g>
      <text x="110" y="44" fill="#1D252D" font-size="23" font-weight="800" font-family="Arial, sans-serif" letter-spacing="-0.5">San Juan</text>
      <text x="110" y="64" fill="#1D252D" font-size="19" font-weight="300" font-family="Arial, sans-serif">Gobierno</text>
      
      <line x1="225" y1="15" x2="225" y2="70" stroke="#1D252D" stroke-width="2" opacity="0.8" />
      <text x="245" y="38" fill="#1D252D" font-size="11" font-weight="bold" font-family="Arial, sans-serif" letter-spacing="0.5">MINISTERIO DE</text>
      <text x="245" y="60" fill="#1D252D" font-size="21" font-weight="800" font-family="Arial, sans-serif" letter-spacing="-0.5">EDUCACIÓN</text>
    </svg>
  `;

  // Render rows
  const isDerivacion = data.tipo === 'Derivación';
  
  const tableHeaders = isDerivacion 
    ? '<th>#</th><th>Nº Serie</th><th>Marca/Modelo</th><th>Tutor / Diagnóstico</th><th>Proveedor</th><th>Remito/Guía</th>'
    : '<th>#</th><th>Nº Serie</th><th>Marca/Modelo</th><th>Estado</th><th>Falla Reportada</th>';

  const rows = data.equipos.map((eq, index) => {
    if (isDerivacion) {
      return \`
        <tr>
          <td style="font-family: monospace;">\${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">\${eq.numeroSerie}</td>
          <td>\${eq.marcaModelo}</td>
          <td>
            <div style="font-size: 11px;">
              <strong>Falla:</strong> \${eq.fallaReportada || '-'}<br/>
              <strong>Diag:</strong> \${eq.diagnostico || '-'}
            </div>
          </td>
          <td style="font-weight: bold;">\${eq.proveedor || '-'}</td>
          <td>\${eq.remitoGuia || '-'}</td>
        </tr>
      \`;
    } else {
      return \`
        <tr>
          <td style="font-family: monospace;">\${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">\${eq.numeroSerie}</td>
          <td>\${eq.marcaModelo}</td>
          <td>\${eq.estado.replace(/_/g, ' ')}</td>
          <td>\${eq.fallaReportada || '-'}</td>
        </tr>
      \`;
    }
  }).join('');

  const today = new Date(data.fecha);
  const formattedDate = today.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  const html = \`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante de Movimiento - \${data.numeroMovimiento}</title>
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
          \${logoSVG}
        </div>
        <div class="header-right">
          <div class="title">Comprobante de Movimiento</div>
          <div class="subtitle">Tipo: <strong>\${data.tipo}</strong> | #\${data.numeroMovimiento}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">\${formattedDate}</div>
        </div>
      </div>
      
      <div class="meta-grid">
        \${data.escuela ? \`<div class="meta-item"><strong>Institución:</strong> <span>\${data.escuela}</span></div>\` : ''}
        <div class="meta-item"><strong>Registrado por:</strong> <span>\${data.operador}</span></div>
        <div class="meta-item"><strong>Motivo:</strong> <span>\${data.motivo}</span></div>
        <div class="meta-item"><strong>Fecha:</strong> <span>\${formattedDate}</span></div>
      </div>
      
      \${data.tutor ? \`
        <div class="tutor-info">
          <h4 style="margin: 0 0 10px 0; color: #475569; font-size: 14px;">Datos del Tutor/Beneficiario</h4>
          <div class="meta-grid" style="margin-bottom: 0;">
            <div class="meta-item"><strong>Nombre:</strong> <span>\${data.tutor.nombre}</span></div>
            <div class="meta-item"><strong>DNI:</strong> <span>\${data.tutor.dni}</span></div>
            \${data.tutor.telefono ? \`<div class="meta-item"><strong>Teléfono:</strong> <span>\${data.tutor.telefono}</span></div>\` : ''}
          </div>
        </div>
      \` : ''}
      
      <h3 style="margin-bottom: 10px; color: #334155;">Equipos Involucrados</h3>
      <table>
        <thead>
          <tr>
            \${tableHeaders}
          </tr>
        </thead>
        <tbody>
          \${rows}
        </tbody>
      </table>
      
      <div class="footer">
        <div class="signature-box">
          <br/><br/>
          \${data.tipo === 'Ingreso' ? 'Firma de quien entrega (Tutor)' : 
             data.tipo === 'Egreso' ? 'Firma de quien recibe (Tutor)' : 
             'Firma y sello de quien entrega'}
        </div>
        <div class="signature-box">
          <br/><br/>
          \${data.tipo === 'Ingreso' ? 'Firma y sello del receptor (Operador)' : 
             data.tipo === 'Egreso' ? 'Firma y sello del directivo/operador' : 
             'Firma y sello del receptor (Garantía)'}
        </div>
      </div>
    </body>
    </html>
  \`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
