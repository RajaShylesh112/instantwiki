const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.join(__dirname, '../apps/web/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.SUPABASE_URL;
const key = env.SUPABASE_KEY;

async function run() {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch OpenAPI spec:", response.status);
    return;
  }

  const spec = await response.json();
  console.log("Database Tables:");
  console.log(Object.keys(spec.definitions || {}));
  
  console.log("\nAvailable RPC Paths:");
  const paths = Object.keys(spec.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  console.log(rpcs);
}

run();
