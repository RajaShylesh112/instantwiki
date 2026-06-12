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

const wikiId = "25f8297e-147c-4388-888a-e1b8d061a751";

async function run() {
  // 1. Fetch documents
  const docsRes = await fetch(`${url}/rest/v1/documents?wiki_id=eq.${wikiId}&select=id,filename`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const docs = await docsRes.json();
  console.log("Documents in wiki:", docs);

  if (docs.length === 0) return;

  const docIds = docs.map(d => d.id);
  
  // 2. Count chunks
  const chunksRes = await fetch(`${url}/rest/v1/document_chunks?document_id=in.(${docIds.join(',')})&select=id`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const chunks = await chunksRes.json();
  console.log(`Total chunks in DB for these documents: ${chunks.length}`);

  if (chunks.length === 0) return;

  const chunkIds = chunks.map(c => c.id);

  // 3. Count embeddings
  // Note: we can filter by chunk_id in the list
  // To avoid long URL, let's query count directly or page through
  const embedRes = await fetch(`${url}/rest/v1/chunk_embeddings?select=count`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const countData = await embedRes.json();
  console.log(`Total embeddings in table (global):`, countData);

  // Let's get count for these chunkIds specifically
  const batchSize = 50;
  let matchesCount = 0;
  for (let i = 0; i < chunkIds.length; i += batchSize) {
    const batch = chunkIds.slice(i, i + batchSize);
    const filter = `in.(${batch.join(',')})`;
    const batchRes = await fetch(`${url}/rest/v1/chunk_embeddings?chunk_id=${encodeURIComponent(filter)}&select=chunk_id`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await batchRes.json();
    matchesCount += data.length;
  }
  console.log(`Embeddings generated for these chunks: ${matchesCount} of ${chunks.length}`);
}

run();
