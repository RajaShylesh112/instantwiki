const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Manually parse .env file
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

// Replicate fetchWithRetry from embeddings.ts
async function fetchWithRetry(url, options, maxRetries = 5, initialDelay = 1500) {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log(`[HTTP Request] Sending POST to ${url} (Attempt ${i + 1}/${maxRetries})...`);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const parsedRetryAfter = retryAfter ? parseInt(retryAfter) : null;
        
        console.warn(`[HTTP 429] Rate limit hit. retry-after header: ${retryAfter}`);
        
        if (parsedRetryAfter !== null && parsedRetryAfter > 10) {
          console.warn(`[Rate Limit Capped] Rate limit reset time (${parsedRetryAfter}s) exceeds 10s. Skipping retries to fall back immediately.`);
          break;
        }
        
        const waitTime = parsedRetryAfter ? parsedRetryAfter * 1000 : delay + Math.random() * 500;
        if (waitTime > 10000) {
          console.warn(`[Rate Limit Capped] Calculated wait time (${Math.round(waitTime)}ms) exceeds 10s. Skipping retries to fall back immediately.`);
          break;
        }
        
        console.warn(`[Rate Limit Wait] Waiting ${Math.round(waitTime)}ms before retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2;
        continue;
      }
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      if (i === maxRetries - 1) throw e;
      console.warn(`[HTTP Error] Fetch attempt failed: ${e.message || e}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  // If we broke out of loop due to skipped retries on 429, we throw/reject so the caller falls back
  throw new Error("API call failed due to rate limit/quota limits.");
}

// Replicate EmbeddingService.generateEmbedding
async function generateEmbedding(text) {
  const voyageKey = process.env.VOYAGE_AI_API_KEY || process.env.VOYAGE_API_KEY;
  const githubKey = process.env.GITHUB_AI_API_KEY || process.env.GITHUB_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Voyage AI first
  if (voyageKey && voyageKey.trim() !== "" && voyageKey !== "YOUR_VOYAGE_AI_API_KEY") {
    try {
      const response = await fetchWithRetry("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${voyageKey}`
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
      } else {
        console.warn(`[Provider Voyage AI] Failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Provider Voyage AI Exception] ${err.message || err}. Falling back to next provider.`);
    }
  }

  if (githubKey && githubKey.trim() !== "" && githubKey !== "YOUR_GITHUB_AI_API_KEY") {
    try {
      const response = await fetchWithRetry("https://models.inference.ai.azure.com/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${githubKey}`
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;
        if (embedding && Array.isArray(embedding)) {
          return { embedding, model: "github-text-embedding-3-small" };
        }
      } else {
        console.warn(`[Provider Github AI] Failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Provider Github AI Exception] ${err.message || err}. Falling back to next provider.`);
    }
  }

  if (openaiKey && openaiKey.trim() !== "" && openaiKey !== "YOUR_OPENAI_API_KEY") {
    try {
      const response = await fetchWithRetry("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;
        if (embedding && Array.isArray(embedding)) {
          return { embedding, model: "text-embedding-3-small" };
        }
      }
    } catch (err) {
      console.warn(`[Provider OpenAI Exception] ${err.message || err}. Falling back to mock generator.`);
    }
  }
  
  // Sandbox Mock Fallback
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

function chunkText(text, size = 2500, overlap = 300) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.substring(start, end));
    start += size - overlap;
  }
  return chunks;
}

// Spawn extractor script
function extractPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "lib", "python", "extractor.py");
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    
    // Pass dummy-dir as the simplified python script expects 3 args
    const args = [scriptPath, pdfPath, "dummy-dir"];
    console.log(`[Spawn Extractor] Command: ${pythonCmd} ${args.join(' ')}`);
    
    const child = spawn(pythonCmd, args);
    let stdoutData = "";
    let stderrData = "";
    
    child.stdout.on("data", (data) => { stdoutData += data.toString(); });
    child.stderr.on("data", (data) => { stderrData += data.toString(); });
    
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python extractor failed with code ${code}. Stderr: ${stderrData}`));
        return;
      }
      try {
        const firstBrace = stdoutData.indexOf("{");
        const lastBrace = stdoutData.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) {
          reject(new Error("No JSON in output. Raw: " + stdoutData));
          return;
        }
        const jsonStr = stdoutData.substring(firstBrace, lastBrace + 1);
        resolve(JSON.parse(jsonStr));
      } catch (err) {
        reject(new Error("Failed to parse JSON: " + err.message));
      }
    });
  });
}

async function runTestPipeline() {
  const samplePdf = "C:\\Users\\rsmgo\\Downloads\\264600a853.pdf";
  console.log(`\n======================================================`);
  console.log(`=== RUNNING BACKEND VERIFICATION FOR: ${samplePdf} ===`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(samplePdf)) {
    console.error(`Error: Sample PDF not found at ${samplePdf}`);
    process.exit(1);
  }

  // 1. Text Ingestion & Extraction (OCR fallback test)
  console.log("[Pipeline Step 1] Ingesting and extracting text...");
  const startTime = Date.now();
  let extracted;
  try {
    extracted = await extractPdf(samplePdf);
    console.log(`[Pipeline Step 1 Success] Extracted text for ${extracted.pages.length} pages.`);
    extracted.pages.forEach(p => {
      console.log(`  - Page ${p.page_number}: ${p.text.length} characters.`);
    });
    console.log(`  - Number of images returned: ${extracted.images ? extracted.images.length : 0}`);
  } catch (err) {
    console.error("[Pipeline Step 1 Failed]", err);
    process.exit(1);
  }

  // 2. Text Chunking
  console.log("\n[Pipeline Step 2] Segmenting extracted text into chunks...");
  const allChunks = [];
  extracted.pages.forEach(page => {
    const chunks = chunkText(page.text, 2500, 300);
    chunks.forEach((content, idx) => {
      allChunks.push({
        page_number: page.page_number,
        chunk_index: allChunks.length,
        content
      });
    });
  });
  console.log(`[Pipeline Step 2 Success] Generated a total of ${allChunks.length} chunks.`);

  // 3. Batch Embedding Generation with fallbacks & rate limit check
  console.log("\n[Pipeline Step 3] Generating vector embeddings for chunks...");
  const batchSize = 5; // Use small batch size for clean logs
  const results = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    console.log(`\n--- Processing Embeddings Batch ${i / batchSize + 1} (${batch.length} chunks) ---`);
    
    const batchStart = Date.now();
    const batchEmbeddings = await Promise.all(
      batch.map(async (chunk) => {
        const start = Date.now();
        console.log(`  [Chunk ${chunk.chunk_index}] Generating embedding (length: ${chunk.content.length} chars)...`);
        const res = await generateEmbedding(chunk.content);
        console.log(`  [Chunk ${chunk.chunk_index} Success] Model: ${res.model} | Time: ${Date.now() - start}ms`);
        return {
          chunk_index: chunk.chunk_index,
          model: res.model,
          dimension: res.embedding.length
        };
      })
    );
    results.push(...batchEmbeddings);
    console.log(`--- Batch ${i / batchSize + 1} completed in ${Date.now() - batchStart}ms ---`);
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n======================================================`);
  console.log(`=== PIPELINE VERIFICATION COMPLETED IN ${totalTime}ms ===`);
  console.log(`======================================================`);
  console.log(`Total Chunks: ${results.length}`);
  const modelCounts = {};
  results.forEach(r => {
    modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
  });
  console.log("Embeddings Generated By Model:");
  Object.keys(modelCounts).forEach(m => {
    console.log(`  - ${m}: ${modelCounts[m]} chunks`);
  });
  console.log(`======================================================\n`);
}

runTestPipeline();
