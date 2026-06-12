const fs = require('fs');
const path = require('path');

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

// Mock owner_id and slug
const ownerId = "8aed741b-a831-4830-8de1-07ed316bee3d"; // rajashylesh's ID
const slug = "defenses-against-random-content-poisoning";
const displayTitle = "Defenses Against Random Content Poisoning";

async function run() {
  console.log("Attempting insert into wikis table...");
  const response = await fetch(`${url}/rest/v1/wikis`, {
    method: "POST",
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      owner_id: ownerId,
      title: displayTitle,
      slug: slug.toLowerCase(),
      description: "Test description",
      visibility: "PUBLIC",
      status: "READY",
      page_limit: 25,
      page_count: 0
    })
  });

  const body = await response.json();
  console.log("Status code:", response.status);
  console.log("Response body:", body);
}

run();
