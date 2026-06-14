"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"

interface PricingButtonProps {
  plan: "FREE" | "PRO"
  isLoggedIn: boolean
}

export default function PricingButton({ plan, isLoggedIn }: PricingButtonProps) {
  const handleUpgrade = () => {
    if (!isLoggedIn) {
      window.location.href = "/signin?callbackUrl=/pricing"
      return
    }

    // Direct user to email support for upgrades since Stripe is removed
    window.location.href = "mailto:support@instant.wiki?subject=Pro%20Upgrade%20Request&body=Hi%2C%20I%20would%20like%20to%20upgrade%20my%20account%20to%20the%20Pro%20plan."
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
      className="w-full py-3 bg-[#6b38d4] hover:bg-[#8455ef] text-white rounded-lg text-sm font-bold tracking-wide transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
    >
      <Sparkles className="h-4 w-4" /> Contact to Upgrade
    </button>
  )
}
