const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function run() {
  const wikiId = "53fcfaae-893c-4643-8c34-d3e96249e873";
  
  // 1. Fetch one document to use
  const { data: docs } = await supabase
    .from("documents")
    .select("id")
    .eq("wiki_id", wikiId)
    .limit(1);
    
  if (!docs || docs.length === 0) {
    console.error("No documents found for wiki:", wikiId);
    return;
  }
  const docId = docs[0].id;
  console.log("Using docId:", docId);

  // 2. Insert a temporary chunk with a specific content
  const testContent = "TEMPORARY_TEST_CHUNK_FOR_EMBEDDING_TABLE_" + Date.now();
  const { data: chunk, error: chunkErr } = await supabase
    .from("document_chunks")
    .insert({
      document_id: docId,
      page_number: 999,
      chunk_index: 999,
      content: testContent,
      heading: "Test Heading",
      section: "Test Section"
    })
    .select("*")
    .single();

  if (chunkErr) {
    console.error("Error inserting chunk:", chunkErr);
    return;
  }
  console.log("Inserted chunk ID:", chunk.id);

  // Create a dummy vector of 1024 dimensions (e.g. all 0.1, normalized)
  const dim = 1024;
  const dummyVector = Array(dim).fill(0.1);
  const len = Math.sqrt(dummyVector.reduce((s, v) => s + v*v, 0));
  const normalizedVector = dummyVector.map(v => v / len);

  // Pad to 1536 if needed? Let's check both or see what dimensions are defined in DB.
  // Wait, let's use 1024 or 1536 depending on what match_chunks expects.
  // We saw both succeeded. Let's use 1024 first.
  
  try {
    // Test Case A: Insert only into chunk_embeddings table. document_chunks.embedding remains NULL.
    console.log("\n--- TEST CASE A: Insert into chunk_embeddings table only ---");
    const { error: embedErr } = await supabase
      .from("chunk_embeddings")
      .insert({
        chunk_id: chunk.id,
        embedding: normalizedVector,
        embedding_model: "voyage-3-large"
      });
      
    if (embedErr) {
      console.error("Error inserting into chunk_embeddings:", embedErr);
    } else {
      console.log("Inserted into chunk_embeddings table successfully.");
      
      // Let's call match_chunks RPC
      const { data: resA, error: rpcErrA } = await supabase.rpc("match_chunks", {
        p_wiki_id: wikiId,
        query_embedding: normalizedVector,
        match_threshold: 0.8,
        match_count: 5
      });
      
      if (rpcErrA) {
        console.error("RPC Error A:", rpcErrA);
      } else {
        const found = resA.some(r => r.chunk_id === chunk.id);
        console.log(`RPC returned ${resA.length} matches. Found our test chunk?`, found);
        if (found) {
          console.log("SUCCESS: match_chunks RPC uses chunk_embeddings table!");
        }
      }
    }

    // Test Case B: Update document_chunks.embedding column as well.
    console.log("\n--- TEST CASE B: Update document_chunks.embedding column ---");
    const { error: updateErr } = await supabase
      .from("document_chunks")
      .update({
        embedding: normalizedVector
      })
      .eq("id", chunk.id);

    if (updateErr) {
      console.error("Error updating document_chunks.embedding:", updateErr);
    } else {
      console.log("Updated document_chunks.embedding column successfully.");
      
      // Call match_chunks RPC again
      const { data: resB, error: rpcErrB } = await supabase.rpc("match_chunks", {
        p_wiki_id: wikiId,
        query_embedding: normalizedVector,
        match_threshold: 0.8,
        match_count: 5
      });
      
      if (rpcErrB) {
        console.error("RPC Error B:", rpcErrB);
      } else {
        const found = resB.some(r => r.chunk_id === chunk.id);
        console.log(`RPC returned ${resB.length} matches. Found our test chunk?`, found);
        if (found) {
          console.log("SUCCESS: match_chunks RPC matches on document_chunks.embedding column!");
        }
      }
    }
  } finally {
    // Clean up
    console.log("\nCleaning up test chunk...");
    await supabase.from("chunk_embeddings").delete().eq("chunk_id", chunk.id);
    await supabase.from("document_chunks").delete().eq("id", chunk.id);
    console.log("Cleanup done.");
  }
}

run();
