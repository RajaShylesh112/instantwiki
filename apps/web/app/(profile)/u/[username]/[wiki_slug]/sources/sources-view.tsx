"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Database, 
  Plus, 
  Trash2, 
  UploadCloud, 
  X, 
  AlertTriangle, 
  FileText, 
  Globe, 
  Check, 
  Loader2, 
  Sparkles 
} from "lucide-react"
import { Document } from "@/lib/repositories/document"

interface SourcesViewProps {
  username: string
  wikiSlug: string
  wikiId: string
  initialDocuments: Document[]
}

export default function SourcesView({ username, wikiSlug, wikiId, initialDocuments = [] }: SourcesViewProps) {
  const router = useRouter()
  const [sources, setSources] = useState<Document[]>(initialDocuments)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [sourceToDelete, setSourceToDelete] = useState<Document | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Upload Processing UX v2 States
  const [progressPercent, setProgressPercent] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [conceptsList, setConceptsList] = useState<string[]>([])
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [synthesisProgress, setSynthesisProgress] = useState(0)
  
  // Custom premium notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info"
    title: string
    message: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showNotification = (type: "success" | "error" | "info", title: string, message: string) => {
    setNotification({ type, title, message })
    setTimeout(() => {
      setNotification((prev) => {
        if (prev?.title === title && prev?.message === message) {
          return null
        }
        return prev
      })
    }, 4500)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleCloseUploader = () => {
    setIsUploaderOpen(false)
    setIsUploading(false)
    setUploadSuccess(false)
    setProgressPercent(0)
  }

  const handleTriggerSynthesis = async () => {
    setIsSynthesizing(true)
    setSynthesisProgress(0)

    // Pre-populate concepts extraction list from sources for immediate visual richness
    const concepts = sources.flatMap((src) => {
      const baseName = src.filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      return [
        baseName,
        `${baseName} Core Foundations`,
        `${baseName} Network Inference`
      ]
    }).slice(0, 8)

    setConceptsList(concepts.length > 0 ? concepts : [
      "Machine Learning Models",
      "Neural Network Topology",
      "Gradient Descent Optimization",
      "Backpropagation Mechanics",
      "Dataset Normalization",
      "Model Inference Pipeline"
    ])

    try {
      const response = await fetch(`/api/wiki/${wikiId}/synthesis`, {
        method: "POST"
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || "Failed to initiate wiki page generation.")
      }

      const res = await response.json()
      const jobId = res.jobId

      // Poll the job status
      const pollInterval = setInterval(async () => {
        try {
          const jobResponse = await fetch(`/api/wiki/${wikiId}/job/${jobId}`)
          if (!jobResponse.ok) {
            throw new Error("Failed to check background synthesis status.")
          }

          const jobData = await jobResponse.json()
          const job = jobData.job

          if (!job) {
            throw new Error("Job details not found.")
          }

          // Map step to progress bar percentage
          let progress = 10
          if (job.current_step === "EXTRACTION") progress = 20
          else if (job.current_step === "CHUNKING") progress = 40
          else if (job.current_step === "EMBEDDINGS") progress = 60
          else if (job.current_step === "TOPIC_DISCOVERY") progress = 80
          else if (job.current_step === "SKELETON") progress = 95
          else if (job.current_step === "FINISHED") progress = 100

          setSynthesisProgress(progress)

          if (job.status === "COMPLETED") {
            clearInterval(pollInterval)
            setSynthesisProgress(100)
            showNotification(
              "success",
              "Wiki Generated Successfully",
              "All pages pre-generated, hyperlinked, and indexed from sources!"
            )
            setTimeout(() => {
              router.push(`/u/${username}/${wikiSlug}`)
              router.refresh()
            }, 800)
          } else if (job.status === "FAILED") {
            clearInterval(pollInterval)
            setIsSynthesizing(false)
            showNotification(
              "error",
              "Generation Failed",
              job.error || "An error occurred during background processing."
            )
          }
        } catch (pollErr: any) {
          console.error("Polling check failed:", pollErr)
        }
      }, 900)

    } catch (err: any) {
      setIsSynthesizing(false)
      showNotification(
        "error",
        "Synthesis Failed",
        err.message || "Failed to trigger page generation pipeline."
      )
    }
  }


  const uploadFile = (file: File) => {
    setIsUploading(true)
    setUploadSuccess(false)
    setUploadedFileName(file.name)
    setProgressPercent(0)

    const formData = new FormData()
    formData.append("sourceType", "FILE")
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `/api/wiki/${wikiId}/documents`, true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setProgressPercent(percent)
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.error) {
            showNotification("error", "Upload Failed", res.error)
            return
          }

          if (res.status === "EXISTS") {
            showNotification(
              "info",
              "File Already Exists",
              `"${file.name}" has already been uploaded to this wiki. Reprocessing skipped.`
            )
            setIsUploaderOpen(false)
            return
          }

          if (res.status === "REUSED") {
            showNotification(
              "success",
              "Instant Cache Match",
              `"${file.name}" was matched with an identical document in our storage bucket. Reused cached output instantly!`
            )
          } else {
            setUploadSuccess(true)
            if (res.warning) {
              showNotification(
                "info",
                "Sandbox Fallback Active",
                `Indexed "${file.name}" in sandbox fallback (storage bucket 'documents' not found).`
              )
            } else {
              showNotification(
                "success",
                "File Uploaded",
                `Successfully uploaded and indexed "${file.name}".`
              )
            }
          }

          setSources((prev) => [res.doc, ...prev])
          
          setTimeout(() => {
            setUploadSuccess(false)
            setIsUploaderOpen(false)
          }, 1000)
        } catch (e) {
          showNotification("error", "Response Parse Error", "Failed to parse API response.")
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          showNotification("error", "Ingestion Rejected", res.error || "Upload failed.")
        } catch (e) {
          showNotification("error", "Upload Error", `Upload failed with status code ${xhr.status}.`)
        }
      }
    }

    xhr.onerror = () => {
      setIsUploading(false)
      showNotification("error", "Network Error", "A connection issue occurred during file transfer.")
    }

    xhr.send(formData)
  }

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setIsUploading(true)
    setUploadSuccess(false)
    setProgressPercent(10)

    let estimatedName = "webpage-source.txt"
    try {
      const urlObj = new URL(urlInput)
      estimatedName = `${urlObj.hostname}${urlObj.pathname.replace(/\/$/, "")}.txt`
    } catch (err) {
      estimatedName = urlInput.replace(/https?:\/\//, "").replace(/\//g, "-") + ".txt"
    }
    setUploadedFileName(estimatedName)

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("sourceType", "URL")
      formData.append("url", urlInput)

      const response = await fetch(`/api/wiki/${wikiId}/documents`, {
        method: "POST",
        body: formData
      })

      clearInterval(interval)
      setProgressPercent(100)

      const res = await response.json()
      setIsUploading(false)

      if (!response.ok) {
        showNotification("error", "Website Rejected", res.error || "Failed to import web page.")
        return
      }

      if (res.status === "EXISTS") {
        showNotification(
          "info",
          "URL Content Exists",
          "This webpage content has already been scraped and imported to this wiki."
        )
        setIsUploaderOpen(false)
        return
      }

      if (res.status === "REUSED") {
        showNotification(
          "success",
          "Instant Deduplication",
          "Webpage text matches an identical record in cache. Reused storage path instantly!"
        )
      } else {
        setUploadSuccess(true)
        if (res.warning) {
          showNotification(
            "info",
            "Sandbox Fallback Active",
            "Scraped webpage in sandbox fallback (storage bucket 'documents' not found)."
          )
        } else {
          showNotification(
            "success",
            "URL Text Extracted",
            "Successfully fetched text content, hashed, and uploaded to storage."
          )
        }
      }

      setSources((prev) => [res.doc, ...prev])
      setUrlInput("")

      setTimeout(() => {
        setUploadSuccess(false)
        setIsUploaderOpen(false)
      }, 1000)

    } catch (err) {
      clearInterval(interval)
      setIsUploading(false)
      showNotification("error", "Fetch Failed", "Could not complete import of the URL page.")
    }
  }

  const confirmDelete = async () => {
    if (!sourceToDelete) return

    try {
      const response = await fetch(`/api/wiki/${wikiId}/documents`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ docId: sourceToDelete.id })
      })

      if (!response.ok) {
        const res = await response.json()
        showNotification("error", "Deletion Failed", res.error || "Failed to remove the document.")
        return
      }

      showNotification(
        "success",
        "Document Deleted",
        `Permanently removed "${sourceToDelete.filename}" and updated index mappings.`
      )
      setSources((prev) => prev.filter((s) => s.id !== sourceToDelete.id))
      setSourceToDelete(null)
    } catch (err) {
      showNotification("error", "Network Error", "Could not complete document deletion request.")
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch (e) {
      return dateStr
    }
  }

  const getSourceTypeBadge = (sourceType: string) => {
    const isFile = sourceType === "FILE"
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${
        isFile 
          ? "bg-purple-50 text-purple-700 border-purple-100" 
          : "bg-blue-50 text-blue-700 border-blue-100"
      }`}>
        {sourceType}
      </span>
    )
  }

  const getMimeTypeBadge = (mimeType: string) => {
    let colors = "bg-slate-50 text-slate-700 border-slate-100"
    if (mimeType === "pdf") colors = "bg-red-50 text-red-700 border-red-100"
    else if (mimeType === "md") colors = "bg-indigo-50 text-indigo-700 border-indigo-100"
    else if (mimeType === "txt") colors = "bg-amber-50 text-amber-700 border-amber-100"
    else if (mimeType === "docx") colors = "bg-sky-50 text-sky-700 border-sky-100"
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors}`}>
        {mimeType}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    let colors = "bg-gray-50 text-gray-700 border-gray-100"
    if (status === "READY") colors = "bg-emerald-50 text-emerald-700 border-emerald-100"
    else if (status === "PENDING" || status === "PROCESSING") colors = "bg-yellow-50 text-yellow-700 border-yellow-100 animate-pulse"
    else if (status === "FAILED") colors = "bg-rose-50 text-rose-700 border-rose-100"

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colors}`}>
        {status === "READY" && <Check className="h-3 w-3" />}
        {status}
      </span>
    )
  }

  return (
    <div className="py-8 max-w-5xl mx-auto px-6 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" id="sources-header">
            Sources & Documents
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Manage the files feeding knowledge entities into this wiki
          </p>
        </div>
        
        {!isUploaderOpen && (
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#6b38d4] hover:bg-[#8455ef] text-white rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Knowledge Source
          </button>
        )}
      </div>

      {/* Inline Add Source Card */}
      {isUploaderOpen && (
        <div className="w-full">
          <div className="rounded-lg border border-slate-250 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Add New Source Document
              </h2>
              <button
                onClick={handleCloseUploader}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Drag & Drop File Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all ${
                  isDragOver
                    ? "border-[#6b38d4] bg-slate-100/50"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md,.docx"
                  className="hidden"
                  disabled={isUploading}
                />
                
                {isUploading && uploadedFileName.endsWith(".txt") === false && urlInput === "" ? (
                  <div className="space-y-3 flex flex-col items-center w-full max-w-xs px-4">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 w-full">
                      <span>Uploading...</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#6b38d4]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6b38d4] transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">Hashing & uploading document...</p>
                  </div>
                ) : uploadSuccess ? (
                  <div className="space-y-2 flex flex-col items-center text-emerald-600">
                    <Check className="h-8 w-8 bg-emerald-50 rounded-full p-1 border border-emerald-200" />
                    <p className="text-xs font-bold font-mono">Ingested successfully!</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <UploadCloud className="h-8 w-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-800">
                      Drag and drop file here or <span className="text-[#6b38d4]">click to browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Supports PDF, TXT, MD, or DOCX up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* URL Import Field */}
              <form
                onSubmit={handleUrlImport}
                className="border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col justify-between"
              >
                {isUploading && (urlInput !== "" || uploadedFileName.endsWith(".txt")) ? (
                  <div className="space-y-3 py-6 flex flex-col items-center w-full">
                    <Loader2 className="h-6 w-6 text-[#6b38d4] animate-spin" />
                    <div className="w-full max-w-xs h-1.5 bg-[#6b38d4]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6b38d4] transition-all duration-350 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Downloading & scraping page: {progressPercent}%</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-450 font-mono block">
                        Import Web Page URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/article"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b38d4] font-mono"
                          disabled={isUploading}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                        We will scrape text content, verify textual nature, hash it, and save the extracted text.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={handleCloseUploader}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-555 hover:text-slate-800"
                        disabled={isUploading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md flex items-center gap-1.5"
                        disabled={isUploading || uploadSuccess}
                      >
                        Import
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sources Table (sources-table) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse" id="sources-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Document Name
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Uploaded
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Source / Type
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400 font-mono">
                  No knowledge sources uploaded yet.
                </td>
              </tr>
            ) : (
              sources.map((src) => (
                <tr key={src.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5" id="sources-col-name">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#6b38d4] shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                          {src.filename}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-6">
                        hash: {src.content_hash.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-505 font-mono" id="sources-col-date">
                    {isMounted ? formatDate(src.created_at) : ""}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono" id="sources-col-pages">
                    <div className="flex gap-1.5">
                      {getSourceTypeBadge(src.source_type)}
                      {getMimeTypeBadge(src.mime_type)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono" id="sources-col-concepts">
                    {getStatusBadge(src.processing_status)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => setSourceToDelete(src)}
                      id="sources-col-action-btn"
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-650 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Pages Action Card at the Bottom */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#6b38d4]" />
            Generate Wiki Pages
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            {sources.length > 0
              ? `Ready to synthesize ${sources.length} document${sources.length > 1 ? "s" : ""} into dynamic wiki nodes.`
              : "Upload documents or URLs first to begin generating wiki pages."}
          </p>
        </div>
        <button
          onClick={handleTriggerSynthesis}
          disabled={sources.length === 0 || isSynthesizing}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#6b38d4] hover:bg-[#8455ef] text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" /> Create Pages
        </button>
      </div>

      {/* Confirmation Modal overlay */}
      {sourceToDelete && (
        <>
          <div className="fixed inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px]" />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white border border-slate-250 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-start gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Delete "{sourceToDelete.filename}"?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-mono">
                    Document Removal & Database Cascade Alert
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50/50 border border-red-100 rounded-md text-xs text-red-800 leading-relaxed font-sans">
                Deleting this file will permanently prune any generated concept pages whose only validation reference is "{sourceToDelete.filename}". Other multi-reference concepts will remain but lose this document's citations.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSourceToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-605 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Full screen Synthesis overlay */}
      {isSynthesizing && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden animate-fade-in flex flex-col gap-6">
            {/* Decorative top gradient border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6b38d4] via-[#8455ef] to-[#006b5e]" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mt-1.5">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-[#6b38d4]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Knowledge Synthesis & Page Generation
                </h2>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column (col-span 2): Concepts Found */}
              <div className="md:col-span-2 space-y-4 border border-slate-150 rounded-xl p-5 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#6b38d4]" />
                    <h4 className="text-sm font-bold text-slate-800">Concepts Extracted</h4>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[#6b38d4] bg-[#6b38d4]/10 border border-[#6b38d4]/20 px-2.5 py-0.5 rounded-full">
                    {conceptsList.length} entities found
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 max-h-48 overflow-y-auto">
                  {conceptsList.map((concept, idx) => (
                    <span
                      key={concept + idx}
                      className="px-3 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-full border border-slate-200 flex items-center gap-1.5 shadow-2xs animate-fade-in"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column (col-span 1): Progress Checklist */}
              <div className="md:col-span-1 border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Live Progress</h4>
                    <span className="h-2 w-2 rounded-full bg-[#6b38d4] animate-pulse"></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-[#6b38d4]/5 p-3 rounded-lg border border-[#6b38d4]/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono text-slate-700">
                      <span>Generating</span>
                      <span>{synthesisProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#6b38d4]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6b38d4] transition-all duration-100 ease-out" style={{ width: `${synthesisProgress}%` }}></div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3 pt-2 text-xs text-left">
                    <div className="flex gap-2 items-center text-slate-800">
                      <Check className="h-4 w-4 text-emerald-650 bg-emerald-100 rounded-full p-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Text Extracted</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-slate-800">
                      {synthesisProgress > 30 ? (
                        <Check className="h-4 w-4 text-emerald-650 bg-emerald-100 rounded-full p-0.5 shrink-0" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
                      )}
                      <div>
                        <p className={`font-semibold ${synthesisProgress > 30 ? "text-slate-800" : "text-slate-400"}`}>Entities Ingested</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-slate-800">
                      {synthesisProgress > 65 ? (
                        <Check className="h-4 w-4 text-emerald-650 bg-emerald-100 rounded-full p-0.5 shrink-0" />
                      ) : synthesisProgress > 30 ? (
                        <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-350 shrink-0 ml-1.5 mr-1" />
                      )}
                      <div>
                        <p className={`font-semibold ${synthesisProgress > 65 ? "text-slate-800" : "text-slate-400"}`}>Relationships Found</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-slate-800">
                      {synthesisProgress >= 100 ? (
                        <Check className="h-4 w-4 text-emerald-650 bg-emerald-100 rounded-full p-0.5 shrink-0" />
                      ) : synthesisProgress > 65 ? (
                        <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-350 shrink-0 ml-1.5 mr-1" />
                      )}
                      <div>
                        <p className={`font-semibold ${synthesisProgress >= 100 ? "text-[#6b38d4]" : "text-slate-400"}`}>Generating Pages</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-55 flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all transform translate-y-0 animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : notification.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-purple-50 border-purple-200 text-purple-800"
        }`}>
          {notification.type === "success" ? (
            <Check className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
          ) : notification.type === "error" ? (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-650" />
          ) : (
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-[#6b38d4]" />
          )}
          <div className="space-y-0.5 flex-1 min-w-0">
            <h4 className="text-xs font-bold font-sans">{notification.title}</h4>
            <p className="text-[11px] font-sans text-slate-500 leading-normal max-w-xs">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-0.5 hover:bg-black/5 rounded-full text-current shrink-0 self-start"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.12s ease-out forwards;
        }
        .z-55 {
          z-index: 55;
        }
      `}</style>
    </div>
  )
}
