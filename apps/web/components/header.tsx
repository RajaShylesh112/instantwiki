import { MainNav } from "./main-nav"
import UserButton from "./user-button"
import { auth } from "auth"

export default async function Header() {
  const session = await auth()
  const username = session?.user?.username || null

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md flex justify-center">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <MainNav username={username} />
        <UserButton />
      </div>
    </header>
  )
}
