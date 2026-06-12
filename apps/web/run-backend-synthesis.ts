import fs from "fs"
import path from "path"

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

const wikiId = "5987390a-b358-4873-83b6-f199b2e1c632"

async function run() {
  // Dynamically import dependencies after env variables are loaded
  const { createClient } = await import("@supabase/supabase-js")
  const { DocumentRepository } = await import("./lib/repositories/document")
  const { WikiGeneratorRepository } = await import("./lib/repositories/wiki-generator")
  const { runIngestionPipeline } = await import("./app/api/wiki/[wiki_id]/synthesis/route")

  console.log(`\n======================================================`)
  console.log(`=== RUNNING PROGRAMMATIC SYNTHESIS FOR: ${wikiId} ===`)
  console.log(`======================================================\n`)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  )

  // 1. Fetch wiki details
  const { data: wiki } = await supabase
    .from("wikis")
    .select("title")
    .eq("id", wikiId)
    .single()

  console.log(`Wiki Title: "${wiki?.title}"`)

  // 2. Fetch documents
  const documents = await DocumentRepository.fetchWikiDocuments(wikiId)
  console.log(`Found ${documents.length} documents associated with this wiki.`)
  if (documents.length === 0) {
    console.error("No documents to process. Exiting.")
    return
  }

  // 3. Mark existing active/stale jobs as FAILED to prevent duplicate execution errors
  const { data: activeJobs } = await supabase
    .from("processing_jobs")
    .select("id, status")
    .eq("wiki_id", wikiId)
    .in("status", ["PENDING", "PROCESSING"])

  if (activeJobs && activeJobs.length > 0) {
    console.log(`Found ${activeJobs.length} active/stale jobs. Marking them as FAILED...`)
    for (const job of activeJobs) {
      await WikiGeneratorRepository.updateJobStep(job.id, "FINISHED", "FAILED", "Stale job superseded by programmatic backend run.")
    }
  }

  // 4. Create new job entry
  console.log("Creating new processing job...")
  const job = await WikiGeneratorRepository.createJob(wikiId, "EXTRACTION")
  console.log(`Created Job ID: ${job.id}`)

  // 5. Run Ingestion Pipeline synchronously
  console.log("Triggering runIngestionPipeline (in-process)...")
  try {
    await runIngestionPipeline(job.id, wikiId, documents, false)
    console.log("\n[Success] Ingestion pipeline execution completed!")
  } catch (err: any) {
    console.error("\n[Error] Ingestion pipeline failed:", err)
    await WikiGeneratorRepository.updateJobStep(job.id, "FINISHED", "FAILED", err.message || String(err))
  }

  // 6. Verify final pages
  const { data: pages } = await supabase
    .from("wiki_pages")
    .select("title, slug, generation_status")
    .eq("wiki_id", wikiId)

  console.log(`\nFinal Pages for Wiki "${wiki?.title}":`)
  if (pages && pages.length > 0) {
    pages.forEach(p => {
      console.log(`  - Page: ${p.title} (${p.slug}) | Status: ${p.generation_status}`)
    })
  } else {
    console.log("  No pages generated in wiki_pages table.")
  }
}

run().catch(console.error)
