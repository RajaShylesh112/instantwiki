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
  isDocLimitReached?: boolean
  isPageLimitReached?: boolean
  isCreditLimitInsufficient?: boolean
}

export default function SourcesView({ 
  username, 
  wikiSlug, 
  wikiId, 
  initialDocuments = [],
  isDocLimitReached = false,
  isPageLimitReached = false,
  isCreditLimitInsufficient = false
}: SourcesViewProps) {
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
  const [currentStep, setCurrentStep] = useState<string>("KNOWLEDGE_EXTRACTION")
  const [estTimeRemaining, setEstTimeRemaining] = useState<number>(45)
  const [synthesisStatusDetail, setSynthesisStatusDetail] = useState<string>("")

  const [isShortcut, setIsShortcut] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const terminalEndRef = useRef<HTMLDivElement>(null)
  const lastStep = useRef<string | null>(null)
  const lastLogDetail = useRef<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const mapDbStepToNewStep = (dbStep: string): string => {
    switch (dbStep) {
      case "EXTRACTION":
        return "KNOWLEDGE_EXTRACTION"
      case "CHUNKING":
      case "EMBEDDINGS":
        return "KNOWLEDGE_UNDERSTANDING"
      case "TOPIC_DISCOVERY":
        return "KNOWLEDGE_STRUCTURING"
      case "SKELETON":
        return "KNOWLEDGE_SYNTHESIS"
      case "FINISHED":
        return "FINISHED"
      default:
        return dbStep
    }
  }

  const addConsoleLog = (msg: string) => {
    const time = new Date().toLocaleTimeString(undefined, { hour12: false })
    setConsoleLogs(prev => [...prev, `[${time}] ${msg}`])
  }

  const getStepNodes = (step: string): string[] => {
    switch (step) {
      case "KNOWLEDGE_EXTRACTION":
        return ["MarkItDown Parser", "Raw Markdown", "Structure Extractor", "Metadata Ingestion", "Visual Selector & OCR"];
      case "KNOWLEDGE_UNDERSTANDING":
        return ["Semantic Chunks", "Vector Embeddings", "pgvector Index", "Chunk Summaries", "Master Summary"];
      case "KNOWLEDGE_STRUCTURING":
        return ["Concept Discovery", "Theme Extraction", "Parent-Child Links", "Hierarchy Builder", "Page Skeletons"];
      case "KNOWLEDGE_SYNTHESIS":
        return ["Page Retrieval", "Hybrid Reranking", "LLM Writing", "Auto Linking", "Citations Mapping"];
      case "FINISHED":
        return ["Wiki Live!", "Index Ready", "Full text search", "Knowledge Graph", "Navigation Enabled"];
      default:
        return ["System Ready", "Awaiting Ingestion", "Worker Active", "Queue Empty", "Cache Synced"];
    }
  }

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [consoleLogs])

  useEffect(() => {
    if (!isSynthesizing) return
    const timer = setInterval(() => {
      setEstTimeRemaining(prev => (prev > 1 ? prev - 1 : 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [isSynthesizing])

  useEffect(() => {
    if (!isSynthesizing) return
    if (currentStep === "KNOWLEDGE_EXTRACTION") {
      setEstTimeRemaining(45)
    } else if (currentStep === "KNOWLEDGE_UNDERSTANDING") {
      setEstTimeRemaining(prev => Math.min(prev, 35))
    } else if (currentStep === "KNOWLEDGE_STRUCTURING") {
      setEstTimeRemaining(prev => Math.min(prev, 22))
    } else if (currentStep === "KNOWLEDGE_SYNTHESIS") {
      setEstTimeRemaining(prev => Math.min(prev, 15))
    } else if (currentStep === "FINISHED") {
      setEstTimeRemaining(0)
    }
  }, [currentStep, isSynthesizing])
  
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

  const handleAbortSynthesis = async () => {
    if (!activeJobId) return
    addConsoleLog("ABORT REQUESTED: Cancelling background jobs and cleaning up connections...")
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    try {
      const res = await fetch(`/api/wiki/${wikiId}/job/${activeJobId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        addConsoleLog("ABORT SUCCESSFUL: Ingestion pipeline stopped.")
        showNotification("info", "Synthesis Aborted", "Wiki generation aborted by user.")
      } else {
        addConsoleLog("ABORT WARNING: Job status could not be changed (already finished or failed).")
      }
    } catch (e) {
      console.error("Failed to abort synthesis:", e)
      addConsoleLog("ABORT ERROR: Network communication failed.")
    } finally {
      setIsSynthesizing(false)
      setActiveJobId(null)
    }
  }

  const handleTriggerSynthesis = async () => {
    setIsSynthesizing(true)
    setSynthesisProgress(0)
    setConsoleLogs([])
    lastStep.current = null
    lastLogDetail.current = null
    
    addConsoleLog("INITIALIZATION: Establishing connection with wiki synthesis system...")

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
      addConsoleLog(`REQUEST: Sending POST request (Shortcut mode: ${isShortcut ? "ACTIVE" : "INACTIVE"})...`)
      const response = await fetch(`/api/wiki/${wikiId}/synthesis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcut: isShortcut })
      })

      if (!response.ok) {
        const res = await response.json()
        throw new Error(res.error || "Failed to initiate wiki page generation.")
      }

      const res = await response.json()
      const jobId = res.jobId
      setActiveJobId(jobId)
      addConsoleLog(`JOB CREATED: Process ID ${jobId.slice(0, 8)} successfully registered.`)

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

          // Parse metadata from job.error if it contains JSON
          let metadata = null
          if (job.error && job.error.startsWith("{") && job.error.endsWith("}")) {
            try {
              metadata = JSON.parse(job.error)
            } catch (e) {}
          }

          // Map step to progress bar percentage
          const mappedStep = mapDbStepToNewStep(job.current_step)
          let progress = 10
          if (mappedStep === "KNOWLEDGE_EXTRACTION") progress = 25
          else if (mappedStep === "KNOWLEDGE_UNDERSTANDING") progress = 50
          else if (mappedStep === "KNOWLEDGE_STRUCTURING") progress = 75
          else if (mappedStep === "KNOWLEDGE_SYNTHESIS") progress = 95
          else if (mappedStep === "FINISHED") progress = 100

          setSynthesisProgress(progress)
          setCurrentStep(mappedStep)

          // Step change logging
          if (mappedStep !== lastStep.current) {
            lastStep.current = mappedStep
            if (mappedStep === "KNOWLEDGE_EXTRACTION") {
              addConsoleLog("KNOWLEDGE EXTRACTION: Spawning MarkItDown parser and saving markdown sources...")
            } else if (mappedStep === "KNOWLEDGE_UNDERSTANDING") {
              addConsoleLog("KNOWLEDGE UNDERSTANDING: Generating semantic chunks, Voyage embeddings, and Master Summary...")
            } else if (mappedStep === "KNOWLEDGE_STRUCTURING") {
              addConsoleLog("KNOWLEDGE STRUCTURING: Building conceptual topics map and parent-child tree hierarchy...")
            } else if (mappedStep === "KNOWLEDGE_SYNTHESIS") {
              addConsoleLog("KNOWLEDGE SYNTHESIS: Executing hybrid retrieval, reranking top 15 chunks, and generating pages...")
            }
          }

          // Update dynamic status detail and estimated time remaining
          if (metadata) {
            if (metadata.est_remaining_seconds !== undefined) {
              setEstTimeRemaining(metadata.est_remaining_seconds)
            }
            
            // Build dynamic text status details
            if (mappedStep === "KNOWLEDGE_EXTRACTION") {
              setSynthesisStatusDetail(`Parsing source files to Markdown... (new: ${metadata.new_docs_count || 0}, reused: ${metadata.reused_docs_count || 0})`)
              const logKey = `extraction-${metadata.new_docs_count}-${metadata.reused_docs_count}`
              if (lastLogDetail.current !== logKey) {
                lastLogDetail.current = logKey
                addConsoleLog(`EXTRACTION INFO: Queued ${metadata.new_docs_count} files for markitdown conversion.`)
              }
            } else if (mappedStep === "KNOWLEDGE_UNDERSTANDING") {
              if (metadata.embedded_chunks !== undefined) {
                setSynthesisStatusDetail(`Generating Voyage embeddings... (${metadata.embedded_chunks} of ${metadata.total_chunks} chunks indexed)`)
                const logKey = `embeddings-${metadata.embedded_chunks}`
                if (lastLogDetail.current !== logKey) {
                  lastLogDetail.current = logKey
                  addConsoleLog(`EMBEDDINGS: Completed embedding chunk ${metadata.embedded_chunks} of ${metadata.total_chunks}.`)
                }
              } else {
                setSynthesisStatusDetail(`Generating Voyage embeddings for ${metadata.total_chunks || 0} chunks...`)
              }
            } else if (mappedStep === "KNOWLEDGE_SYNTHESIS") {
              if (metadata.current_page_index !== undefined) {
                const pageTitle = metadata.current_page_title || (metadata.current_page_index === 0 ? "Preparing pages..." : "")
                setSynthesisStatusDetail(`Synthesizing page ${metadata.current_page_index} of ${metadata.total_pages}${pageTitle ? `: "${pageTitle}"` : ""}`)
                const logKey = `skeleton-${metadata.current_page_index}`
                if (lastLogDetail.current !== logKey) {
                  lastLogDetail.current = logKey
                  // Only log if we have a meaningful title (skip blank 0/N kickoff broadcast)
                  if (metadata.current_page_index > 0 || metadata.current_page_title) {
                    addConsoleLog(`SYNTHESIS: Generated concept page ${metadata.current_page_index}/${metadata.total_pages}: "${metadata.current_page_title || ''}"`)
                  }
                }
              } else {
                setSynthesisStatusDetail("Synthesizing wiki pages content...")
              }
            } else {
              setSynthesisStatusDetail("")
            }
          } else {
            setSynthesisStatusDetail("")
          }

          if (job.status === "COMPLETED") {
            clearInterval(pollInterval)
            pollIntervalRef.current = null
            setSynthesisProgress(100)
            addConsoleLog("FINISHED: All operations completed successfully.")
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
            pollIntervalRef.current = null
            setIsSynthesizing(false)
            addConsoleLog(`FAILED: Synthesis pipeline terminated with error: ${job.error || "Unknown error"}`)
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
      pollIntervalRef.current = pollInterval

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
        
        {isDocLimitReached && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-805 leading-normal w-full text-left">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Upload Cap Reached:</span> You have reached the limit of 10 documents for the Free tier. Please upgrade your plan on the profile page to upload more documents.
            </div>
          </div>
        )}

        {!isUploaderOpen && (
          <button
            onClick={() => !isDocLimitReached && setIsUploaderOpen(true)}
            disabled={isDocLimitReached}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              isDocLimitReached
                ? "bg-slate-150 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed border border-transparent"
                : "bg-[#6b38d4] hover:bg-[#8455ef] text-white cursor-pointer"
            }`}
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
                      Supports PDF, TXT, MD, or DOCX up to 50MB
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-left flex-1">
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

        {/* Quick Generation / Shortcut Toggle Switch */}
        {sources.length > 0 && (
          <div className="flex items-center gap-3 border border-purple-100 bg-purple-50/30 rounded-lg p-2.5">
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-slate-700">Quick Generation</span>
              <span className="text-[9px] text-slate-400 font-mono">Parallelizes DB, generates in &lt;10s</span>
            </div>
            <button
              onClick={() => setIsShortcut(!isShortcut)}
              type="button"
              role="switch"
              aria-checked={isShortcut}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isShortcut ? "bg-[#6b38d4]" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isShortcut ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {isPageLimitReached && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-805 leading-normal max-w-md text-left">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Page Limit Reached:</span> You have reached the limit of 25 pages for the Free tier. Please upgrade your plan on the profile page to generate more pages.
            </div>
          </div>
        )}

        {isCreditLimitInsufficient && (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-805 leading-normal max-w-md text-left">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Insufficient AI Credits:</span> Page generation requires 2 AI credits. Please upgrade your plan on the profile page or purchase more credits.
            </div>
          </div>
        )}

        <button
          onClick={handleTriggerSynthesis}
          disabled={sources.length === 0 || isSynthesizing || isPageLimitReached || isCreditLimitInsufficient}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${
            isPageLimitReached || isCreditLimitInsufficient
              ? "bg-slate-150 text-slate-400 dark:bg-zinc-800 dark:text-zinc-650 cursor-not-allowed"
              : "bg-[#6b38d4] hover:bg-[#8455ef] text-white cursor-pointer disabled:opacity-50"
          }`}
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
        <div className="fixed inset-0 bg-slate-955/85 z-50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden animate-fade-in flex flex-col gap-5 text-slate-100 font-sans">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mt-1">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-purple-400 animate-pulse animate-duration-2000" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  SYSTEM SYNTHESIS CORE &bull; WIKI GENERATOR
                </h2>
              </div>
              <button
                onClick={handleAbortSynthesis}
                className="px-3 py-1.5 bg-red-955/40 hover:bg-red-900/60 border border-red-800/50 hover:border-red-750 text-red-200 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-3.5 w-3.5" /> Abort Synthesis
              </button>
            </div>

            {/* Content grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Radial Progress & Stage details */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-955/35 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  {/* Circular progress ring */}
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      className="text-slate-800"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="58"
                      className="text-purple-500 transition-all duration-300 ease-out"
                      strokeWidth="6"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (synthesisProgress / 100) * 364.4}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inside circle text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold tracking-tight text-white">{synthesisProgress}%</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono mt-0.5">PROGRESS</span>
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    {currentStep === "KNOWLEDGE_EXTRACTION" && "KNOWLEDGE EXTRACTION"}
                    {currentStep === "KNOWLEDGE_UNDERSTANDING" && "KNOWLEDGE UNDERSTANDING"}
                    {currentStep === "KNOWLEDGE_STRUCTURING" && "KNOWLEDGE STRUCTURING"}
                    {currentStep === "KNOWLEDGE_SYNTHESIS" && "KNOWLEDGE SYNTHESIS"}
                    {currentStep === "FINISHED" && "SYNTHESIS COMPLETED"}
                  </h4>
                  <p className="text-[11px] text-slate-350 truncate max-w-xs font-mono h-4">
                    {synthesisStatusDetail || "Working..."}
                  </p>
                  {currentStep !== "FINISHED" && estTimeRemaining > 0 && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      Estimated remaining: <span className="text-slate-300 font-bold">~{estTimeRemaining}s</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Visual Concept Network Map */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-955/35 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    Cognitive Concept Linker
                  </h4>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                    {getStepNodes(currentStep).length} nodes active
                  </span>
                </div>

                {/* Network Map area */}
                <div className="relative w-full h-[180px] bg-slate-950/80 border border-slate-850 rounded-lg overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Background grid */}
                    <defs>
                      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Connections from center to surrounding nodes */}
                    <line x1="20%" y1="25%" x2="50%" y2="50%" className="stroke-purple-500/20 stroke-[1]" strokeDasharray="4,4" />
                    <line x1="80%" y1="22%" x2="50%" y2="50%" className="stroke-purple-500/20 stroke-[1]" strokeDasharray="4,4" />
                    <line x1="22%" y1="78%" x2="50%" y2="50%" className="stroke-purple-500/20 stroke-[1]" strokeDasharray="4,4" />
                    <line x1="78%" y1="78%" x2="50%" y2="50%" className="stroke-purple-500/20 stroke-[1]" strokeDasharray="4,4" />
                    <line x1="50%" y1="15%" x2="50%" y2="50%" className="stroke-purple-500/20 stroke-[1]" strokeDasharray="4,4" />

                    {/* Glowing active line pulse */}
                    <line x1="20%" y1="25%" x2="50%" y2="50%" className="stroke-emerald-500/20 stroke-[2] animate-pulse" strokeDasharray="6,6" style={{ animationDuration: '3s' }} />
                    <line x1="80%" y1="22%" x2="50%" y2="50%" className="stroke-emerald-500/20 stroke-[2] animate-pulse" strokeDasharray="6,6" style={{ animationDuration: '4s' }} />
                    <line x1="22%" y1="78%" x2="50%" y2="50%" className="stroke-emerald-500/20 stroke-[2] animate-pulse" strokeDasharray="6,6" style={{ animationDuration: '2.5s' }} />
                    <line x1="78%" y1="78%" x2="50%" y2="50%" className="stroke-emerald-500/20 stroke-[2] animate-pulse" strokeDasharray="6,6" style={{ animationDuration: '3.5s' }} />
                    <line x1="50%" y1="15%" x2="50%" y2="50%" className="stroke-emerald-500/20 stroke-[2] animate-pulse" strokeDasharray="6,6" style={{ animationDuration: '2.8s' }} />
                  </svg>
                  
                  {/* Central Node */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900/90 border border-purple-500 text-purple-300 text-[10px] font-extrabold uppercase rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] z-20 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    {currentStep}
                  </div>

                  {/* Floating Step Nodes */}
                  {getStepNodes(currentStep).map((concept, idx) => {
                    const pos = [
                      { x: "20%", y: "25%" },
                      { x: "80%", y: "22%" },
                      { x: "22%", y: "78%" },
                      { x: "78%", y: "78%" },
                      { x: "50%", y: "15%" }
                    ][idx] || { x: "50%", y: "50%" }
                    return (
                      <div
                        key={concept + idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/95 border border-purple-500/30 text-purple-200 text-[9px] font-semibold rounded-md shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-bounce-slow z-10"
                        style={{
                          left: pos.x,
                          top: pos.y,
                          animationDelay: `${idx * 0.4}s`,
                          animationDuration: '5s'
                        }}
                      >
                        <div className="w-1 h-1 rounded-full bg-purple-400 animate-ping" />
                        {concept}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Scrolling Console Terminal */}
            <div className="bg-black/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5 font-mono text-[10px] text-slate-350">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1 text-slate-400">
                <span>SYSTEM INSTRUMENTATION LOGGER</span>
                <span className="animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ONLINE
                </span>
              </div>
              <div className="h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 pr-1 flex flex-col">
                {consoleLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed whitespace-pre-wrap break-all text-left">
                    <span className="text-[#6b38d4] font-semibold">&gt;&gt;</span> {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
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
        @keyframes bounceSlow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 5s ease-in-out infinite;
        }
        .bg-slate-955\/35 {
          background-color: rgba(15, 23, 42, 0.35);
        }
        .bg-slate-955\/85 {
          background-color: rgba(15, 23, 42, 0.5);
        }
      `}</style>
    </div>
  )
}
