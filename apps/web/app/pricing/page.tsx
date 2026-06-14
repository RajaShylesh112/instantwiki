import Header from "@/components/header";
import { Footer } from "@/components/ui/footer";
import { Check, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PricingButton from "./pricing-button";
import { auth } from "auth";

export const metadata = {
  title: "Pricing | instant.wiki",
  description: "Simple, transparent pricing for your documentation needs.",
};

export default async function PricingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-slate-900 dark:text-zinc-150 font-sans">
      <Header />

      <main className="flex-1 py-16 px-4 md:px-6 max-w-[1200px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-500 dark:text-zinc-400 font-serif">
            No hidden fees. Choose the perfect plan for your knowledge base and documentation needs.
          </p>
        </div>

        {/* 2-Column Grid with Bento Card Styles */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* HOBBY TIER */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-white dark:bg-zinc-900 flex flex-col shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 relative overflow-hidden group">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50 dark:opacity-20" />
            
            <div className="relative z-10 mb-6 space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#006b5e]" />
                Hobby
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Perfect for side projects and personal notes.</p>
            </div>
            
            <div className="relative z-10 mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 dark:text-white">$0</span>
              <span className="text-slate-500 dark:text-zinc-400 font-medium">/forever</span>
            </div>
            
            <ul className="relative z-10 space-y-4 mb-8 flex-1">
              {[
                "1 Workspace",
                "Up to 25 AI-generated pages",
                "Basic analytics",
                "Public workspaces only",
                "Community support",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-300">
                  <Check className="h-5 w-5 text-[#006b5e] dark:text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/create-wiki" className="block w-full mt-auto relative z-10">
              <Button variant="outline" className="w-full h-12 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
                Get Started for Free
              </Button>
            </Link>
          </div>

          {/* PRO TIER */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-white dark:bg-zinc-900 flex flex-col shadow-sm hover:shadow-xl hover:border-[#6b38d4]/50 dark:hover:border-purple-500/50 transition-all duration-300 relative group">
            <div className="absolute top-0 right-8 -translate-y-1/2 z-20">
              <span className="bg-[#6b38d4] text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full shadow-md">
                Most Popular
              </span>
            </div>
            
            {/* Background glow effect */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-[#6b38d4]/5 to-transparent dark:from-purple-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Background pattern */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50 dark:opacity-20" />
            
            <div className="relative z-10 mb-6 space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#6b38d4]" />
                Pro
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">For creators and small teams building serious docs.</p>
            </div>
            
            <div className="relative z-10 mb-8 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">$5</span>
              <span className="text-slate-500 dark:text-zinc-400 font-medium">/month</span>
            </div>
            
            <ul className="relative z-10 space-y-4 mb-8 flex-1">
              {[
                "Unlimited Workspaces",
                "Unlimited AI page generations",
                "Private and Unlisted workspaces",
                "Custom domains (Coming soon)",
                "Priority email support",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300">
                  <Check className="h-5 w-5 text-[#6b38d4] dark:text-purple-400 shrink-0" />
                  <span className="font-semibold leading-tight">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="w-full mt-auto relative z-10">
              <PricingButton plan="FREE" isLoggedIn={isLoggedIn} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
