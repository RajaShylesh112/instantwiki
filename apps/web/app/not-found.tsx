"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { HelpCircle, ArrowLeft, Home, Compass, FileText } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100 p-6 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Glowing Floating Node Graphics (Visual theme: Disconnected Knowledge Network) */}
      <div className="relative mb-8 flex items-center justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" className="animate-[spin_40s_linear_infinite] opacity-60 dark:opacity-40">
          <circle cx="110" cy="110" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="text-slate-300 dark:text-zinc-800" />
          <circle cx="110" cy="110" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" className="text-slate-200 dark:text-zinc-900" />
          <line x1="110" y1="10" x2="110" y2="210" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="text-slate-200 dark:text-zinc-900" />
          <line x1="10" y1="110" x2="210" y2="110" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="text-slate-200 dark:text-zinc-900" />
        </svg>

        {/* Nodes */}
        <div className="absolute top-10 left-12 w-3 h-3 rounded-full bg-slate-300 dark:bg-zinc-800 animate-pulse" />
        <div className="absolute bottom-12 right-12 w-4 h-4 rounded-full bg-[#6b38d4]/30 dark:bg-purple-900/30 border border-[#6b38d4]/40" />
        <div className="absolute top-1/2 left-4 w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600 animate-ping" />
        <div className="absolute top-12 right-16 w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-600" />

        {/* Central Disconnected Node */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-amber-500 rounded-full blur-md opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative h-20 w-20 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 shadow-md flex items-center justify-center">
              <HelpCircle className="h-10 w-10 text-red-500 dark:text-red-400 animate-[bounce_3s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="max-w-md text-center space-y-4 relative z-10">
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#6b38d4] to-red-500 bg-clip-text text-transparent leading-none">
            404
          </h1>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Knowledge Node Missing
          </h2>
        </div>
        
        <p className="text-[#494454] dark:text-zinc-400 text-sm leading-relaxed font-serif max-w-sm mx-auto">
          The wiki page, workspace partition, or document file you are trying to reach doesn't exist or is currently private.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/20 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-[#6b38d4] dark:hover:text-purple-400 transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go Back
          </button>
          
          <Link href="/workspaces">
            <button className="w-full sm:w-auto px-6 py-2.5 bg-[#6b38d4] text-white hover:brightness-110 shadow-xs transition-all font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
              <Home className="h-3.5 w-3.5" />
              Workspaces Dashboard
            </button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-slate-100 dark:border-zinc-900 flex justify-center gap-6 text-[10px] font-mono text-slate-400 dark:text-zinc-550">
          <Link href="/" className="hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors flex items-center gap-1">
            <Compass className="h-3 w-3" /> Home Page
          </Link>
          <span className="select-none text-slate-200 dark:text-zinc-850">|</span>
          <Link href="/pricing" className="hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors flex items-center gap-1">
            <FileText className="h-3 w-3" /> Pro Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
