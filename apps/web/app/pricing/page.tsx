import { supabase } from "@/lib/supabase";
import { auth } from "auth"
import Header from "@/components/header"
import PricingButton from "./pricing-button"
import { Check, X } from "lucide-react"



export const dynamic = "force-dynamic"

export default async function PricingPage() {
  const session = await auth()
  let plan: "FREE" | "PRO" = "FREE"

  if (session?.user?.email) {
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("plan")
        .eq("email", session.user.email)
        .maybeSingle()
      if (dbUser) {
        plan = dbUser.plan as "FREE" | "PRO"
      }
    } catch (e) {
      console.error("Error loading user plan on pricing page:", e)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100">
      <Header />
      
      <main className="flex-1 py-16 max-w-5xl mx-auto px-6 w-full space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-block px-4 py-1 bg-[#6b38d4]/10 dark:bg-purple-950/35 text-[#6b38d4] dark:text-purple-400 rounded-full text-xs font-bold font-mono tracking-wider">
            TRANSPARENT PRICING
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight leading-tight text-[#1a1c1b] dark:text-white">
            Choose your knowledge depth
          </h1>
          <p className="max-w-md mx-auto text-slate-500 dark:text-zinc-400 text-sm font-serif">
            Scale your document partitions, page extraction outputs, and AI credits with ease.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* FREE Tier Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-mono">
                  Base Plan
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100">
                  Free Tier
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold tracking-tight text-[#1a1c1b] dark:text-white">$0</span>
                  <span className="text-xs text-slate-400 font-mono">/ month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 pt-1">
                  Perfect for small reading clubs, research projects, or evaluation.
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-mono text-left">
                  Included Limits
                </h4>
                <ul className="space-y-3 text-xs leading-normal">
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">1 Workspace</strong> (Wiki partition)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">25 Wiki Pages</strong> max capacity</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">10 Documents</strong> upload quota</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">5 AI Generation Credits</strong> (Total limit)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">50 MB Storage</strong> cap (File uploads)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left text-slate-400 dark:text-zinc-650">
                    <X className="h-4 w-4 text-red-400 dark:text-red-900/30 shrink-0 mt-0.5" />
                    <span>Stripe Billing Portal Management</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-6">
              <button
                disabled
                className="w-full py-3 bg-slate-100 dark:bg-zinc-800 text-slate-450 dark:text-zinc-500 rounded-lg text-sm font-bold tracking-wide cursor-not-allowed border border-transparent"
              >
                Default Plan
              </button>
            </div>
          </div>

          {/* PRO Tier Card */}
          <div className="rounded-2xl border-2 border-[#6b38d4] bg-white dark:bg-zinc-900 p-8 shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* Pop tag */}
            <div className="absolute top-0 right-0 bg-[#6b38d4] text-white text-[9px] font-bold tracking-widest uppercase py-1 px-4 rounded-bl-lg font-mono">
              RECOMMENDED
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6b38d4] dark:text-purple-400 font-mono">
                  Scale Plan
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100">
                  Pro Plan
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold tracking-tight text-[#1a1c1b] dark:text-white">$5</span>
                  <span className="text-xs text-slate-400 font-mono">/ month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 pt-1">
                  For creators, researchers, and professional teams mapping vast libraries.
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6b38d4] dark:text-purple-400 font-mono text-left">
                  Included Limits
                </h4>
                <ul className="space-y-3 text-xs leading-normal">
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">Unlimited Workspaces</strong> (Wikis)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">Unlimited Wiki Pages</strong> generated</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">Unlimited Documents</strong> upload quota</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">Unlimited AI Generations</strong> (No credit caps)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-700 dark:text-zinc-300">2 GB Storage</strong> cap (File uploads)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-left">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Stripe Billing Portal Management (Cancel anytime)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-6">
              <PricingButton plan={plan} isLoggedIn={!!session} />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
