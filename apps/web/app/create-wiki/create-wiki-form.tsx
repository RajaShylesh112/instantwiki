"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWikiAction, generateWikiNamesAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Sparkles, 
  Loader2, 
  Globe, 
  Lock, 
  EyeOff, 
  FolderPlus, 
  AlertCircle,
  Check
} from "lucide-react"
import { AiWikiSuggestion } from "@/lib/validation/wiki"

interface CreateWikiFormProps {
  username: string
  isWorkspaceLimitReached?: boolean
  isAiLimitReached?: boolean
}

export default function CreateWikiForm({ 
  username,
  isWorkspaceLimitReached = false,
  isAiLimitReached = false
}: CreateWikiFormProps) {
  const router = useRouter()
  
  // Main form states
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("PUBLIC")
  const [isPending, setIsPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // AI assistant states
  const [topicPrompt, setTopicPrompt] = useState("")
  const [scopePrompt, setScopePrompt] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AiWikiSuggestion[]>([])
  const [isAiUsed, setIsAiUsed] = useState(false)
  const [aiProviderMsg, setAiProviderMsg] = useState("")

  // Automatic slug generation from title
  const handleTitleChange = (val: string) => {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove special characters
      .replace(/\s+/g, "-")          // replace spaces with hyphens
      .replace(/-+/g, "-")           // collapse duplicate hyphens
    setSlug(generatedSlug)
  }

  // Handle suggestion click to autofill form
  const handleSelectSuggestion = (sug: AiWikiSuggestion) => {
    setTitle(sug.title)
    setSlug(sug.slug)
    setDescription(sug.description)
    setFormError(null)
  }

  // AI suggestions call
  const handleGenerateIdeas = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!topicPrompt.trim()) {
      setAiError("Please provide a topic.")
      return
    }

    setIsAiLoading(true)
    setAiError(null)
    setSuggestions([])

    try {
      const res = await generateWikiNamesAction(topicPrompt, scopePrompt)
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions)
        setIsAiUsed(true)
        setAiProviderMsg(res.isMocked ? "Simulated Sandbox Recommendations" : "DeepSeek AI Recommendations")
      } else {
        setAiError(res.error || "Failed to generate suggestions.")
      }
    } catch (err) {
      setAiError("Unexpected error calling AI provider.")
    } finally {
      setIsAiLoading(false)
    }
  }

  // Submit form action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsPending(true)

    // Manual validation checks
    if (title.trim().length < 2) {
      setFormError("Title must be at least 2 characters.")
      setIsPending(false)
      return
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      setFormError("Slug must be lowercase, alphanumeric, and hyphen-separated only (e.g. ml-atlas).")
      setIsPending(false)
      return
    }

    try {
      const res = await createWikiAction({
        title,
        slug,
        description,
        visibility,
      })

      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl + "/sources")
        router.refresh()
      } else {
        setFormError(res.error || "Failed to create wiki.")
        setIsPending(false)
      }
    } catch (err) {
      setFormError("An unexpected error occurred. Please try again.")
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* Left Column: Form Controls (Col-span 7) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3.5 z-20 animate-fade-in">
            <Loader2 className="h-8 w-8 text-[#6b38d4] dark:text-purple-400 animate-spin" />
            <p className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 bg-white/90 dark:bg-zinc-900/90 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-md">
              Creating wiki workspace & routing...
            </p>
          </div>
        )}
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
          <FolderPlus className="h-5 w-5 text-[#6b38d4] dark:text-purple-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
            New Wiki Details
          </h2>
        </div>

        {isWorkspaceLimitReached && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-400 leading-normal">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Workspace Limit Reached:</span> You have reached the limit of 1 workspace for the Free tier. Please upgrade your plan on the profile page to create more workspaces.
            </div>
          </div>
        )}

        {formError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/50 rounded-lg text-xs text-red-800 dark:text-red-400 leading-normal">
            <AlertCircle className="h-4.5 w-4.5 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Wiki Title
            </label>
            <Input
              type="text"
              required
              placeholder="Enter wiki title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:border-[#6b38d4] focus:ring-[#6b38d4]/50 text-sm"
              disabled={isPending}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>URL Slug</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-normal lowercase">instant.wiki/u/{username}/[slug]</span>
            </label>
            <Input
              type="text"
              required
              placeholder="Enter wiki URL slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-mono text-xs focus:border-[#6b38d4] focus:ring-[#6b38d4]/50"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Enter wiki description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-serif text-sm focus:border-[#6b38d4] focus:ring-[#6b38d4]/50 min-h-[100px]"
              disabled={isPending}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono block">
              Visibility & Permissions
            </label>
            
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Public */}
              <button
                type="button"
                onClick={() => setVisibility("PUBLIC")}
                className={`p-3 border rounded-lg flex flex-col text-left gap-1.5 transition-all cursor-pointer ${
                  visibility === "PUBLIC"
                    ? "border-[#6b38d4] bg-[#6b38d4]/10 text-slate-800 dark:text-zinc-100"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100/30 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}
                disabled={isPending}
              >
                <span className="flex items-center gap-1 text-xs font-bold font-mono">
                  <Globe className={`h-4 w-4 ${visibility === "PUBLIC" ? "text-[#006b5e] dark:text-[#6ef9e2]" : "text-slate-400 dark:text-zinc-500"}`} />
                  Public
                </span>
                <span className="text-[10px] leading-relaxed">Anyone can view this wiki index.</span>
              </button>

              {/* Unlisted */}
              <button
                type="button"
                onClick={() => setVisibility("UNLISTED")}
                className={`p-3 border rounded-lg flex flex-col text-left gap-1.5 transition-all cursor-pointer ${
                  visibility === "UNLISTED"
                    ? "border-[#6b38d4] bg-[#6b38d4]/10 text-slate-800 dark:text-zinc-100"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100/30 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}
                disabled={isPending}
              >
                <span className="flex items-center gap-1 text-xs font-bold font-mono">
                  <EyeOff className={`h-4 w-4 ${visibility === "UNLISTED" ? "text-slate-550 dark:text-zinc-300" : "text-slate-400 dark:text-zinc-500"}`} />
                  Unlisted
                </span>
                <span className="text-[10px] leading-relaxed">Only people with the link can view it.</span>
              </button>

              {/* Private */}
              <button
                type="button"
                onClick={() => setVisibility("PRIVATE")}
                className={`p-3 border rounded-lg flex flex-col text-left gap-1.5 transition-all cursor-pointer ${
                  visibility === "PRIVATE"
                    ? "border-[#6b38d4] bg-[#6b38d4]/10 text-slate-800 dark:text-zinc-100"
                    : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100/30 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}
                disabled={isPending}
              >
                <span className="flex items-center gap-1 text-xs font-bold font-mono">
                  <Lock className={`h-4 w-4 ${visibility === "PRIVATE" ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`} />
                  Private
                </span>
                <span className="text-[10px] leading-relaxed">Only you can view and edit this workspace.</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => router.push(`/workspaces`)}
            className="px-4 py-2 text-xs font-semibold text-slate-550 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </button>
          <Button
            type="submit"
            disabled={isPending || isWorkspaceLimitReached}
            className={`px-5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm ${
              isWorkspaceLimitReached
                ? "bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-650 cursor-not-allowed"
                : "bg-[#6b38d4] hover:bg-[#8455ef] text-white cursor-pointer"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
              </>
            ) : (
              "Create Wiki"
            )}
          </Button>
        </div>
      </form>

      {/* Right Column: AI Assistant (Col-span 5) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-[#1a1c1b] to-slate-900 text-slate-105 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 relative overflow-hidden">
        {isAiLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3.5 z-20 animate-fade-in">
            <Loader2 className="h-8 w-8 text-[#6b38d4] animate-spin" />
            <p className="text-xs font-mono font-bold text-slate-200 bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-800 shadow-md">
              Analyzing topic & generating suggestions...
            </p>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#6b38d4]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              DeepSeek AI Assistant
            </h2>
          </div>
          <span className="text-[9px] font-mono bg-[#6b38d4]/20 border border-[#6b38d4]/30 text-indigo-300 px-2 py-0.5 rounded uppercase">
            Autopilot
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Wiki Topic
            </label>
            <input
              type="text"
              placeholder="Enter wiki topic"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-100 bg-slate-950/60 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b38d4] font-sans"
              disabled={isAiLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Focus & Scope (Optional)
            </label>
            <textarea
              placeholder="Enter focus and scope details"
              value={scopePrompt}
              onChange={(e) => setScopePrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-100 bg-slate-950/60 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b38d4] font-sans min-h-[60px]"
              disabled={isAiLoading}
            />
          </div>

          {isAiLimitReached && (
            <div className="flex items-start gap-2 p-3 bg-amber-955/20 border border-amber-900/40 rounded-lg text-[11px] text-amber-350 leading-normal">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Credit Limit Reached:</span> You have used all 5 AI Name Generation credits on the Free tier. Please upgrade your plan to continue using the AI assistant.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateIdeas}
            className={`w-full py-2 transition-colors rounded-md text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm ${
              isAiLimitReached && !isAiLoading
                ? "bg-zinc-800 text-zinc-550 cursor-not-allowed border border-zinc-700 hover:bg-zinc-800"
                : "bg-[#6b38d4] hover:bg-[#8455ef] cursor-pointer"
            }`}
            disabled={isAiLoading || isAiLimitReached}
          >
            {isAiLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate Wiki Names
              </>
            )}
          </button>
        </div>

        {/* Suggestions Display */}
        {aiError && (
          <div className="p-3 bg-red-950/40 border border-red-900 rounded-lg text-xs text-red-350 leading-relaxed font-sans">
            {aiError}
          </div>
        )}

        {isAiUsed && (
          <div className="space-y-3.5 pt-2 border-t border-slate-850">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Suggestions List</span>
              <span className="text-[#6b38d4] font-bold">{aiProviderMsg}</span>
            </div>

            <div className="space-y-3">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="p-3.5 bg-slate-950/40 hover:bg-[#6b38d4]/10 border border-slate-800 hover:border-[#6b38d4]/30 rounded-lg cursor-pointer transition-all flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-[#6b38d4] transition-colors">
                      {sug.title}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 rounded">
                      {sug.slug}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-serif line-clamp-2">
                    {sug.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
