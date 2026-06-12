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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVectorDim() {
  console.log("Checking vector column definitions...");
  
  // Method 1: Query database system catalogs to find the dimension of chunk_embeddings.embedding
  const { data: cols, error: err } = await supabase.rpc('match_chunks', {
    p_wiki_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    query_embedding: Array(1536).fill(0),
    match_threshold: 0.0,
    match_count: 1
  });

  if (err) {
    console.log("match_chunks with 1536 dimension returned error:", err);
  } else {
    console.log("match_chunks with 1536 dimension SUCCEEDED!");
  }

  // Let's try 1024 dimension as well to see if it accepts 1024
  const { data: cols1024, error: err1024 } = await supabase.rpc('match_chunks', {
    p_wiki_id: '00000000-0000-0000-0000-000000000000',
    query_embedding: Array(1024).fill(0),
    match_threshold: 0.0,
    match_count: 1
  });

  if (err1024) {
    console.log("match_chunks with 1024 dimension returned error:", err1024);
  } else {
    console.log("match_chunks with 1024 dimension SUCCEEDED!");
  }
}

checkVectorDim();
