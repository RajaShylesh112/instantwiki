"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface SignInFormProps {
  callbackUrl?: string
}

export default function SignInForm({ callbackUrl }: SignInFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true)
    }
  }, [searchParams])

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setRegistered(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const usernameOrEmail = formData.get("usernameOrEmail") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        usernameOrEmail,
        password,
        redirect: false,
        callbackUrl: callbackUrl ?? "/",
      })

      if (result?.error) {
        setError("Invalid username/email or password.")
      } else if (result?.url) {
        router.push(result.url)
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setRegistered(false)
    await signIn("google", { callbackUrl: callbackUrl ?? "/" })
  }

  return (
    <div className="space-y-6">
      {registered && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-xs text-emerald-800">
          Account created successfully! Please sign in below.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Google Sign-in FIRST (as in layout spec) */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        variant="outline"
        className="relative flex w-full items-center justify-center gap-2.5 border-slate-200 bg-white py-5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Separator */}
      <div className="relative flex items-center justify-center py-1.5">
        <div className="w-full border-t border-slate-100" />
        <span className="absolute bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
          or use credentials
        </span>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Username or Email
          </label>
           <Input
            name="usernameOrEmail"
            type="text"
            required
            disabled={loading}
            placeholder="e.g. raja"
            className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#6b38d4] focus:ring-[#6b38d4]/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Password
          </label>
          <Input
            name="password"
            type="password"
            required
            disabled={loading}
            placeholder="••••••••"
            className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#6b38d4] focus:ring-[#6b38d4]/50"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6b38d4] text-white py-5 font-semibold text-xs transition-colors hover:bg-[#8455ef] shadow-sm"
        >
          {loading ? "Signing in..." : "Sign In with Password"}
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#6b38d4] hover:text-[#8455ef] hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  )
}
