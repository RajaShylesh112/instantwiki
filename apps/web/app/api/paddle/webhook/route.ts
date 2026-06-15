import { NextResponse } from "next/server"
import { Environment, Paddle } from "@paddle/paddle-node-sdk"
import { createClient } from "@supabase/supabase-js"

// Initialize Paddle Node SDK
const paddle = new Paddle(process.env.PADDLE_API_KEY || "dummy", {
  environment: Environment.production,
})

// Initialize Supabase admin client to bypass RLS for webhook updates
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature") || ""
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET || ""

  try {
    const rawRequestBody = await req.text()

    if (!secretKey) {
      console.warn("No PADDLE_WEBHOOK_SECRET found, processing unverified for testing.")
      // DO NOT DO THIS IN PRODUCTION WITHOUT A SECRET
    }

    // Verify the webhook signature
    let eventData
    if (secretKey) {
      eventData = paddle.webhooks.unmarshal(rawRequestBody, secretKey, signature)
    } else {
      eventData = JSON.parse(rawRequestBody)
    }

    // Handle the event
    if (eventData && eventData.eventType === "transaction.completed") {
      const transaction = eventData.data
      // In Paddle v2, customData is an object
      const customData = transaction.customData as { userId?: string } | null

      if (customData && customData.userId) {
        // Upgrade the user to PRO in Supabase
        const { error } = await supabase
          .from("users")
          .update({ plan: "PRO" })
          .eq("id", customData.userId)

        if (error) {
          console.error("Failed to update user plan in Supabase:", error)
          return NextResponse.json({ error: "Failed to update DB" }, { status: 500 })
        }

        console.log(`Successfully upgraded user ${customData.userId} to PRO!`)
      } else {
        console.warn("Transaction completed, but no customData.userId was provided.")
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing failed:", error)
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 })
  }
}
