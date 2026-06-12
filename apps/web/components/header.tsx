import { MainNav } from "./main-nav"
import UserButton from "./user-button"
import { auth } from "auth"
import ThemeToggle from "./layout/ThemeToggle"

export default async function Header() {
  const session = await auth()
  const username = session?.user?.username || null

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-zinc-850 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md flex justify-center">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <MainNav username={username} />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
