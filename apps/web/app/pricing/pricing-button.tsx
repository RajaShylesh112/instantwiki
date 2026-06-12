"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

interface PricingButtonProps {
  plan: "FREE" | "PRO"
  isLoggedIn: boolean
}

export default function PricingButton({ plan, isLoggedIn }: PricingButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      window.location.href = "/signin?callbackUrl=/pricing"
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Failed to initiate Stripe checkout.")
      }
    } catch (err) {
      console.error(err)
      alert("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  if (plan === "PRO") {
    return (
      <button
        disabled
        className="w-full py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg text-sm font-bold tracking-wide cursor-not-allowed border border-transparent shadow-xs"
      >
        Active Pro Subscription
      </button>
    )
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-3 bg-[#6b38d4] hover:bg-[#8455ef] text-white rounded-lg text-sm font-bold tracking-wide transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Upgrading...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" /> Upgrade to Pro
        </>
      )}
    </button>
  )
}
