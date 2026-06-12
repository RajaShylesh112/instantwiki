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

async function makeRequest(table, method = "GET", filter = "", body = null) {
  const url = `${supabaseUrl}/rest/v1/${table}?${filter}`;
  const options = {
    method,
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} on ${table}`);
  }
  if (method === "DELETE" || response.status === 204) {
    return { success: true };
  }
  return response.json();
}

async function run() {
  try {
    const wikiId = "25aeb654-2858-4d97-bb46-162078345c9c";
    console.log(`Clearing Grandma's Story Quilt wiki pages (Wiki ID: ${wikiId})...`);
    
    // 1. Delete wiki pages
    const pagesDel = await makeRequest("wiki_pages", "DELETE", `wiki_id=eq.${wikiId}`);
    console.log("Pages deleted:", pagesDel);
    
    // 2. Fetch documents for this wiki
    const docs = await makeRequest("documents", "GET", `wiki_id=eq.${wikiId}`);
    console.log("Documents found for this wiki:", docs.length);
    
    for (const doc of docs) {
      console.log(`Clearing database chunks/images/embeddings for document: ${doc.filename} (${doc.id})...`);
      
      // Delete document images
      const imagesDel = await makeRequest("document_images", "DELETE", `document_id=eq.${doc.id}`);
      console.log("- Images deleted:", imagesDel);
      
      // Get chunk IDs to delete their embeddings
      const chunks = await makeRequest("document_chunks", "GET", `document_id=eq.${doc.id}`);
      if (chunks && chunks.length > 0) {
        console.log(`- Found ${chunks.length} chunks. Deleting embeddings in batches...`);
        const chunkIds = chunks.map(c => c.id);
        
        // Batch size of 100
        const batchSize = 100;
        for (let i = 0; i < chunkIds.length; i += batchSize) {
          const batch = chunkIds.slice(i, i + batchSize);
          const filter = `chunk_id=in.(${batch.join(',')})`;
          await makeRequest("chunk_embeddings", "DELETE", filter);
        }
        console.log("- Embeddings deleted successfully.");
      }
      
      // Delete document chunks
      const chunksDel = await makeRequest("document_chunks", "DELETE", `document_id=eq.${doc.id}`);
      console.log("- Chunks deleted:", chunksDel);
    }
    
    console.log("\nWiki clear completed. You can now trigger synthesis again to perform a clean and real PDF extraction!");
  } catch (err) {
    console.error("Error clearing database entries:", err);
  }
}

run();
