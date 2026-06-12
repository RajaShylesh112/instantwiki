"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "./actions"
import { Button } from "@/components/ui/button"
import { Loader2, User, Image as ImageIcon, AlertCircle, Check } from "lucide-react"

interface ProfileEditorProps {
  user: {
    id: string
    username: string
    image: string | null
  }
  onClose?: () => void
}

export default function ProfileEditor({ user, onClose }: ProfileEditorProps) {
  const router = useRouter()
  const [usernameInput, setUsernameInput] = useState(user.username)
  const [imageInput, setImageInput] = useState(user.image || "")
  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccess(false)

    // Client validation
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMsg("Username must be between 3 and 30 characters (alphanumeric & underscores only).")
      return
    }

    if (imageInput.trim()) {
      try {
        new URL(imageInput.trim())
      } catch (err) {
        setErrorMsg("Please enter a valid image URL (e.g., https://example.com/avatar.jpg).")
        return
      }
    }

    setIsPending(true)
    try {
      const result = await updateProfile(user.id, cleanUsername, imageInput.trim())
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setIsPending(false)
          if (onClose) onClose()
          if (result.redirectUrl) {
            router.push(result.redirectUrl)
          } else {
            router.refresh()
          }
        }, 1200)
      } else {
        setErrorMsg(result.error || "Failed to update profile.")
        setIsPending(false)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg("An unexpected error occurred. Please try again.")
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans text-left">
      <div className="space-y-4">
        {/* Username field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" /> Username
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <input
              type="text"
              required
              placeholder="e.g. raja_dev"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-150 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/20 dark:focus:ring-purple-900/30 focus:border-[#6b38d4] dark:focus:border-purple-500 font-mono transition-all hover:border-slate-350 dark:hover:border-zinc-700"
              disabled={isPending || success}
            />
          </div>
        </div>

        {/* Profile Image URL field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" /> Profile Image URL
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-150 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/20 dark:focus:ring-purple-900/30 focus:border-[#6b38d4] dark:focus:border-purple-500 font-mono transition-all hover:border-slate-350 dark:hover:border-zinc-700"
              disabled={isPending || success}
            />
          </div>
        </div>
      </div>

      {/* Message feedback */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-red-800 dark:text-red-400 leading-normal animate-shake">
          <AlertCircle className="h-4.5 w-4.5 text-red-650 dark:text-red-405 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 leading-normal font-mono animate-fade-in">
          <Check className="h-4.5 w-4.5 text-emerald-650 dark:text-emerald-400 shrink-0 bg-emerald-100 dark:bg-emerald-950/40 rounded-full p-0.5" />
          <span>Profile card updated successfully!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 mt-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            disabled={isPending || success}
          >
            Cancel
          </button>
        )}
        <Button
          type="submit"
          disabled={isPending || success}
          className="px-5 py-2 text-xs font-semibold bg-[#6b38d4] hover:bg-[#8455ef] text-white rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
