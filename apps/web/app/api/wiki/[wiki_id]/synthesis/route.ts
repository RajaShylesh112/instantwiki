import { supabase } from "@/lib/supabase"
import { NextRequest } from "next/server"
import { auth } from "auth"
import { DocumentRepository } from "@/lib/repositories/document"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { canGeneratePages } from "@/services/limits"
import { runIngestionPipeline } from "@/services/wiki-synthesis/pipeline"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string }> }
) {
  try {
    const { wiki_id } = await params
    
    // 1. Session Auth Guard
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // Resolve database user ID
    let userId = session.user.id
    if (!userId && session.user.email) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle()
      if (dbUser) {
        userId = dbUser.id
      }
    }

    if (!userId) {
      return Response.json({ error: "User not found in database." }, { status: 404 })
    }

    // Enforce limits
    const limitCheck = await canGeneratePages(userId, wiki_id)
    if (!limitCheck.allowed) {
      return Response.json({ error: limitCheck.error }, { status: 403 })
    }

    // 2. Fetch all documents for this wiki
    const documents = await DocumentRepository.fetchWikiDocuments(wiki_id)
    if (documents.length === 0) {
      return Response.json({ error: "No documents uploaded to synthesize pages from." }, { status: 400 })
    }

    // 3. Check if there's already an active processing job
    const latestJob = await WikiGeneratorRepository.getLatestJobByWikiId(wiki_id)
    if (latestJob && (latestJob.status === "PENDING" || latestJob.status === "PROCESSING")) {
      const startedAt = new Date(latestJob.started_at).getTime()
      const now = Date.now()
      const minutesElapsed = (now - startedAt) / (1000 * 60)
      
      if (minutesElapsed > 5) {
        console.warn(`Job ${latestJob.id} is stale (${minutesElapsed.toFixed(1)} mins old). Marking as FAILED.`)
        try {
          await WikiGeneratorRepository.updateJobStep(latestJob.id, "FINISHED", "FAILED", "Job timed out or server restarted.")
        } catch (dbErr) {
          console.error("Failed to mark stale job as FAILED:", dbErr)
        }
      } else {
        return Response.json({ jobId: latestJob.id, status: latestJob.status })
      }
    }

    const body = await request.json().catch(() => ({}))
    const isShortcut = !!body.shortcut

    // 4. Create new job entry
    const job = await WikiGeneratorRepository.createJob(wiki_id, "EXTRACTION")

    // 5. Run Ingestion Pipeline in the background
    runIngestionPipeline(job.id, wiki_id, documents, isShortcut).catch((err) => {
      console.error(`Ingestion pipeline background failure for job ${job.id}:`, err)
      WikiGeneratorRepository.updateJobStep(job.id, "FINISHED", "FAILED", err.message || String(err))
    })

    return Response.json({ jobId: job.id, status: "PROCESSING" })

  } catch (err: any) {
    console.error("Error starting synthesis:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}