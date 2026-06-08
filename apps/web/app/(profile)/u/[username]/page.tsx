import { auth } from "auth"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository, Wiki } from "@/lib/repositories/wiki"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Globe, Lock, EyeOff, Plus, BookOpen, User, Folder } from "lucide-react"
import ProfileDetails from "./profile-details"
import Header from "@/components/header"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  // 1. Resolve user profile from Supabase
  let dbUser: { id: string; email: string; username: string; image: string | null } | null = null
  let isMocked = false

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, image")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      dbUser = data
    }
  } catch (err) {
    console.error("Database error fetching profile:", err)
    isMocked = true
  }

  // Fallback to mock profile if not found or database tables are missing
  if (isMocked || !dbUser) {
    dbUser = {
      id: "mock-user-id",
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@instant.wiki`,
      image: null,
    }
    isMocked = true
  }

  // 2. Fetch wikis belonging to this user
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
  if (isMocked || wikis.length === 0) {
    wikis = [
      {
        id: "mock-wiki-1",
        owner_id: dbUser.id,
        title: "Machine Learning Atlas",
        slug: "ml-atlas",
        description: "A comprehensive knowledge directory and structured handbook mapping concepts, algorithms, and references in Machine Learning.",
        visibility: "PUBLIC",
        status: "READY",
        page_limit: 25,
        page_count: 8,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  }

  // 3. Resolve session permission ownership
  const session = await auth()
  const isOwner = session?.user?.email === dbUser.email

  // If visitor, filter out PRIVATE wikis
  const visibleWikis = isOwner || isMocked
    ? wikis
    : wikis.filter((w) => w.visibility !== "PRIVATE")

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <div className="flex-1 py-10 max-w-6xl mx-auto px-6 font-sans w-full">
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* Left Column: Profile Card (Col-span 1) */}
          <div className="md:col-span-1">
            <ProfileDetails
              user={dbUser}
              isOwner={isOwner || isMocked}
              isMocked={isMocked}
            />
          </div>

          {/* Right Column: User Wikis list (Col-span 3) */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Folder className="h-5 w-5 text-slate-400" /> Published Wikis
              </h1>
              
              {(isOwner || isMocked) && (
                <Link href="/create-wiki">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-8 px-3 flex items-center gap-1.5 rounded-md shadow-xs">
                    <Plus className="h-4 w-4" /> Create Wiki
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-4">
              {visibleWikis.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-450 font-mono">
                  No wikis published yet.
                </div>
              ) : (
                visibleWikis.map((wiki) => (
                  <div
                    key={wiki.id}
                    className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/u/${dbUser.username}/${wiki.slug}`}
                          className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {wiki.title}
                        </Link>
                        
                        {/* Visibility badge */}
                        <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-550 border border-slate-200 bg-slate-50 rounded px-1.5 py-0.5">
                          {wiki.visibility === "PUBLIC" && <Globe className="h-3 w-3 text-blue-600" />}
                          {wiki.visibility === "UNLISTED" && <EyeOff className="h-3 w-3 text-slate-400" />}
                          {wiki.visibility === "PRIVATE" && <Lock className="h-3 w-3 text-red-500" />}
                          <span className="capitalize">{wiki.visibility.toLowerCase()}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-550 leading-relaxed font-serif line-clamp-2">
                        {wiki.description || "No description provided for this wiki."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-mono text-slate-450 mt-1.5">
                      <div className="flex gap-3">
                        <span>
                          <span className="font-bold text-slate-755">{wiki.page_count}</span> Pages
                        </span>
                        <span>•</span>
                        <span>
                          Status: <span className="text-emerald-600 font-bold uppercase">{wiki.status}</span>
                        </span>
                      </div>

                      <Link
                        href={`/u/${dbUser.username}/${wiki.slug}`}
                        className="text-indigo-650 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Enter Workspace <BookOpen className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
