const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting secure tunnel to backend (Port 5001)...');

const backend = spawn('npx', ['localtunnel', '--port', '5001']);

backend.stdout.on('data', (data) => {
  const out = data.toString();
  if (out.includes('your url is:')) {
    const url = out.split('your url is:')[1].trim();
    console.log(`Backend tunneled securely to: ${url}`);
    
    // Inject backend URL into frontend environment
    fs.writeFileSync('./client/.env.local', `VITE_API_URL=${url}\n`);
    console.log('Injected VITE_API_URL into frontend configuration.');

    console.log('Starting secure tunnel to frontend (Port 5173)...');
    
    // NOTE: Vite dev server needs a restart to pick up .env changes
    // But since the user is already running 'npm run dev' we can't easily restart it here.
    // They will need to manually restart the dev server in the terminal.
    
    const frontend = spawn('npx', ['localtunnel', '--port', '5173']);
    frontend.stdout.on('data', (fData) => {
      const fOut = fData.toString();
      if (fOut.includes('your url is:')) {
        const fUrl = fOut.split('your url is:')[1].trim();
        console.log(`\n======================================================`);
        console.log(`🚀 SHARE THIS LINK WITH YOUR MANAGER:`);
        console.log(`👉 ${fUrl}`);
        console.log(`======================================================\n`);
        console.log('⚠️ IMPORTANT: Please restart your `npm run dev` terminal command so it picks up the new API URL!');
      }
    });
    
    frontend.stderr.on('data', (err) => console.error(`Frontend Tunnel Error: ${err}`));
  }
});

backend.stderr.on('data', (err) => {
  console.error(`Backend Tunnel Error: ${err}`);
});
