const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) continue;
    let key = trimmed.substring(0, firstEq).trim();
    let val = trimmed.substring(firstEq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[key] = val;
  }
}

loadEnv();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const wikiId = "5987390a-b358-4873-83b6-f199b2e1c632";

async function inspectWiki() {
  console.log(`Inspecting wiki ${wikiId}...`);
  
  // 1. Fetch wiki details
  const { data: wiki } = await supabase
    .from("wikis")
    .select("*")
    .eq("id", wikiId)
    .single();
    
  console.log("Wiki details:", wiki);

  // 2. Fetch processing jobs
  const { data: jobs } = await supabase
    .from("processing_jobs")
    .select("*")
    .eq("wiki_id", wikiId)
    .order("started_at", { ascending: false });

  console.log("\nProcessing Jobs:");
  if (jobs && jobs.length > 0) {
    jobs.forEach(j => {
      console.log(`  - Job ID: ${j.id} | Status: ${j.status} | Step: ${j.current_step} | Started: ${j.started_at} | Error: ${j.error}`);
    });
  } else {
    console.log("  No jobs found.");
  }

  // 3. Fetch wiki pages
  const { data: pages } = await supabase
    .from("wiki_pages")
    .select("id, slug, title, generation_status, page_type")
    .eq("wiki_id", wikiId);

  console.log("\nWiki Pages:");
  if (pages && pages.length > 0) {
    pages.forEach(p => {
      console.log(`  - Page: ${p.title} (${p.slug}) | Type: ${p.page_type} | Status: ${p.generation_status}`);
    });
  } else {
    console.log("  No pages found.");
  }
}

inspectWiki();
