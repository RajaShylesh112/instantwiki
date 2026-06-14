import fs from "fs"
import path from "path"
import { performance } from "perf_hooks"

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

const wikiId = "89c36aa4-01ef-46e0-abd9-8faa8e99c819"

async function run() {
  const startTime = performance.now();
  
  // Dynamically import dependencies after env variables are loaded
  const { createClient } = await import("@supabase/supabase-js")
  const { DocumentRepository } = await import("./lib/repositories/document")
  const { WikiGeneratorRepository } = await import("./lib/repositories/wiki-generator")
  const { runIngestionPipeline } = await import("./services/wiki-synthesis/pipeline")
  const { EmbeddingService } = await import("./services/ai/embeddings")

  console.log(`\n======================================================`)
  console.log(`=== RUNNING PROGRAMMATIC SYNTHESIS FOR: ${wikiId} ===`)
  console.log(`======================================================\n`)

  // Log active settings & variables
  console.log(`[CONFIG] System Configuration:`)
  console.log(`  - SUPABASE_URL: ${process.env.SUPABASE_URL || "NOT SET"}`)
  console.log(`  - SUPABASE_KEY: ${process.env.SUPABASE_KEY ? `PRESENT (${process.env.SUPABASE_KEY.substring(0, 10)}...)` : "NOT SET"}`)
  console.log(`  - OPENAI_BASE_URL: ${process.env.OPENAI_BASE_URL || "NOT SET"}`)
  console.log(`  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "PRESENT" : "NOT SET"}`)
  console.log(`  - AWS_BEARER_TOKEN_BEDROCK: ${process.env.AWS_BEARER_TOKEN_BEDROCK ? "PRESENT" : "NOT SET"}`)
  console.log(`  - BEDROCK_AWS_REGION: ${process.env.BEDROCK_AWS_REGION || "NOT SET"}`)
  console.log(`  - Embedding Active Model: ${EmbeddingService.getActiveModelName()}`)
  console.log(`  - Embedding Dimension: ${EmbeddingService.getTargetDimension()}`)
  console.log(`------------------------------------------------------\n`)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  )

  // 1. Fetch wiki details
  console.log(`[WIKI] Fetching details for Wiki ID: ${wikiId}...`)
  const { data: wiki, error: wikiError } = await supabase
    .from("wikis")
    .select("title, description, slug")
    .eq("id", wikiId)
    .single()

  if (wikiError) {
    console.error(`[ERROR] Failed to fetch wiki details:`, wikiError)
    return
  }
  console.log(`[WIKI] Success:`)
  console.log(`  - Title: "${wiki?.title}"`)
  console.log(`  - Slug: "${wiki?.slug}"`)
  console.log(`  - Description: "${wiki?.description || "(none)"}"\n`)

  // 2. Fetch documents
  console.log(`[DOCUMENTS] Fetching documents for Wiki ID: ${wikiId}...`)
  const documents = await DocumentRepository.fetchWikiDocuments(wikiId)
  console.log(`[DOCUMENTS] Found ${documents.length} document(s) associated with this wiki:`)
  
  documents.forEach((doc, idx) => {
    console.log(`  [${idx + 1}] ID: ${doc.id}`)
    console.log(`      Filename: "${doc.filename}"`)
    console.log(`      Mime Type: ${doc.mime_type}`)
    console.log(`      Source Type: ${doc.source_type}`)
    console.log(`      File Size: ${doc.file_size ? `${doc.file_size} bytes` : "unknown"}`)
    console.log(`      Content Hash: ${doc.content_hash || "(none)"}`)
  })
  console.log()

  if (documents.length === 0) {
    console.error("[ERROR] No documents found to process. Exiting.")
    return
  }

  // 3. Mark existing active/stale jobs as FAILED to prevent duplicate execution errors
  console.log(`[JOBS] Checking for stale/active jobs for Wiki ID: ${wikiId}...`)
  const { data: activeJobs } = await supabase
    .from("processing_jobs")
    .select("id, status")
    .eq("wiki_id", wikiId)
    .in("status", ["PENDING", "PROCESSING"])

  if (activeJobs && activeJobs.length > 0) {
    console.log(`[JOBS] Found ${activeJobs.length} active/stale job(s). Marking them as FAILED...`)
    for (const job of activeJobs) {
      console.log(`  - Marking Job ${job.id} (Status: ${job.status}) as FAILED...`)
      await WikiGeneratorRepository.updateJobStep(job.id, "FINISHED", "FAILED", "Stale job superseded by programmatic backend run.")
    }
  } else {
    console.log(`[JOBS] No active/stale jobs found. Clean state.`)
  }
  console.log()

  // 4. Create new job entry
  console.log("[JOBS] Creating a new processing job entry...")
  const job = await WikiGeneratorRepository.createJob(wikiId, "EXTRACTION")
  console.log(`[JOBS] Created Job ID: ${job.id}\n`)

  // 5. Run Ingestion Pipeline synchronously
  console.log("[PIPELINE] Starting the ingestion pipeline in-process...")
  const pipelineStart = performance.now();
  try {
    await runIngestionPipeline(job.id, wikiId, documents, false)
    const pipelineDuration = ((performance.now() - pipelineStart) / 1000).toFixed(2);
    console.log(`\n[Success] Ingestion pipeline execution completed successfully in ${pipelineDuration}s!`)
  } catch (err: any) {
    const pipelineDuration = ((performance.now() - pipelineStart) / 1000).toFixed(2);
    console.error(`\n[Error] Ingestion pipeline failed after ${pipelineDuration}s:`, err)
    await WikiGeneratorRepository.updateJobStep(job.id, "FINISHED", "FAILED", err.message || String(err))
  }

  // 6. Verify final pages
  console.log(`\n[VERIFICATION] Fetching final generated pages from database...`)
  const { data: pages } = await supabase
    .from("wiki_pages")
    .select("id, title, slug, generation_status, body")
    .eq("wiki_id", wikiId)

  console.log(`\nGenerated Pages Summary for Wiki "${wiki?.title}":`)
  if (pages && pages.length > 0) {
    pages.forEach((p, idx) => {
      const charCount = p.body ? p.body.length : 0;
      console.log(`  [${idx + 1}] Title: "${p.title}"`)
      console.log(`      Slug: ${p.slug}`)
      console.log(`      Page ID: ${p.id}`)
      console.log(`      Status: ${p.generation_status}`)
      console.log(`      Size: ${charCount} characters (~${(charCount / 6).toFixed(0)} words)`)
    })
  } else {
    console.log("  No pages generated in wiki_pages table.")
  }

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`)
  console.log(`=== RUN COMPLETED IN ${totalDuration} SECONDS ===`)
  console.log(`======================================================\n`)
}

run().catch(console.error)
