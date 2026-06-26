const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

async function run() {
  console.log("Starting backend server...");
  const server = spawn('dotnet', ['run', '--project', 'backend/MiCompuEdu.WebApi', '--launch-profile', 'http'], {
    cwd: 'C:\\Users\\Docente\\Desktop\\MiCompuEdu_sj-depo'
  });

  server.stdout.on('data', (data) => {
    const str = data.toString();
    console.log("[Server]", str.trim());
  });

  server.stderr.on('data', (data) => {
    console.error("[Server Error]", data.toString());
  });

  // Wait 12 seconds for server to compile and start
  console.log("Waiting for backend server to compile and start...");
  await new Promise(resolve => setTimeout(resolve, 12000));

  try {
    console.log("Logging in as admin...");
    const loginRes = await fetch('http://localhost:5110/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: 'admin', password: 'Admin123!' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
    const { token } = await loginRes.json();
    console.log("Logged in successfully. Token obtained.");

    console.log("Reading netbooks_entregadas_LIMPIO.xlsx...");
    const filePath = 'C:\\Users\\Docente\\Desktop\\MiCompuEdu_sj-depo\\netbooks_entregadas_LIMPIO.xlsx';
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    console.log("Uploading file to endpoint POST /api/v1/importacion/padron...");
    const formData = new FormData();
    formData.append('archivo', blob, 'netbooks_entregadas_LIMPIO.xlsx');

    const uploadRes = await fetch('http://localhost:5110/api/v1/importacion/padron', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${await uploadRes.text()}`);
    }

    const result = await uploadRes.json();
    console.log("\n=========================================");
    console.log("IMPORT COMPLETED SUCCESSFULLY!");
    console.log("=========================================");
    console.log(`Total rows: ${result.totalFilas}`);
    console.log(`Schools created: ${result.escuelasCreadas}`);
    console.log(`Schools existing: ${result.escuelasExistentes}`);
    console.log(`Beneficiaries created: ${result.beneficiariosCreados}`);
    console.log(`Beneficiaries updated: ${result.beneficiariosActualizados}`);
    console.log(`Equipos created: ${result.equiposCreados}`);
    console.log(`Equipos updated: ${result.equiposActualizados}`);
    console.log(`Errors: ${result.errores}`);
    if (result.detallesErrores.length > 0) {
      console.log("First 10 errors:");
      result.detallesErrores.slice(0, 10).forEach(e => console.log(" -", e));
    }
  } catch (err) {
    console.error("Error during import process:", err);
  } finally {
    console.log("Stopping backend server...");
    server.kill();
  }
}

run();
