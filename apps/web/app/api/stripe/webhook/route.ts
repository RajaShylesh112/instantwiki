import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/services/stripe"
import Stripe from "stripe"



export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing stripe-signature or webhook secret.")
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId) {
          console.warn("checkout.session.completed missing userId metadata.")
          break
        }

        // Update database: set plan = PRO, customer id, and subscription id
        const { error } = await supabase
          .from("users")
          .update({
            plan: "PRO",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId
          })
          .eq("id", userId)

        if (error) {
          throw error
        }
        console.log(`User ${userId} successfully upgraded to PRO.`)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status

        // Determine plan based on subscription status (active, trialing)
        const plan = (status === "active" || status === "trialing") ? "PRO" : "FREE"

        const { error } = await supabase
          .from("users")
          .update({
            plan,
            stripe_subscription_id: subscription.id
          })
          .eq("stripe_customer_id", customerId)

        if (error) {
          throw error
        }
        console.log(`Subscription updated for customer ${customerId}. Plan synced to ${plan}.`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade plan to FREE
        const { error } = await supabase
          .from("users")
          .update({
            plan: "FREE",
            stripe_subscription_id: null
          })
          .eq("stripe_customer_id", customerId)

        if (error) {
          throw error
        }
        console.log(`Subscription deleted for customer ${customerId}. Plan downgraded to FREE.`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook processing error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
