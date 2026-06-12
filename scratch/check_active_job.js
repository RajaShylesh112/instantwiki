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
  console.log(`Fetching details for job: ${jobId}...`);
  const response = await fetch(`${url}/rest/v1/processing_jobs?id=eq.${jobId}&select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch job:", response.status);
    return;
  }

  const jobs = await response.json();
  console.log("Job details:", jobs);

  if (jobs.length > 0) {
    const job = jobs[0];
    console.log("\nChecking related wiki pages for this wiki ID:", job.wiki_id);
    const pagesResponse = await fetch(`${url}/rest/v1/wiki_pages?wiki_id=eq.${job.wiki_id}&select=*`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (pagesResponse.ok) {
      const pages = await pagesResponse.json();
      console.log(`Found ${pages.length} pages:`);
      pages.forEach(p => {
        console.log(`- Title: ${p.title}, Slug: ${p.slug}, Status: ${p.generation_status}`);
      });
    }
  }
}

run();
