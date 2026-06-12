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

    const { data: dbUser } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("email", session.user.email)
      .maybeSingle()

    if (!dbUser || !dbUser.stripe_customer_id) {
      return NextResponse.json({ error: "No active Stripe billing profile found. Please upgrade to Pro first." }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: `${appUrl}/u/${session.user.username || ""}`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error("Stripe portal error:", err)
    return NextResponse.json({ error: err.message || "Failed to create billing portal session." }, { status: 500 })
  }
}
