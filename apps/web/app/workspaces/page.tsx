import { auth } from "auth"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository, Wiki } from "@/lib/repositories/wiki"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Globe, Lock, EyeOff, Plus, BookOpen, Briefcase } from "lucide-react"
import Header from "@/components/header"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

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

  // Fallback to mock profile if not found or database tables are missing
  if (isMocked || !dbUser) {
    dbUser = {
      id: "mock-user-id",
      username: username.toLowerCase(),
      email: email || `${username.toLowerCase()}@instant.wiki`,
      image: null,
    }
    isMocked = true
  }

  // 3. Fetch wikis belonging to this user
  let wikis: Wiki[] = []
  
  if (!isMocked) {
    try {
      wikis = await WikiRepository.fetchUserWikis(dbUser.id)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") {
        isMocked = true
      }
    }
  }

  // Setup sandbox mock wikis list
  if (isMocked && wikis.length === 0) {
    wikis = []
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100">
      <Header />
      
      <main className="flex-1 py-10 max-w-5xl mx-auto px-6 font-sans w-full space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1 text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-[#6b38d4] dark:text-purple-400" /> Workspaces
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Manage your document pipelines and published wikis
            </p>
          </div>
          
          <Link href="/create-wiki">
            <Button className="bg-[#6b38d4] hover:bg-[#8455ef] text-white text-xs font-semibold h-9 px-4 flex items-center gap-1.5 rounded-lg shadow-sm">
              <Plus className="h-4 w-4" /> Create Workspace
            </Button>
          </Link>
        </div>

        {/* Workspaces List Grid */}
        <div className="grid gap-4">
          {wikis.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-250 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-450 dark:text-zinc-400 font-mono space-y-3">
              <p>No active workspaces found.</p>
              <Link href="/create-wiki" className="text-[#6b38d4] dark:text-purple-400 hover:underline font-bold inline-block">
                Create your first workspace now &rarr;
              </Link>
            </div>
          ) : (
            wikis.map((wiki) => (
              <div
                key={wiki.id}
                className="group p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-[#6b38d4]/30 dark:hover:border-purple-500/30 hover:shadow-md transition-all flex flex-col justify-between gap-4 shadow-2xs animate-fade-in"
              >
                <div className="space-y-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/u/${dbUser.username}/${wiki.slug}`}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors"
                    >
                      {wiki.title}
                    </Link>
                    
                    {/* Visibility badge */}
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded px-2 py-0.5">
                      {wiki.visibility === "PUBLIC" && <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
                      {wiki.visibility === "UNLISTED" && <EyeOff className="h-3 w-3 text-slate-400" />}
                      {wiki.visibility === "PRIVATE" && <Lock className="h-3 w-3 text-red-500 dark:text-red-400" />}
                      <span className="capitalize">{wiki.visibility.toLowerCase()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-serif line-clamp-2">
                    {wiki.description || "No description provided for this wiki."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-[11px] font-mono text-slate-450 dark:text-zinc-550 mt-1.5">
                  <div className="flex gap-3">
                    <span>
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{wiki.page_count}</span> Pages
                    </span>
                    <span>•</span>
                    <span>
                      Status: <span className="text-emerald-600 dark:text-emerald-450 font-bold uppercase">{wiki.status}</span>
                    </span>
                  </div>

                  <Link
                    href={`/u/${dbUser.username}/${wiki.slug}`}
                    className="text-[#6b38d4] dark:text-purple-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                  >
                    Enter Workspace <BookOpen className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
