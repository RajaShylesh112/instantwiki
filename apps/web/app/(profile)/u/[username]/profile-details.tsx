"use client"

import { useState } from "react"
import { Settings, User, X, Camera, ShieldAlert, Mail, BadgeCheck, AlertTriangle, ShieldCheck, Cpu, HardDrive, BarChart3, Database, FileText } from "lucide-react"
import ProfileEditor from "./profile-editor"
import { updatePlan } from "./actions"

interface ProfileDetailsProps {
  user: {
    id: string
    username: string
    image: string | null
    email: string
  }
  isOwner: boolean
  isMocked: boolean
  usage: {
    plan: "FREE" | "PRO"
    workspacesCount: number
    workspacesLimit: number
    pagesCount: number
    pagesLimit: number
    docsCount: number
    docsLimit: number
    aiCreditsUsed: number
    aiCreditsLimit: number
    storageBytesUsed: number
    storageLimit: number
    chunksCount: number
    imagesCount: number
  }
}

export default function ProfileDetails({ user, isOwner, isMocked, usage }: ProfileDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handlePlanToggle = () => {
    if (usage.plan === "FREE") {
      window.location.href = "/pricing"
    } else {
      window.location.href = "mailto:support@instant.wiki?subject=Manage%20Subscription"
    }
  }

  const storageMbUsed = (usage.storageBytesUsed / (1024 * 1024)).toFixed(1)
  const storageMbLimit = usage.storageLimit === Infinity ? "∞" : Math.round(usage.storageLimit / (1024 * 1024))
  const storagePercent = usage.storageLimit === Infinity ? 0 : Math.min(100, (usage.storageBytesUsed / usage.storageLimit) * 100)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300 font-sans text-left relative overflow-hidden">
      {/* Decorative accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6b38d4] via-[#8455ef] to-[#006b5e]" />
      
      {/* Profile Avatar Card */}
      <div className="flex flex-col items-center text-center space-y-5 pt-2">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6b38d4] to-[#006b5e] rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
          
          {user.image ? (
            <img
              src={user.image}
              alt={user.username}
              className="relative h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-900 bg-slate-50 dark:bg-zinc-855 shadow-sm"
            />
          ) : (
            <div className="relative h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm">
              <div className="h-full w-full rounded-full bg-[#6b38d4]/10 flex items-center justify-center">
                <User className="h-10 w-10 text-[#6b38d4] dark:text-purple-400" />
              </div>
            </div>
          )}
          
          {isOwner && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-0 right-0 p-2 bg-[#6b38d4] text-white rounded-full hover:bg-[#8455ef] hover:scale-105 transition-all shadow-md border-2 border-white dark:border-zinc-900 cursor-pointer"
              title="Edit Profile"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              @{user.username}
            </h2>
            {!isMocked && <BadgeCheck className="h-4.5 w-4.5 text-blue-500 fill-blue-500/10 shrink-0" />}
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono flex items-center justify-center gap-1">
            <Mail className="h-3 w-3 text-slate-350 dark:text-zinc-550" />
            {user.email}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/30 dark:hover:border-purple-500/30 hover:bg-[#6b38d4]/5 dark:hover:bg-purple-950/20 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-[#6b38d4] dark:hover:text-purple-400 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" /> Edit Profile Card
          </button>
        )}
      </div>

      {/* SaaS Usage & Plan Details */}
      <div className="border-t border-slate-100 dark:border-zinc-800 pt-5 space-y-5">
        {/* Removed plan error banner */}

        {/* Plan Header */}
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-semibold text-slate-400 dark:text-zinc-550 uppercase">Current Plan</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-md tracking-wider ${
              usage.plan === "PRO"
                ? "bg-purple-500/10 text-purple-550 border-purple-555/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-655 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
            }`}>
              {usage.plan}
            </span>
            {isOwner && !isMocked && (
              <button
                onClick={handlePlanToggle}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors uppercase font-mono cursor-pointer disabled:opacity-50"
              >
                {usage.plan === "FREE" ? "Upgrade" : "Manage"}
              </button>
            )}
          </div>
        </div>

        {/* AI Credit Blocks */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-purple-505" />
              AI Credits Used
            </span>
            <span className="text-slate-500 dark:text-zinc-500 font-bold">
              {usage.plan === "PRO" ? "Unlimited" : `${usage.aiCreditsUsed} / ${usage.aiCreditsLimit}`}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 py-1">
            {usage.plan === "PRO" ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-3.5 w-6 rounded-[3px] bg-purple-500/20 border border-purple-500/30 animate-pulse" 
                />
              ))
            ) : (
              Array.from({ length: usage.aiCreditsLimit }).map((_, i) => {
                const isUsed = i < usage.aiCreditsUsed;
                return (
                  <div 
                    key={i} 
                    className={`h-3.5 w-6 rounded-[3px] border transition-all duration-300 ${
                      isUsed 
                        ? "bg-purple-500 border-purple-600 dark:bg-purple-605 dark:border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.35)]" 
                        : "bg-slate-100 border-slate-205 dark:bg-zinc-800 dark:border-zinc-700"
                    }`} 
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Resource Limits List */}
        <div className="space-y-3 pt-1">
          {/* Workspaces */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3 text-slate-400" />
                Workspaces (Wikis)
              </span>
              <span className="font-bold">
                {usage.workspacesCount} / {usage.workspacesLimit === Infinity ? "∞" : usage.workspacesLimit}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${usage.workspacesLimit === Infinity ? 100 : Math.min(100, (usage.workspacesCount / usage.workspacesLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Wiki Pages */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400" />
                Wiki Pages
              </span>
              <span className="font-bold">
                {usage.pagesCount} / {usage.pagesLimit === Infinity ? "∞" : usage.pagesLimit}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${usage.pagesLimit === Infinity ? 100 : Math.min(100, (usage.pagesCount / usage.pagesLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-slate-400" />
                Uploaded Documents
              </span>
              <span className="font-bold">
                {usage.docsCount} / {usage.docsLimit === Infinity ? "∞" : usage.docsLimit}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                style={{ width: `${usage.docsLimit === Infinity ? 100 : Math.min(100, (usage.docsCount / usage.docsLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Storage Limit */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3 text-slate-400" />
                Storage Used
              </span>
              <span className="font-bold">
                {storageMbUsed} MB / {storageMbLimit} {usage.storageLimit !== Infinity && "MB"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sophisticated SaaS Month Metrics */}
        <div className="bg-slate-50 dark:bg-zinc-955/50 border border-slate-100 dark:border-zinc-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-2">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-450 font-mono">
              Monthly Ingestion Statistics
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3.5 text-left font-mono text-[10px]">
            <div className="space-y-0.5">
              <span className="text-slate-400 dark:text-zinc-550 block">Pages Generated</span>
              <span className="text-xs font-bold text-slate-750 dark:text-zinc-200">{usage.pagesCount}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 dark:text-zinc-550 block">Docs Processed</span>
              <span className="text-xs font-bold text-slate-750 dark:text-zinc-200">{usage.docsCount}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 dark:text-zinc-550 block">Knowledge Chunks</span>
              <span className="text-xs font-bold text-slate-750 dark:text-zinc-200">{usage.chunksCount.toLocaleString()}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 dark:text-zinc-550 block">Images Extracted</span>
              <span className="text-xs font-bold text-slate-750 dark:text-zinc-200">{usage.imagesCount}</span>
            </div>
          </div>
        </div>

        {isMocked && (
          <div className="flex gap-2 p-3 bg-amber-50/40 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed font-sans shadow-2xs">
            <ShieldAlert className="h-4 w-4 text-amber-655 shrink-0 mt-0.5" />
            <span>Running in Sandbox offline simulation. Database triggers are currently offline.</span>
          </div>
        )}
      </div>

      {/* Edit Profile Modal Dialog */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-950/60 z-40 backdrop-blur-xs transition-opacity duration-300" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                  Modify Account Details
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-655 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ProfileEditor user={user} onClose={() => setIsModalOpen(false)} />
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
