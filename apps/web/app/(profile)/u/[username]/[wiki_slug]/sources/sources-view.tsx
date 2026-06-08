"use client"

import { useState, useRef } from "react"
import { Database, Plus, Trash2, UploadCloud, X, AlertTriangle, FileText, Globe, Check, Loader2 } from "lucide-react"
import { mockSources, MockSource } from "../mock-data"

interface SourcesViewProps {
  username: string
  wikiSlug: string
}

export default function SourcesView({ username, wikiSlug }: SourcesViewProps) {
  const [sources, setSources] = useState<MockSource[]>(mockSources)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [sourceToDelete, setSourceToDelete] = useState<MockSource | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      simulateUpload(files[0].name)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      simulateUpload(files[0].name)
    }
  }

  const simulateUpload = (fileName: string) => {
    setIsUploading(true)
    setUploadSuccess(false)
    
    setTimeout(() => {
      setIsUploading(false)
      setUploadSuccess(true)
      
      const newSource: MockSource = {
        id: `src-${Date.now()}`,
        name: fileName.endsWith(".pdf") || fileName.endsWith(".txt") || fileName.endsWith(".md")
          ? fileName
          : `${fileName}.pdf`,
        uploadedAt: "Just now",
        pagesCount: Math.floor(Math.random() * 8) + 3,
        conceptsCount: Math.floor(Math.random() * 12) + 5,
      }

      setSources((prev) => [newSource, ...prev])

      setTimeout(() => {
        setUploadSuccess(false)
        setIsUploaderOpen(false)
      }, 1500)
    }, 2000)
  }

  const handleUrlImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setIsUploading(true)
    
    setTimeout(() => {
      setIsUploading(false)
      setUploadSuccess(true)

      let cleanName = "webpage-source.pdf"
      try {
        const urlObj = new URL(urlInput)
        cleanName = `${urlObj.hostname}${urlObj.pathname.replace(/\/$/, "")}.pdf`
      } catch (err) {
        cleanName = urlInput.replace(/https?:\/\//, "").replace(/\//g, "-") + ".pdf"
      }

      const newSource: MockSource = {
        id: `src-${Date.now()}`,
        name: cleanName,
        uploadedAt: "Just now",
        pagesCount: 1,
        conceptsCount: Math.floor(Math.random() * 5) + 2,
      }

      setSources((prev) => [newSource, ...prev])
      setUrlInput("")

      setTimeout(() => {
        setUploadSuccess(false)
        setIsUploaderOpen(false)
      }, 1550)
    }, 1500)
  }

  const confirmDelete = () => {
    if (sourceToDelete) {
      setSources((prev) => prev.filter((s) => s.id !== sourceToDelete.id))
      setSourceToDelete(null)
    }
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Knowledge Source
          </button>
        )}
      </div>

      {/* Inline Add Source Card */}
      {isUploaderOpen && (
        <div className="rounded-lg border border-slate-250 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Add New Source Document
            </h2>
            <button
              onClick={() => setIsUploaderOpen(false)}
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
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all ${
                isDragOver
                  ? "border-indigo-600 bg-slate-100/50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.md"
                className="hidden"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-mono">Uploading and parsing PDF...</p>
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
                    Drag and drop file here or <span className="text-indigo-650">click to browse</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Supports PDF, TXT, or MD up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* URL Import Field */}
            <form
              onSubmit={handleUrlImport}
              className="border border-slate-200 rounded-lg p-5 bg-slate-50 flex flex-col justify-between"
            >
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
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    disabled={isUploading}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                  We will scrape content, strip boilerplates, and build semantic concept links automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsUploaderOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-505 hover:text-slate-800"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md flex items-center gap-1.5"
                  disabled={isUploading || uploadSuccess}
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Import"}
                </button>
              </div>
            </form>
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
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono text-right">
                Pages Ingested
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono text-right">
                Concepts Found
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
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                        {src.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-505 font-mono" id="sources-col-date">
                    {src.uploadedAt}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-800 font-mono text-right" id="sources-col-pages">
                    {src.pagesCount}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-800 font-mono text-right" id="sources-col-concepts">
                    {src.conceptsCount}
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
                    Delete "{sourceToDelete.name}"?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-mono">
                    Document Removal & Database Cascade Alert
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50/50 border border-red-100 rounded-md text-xs text-red-800 leading-relaxed font-sans">
                Deleting this file will permanently prune any generated concept pages whose only validation reference is "{sourceToDelete.name}". Other multi-reference concepts will remain but lose this document's citations.
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
