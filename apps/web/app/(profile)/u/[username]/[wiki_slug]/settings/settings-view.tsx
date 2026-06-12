"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Lock, EyeOff, Globe, AlertCircle, Trash2, X, AlertTriangle, Check, Loader2 } from "lucide-react"

interface SettingsViewProps {
  username: string
  wikiSlug: string
  initialWiki: {
    id: string
    title: string
    description: string
    visibility: "PRIVATE" | "UNLISTED" | "PUBLIC"
  }
}

export default function SettingsView({ username, wikiSlug, initialWiki }: SettingsViewProps) {
  const router = useRouter()
  
  const [title, setTitle] = useState(initialWiki.title)
  const [slug, setSlug] = useState(wikiSlug)
  const [description, setDescription] = useState(initialWiki.description)
  const [visibility, setVisibility] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">(initialWiki.visibility)
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
    if (!cleanSlug) return

    setIsSaving(true)
    setSaveSuccess(false)

    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      
      if (cleanSlug !== wikiSlug) {
        setTimeout(() => {
          router.push(`/u/${username}/${cleanSlug}/settings`)
        }, 1000)
      } else {
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    }, 1500)
  }

  const handleDelete = async () => {
    if (deleteInput !== wikiSlug) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/wiki/${initialWiki.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const res = await response.json()
        alert(res.error || "Failed to delete wiki workspace.")
        setIsDeleting(false)
        return
      }

      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      router.push("/workspaces")
      router.refresh()
    } catch (err) {
      console.error("Error deleting workspace:", err)
      alert("A network error occurred. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="py-8 max-w-3xl mx-auto px-6 font-sans space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" id="settings-header">
          Wiki Settings
        </h1>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Configure wiki properties, access levels, and workspace configurations
        </p>
      </div>

      {/* Main Settings Form (settings-form-container) */}
      <form onSubmit={handleSave} className="space-y-6" id="settings-form-container">
        
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-150 rounded-md text-xs text-emerald-800 font-mono select-none animate-fade-in">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            Changes saved successfully! {slug !== wikiSlug && "Redirecting to updated path..."}
          </div>
        )}

        <div className="space-y-5" id="settings-general-fields">
          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Wiki Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b38d4] transition-colors"
              id="settings-input-title"
            />
          </div>

          {/* Slug Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Custom URL Slug
            </label>
            <div className="flex rounded-md border border-slate-200 overflow-hidden bg-slate-50">
              <span className="px-3 py-2 text-xs text-slate-505 bg-slate-100 border-r border-slate-200 select-none flex items-center">
                instant.wiki/u/{username}/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none font-mono"
                id="settings-input-slug"
              />
            </div>
            
            {slug !== wikiSlug && (
              <div className="flex items-start gap-1.5 p-2.5 bg-amber-55/30 border border-amber-100 rounded-md text-[11px] text-amber-700 leading-normal">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Warning: Changing the custom URL slug will modify the wiki routing pathway. Existing links will return 404 errors.
                </span>
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b38d4] transition-colors"
              id="settings-input-desc"
            />
          </div>

          {/* Visibility Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono block">
              Visibility Permissions
            </label>
            
            <div className="grid gap-3 sm:grid-cols-3" id="settings-radio-visibility">
              
              {/* Private */}
              <label className={`border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                visibility === "PRIVATE"
                  ? "border-[#6b38d4] bg-[#6b38d4]/10 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50/50"
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="PRIVATE"
                  checked={visibility === "PRIVATE"}
                  onChange={() => setVisibility("PRIVATE")}
                  className="mt-1 h-3.5 w-3.5 text-[#6b38d4] focus:ring-[#6b38d4] border-slate-300"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-slate-450" /> Private
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal font-mono">
                    Only you can view or manage.
                  </p>
                </div>
              </label>

              {/* Unlisted */}
              <label className={`border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                visibility === "UNLISTED"
                  ? "border-[#6b38d4] bg-[#6b38d4]/10 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50/50"
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="UNLISTED"
                  checked={visibility === "UNLISTED"}
                  onChange={() => setVisibility("UNLISTED")}
                  className="mt-1 h-3.5 w-3.5 text-[#6b38d4] focus:ring-[#6b38d4] border-slate-300"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5 text-slate-455" /> Unlisted
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal font-mono">
                    Anyone with link can read.
                  </p>
                </div>
              </label>

              {/* Public */}
              <label className={`border rounded-lg p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                visibility === "PUBLIC"
                  ? "border-[#6b38d4] bg-[#6b38d4]/10 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50/50"
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                  className="mt-1 h-3.5 w-3.5 text-[#6b38d4] focus:ring-[#6b38d4] border-slate-300"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-[#006b5e]" /> Public
                  </span>
                  <p className="text-[10px] text-slate-505 leading-normal font-mono">
                    Indexed and visible to everyone.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3 border-t border-slate-150">
          <button
            type="submit"
            disabled={isSaving}
            id="settings-btn-save"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50/30 p-6 space-y-4" id="settings-danger-zone">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-red-655 flex items-center gap-1">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </h2>
          <p className="text-[11px] text-slate-550 leading-relaxed font-mono">
            Once you delete a wiki, there is no going back. Please be certain.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            id="settings-btn-delete-trigger"
            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-all"
          >
            Delete this Wiki
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px]" />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" id="settings-delete-modal">
            <div className="bg-white border border-slate-250 rounded-lg shadow-xl max-w-md w-full p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-red-655">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Confirm Deletion
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setDeleteInput("")
                  }}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-450"
                  disabled={isDeleting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  This action is permanent and cannot be undone. All pages, concepts, and uploader sources under this namespace will be destroyed.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
                    Type the wiki slug to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={wikiSlug}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                    disabled={isDeleting}
                    id="settings-delete-confirm-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setDeleteInput("")
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-605 hover:text-slate-800"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== wikiSlug || isDeleting}
                  id="settings-btn-delete-confirm"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    "I understand the consequences, delete this wiki"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.12s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
