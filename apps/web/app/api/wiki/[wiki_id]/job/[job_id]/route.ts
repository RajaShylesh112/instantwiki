import { NextRequest } from "next/server"
import { auth } from "auth"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string; job_id: string }> }
) {
  try {
    const { wiki_id, job_id } = await params

    // 1. Session Auth Guard
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // 2. Fetch the latest job for this wiki
    const job = await WikiGeneratorRepository.getLatestJobByWikiId(wiki_id)
    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 })
    }

    return Response.json({ job })
  } catch (err: any) {
    console.error("Error fetching job status:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}
