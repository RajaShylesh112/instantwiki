"use client"

import { useState } from "react"
import { Settings, User, X, Camera, ShieldAlert, Mail, BadgeCheck } from "lucide-react"
import ProfileEditor from "./profile-editor"

interface ProfileDetailsProps {
  user: {
    id: string
    username: string
    image: string | null
    email: string
  }
  isOwner: boolean
  isMocked: boolean
}

export default function ProfileDetails({ user, isOwner, isMocked }: ProfileDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
              className="relative h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-900 bg-slate-50 dark:bg-zinc-805 shadow-sm"
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

      {/* Account Info Details */}
      <div className="border-t border-slate-100 dark:border-zinc-800 pt-5 space-y-3.5 text-xs font-mono text-slate-500 dark:text-zinc-400">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-400 dark:text-zinc-500">Account Type</span>
          <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-md ${
            isMocked 
              ? "bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50" 
              : "bg-[#6b38d4]/10 dark:bg-purple-955/20 text-[#6b38d4] dark:text-purple-400 border-[#6b38d4]/20 dark:border-purple-900/30"
          }`}>
            {isMocked ? "Sandbox" : "Developer"}
          </span>
        </div>
        
        {isMocked && (
          <div className="flex gap-2 p-3 bg-amber-50/40 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed font-sans shadow-2xs">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
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
