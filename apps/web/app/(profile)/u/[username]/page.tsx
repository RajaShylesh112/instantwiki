import { auth } from "auth"
import { createClient } from "@supabase/supabase-js"
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

  // 2. Resolve session permission ownership
  const session = await auth()
  const isOwner = session?.user?.email === dbUser.email

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#1A1C1B]">
      <Header />
      
      <main className="flex-1 py-12 max-w-md mx-auto px-6 w-full flex flex-col justify-start">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              User Profile
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Manage your personal identity credentials
            </p>
          </div>

          <ProfileDetails
            user={dbUser}
            isOwner={isOwner || isMocked}
            isMocked={isMocked}
          />
        </div>
      </main>
    </div>
  )
}
