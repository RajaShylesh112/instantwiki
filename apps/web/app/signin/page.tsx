import SignInForm from "./signin-form"
import Link from "next/link"
import { auth } from "auth"
import { redirect } from "next/navigation"

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string
    error?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth()
  if (session?.user?.username) {
    redirect(`/u/${session.user.username}`)
  }

  const params = await searchParams
  const error = params.error
  const callbackUrl = params.callbackUrl

  const getErrorMessage = (err: string) => {
    switch (err.toLowerCase()) {
      case "oauthsignin":
        return "Error constructing the authorization URL. Please try again."
      case "oauthcallback":
        return "Failed to complete authentication. The provider might be misconfigured."
      case "oauthaccountnotlinked":
        return "To confirm your identity, sign in with the same account you used originally."
      case "sessionrequired":
        return "Please sign in to access this page."
      case "default":
      default:
        return "An error occurred during authentication. Please try again."
    }
  }

  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center bg-slate-50/30 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center space-y-3 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Instant Wiki
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            Turn documents into navigable knowledge bases.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-800">
            <span className="font-bold block">Sign in failed</span>
            <span>{getErrorMessage(error)}</span>
          </div>
        )}

        <SignInForm callbackUrl={callbackUrl} />

        <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
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

      {/* Recently Published Wikis list below sign in */}
      <div className="w-full max-w-md mt-10 space-y-3 text-center border-t border-slate-200/80 pt-8">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Recently Published Wikis
        </h4>
        <div className="flex flex-col items-center gap-2 text-xs">
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Machine Learning Atlas
          </Link>
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Startup Handbook
          </Link>
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Travel Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  )
}
