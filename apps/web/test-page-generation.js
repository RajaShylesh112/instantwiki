const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log("No .env file found at:", envPath);
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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const voyageApiKey = process.env.VOYAGE_AI_API_KEY || process.env.VOYAGE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Reusable fetch with timeout helper
async function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Generate embedding using Voyage AI (replicated from embeddings.ts)
async function generateEmbedding(text) {
  if (voyageApiKey && voyageApiKey.trim() !== "" && voyageApiKey !== "YOUR_VOYAGE_AI_API_KEY") {
    console.log(`[Voyage AI] Requesting embedding for: "${text}"`);
    try {
      const response = await fetchWithTimeout("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${voyageApiKey}`
        },
        body: JSON.stringify({
          input: [text],
          model: "voyage-4-large"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;
        if (embedding && Array.isArray(embedding)) {
          // Pad 1024-dimension Voyage vector to 1536 dimensions
          const padded = embedding.concat(new Array(1536 - embedding.length).fill(0));
          return { embedding: padded, model: "voyage-4-large" };
        }
      }
      console.warn(`[Voyage AI] Embedding failed with status: ${response.status}`);
    } catch (err) {
      console.warn(`[Voyage AI Exception] ${err.message}.`);
    }
  }

  // Fallback sandbox mock
  console.log(`[Mock Fallback] Generating deterministic mock embedding...`);
  const dimensions = 1536;
  const hash = crypto.createHash("sha256").update(text).digest();
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    const byteIndex = (i * 3) % hash.length;
    const seedVal = hash[byteIndex] + hash[(byteIndex + 1) % hash.length];
    let val = Math.sin(seedVal + i) * Math.cos(seedVal - i);
    vector.push(val);
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  const embedding = magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  return { embedding, model: "sandbox-mock-1536" };
}

// Call DeepSeek LLM to generate page content
async function callDeepSeek(prompt) {
  if (!deepseekApiKey || deepseekApiKey === "YOUR_DEEPSEEK_API_KEY") {
    throw new Error("No DEEPSEEK_API_KEY configured in environment.");
  }
  
  console.log("[DeepSeek LLM] Calling deepseek-chat API...");
  const response = await fetchWithTimeout("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that outputs only valid JSON matching the requested schema. Do not include markdown wraps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API responded with HTTP status ${response.status}: ${errText}`);
  }
  
  const rawData = await response.json();
  const content = rawData.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function runPageGenerationTest() {
  console.log("\n=============================================");
  console.log("=== STARTING BACKEND PAGE GENERATION TEST ===");
  console.log("=============================================\n");

  // 1. Find a wiki with chunks in the database
  console.log("[Step 1] Finding active wiki and document chunks...");
  
  const { data: wikis, error: wikiErr } = await supabase
    .from("wikis")
    .select("id, title, description")
    .limit(5);

  if (wikiErr) {
    console.error("Error fetching wikis:", wikiErr);
    process.exit(1);
  }

  if (!wikis || wikis.length === 0) {
    console.warn("No wikis found in database. Exiting.");
    process.exit(0);
  }

  console.log(`Found ${wikis.length} wikis in database.`);
  
  let targetWiki = null;
  let targetChunksCount = 0;

  // Let's iterate and find the first wiki that has chunks
  for (const w of wikis) {
    const { count, error: countErr } = await supabase
      .from("document_chunks")
      .select("id", { count: 'exact', head: true })
      .eq("document_id", w.id); // Wait, chunks are linked to documents, which are linked to wikis.
      
    // Let's do a join query or fetch documents for the wiki first
    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("wiki_id", w.id);

    if (docs && docs.length > 0) {
      const docIds = docs.map(d => d.id);
      const { count: chunksCount, error: chunkCountErr } = await supabase
        .from("document_chunks")
        .select("id", { count: 'exact', head: true })
        .in("document_id", docIds);

      if (chunksCount && chunksCount > 0) {
        targetWiki = w;
        targetChunksCount = chunksCount;
        break;
      }
    }
  }

  if (!targetWiki) {
    console.log("None of the wikis have document chunks. Let's use the first wiki and run with mock search fallback.");
    targetWiki = wikis[0];
  }

  console.log(`Using Wiki: "${targetWiki.title}" (ID: ${targetWiki.id})`);
  console.log(`Associated chunks in DB: ${targetChunksCount}`);

  // 2. Define Topic and Generate Embedding
  const topicTitle = "Introduction to Genomics and Data Pipelines";
  console.log(`\n[Step 2] Embedding topic: "${topicTitle}"`);
  const embedStart = Date.now();
  const { embedding, model } = await generateEmbedding(topicTitle);
  console.log(`[Step 2 Success] Generated embedding in ${Date.now() - embedStart}ms using model: ${model} (dimensions: ${embedding.length})`);

  // 3. Search Similar Chunks in DB
  console.log("\n[Step 3] Querying pgvector for similar document chunks...");
  const searchStart = Date.now();
  
  const { data: similarChunks, error: searchErr } = await supabase.rpc("match_chunks", {
    p_wiki_id: targetWiki.id,
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5
  });

  if (searchErr) {
    console.error("Cosine similarity search failed:", searchErr);
    process.exit(1);
  }

  console.log(`[Step 3 Success] pgvector search returned ${similarChunks ? similarChunks.length : 0} chunks in ${Date.now() - searchStart}ms.`);

  let chunkContents = "";
  if (similarChunks && similarChunks.length > 0) {
    similarChunks.forEach((c, idx) => {
      console.log(`  - Chunk ${idx + 1} (Score: ${c.similarity.toFixed(4)}) from page ${c.page_number || 1}:`);
      console.log(`    "${c.content.substring(0, 100).replace(/\n/g, ' ')}..."`);
    });
    
    chunkContents = similarChunks
      .map((c, idx) => `[Source ${idx + 1}] (Page ${c.page_number}): ${c.content}`)
      .join("\n---\n");
  } else {
    console.log("  - No matching chunks found. Using mock source text for synthesis fallback.");
    chunkContents = `[Source 1] (Page 1): Bioinformatics preprocessing pipelines clean raw genomic sequence data.
[Source 2] (Page 1): Phred quality scores represent base call accuracy. Scores above 30 have 99.9% accuracy.
[Source 3] (Page 2): Alignment algorithms map processed short reads to standard reference genomes to identify variations.`;
  }

  // 4. Construct LLM prompt
  const pagePrompt = `You are a professional technical documentation synthesizer. Write a comprehensive, highly factual wiki article for the topic: "${topicTitle}".
          
You MUST construct the content ONLY using the source evidence snippets provided below. Do not make up facts.

Source Evidence Snippets:
${chunkContents}

Structure constraints for the article:
1. Do NOT include generic sections like "Overview", "Subtopics", "Visual References", "Related Pages", or "Sources/References" in your generated markdown. The UI layers these sections automatically.
2. Instead, write custom, technical, topic-specific markdown headings (using ### and ####) that flow logically based on the concepts found in the source snippets.
3. Write high-density paragraphs and bullet points detailing the mechanics, architecture, or key ideas. Do NOT include preambles, introductions, or summary concluding remarks that restate the text. Focus entirely on logical technical descriptions.

Return your response in this exact JSON schema:
{
  "summary": "1-sentence summary of the page.",
  "body": "Your full generated markdown body content goes here."
}
`;

  // 5. Call LLM Page Generation
  console.log("\n[Step 4] Synthesizing page content via DeepSeek...");
  const generationStart = Date.now();
  try {
    const generatedContent = await callDeepSeek(pagePrompt);
    const elapsed = Date.now() - generationStart;
    
    console.log(`\n=============================================`);
    console.log(`=== PAGE SYNTHESIS COMPLETED IN ${elapsed}ms ===`);
    console.log(`=============================================\n`);
    
    console.log(`[Summary]: ${generatedContent.summary}`);
    console.log(`\n[Markdown Body]:\n`);
    console.log(generatedContent.body);
    console.log(`\n=============================================`);
  } catch (err) {
    console.error("Page synthesis failed:", err);
    process.exit(1);
  }
}

runPageGenerationTest();
