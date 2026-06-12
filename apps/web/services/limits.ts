import { supabase } from "@/lib/supabase";



export interface UserUsage {
  plan: "FREE" | "PRO"
  workspacesCount: number
  workspacesLimit: number
  pagesCount: number
  pagesLimit: number
  docsCount: number
  docsLimit: number
  aiCreditsUsed: number
  aiCreditsLimit: number
  storageBytesUsed: number
  storageLimit: number
  
  // Sophisticated SaaS metrics
  chunksCount: number
  imagesCount: number
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  // Fetch user plan
  const { data: user } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .maybeSingle()
  
  const plan = (user?.plan || "FREE") as "FREE" | "PRO"
  const isFree = plan === "FREE"

  // Fetch AI credits used
  let aiCreditsUsed = 0
  try {
    const { data: stats } = await supabase
      .from("usage_stats")
      .select("ai_credits_used")
      .eq("user_id", userId)
      .maybeSingle()
    
    if (stats) {
      aiCreditsUsed = stats.ai_credits_used || 0
    }
  } catch (err) {
    console.warn("usage_stats table might not exist yet, defaulting credits to 0:", err)
  }

  // Fetch workspaces count
  const { count: workspacesCount } = await supabase
    .from("wikis")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)

  // Fetch all user's wikis ids to count pages, docs, chunks and images
  const { data: userWikis } = await supabase
    .from("wikis")
    .select("id")
    .eq("owner_id", userId)
  
  const wikiIds = userWikis?.map(w => w.id) || []
  
  let pagesCount = 0
  let docsCount = 0
  let chunksCount = 0
  let imagesCount = 0
  let storageBytesUsed = 0

  if (wikiIds.length > 0) {
    const { count: pCount } = await supabase
      .from("wiki_pages")
      .select("id", { count: "exact", head: true })
      .in("wiki_id", wikiIds)
    pagesCount = pCount || 0

    const { count: dCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .in("wiki_id", wikiIds)
    docsCount = dCount || 0

    // Count chunks count
    try {
      // Find all document ids
      const { data: docs } = await supabase
        .from("documents")
        .select("id, file_size")
        .in("wiki_id", wikiIds)
      
      const docIds = docs?.map(d => d.id) || []
      
      // Calculate storage bytes
      storageBytesUsed = docs?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0

      if (docIds.length > 0) {
        const { count: cCount } = await supabase
          .from("document_chunks")
          .select("id", { count: "exact", head: true })
          .in("document_id", docIds)
        chunksCount = cCount || 0

        const { count: imgCount } = await supabase
          .from("document_images")
          .select("id", { count: "exact", head: true })
          .in("document_id", docIds)
        imagesCount = imgCount || 0
      }
    } catch (err) {
      console.warn("Error calculating chunk/image counts or file_size:", err)
    }
  }

  return {
    plan,
    workspacesCount: workspacesCount || 0,
    workspacesLimit: isFree ? 1 : Infinity,
    pagesCount,
    pagesLimit: isFree ? 25 : Infinity,
    docsCount,
    docsLimit: isFree ? 10 : Infinity,
    aiCreditsUsed,
    aiCreditsLimit: isFree ? 5 : Infinity,
    storageBytesUsed,
    storageLimit: isFree ? 50 * 1024 * 1024 : 2 * 1024 * 1024 * 1024, // 50MB vs 2GB
    chunksCount,
    imagesCount
  }
}

export async function canCreateWiki(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const usage = await getUserUsage(userId)
  if (usage.workspacesCount >= usage.workspacesLimit) {
    return { allowed: false, error: "You have reached the workspace limit for the Free tier (1 workspace). Please upgrade your plan." }
  }
  return { allowed: true }
}

export async function canUploadDocument(userId: string, fileSize: number): Promise<{ allowed: boolean; error?: string }> {
  const usage = await getUserUsage(userId)
  
  // Single file upload size limit: 50MB for BOTH plans
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  if (fileSize > MAX_FILE_SIZE) {
    return { allowed: false, error: "File size exceeds the maximum limit of 50MB." }
  }

  if (usage.plan === "FREE") {
    // Check document count limit (10 documents)
    if (usage.docsCount >= usage.docsLimit) {
      return { allowed: false, error: "You have reached the document limit for the Free tier (10 documents)." }
    }
    // Check cumulative storage limit (50MB)
    if (usage.storageBytesUsed + fileSize > usage.storageLimit) {
      return { allowed: false, error: "You have reached the cumulative storage limit for the Free tier (50MB)." }
    }
  } else {
    // PRO plan cumulative storage limit (2GB)
    if (usage.storageBytesUsed + fileSize > usage.storageLimit) {
      return { allowed: false, error: "You have reached the cumulative storage limit for the Pro tier (2GB)." }
    }
  }

  return { allowed: true }
}

export async function canGenerateNames(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const usage = await getUserUsage(userId)
  if (usage.plan === "FREE") {
    const creditsRemaining = Math.max(0, usage.aiCreditsLimit - usage.aiCreditsUsed)
    if (creditsRemaining < 1) {
      return { allowed: false, error: "Insufficient AI credits. Generating wiki names requires 1 AI credit." }
    }
  }
  return { allowed: true }
}

export async function canGeneratePages(userId: string, currentWikiId?: string): Promise<{ allowed: boolean; error?: string }> {
  const usage = await getUserUsage(userId)
  
  if (usage.plan === "FREE") {
    // Check page count from OTHER wikis (as the current wiki's pages will be deleted during synthesis)
    let otherPagesCount = 0
    if (currentWikiId) {
      const { data: otherWikis } = await supabase
        .from("wikis")
        .select("id")
        .eq("owner_id", userId)
        .neq("id", currentWikiId)
      
      const otherWikiIds = otherWikis?.map(w => w.id) || []
      if (otherWikiIds.length > 0) {
        const { count } = await supabase
          .from("wiki_pages")
          .select("id", { count: "exact", head: true })
          .in("wiki_id", otherWikiIds)
        otherPagesCount = count || 0
      }
    } else {
      otherPagesCount = usage.pagesCount
    }

    if (otherPagesCount >= 25) {
      return { allowed: false, error: "You have reached the limit of 25 pages for the Free tier. Please upgrade to Pro to generate more pages." }
    }

    // Check if they have at least 2 AI credits remaining (meaning aiCreditsLimit - aiCreditsUsed >= 2)
    const creditsRemaining = Math.max(0, usage.aiCreditsLimit - usage.aiCreditsUsed)
    if (creditsRemaining < 2) {
      return { allowed: false, error: `Insufficient AI credits. Page generation requires 2 AI credits, but you only have ${creditsRemaining} remaining.` }
    }
  }

  return { allowed: true }
}

export async function incrementAiCredits(userId: string, amount: number = 1): Promise<void> {
  try {
    const { data: stats } = await supabase
      .from("usage_stats")
      .select("ai_credits_used")
      .eq("user_id", userId)
      .maybeSingle()

    const current = stats?.ai_credits_used || 0
    
    await supabase
      .from("usage_stats")
      .upsert({ user_id: userId, ai_credits_used: current + amount })
  } catch (err) {
    console.error("Error incrementing AI credits:", err)
  }
}
