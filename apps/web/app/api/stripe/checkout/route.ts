import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server"
import { auth } from "auth"
import { stripe } from "@/services/stripe"



export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Resolve db user
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, username, plan, stripe_customer_id")
      .eq("email", session.user.email)
      .maybeSingle()

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: "Stripe Price ID not configured." }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer: dbUser.stripe_customer_id || undefined,
      customer_email: dbUser.stripe_customer_id ? undefined : session.user.email,
      success_url: `${appUrl}/u/${dbUser.username}?payment_status=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: dbUser.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: err.message || "Failed to create checkout session." }, { status: 500 })
  }
}
