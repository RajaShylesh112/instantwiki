const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error("Env not found at:", envPath);
    return;
  }
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
const wikiId = "81433f73-6ceb-4107-b0a2-78529ffdb718";

async function main() {
  const { data: documents } = await supabase
    .from("documents")
    .select("id, filename")
    .eq("wiki_id", wikiId);

  for (const doc of documents) {
    console.log(`\nDocument: ${doc.filename} (${doc.id})`);
    const { data: chunks, error } = await supabase
      .from("document_chunks")
      .select("id, page_number, content")
      .eq("document_id", doc.id)
      .limit(3);
      
    if (error) {
      console.error("  Error:", error);
      continue;
    }
    
    console.log(`  Found ${chunks.length} chunks.`);
    chunks.forEach(c => {
      console.log(`    - Page ${c.page_number} chunk: "${c.content.substring(0, 150).replace(/\n/g, " ")}..."`);
    });
  }
}

main();
