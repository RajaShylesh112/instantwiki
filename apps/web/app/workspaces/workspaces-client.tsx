"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Globe,
  Lock,
  EyeOff,
  BookOpen,
  Trash2,
  FileText,
  Clock,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Wiki } from "@/lib/repositories/wiki"
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid"

interface WorkspacesClientProps {
  wikis: Wiki[]
  username: string
}

function DeleteModal({
  wiki,
  onClose,
  onDeleted,
}: {
  wiki: Wiki
  onClose: () => void
  onDeleted: () => void
}) {
  const [input, setInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (input !== wiki.slug) return
    setIsDeleting(true)
    setError("")
    try {
      const res = await fetch(`/api/wiki/${wiki.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || "Failed to delete workspace.")
        setIsDeleting(false)
        return
      }
      onDeleted()
    } catch {
      setError("Network error. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Delete Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning */}
        <div className="text-xs text-slate-600 dark:text-zinc-400 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg p-3 space-y-1 leading-relaxed">
          <p>You are about to permanently delete <span className="font-bold text-slate-900 dark:text-white">{wiki.title}</span>.</p>
          <p>All pages, sources, and generated content will be lost forever.</p>
        </div>

        {/* Confirm input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Type <span className="text-red-500 dark:text-red-400">{wiki.slug}</span> to confirm
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={wiki.slug}
            className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:focus:ring-red-500/40 transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 font-mono">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={input !== wiki.slug || isDeleting}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-red-900/40 text-white disabled:text-red-200 dark:disabled:text-red-600 transition-colors flex items-center justify-center gap-1.5"
          >
            {isDeleting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="h-3.5 w-3.5" /> Delete Workspace</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Wiki["status"] }) {
  const map = {
    READY: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
    PROCESSING: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
    DRAFT: "text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700",
    FAILED: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50",
  }
  return (
    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${map[status]}`}>
      {status}
    </span>
  )
}

export default function WorkspacesClient({ wikis: initialWikis, username }: WorkspacesClientProps) {
  const router = useRouter()
  const [wikis, setWikis] = useState(initialWikis)
  const [deletingWiki, setDeletingWiki] = useState<Wiki | null>(null)

  const handleDeleted = () => {
    if (!deletingWiki) return
    setWikis((prev) => prev.filter((w) => w.id !== deletingWiki.id))
    setDeletingWiki(null)
    router.refresh()
  }

  return (
    <>
      {deletingWiki && (
        <DeleteModal
          wiki={deletingWiki}
          onClose={() => setDeletingWiki(null)}
          onDeleted={handleDeleted}
        />
      )}

      <div className="grid gap-4">
        {wikis.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-400 dark:text-zinc-500 font-mono space-y-3">
            <p>No active workspaces found.</p>
            <Link href="/create-wiki" className="text-[#6b38d4] dark:text-purple-400 hover:underline font-bold inline-block">
              Create your first workspace now →
            </Link>
          </div>
        ) : (
          <BentoGrid
            items={wikis.map((wiki, index) => {
              const updatedAt = new Date(wiki.updated_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })

              return {
                title: wiki.title,
                description: wiki.description || "No description provided for this workspace.",
                meta: `${wiki.page_count} pages · ${updatedAt}`,
                icon: <BookOpen className="w-4 h-4 text-purple-500" />,
                status: wiki.status,
                tags: [wiki.visibility],
                href: `/u/${username}/${wiki.slug}`,
                colSpan: 1,
                cta: "Enter Workspace →",
                actionNode: (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setDeletingWiki(wiki)
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all z-10"
                    title="Delete workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              }
            })}
          />
        )}
      </div>
    </>
  )
}
