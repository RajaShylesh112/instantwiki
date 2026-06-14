import { supabase } from "@/lib/supabase"
import { auth } from "auth"
import { redirect } from "next/navigation"
import { WikiRepository, Wiki } from "@/lib/repositories/wiki"
import Link from "next/link"
import { Plus, Briefcase } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import WorkspacesClient from "./workspaces-client"

export default async function WorkspacesPage() {
  // 1. Session check
  const session = await auth()
  if (!session?.user) {
    redirect("/signin?callbackUrl=/workspaces")
  }

  const username = session.user.username || "sandbox"
  const email = session.user.email

  // 2. Fetch user profile from Supabase
  let dbUser: { id: string; email: string; username: string; image: string | null } | null = null
  let isMocked = false

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, image")
      .eq("email", email?.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      dbUser = data
    }
  } catch (err) {
    console.error("Database error fetching workspaces user profile:", err)
    isMocked = true
  }

  if (isMocked || !dbUser) {
    dbUser = {
      id: "mock-user-id",
      username: username.toLowerCase(),
      email: email || `${username.toLowerCase()}@instant.wiki`,
      image: null,
    }
    isMocked = true
  }

  // 3. Fetch wikis
  let wikis: Wiki[] = []
  if (!isMocked) {
    try {
      wikis = await WikiRepository.fetchUserWikis(dbUser.id)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") isMocked = true
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100">
      <Header />

      <main className="flex-1 py-10 max-w-5xl mx-auto px-6 font-sans w-full space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-[#6b38d4] dark:text-purple-400" />
              Workspaces
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              {wikis.length} workspace{wikis.length !== 1 ? "s" : ""} · Manage your document pipelines and published wikis
            </p>
          </div>

          <Link href="/create-wiki">
            <Button className="bg-[#6b38d4] hover:bg-[#8455ef] text-white text-xs font-semibold h-9 px-4 flex items-center gap-1.5 rounded-lg shadow-sm">
              <Plus className="h-4 w-4" /> Create Workspace
            </Button>
          </Link>
        </div>

        {/* Dynamic workspace list with delete */}
        <WorkspacesClient wikis={wikis} username={dbUser.username} />
      </main>
    </div>
  )
}
