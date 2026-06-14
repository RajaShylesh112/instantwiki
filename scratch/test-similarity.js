const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
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
const supabase = createClient(url, key);
const wikiId = "53fcfaae-893c-4643-8c34-d3e96249e873"; // some-random

async function run() {
  console.log("=== DIAGNOSING WIKI SIMILARITY RETRIEVAL ===");
  console.log("Wiki ID:", wikiId);

  // 1. Fetch documents
  const { data: docs, error: docsErr } = await supabase
    .from("documents")
    .select("id, filename, wiki_id")
    .eq("wiki_id", wikiId);

  if (docsErr) {
    console.error("Error fetching documents:", docsErr);
    return;
  }
  console.log(`Found ${docs.length} documents for this wiki:`, docs);

  if (docs.length === 0) {
    console.warn("No documents found in database for wiki:", wikiId);
    return;
  }

  const docIds = docs.map(d => d.id);

  // 2. Query some chunks
  const { data: chunks, error: chunksErr } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, embedding, page_number")
    .in("document_id", docIds)
    .limit(5);

  if (chunksErr) {
    console.error("Error fetching chunks:", chunksErr);
    return;
  }
  console.log(`\nFetched ${chunks.length} chunks from document_chunks.`);
  
  if (chunks.length === 0) {
    console.warn("No chunks found in document_chunks for document IDs:", docIds);
    return;
  }

  chunks.forEach((c, i) => {
    const hasEmbed = c.embedding ? "YES" : "NO";
    const embedDim = c.embedding ? (Array.isArray(c.embedding) ? c.embedding.length : typeof c.embedding) : 0;
    console.log(`  [Chunk ${i+1}] ID: ${c.id} | Page: ${c.page_number} | Has embedding column: ${hasEmbed} (Dim: ${embedDim}) | Text preview: "${c.content.substring(0, 60)}..."`);
  });

  // 3. Query chunk_embeddings table
  const { data: embeddings, error: embedErr } = await supabase
    .from("chunk_embeddings")
    .select("id, chunk_id, embedding, embedding_model")
    .in("chunk_id", chunks.map(c => c.id));

  if (embedErr) {
    console.error("Error fetching from chunk_embeddings:", embedErr);
  } else {
    console.log(`\nFetched ${embeddings.length} entries from chunk_embeddings table.`);
    embeddings.forEach((emb, i) => {
      const dim = Array.isArray(emb.embedding) ? emb.embedding.length : typeof emb.embedding;
      console.log(`  [Embedding ${i+1}] Chunk ID: ${emb.chunk_id} | Model: ${emb.embedding_model} | Dimension: ${dim}`);
    });
  }

  // 4. Test similarity matching with match_chunks rpc
  // Let's generate a query embedding using Voyage AI api or a dummy one.
  const voyageApiKey = env.VOYAGE_AI_API_KEY;
  if (!voyageApiKey) {
    console.error("Missing VOYAGE_AI_API_KEY in .env");
    return;
  }

  console.log("\nGenerating embedding for test query: 'Mahatma Gandhi biography and history'...");
  let queryVector;
  try {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${voyageApiKey}`
      },
      body: JSON.stringify({
        input: ["Mahatma Gandhi biography and history"],
        model: "voyage-4-large"
      })
    });
    
    if (!response.ok) {
      throw new Error(`Voyage API error: ${response.status}`);
    }

    const resData = await response.json();
    const rawEmbedding = resData.data?.[0]?.embedding;
    if (rawEmbedding) {
      console.log(`Successfully generated Voyage embedding of length: ${rawEmbedding.length}`);
      // Pad to 1536 as in page-generator.ts
      queryVector = rawEmbedding.concat(new Array(1536 - rawEmbedding.length).fill(0));
      console.log(`Padded embedding length to: ${queryVector.length}`);
    }
  } catch (err) {
    console.error("Failed to generate embedding via Voyage:", err);
  }

  if (!queryVector) {
    console.log("Using dummy 1536-dim vector for testing RPC...");
    queryVector = Array(1536).fill(0).map(() => Math.random() - 0.5);
    const mag = Math.sqrt(queryVector.reduce((s, v) => s + v*v, 0));
    queryVector = queryVector.map(v => v / mag);
  }

  // Run match_chunks
  console.log("\nCalling RPC match_chunks with threshold = 0.0...");
  const { data: match0, error: err0 } = await supabase.rpc("match_chunks", {
    p_wiki_id: wikiId,
    query_embedding: queryVector,
    match_threshold: 0.0,
    match_count: 5
  });

  if (err0) {
    console.error("RPC match_chunks (threshold 0.0) failed:", err0);
  } else {
    console.log(`RPC (threshold 0.0) returned ${match0.length} matches:`);
    match0.forEach((m, idx) => {
      console.log(`  [Match ${idx+1}] Chunk ID: ${m.chunk_id} | Similarity: ${m.similarity} | Content: "${m.content?.substring(0, 80)}..."`);
    });
  }

  console.log("\nCalling RPC match_chunks with threshold = 0.1...");
  const { data: match1, error: err1 } = await supabase.rpc("match_chunks", {
    p_wiki_id: wikiId,
    query_embedding: queryVector,
    match_threshold: 0.1,
    match_count: 5
  });

  if (err1) {
    console.error("RPC match_chunks (threshold 0.1) failed:", err1);
  } else {
    console.log(`RPC (threshold 0.1) returned ${match1.length} matches.`);
  }
}

run();
