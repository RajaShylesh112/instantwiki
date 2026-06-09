"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { registerUser } from "./actions"

export default function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await registerUser(formData)
      if (result.success) {
        router.push("/signin?registered=true")
      } else {
        setError(result.error ?? "Failed to create account.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
      <div className="flex flex-col items-center space-y-3 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Create an Account
        </h1>
        <p className="text-sm text-slate-500 font-medium max-w-xs">
          Join InstantWiki to start building your workspace.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-800 animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Username
          </label>
          <Input
            name="username"
            type="text"
            required
            disabled={loading}
            placeholder="e.g. alice_dev"
            className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#6b38d4] focus:ring-[#6b38d4]/50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Email Address
          </label>
          <Input
            name="email"
            type="email"
            required
            disabled={loading}
            placeholder="you@example.com"
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
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-[#6b38d4] hover:text-[#8455ef] hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}
