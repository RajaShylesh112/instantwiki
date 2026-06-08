import SignupForm from "./signup-form"
import Link from "next/link"
import { auth } from "auth"
import { redirect } from "next/navigation"

export default async function SignupPage() {
  const session = await auth()
  if (session?.user?.username) {
    redirect(`/u/${session.user.username}`)
  }

  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center bg-slate-50/30 px-4 py-12">
      <SignupForm />

      <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4 mt-6 w-full max-w-md">
        By continuing, you agree to our{" "}
        <Link href="/policy" className="underline hover:text-slate-600">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/policy" className="underline hover:text-slate-600">
          Privacy Policy
        </Link>.
      </div>
    </div>
  )
}
