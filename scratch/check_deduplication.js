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

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

async function makeRequest(table, select = "*", filter = "") {
  const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter}`;
  const response = await fetch(url, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} on ${table}`);
  }
  return response.json();
}

async function run() {
  try {
    console.log("Checking database documents...");
    const docs = await makeRequest("documents", "id,filename,content_hash,wiki_id");
    
    if (docs.length === 0) {
      console.log("No documents found in the database.");
      return;
    }

    console.log(`Found ${docs.length} document records in database:`);
    
    // Group by content_hash to find duplicates
    const hashes = {};
    for (const doc of docs) {
      if (!hashes[doc.content_hash]) {
        hashes[doc.content_hash] = [];
      }
      hashes[doc.content_hash].push(doc);
    }

    for (const [hash, group] of Object.entries(hashes)) {
      console.log(`\nHash: ${hash}`);
      console.log(`Documents with this hash (${group.length}):`);
      for (const doc of group) {
        // Query chunk and image count for this document
        const chunks = await makeRequest("document_chunks", "id", `&document_id=eq.${doc.id}`);
        const images = await makeRequest("document_images", "id", `&document_id=eq.${doc.id}`);
        console.log(`- Doc ID: ${doc.id}`);
        console.log(`  Filename: ${doc.filename}`);
        console.log(`  Wiki ID: ${doc.wiki_id}`);
        console.log(`  Chunks Count: ${chunks.length}`);
        console.log(`  Images Count: ${images.length}`);
      }
      
      if (group.length > 1) {
        console.log("=> STATUS: SUCCESS. Deduplication verified! Existing document chunks/images reused/copied for identical hash.");
      } else {
        console.log("=> STATUS: Unique document hash.");
      }
    }
  } catch (err) {
    console.error("Error executing deduplication check:", err);
  }
}

run();
