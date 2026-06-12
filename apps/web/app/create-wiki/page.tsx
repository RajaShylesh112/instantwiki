import { supabase } from "@/lib/supabase";
import { auth } from "auth"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import CreateWikiForm from "./create-wiki-form"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { getUserUsage } from "@/services/limits"



export default async function CreateWikiPage() {
  // 1. Session authorization guard
  const session = await auth()
  if (!session?.user) {
    redirect("/signin?callbackUrl=/create-wiki")
  }

  const username = session.user.username || "sandbox"

  let isWorkspaceLimitReached = false
  let isAiLimitReached = false

  if (session.user.email) {
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle()
        
      if (dbUser) {
        const usage = await getUserUsage(dbUser.id)
        isWorkspaceLimitReached = usage.workspacesCount >= usage.workspacesLimit
        isAiLimitReached = usage.aiCreditsUsed >= usage.aiCreditsLimit
      }
    } catch (e) {
      console.error("Error fetching usage limits for create-wiki page:", e)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
      {/* Navigation Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 py-10 max-w-6xl mx-auto px-6 w-full space-y-6">
        
        {/* Breadcrumbs / Header Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Link href={`/u/${username}`} className="hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors">
              @{username}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-655 dark:text-zinc-300 font-semibold">create-wiki</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Wiki Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            Define a new index partition for structured document mapping
          </p>
        </div>

        {/* Wiki Creation Grid Form */}
        <CreateWikiForm 
          username={username} 
          isWorkspaceLimitReached={isWorkspaceLimitReached} 
          isAiLimitReached={isAiLimitReached} 
        />

      </main>
    </div>
  )
}
