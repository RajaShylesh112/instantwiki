"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { initializePaddle, Paddle } from "@paddle/paddle-js"

interface PricingButtonProps {
  plan: "FREE" | "PRO"
  isLoggedIn?: boolean
  userId?: string
}

export default function PricingButton({ plan, isLoggedIn = false, userId }: PricingButtonProps) {
  const [paddle, setPaddle] = useState<Paddle | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initPaddle = async () => {
      try {
        const paddleInstance = await initializePaddle({
          environment: 'production',
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_token',
        })
        if (paddleInstance) {
          setPaddle(paddleInstance)
        }
      } catch (err) {
        console.error("Failed to initialize Paddle", err)
      } finally {
        setLoading(false)
      }
    }
    initPaddle()
  }, [])

  const handleUpgrade = () => {
    if (!isLoggedIn) {
      window.location.href = "/signin?callbackUrl=/pricing"
      return
    }

    if (paddle) {
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || 'pri_01hxyz1234567890abcdef'
      const checkoutData: any = {
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ]
      }

      if (userId) {
        checkoutData.customData = { userId }
      }

      paddle.Checkout.open(checkoutData)
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
      className="w-full h-12 bg-[#6b38d4] hover:bg-[#5a2eab] text-white font-bold rounded-xl text-sm transition-all shadow-md group-hover:shadow-lg group-hover:shadow-[#6b38d4]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Upgrade to Pro
    </button>
  )
}
