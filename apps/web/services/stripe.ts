import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY environment variable is not set.")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key")
