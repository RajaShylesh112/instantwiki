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

const jobId = "4bd1bae5-e11b-4eba-ace2-6b6c57f6c023";

async function run() {
  console.log(`Setting status of job ${jobId} to FAILED...`);
  const response = await fetch(`${url}/rest/v1/processing_jobs?id=eq.${jobId}`, {
    method: "PATCH",
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: "FAILED",
      error: "Job timed out or server restarted.",
      finished_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    console.error("Failed to update job status:", response.status);
    return;
  }

  const result = await response.json();
  console.log("Updated job details:", result);
}

run();
