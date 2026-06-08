"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, BookOpen, Database, X } from "lucide-react"
import { mockArticles, mockSources } from "./mock-data"

interface WikiSearchProps {
  username: string
  wikiSlug: string
}

interface SearchItem {
  id: string
  title: string
  slug: string
  type: "page" | "source"
  subtitle?: string
}

export default function WikiSearch({ username, wikiSlug }: WikiSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate searchable index from mock data
  const searchItems: SearchItem[] = [
    ...Object.values(mockArticles).map(
      (art) =>
        ({
          id: `art-${art.slug}`,
          title: art.title,
          slug: art.slug,
          type: "page",
          subtitle: art.summary,
        } as SearchItem)
    ),
    ...mockSources.map(
      (src) =>
        ({
          id: `src-${src.id}`,
          title: src.name,
          slug: "sources", // redirect to sources page
          type: "source",
          subtitle: `${src.pagesCount} pages • ${src.conceptsCount} concepts`,
        } as SearchItem)
    ),
  ]

  // Filter items based on query
  const filteredItems = query.trim()
    ? searchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  const pages = filteredItems.filter((item) => item.type === "page")
  const sources = filteredItems.filter((item) => item.type === "source")

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
        selectItem(filteredItems[selectedIndex])
      } else if (filteredItems.length > 0) {
        selectItem(filteredItems[0])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  const selectItem = (item: SearchItem) => {
    setQuery("")
    setIsOpen(false)
    setSelectedIndex(-1)

    const basePath = `/u/${username}/${wikiSlug}`
    if (item.type === "page") {
      router.push(`${basePath}/${item.slug}`)
    } else {
      router.push(`${basePath}/sources`)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg z-35 font-sans">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search pages, concepts, or sources..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-9 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono transition-shadow shadow-xs hover:border-slate-300"
          id="home-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setSelectedIndex(-1)
            }}
            className="absolute right-3 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-450 font-mono">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-1.5 divide-y divide-slate-100">
              {pages.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Concepts & Pages
                  </div>
                  {pages.map((item) => {
                    const globalIdx = filteredItems.findIndex((fi) => fi.id === item.id)
                    const isSelected = globalIdx === selectedIndex
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                          isSelected ? "bg-slate-50 text-slate-900" : "text-slate-700"
                        }`}
                      >
                        <BookOpen className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {sources.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Sources
                  </div>
                  {sources.map((item) => {
                    const globalIdx = filteredItems.findIndex((fi) => fi.id === item.id)
                    const isSelected = globalIdx === selectedIndex
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                          isSelected ? "bg-slate-50 text-slate-900" : "text-slate-700"
                        }`}
                      >
                        <Database className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
