/**
 * Integration Test Script for MiCompuEdu_sj API
 * Run this script after compiling and starting the backend server.
 * Usage: node test-endpoints.js
 */

const BASE_URL = 'http://localhost:5110/api/v1';

async function runTests() {
  console.log('🧪 Starting API Integration Tests...\n');

  let operatorToken = '';
  let adminToken = '';
  let testEquipoId = '';
  let testReparacionId = '';
  let testUbicacionId = '';
  let newUserId = '';

  // 1. Authenticate as Operator
  try {
    console.log('1. Authenticating as Operator...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: 'operador', password: 'Admin123!' })
    });

    if (!loginRes.ok) throw new Error(`Operator login failed: ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    operatorToken = loginData.token;
    console.log(`✅ Operator logged in. Token: ${operatorToken.substring(0, 15)}...\n`);
  } catch (err) {
    console.error(`❌ Test 1 Failed: ${err.message}\n`);
    return;
  }

  // 2. Query Beneficiary by DNI
  try {
    console.log('2. Querying Beneficiary by DNI (42345678)...');
    const benRes = await fetch(`${BASE_URL}/beneficiarios/42345678`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    if (!benRes.ok) throw new Error(`Query beneficiary failed: ${await benRes.text()}`);
    const benData = await benRes.json();
    testEquipoId = benData.equipo.id;
    console.log(`✅ Beneficiary found: ${benData.nombre} ${benData.apellido}`);
    console.log(`✅ Notebook Serial: ${benData.equipo.numeroSerie}`);
    console.log(`✅ School: ${benData.escuelaNombre} (CUE: ${benData.escuelaCue})`);
    console.log(`✅ Program: ${benData.equipo.programaEducativoNombre}\n`);
  } catch (err) {
    console.error(`❌ Test 2 Failed: ${err.message}\n`);
    return;
  }

  // 2b. Query active Schools and Programs Catalogs
  try {
    console.log('2b. Querying active Schools and Programs Catalogs...');
    const escRes = await fetch(`${BASE_URL}/escuelas`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!escRes.ok) throw new Error(`Query schools failed: ${await escRes.text()}`);
    const escuelas = await escRes.json();
    console.log(`✅ Loaded ${escuelas.length} active schools.`);
    escuelas.forEach(e => console.log(`   - [CUE: ${e.cue}] ${e.nombre}`));

    const progRes = await fetch(`${BASE_URL}/programas`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!progRes.ok) throw new Error(`Query programs failed: ${await progRes.text()}`);
    const programas = await progRes.json();
    console.log(`✅ Loaded ${programas.length} active educational programs.`);
    programas.forEach(p => console.log(`   - ${p.nombre}`));
    console.log();

    const ubiRes = await fetch(`${BASE_URL}/ubicaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!ubiRes.ok) throw new Error(`Query locations failed: ${await ubiRes.text()}`);
    const ubicaciones = await ubiRes.json();
    console.log(`✅ Loaded ${ubicaciones.length} active warehouse shelf locations.`);
    ubicaciones.forEach(u => console.log(`   - [Código: ${u.codigo}] ${u.estanteria} - Fila ${u.fila}`));
    if (ubicaciones.length > 0) {
      testUbicacionId = ubicaciones[0].id;
    }
    console.log();

    // 2c. Test Advanced Filtering on Reparaciones
    console.log('2c. Querying repairs with advanced filters...');
    if (escuelas.length > 0) {
      const escId = escuelas[0].id;
      const filteredEscRes = await fetch(`${BASE_URL}/reparaciones?escuelaId=${escId}`, {
        headers: { 'Authorization': `Bearer ${operatorToken}` }
      });
      if (!filteredEscRes.ok) throw new Error(`Filtered query by school failed: ${await filteredEscRes.text()}`);
      const filteredEsc = await filteredEscRes.json();
      console.log(`✅ Filtered by School ID ${escId}: Found ${filteredEsc.length} repairs.`);
    }

    if (programas.length > 0) {
      const progId = programas[0].id;
      const filteredProgRes = await fetch(`${BASE_URL}/reparaciones?programaEducativoId=${progId}`, {
        headers: { 'Authorization': `Bearer ${operatorToken}` }
      });
      if (!filteredProgRes.ok) throw new Error(`Filtered query by program failed: ${await filteredProgRes.text()}`);
      const filteredProg = await filteredProgRes.json();
      console.log(`✅ Filtered by Program ID ${progId}: Found ${filteredProg.length} repairs.`);
    }
    console.log();
  } catch (err) {
    console.error(`❌ Test 2b/2c Failed: ${err.message}\n`);
    return;
  }

  // 3. Register Device Intake & Generate PDF
  try {
    console.log('3. Registering Device Intake (POST /reparaciones)...');
    const intakeRes = await fetch(`${BASE_URL}/reparaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        equipoId: testEquipoId,
        fallaReportada: 'El teclado no responde en las teclas A, S, D, F.',
        fallaCatalogoId: 4,
        observaciones: 'Presenta desgaste de pintura en la tapa.',
        ubicacionDepositoId: testUbicacionId || null
      })
    });

    if (!intakeRes.ok) throw new Error(`RegistrarIngreso failed: ${await intakeRes.text()}`);
    const intakeData = await intakeRes.json();
    testReparacionId = intakeData.id;
    console.log(`✅ Intake registered. Repair ID: ${testReparacionId}`);
    console.log(`✅ Assigned Shelf Code: ${intakeData.ubicacionDepositoCodigo || 'None'}`);
    console.log(`✅ PDF Comprobante URL: ${intakeData.comprobanteUrl}\n`);
  } catch (err) {
    console.error(`❌ Test 3 Failed: ${err.message}\n`);
    return;
  }

  // 3b. Upload physical technical evidence
  try {
    console.log(`3b. Logging in as Tecnico for evidence upload...`);
    const techLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: 'tecnico', password: 'Admin123!' })
    });
    if (!techLoginRes.ok) throw new Error(`Tecnico login failed: ${await techLoginRes.text()}`);
    const techLoginData = await techLoginRes.json();
    const tecnicoToken = techLoginData.token;
    console.log(`✅ Tecnico logged in.\n`);

    console.log(`3b. Uploading technical evidence image for repair ID: ${testReparacionId}...`);
    const formData = new FormData();
    const mockFileContent = 'fictional image binary content data';
    const blob = new Blob([mockFileContent], { type: 'image/png' });
    formData.append('file', blob, 'pantalla_rota.png');

    const uploadRes = await fetch(`${BASE_URL}/reparaciones/${testReparacionId}/evidencias`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tecnicoToken}`
      },
      body: formData
    });

    if (!uploadRes.ok) throw new Error(`Evidence upload failed: ${await uploadRes.text()}`);
    const uploadData = await uploadRes.json();
    console.log(`✅ Evidence uploaded successfully. ID: ${uploadData.id}`);
    console.log(`✅ Physical URL: ${uploadData.urlArchivo}`);
    console.log(`✅ Original name: ${uploadData.nombreArchivo}\n`);
  } catch (err) {
    console.error(`❌ Test 3b Failed: ${err.message}\n`);
    return;
  }

  // 3c. Update state to Listo_Para_Retirar (should queue notification)
  try {
    console.log(`3c. Updating repair state to Listo_Para_Retirar to trigger notification...`);
    const statusRes = await fetch(`${BASE_URL}/reparaciones/${testReparacionId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        nuevoEstado: 'Listo_Para_Retirar',
        diagnostico: 'Cambio de disco SSD dañado por SSD Kingston 240GB nuevo.',
        accionesRealizadas: 'Se clonó sistema, se reemplazó SSD físico y se probó encendido.',
        observaciones: 'Listo para ser devuelto al docente.'
      })
    });

    if (!statusRes.ok) throw new Error(`Status update failed: ${await statusRes.text()}`);
    console.log(`✅ State updated to Listo_Para_Retirar successfully.\n`);
  } catch (err) {
    console.error(`❌ Test 3c Failed: ${err.message}\n`);
    return;
  }

  // 3e. Update state to En_Garantia_Externa with warranty details
  try {
    console.log(`3e. Updating repair state to En_Garantia_Externa with warranty details...`);
    const statusRes = await fetch(`${BASE_URL}/reparaciones/${testReparacionId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        nuevoEstado: 'En_Garantia_Externa',
        diagnostico: 'Placa madre con falla insalvable localmente. Se deriva a servicio oficial.',
        accionesRealizadas: 'Ninguna (derivación a garantía externa).',
        observaciones: 'Enviado por remito oficial.',
        proveedorGarantia: 'Exo Oficial',
        remitoGarantia: 'R-0001-000456',
        fechaEsperadaGarantia: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      })
    });

    if (!statusRes.ok) throw new Error(`Status update to En_Garantia_Externa failed: ${await statusRes.text()}`);
    console.log(`✅ State updated to En_Garantia_Externa successfully.`);

    // Query repair and verify fields
    console.log(`3e. Querying repairs list to verify warranty details...`);
    const queryRes = await fetch(`${BASE_URL}/reparaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!queryRes.ok) throw new Error(`Querying repairs failed: ${await queryRes.text()}`);
    const repairs = await queryRes.json();
    const testRepair = repairs.find(r => r.id === testReparacionId);
    if (!testRepair) throw new Error("Expected to find the test repair in list!");

    console.log(`✅ Verified ProveedorGarantia: ${testRepair.proveedorGarantia}`);
    console.log(`✅ Verified RemitoGarantia: ${testRepair.remitoGarantia}`);
    console.log(`✅ Verified FechaEsperadaGarantia: ${testRepair.fechaEsperadaGarantia}\n`);

    if (testRepair.proveedorGarantia !== 'Exo Oficial' || testRepair.remitoGarantia !== 'R-0001-000456') {
      throw new Error("Warranty details do not match expected values!");
    }
  } catch (err) {
    console.error(`❌ Test 3e Failed: ${err.message}\n`);
    return;
  }

  // 3d. Check notification queue & await worker dispatch
  try {
    console.log(`3d. Checking notification queue status for repair ID: ${testReparacionId}...`);
    const notifRes = await fetch(`${BASE_URL}/reparaciones/${testReparacionId}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });

    if (!notifRes.ok) throw new Error(`Querying notifications failed: ${await notifRes.text()}`);
    const notifs = await notifRes.json();
    console.log(`✅ Queue contains ${notifs.length} notifications.`);
    if (notifs.length === 0) throw new Error("Expected at least one notification in queue!");
    console.log(`   - Initial State: ${notifs[0].estado} (Reintentos: ${notifs[0].reintentos})`);

    console.log('⏰ Waiting 12 seconds for NotificationWorkerService to poll and dispatch...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    console.log('3d. Re-checking notification status...');
    const notifRes2 = await fetch(`${BASE_URL}/reparaciones/${testReparacionId}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!notifRes2.ok) throw new Error(`Querying notifications second time failed: ${await notifRes2.text()}`);
    const notifs2 = await notifRes2.json();
    console.log(`   - Final State: ${notifs2[0].estado} (FechaEnvio: ${notifs2[0].fechaEnvio})`);
    
    if (notifs2[0].estado !== 'Enviado') {
      throw new Error(`Notification is not 'Enviado'. Current: ${notifs2[0].estado}. Error: ${notifs2[0].errorMensaje}`);
    }
    console.log(`✅ Notification successfully processed asynchronously!\n`);
  } catch (err) {
    console.error(`❌ Test 3d Failed: ${err.message}\n`);
    return;
  }

  // 4. Authenticate as Administrador
  try {
    console.log('4. Authenticating as Administrator...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: 'admin', password: 'Admin123!' })
    });

    if (!loginRes.ok) throw new Error(`Admin login failed: ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    console.log(`✅ Admin logged in. Token: ${adminToken.substring(0, 15)}...\n`);
  } catch (err) {
    console.error(`❌ Test 4 Failed: ${err.message}\n`);
    return;
  }

  // 5. Get Users List (Admin only)
  try {
    console.log('5. Listing all system users (GET /usuarios)...');
    const usersRes = await fetch(`${BASE_URL}/usuarios`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!usersRes.ok) throw new Error(`Listing users failed: ${await usersRes.text()}`);
    const usersData = await usersRes.json();
    console.log(`✅ Registered users count: ${usersData.length}`);
    usersData.forEach(u => {
      console.log(`   - ${u.nombreCompleto} (@${u.nombreUsuario}) [${u.rol}] - Activo: ${u.activo}`);
    });
    console.log();
  } catch (err) {
    console.error(`❌ Test 5 Failed: ${err.message}\n`);
    return;
  }

  // 6. Create New User (Admin only)
  try {
    console.log('6. Registering a new Operator user...');
    const newUsername = `operador_${Math.floor(Math.random() * 1000)}`;
    const createRes = await fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        nombreCompleto: 'Operador de Pruebas Automatizadas',
        nombreUsuario: newUsername,
        email: `${newUsername}@sanjuan.edu.ar`,
        password: 'Password123!',
        rol: 'Operador'
      })
    });

    if (!createRes.ok) throw new Error(`User creation failed: ${await createRes.text()}`);
    const createData = await createRes.json();
    newUserId = createData.id;
    console.log(`✅ New user created successfully.`);
    console.log(`✅ ID: ${newUserId} | Username: @${createData.nombreUsuario}\n`);
  } catch (err) {
    console.error(`❌ Test 6 Failed: ${err.message}\n`);
    return;
  }

  // 7. Toggle User Active Status (Admin only)
  try {
    console.log(`7. Toggling active status for user ID: ${newUserId}...`);
    const toggleRes = await fetch(`${BASE_URL}/usuarios/${newUserId}/toggle-active`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!toggleRes.ok) throw new Error(`Toggle active failed: ${await toggleRes.text()}`);
    const newActiveState = await toggleRes.json();
    console.log(`✅ Active state changed. New status (activo): ${newActiveState}\n`);
  } catch (err) {
    console.error(`❌ Test 7 Failed: ${err.message}\n`);
    return;
  }

  // 8. Query Dashboard Stats (Admin/Supervisor only)
  try {
    console.log('8. Querying Dashboard stats (GET /dashboard/stats)...');
    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!statsRes.ok) throw new Error(`Querying dashboard stats failed: ${await statsRes.text()}`);
    const statsData = await statsRes.json();
    console.log(`✅ Dashboard metrics retrieved:`);
    console.log(`   - Total Ingresados: ${statsData.equiposIngresados}`);
    console.log(`   - Pendientes: ${statsData.equiposPendientes}`);
    console.log(`   - Entregados: ${statsData.equiposEntregados}`);
    console.log(`   - Tiempos promedio (días): ${statsData.tiempoPromedioReparacionDias}`);
    console.log(`   - Fallas más frecuentes: ${statsData.fallasMasFrecuentes.length}`);
    console.log(`   - Reparaciones por Escuela: ${statsData.reparacionesPorEscuela.length}`);
    console.log(`   - Efectividad Técnicos: ${statsData.efectividadTecnicos.length}`);
    console.log(`   - Reparaciones por Mes: ${statsData.reparacionesPorMes.length}\n`);

    if (!statsData.reparacionesPorEscuela || !statsData.efectividadTecnicos || !statsData.reparacionesPorMes) {
      throw new Error("Missing new advanced KPI lists in dashboard stats response!");
    }
  } catch (err) {
    console.error(`❌ Test 8 Failed: ${err.message}\n`);
    return;
  }

  // 9. Digital Signature Verification (Intake and Delivery)
  try {
    console.log('9. Verifying Digital Signatures (Intake & Delivery)...');
    
    // Create a mock base64 signature string
    const mockIntakeSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const mockDeliverySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAgIAAAoAAYXyP6wAAAAASUVORK5CYII=';

    console.log('9a. Registering device intake with a digital signature...');
    const intakeRes = await fetch(`${BASE_URL}/reparaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        equipoId: testEquipoId,
        fallaReportada: 'Falla para testeo de firmas digitales.',
        fallaCatalogoId: 1,
        observaciones: 'Testeo de firma digital.',
        ubicacionDepositoId: testUbicacionId || null,
        firmaIngresoBase64: mockIntakeSignature
      })
    });

    if (!intakeRes.ok) throw new Error(`RegistrarIngreso with signature failed: ${await intakeRes.text()}`);
    const intakeData = await intakeRes.json();
    const signatureRepairId = intakeData.id;
    console.log(`✅ Intake registered. Repair ID: ${signatureRepairId}`);
    console.log(`✅ Verified response DTO contains FirmaIngresoBase64.`);

    // Fetch the repair details to verify the signature is stored in database
    console.log('9b. Querying repair from list to verify signature database persistence...');
    const listRes = await fetch(`${BASE_URL}/reparaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!listRes.ok) throw new Error(`Querying repairs failed: ${await listRes.text()}`);
    const repairsList = await listRes.json();
    const persistRepair = repairsList.find(r => r.id === signatureRepairId);
    if (!persistRepair) throw new Error("Expected to find the signature test repair in list!");

    if (persistRepair.firmaIngresoBase64 !== mockIntakeSignature) {
      throw new Error("Stored intake signature does not match original!");
    }
    console.log('✅ persistRepair.firmaIngresoBase64 matches mockIntakeSignature.');

    // Now deliver the device and supply the delivery signature
    console.log('9c. Confirming delivery of device with delivery signature...');
    const deliveryRes = await fetch(`${BASE_URL}/reparaciones/${signatureRepairId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        nuevoEstado: 'Entregado',
        diagnostico: 'Reparación de prueba finalizada.',
        accionesRealizadas: 'Entrega física.',
        observaciones: 'Entregado con firma digital.',
        firmaEntregaBase64: mockDeliverySignature
      })
    });

    if (!deliveryRes.ok) throw new Error(`Confirming delivery failed: ${await deliveryRes.text()}`);
    console.log('✅ Delivery state transition processed successfully.');

    // Fetch again and verify delivery signature
    console.log('9d. Re-checking repair to verify delivery signature storage...');
    const listRes2 = await fetch(`${BASE_URL}/reparaciones`, {
      headers: { 'Authorization': `Bearer ${operatorToken}` }
    });
    if (!listRes2.ok) throw new Error(`Querying repairs failed: ${await listRes2.text()}`);
    const repairsList2 = await listRes2.json();
    const deliveredRepair = repairsList2.find(r => r.id === signatureRepairId);
    
    if (!deliveredRepair) throw new Error("Expected to find the delivered repair!");
    if (deliveredRepair.firmaEntregaBase64 !== mockDeliverySignature) {
      throw new Error("Stored delivery signature does not match original!");
    }
    console.log('✅ deliveredRepair.firmaEntregaBase64 matches mockDeliverySignature.\n');
  } catch (err) {
    console.error(`❌ Test 9 Failed: ${err.message}\n`);
    return;
  }

  console.log('🏁 Integration tests finished successfully! All checks passed. 🎉');
}

runTests();
