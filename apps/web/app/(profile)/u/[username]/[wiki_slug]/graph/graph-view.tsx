"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Search, ZoomIn, ZoomOut, Maximize2, Network, X, BookOpen, HelpCircle } from "lucide-react"
import { WikiPage } from "@/lib/repositories/wiki-generator"

interface GraphViewProps {
  username: string
  wikiSlug: string
  wikiId: string
  initialPages: WikiPage[]
}

export default function GraphView({ username, wikiSlug, wikiId, initialPages = [] }: GraphViewProps) {
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  const svgRef = useRef<SVGSVGElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // 1. Process Pages into Graph Nodes
  const nodes = initialPages.map(page => {
    let group = 2 // TOPIC
    let val = 20
    if (page.page_type === "ROOT") {
      group = 1
      val = 26
    } else if (page.page_type === "SUBTOPIC" || page.page_type === "REFERENCE") {
      group = 3
      val = 14
    }

    return {
      id: page.id,
      name: page.title,
      slug: page.slug,
      summary: page.summary || "No summary discovered for this page.",
      page_type: page.page_type,
      group,
      val
    }
  })

  // 2. Process Parent-Child Links
  const links: { source: string; target: string }[] = []
  initialPages.forEach(page => {
    if (page.parent_page_id) {
      links.push({
        source: page.parent_page_id,
        target: page.id
      })
    }
  })

  // 3. Calculate Node Positions Dynamically in a tree circular layout
  const calculateNodePositions = (pages: WikiPage[]) => {
    const positions: Record<string, { x: number; y: number }> = {}
    if (pages.length === 0) return positions
    
    // Locate the root node
    const root = pages.find(p => p.page_type === "ROOT") || pages.find(p => p.parent_page_id === null) || pages[0]
    positions[root.id] = { x: 400, y: 250 }

    // Resolve children of root
    const children = pages.filter(p => p.parent_page_id === root.id && p.id !== root.id)
    children.forEach((child, idx) => {
      const angle = (idx / children.length) * 2 * Math.PI
      const radius = 170
      const cx = 400 + Math.cos(angle) * radius
      const cy = 250 + Math.sin(angle) * radius
      positions[child.id] = { x: cx, y: cy }

      // Resolve grandchildren of this child node
      const grandchildren = pages.filter(p => p.parent_page_id === child.id && p.id !== child.id)
      grandchildren.forEach((gc, gcIdx) => {
        // Offset angle for grandchildren spread
        const gcAngle = angle + ((gcIdx - (grandchildren.length - 1) / 2) * 0.45)
        const gcRadius = 110
        positions[gc.id] = {
          x: cx + Math.cos(gcAngle) * gcRadius,
          y: cy + Math.sin(gcAngle) * gcRadius
        }
      })
    })

    // Fallback coordinates for any unmapped orphaned nodes
    pages.forEach((page, idx) => {
      if (!positions[page.id]) {
        positions[page.id] = { 
          x: 200 + (idx * 80) % 400, 
          y: 100 + (idx * 80) % 300 
        }
      }
    })

    return positions
  }

  const nodePositions = calculateNodePositions(initialPages)

  const connectedNodeIds = new Set<string>()
  if (selectedNodeId) {
    connectedNodeIds.add(selectedNodeId)
    links.forEach((link) => {
      if (link.source === selectedNodeId) {
        connectedNodeIds.add(link.target)
      } else if (link.target === selectedNodeId) {
        connectedNodeIds.add(link.source)
      }
    })
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement
    if (target.tagName === "circle" || target.tagName === "text" || target.closest("button")) {
      return
    }
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 1.1
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor
    setZoom(Math.max(0.3, Math.min(3.0, newZoom)))
  }

  const handleZoomIn = () => setZoom((z) => Math.min(3.0, z * 1.1))
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, z / 1.1))
  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    setSelectedNodeId(null)
    setSearchQuery("")
  }

  const filteredNodes = searchQuery.trim()
    ? nodes.filter((node) => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const handleSelectSearchedNode = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    setSearchQuery("")
    setIsSearchFocused(false)

    const pos = nodePositions[nodeId]
    if (pos) {
      setPan({
        x: 400 - pos.x * zoom,
        y: 250 - pos.y * zoom,
      })
    }
  }

  return (
    <div className="relative h-[calc(100vh-60px)] md:h-screen w-full bg-transparent overflow-hidden font-sans select-none flex flex-col">
      {/* Floating Header & Search Bar (graph-controls) */}
      <header className="absolute top-5 left-5 right-5 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pointer-events-none">
        
        <div className="relative w-full max-w-xs pointer-events-auto bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-450 bg-transparent rounded-md focus:outline-none font-mono"
              id="graph-search-node"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {filteredNodes.length === 0 ? (
                <div className="p-3 text-[11px] text-slate-455 font-mono text-center">
                  No concepts match
                </div>
              ) : (
                filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectSearchedNode(node.id)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-semibold border-b border-slate-50 last:border-0"
                  >
                    {node.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Floating Zoom Controls (graph-zoom-group) */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200 pointer-events-auto shrink-0 self-end sm:self-auto">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom In"
            id="graph-btn-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom Out"
            id="graph-btn-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-[10px] font-bold font-mono uppercase tracking-wider"
            title="Fit to Screen"
            id="graph-btn-fit"
          >
            <Maximize2 className="h-4 w-4" /> Fit
          </button>
        </div>
      </header>

      {/* SVG Canvas Area (graph-canvas-container) */}
      <div
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: "#FAFAF8" }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* Draw Links/Edges */}
            {links.map((link, idx) => {
              const start = nodePositions[link.source]
              const end = nodePositions[link.target]
              if (!start || !end) return null

              const isSelectedPath =
                selectedNodeId === link.source || selectedNodeId === link.target
              const opacity = selectedNodeId ? (isSelectedPath ? 1.0 : 0.15) : 0.6
              const stroke = isSelectedPath ? "#6b38d4" : "#CBD5E1"
              const strokeWidth = isSelectedPath ? 2.0 : 1.2

              return (
                <line
                  key={`link-${idx}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  style={{ opacity, transition: "all 0.2s ease" }}
                  id="graph-edge-element"
                />
              )
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id]
              if (!pos) return null

              const isSelected = selectedNodeId === node.id
              const isConnected = connectedNodeIds.has(node.id)
              
              const opacity = selectedNodeId ? (isConnected ? 1.0 : 0.2) : 1.0
              const radius = isSelected ? 16 : 12
              
              let fill = "#FFFFFF"
              let stroke = "#94A3B8"
              if (node.group === 1) {
                fill = isSelected ? "#f6f2ff" : "#F8FAFC"
                stroke = "#6b38d4"
              } else if (node.group === 2) {
                fill = isSelected ? "#f0faf7" : "#F8FAFC"
                stroke = "#006b5e"
              } else if (node.group === 3) {
                fill = isSelected ? "#FFF7ED" : "#F8FAFC"
                stroke = "#EA580C"
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                  className="cursor-pointer group"
                  style={{ opacity, transition: "all 0.2s ease" }}
                  id="graph-node-element"
                >
                  <circle
                    r={radius + 4}
                    fill="transparent"
                    className="group-hover:fill-slate-200/40 transition-colors"
                  />
                  
                  <circle
                    r={radius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="shadow-sm transition-all"
                  />

                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    className="text-[10px] font-bold font-mono tracking-tight fill-slate-800 pointer-events-none select-none"
                  >
                    {node.name}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Floating Instruction overlay */}
        <div className="absolute bottom-5 left-5 pointer-events-none bg-white/70 border border-slate-200/50 backdrop-blur-xs p-3 rounded-lg text-[10px] text-slate-450 font-mono flex items-start gap-1.5 max-w-xs shadow-none">
          <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Drag canvas to pan. Scroll to zoom. Click nodes to focus paths and reveal summary info cards.
          </span>
        </div>

        {/* Selected Node Summary Card Popup (graph-node-popup) */}
        {selectedNodeId && selectedNode && (
          <div
            className="absolute bottom-5 right-5 w-80 bg-white border border-slate-250 rounded-lg shadow-xl z-20 p-5 space-y-4 animate-fade-in pointer-events-auto font-sans"
            id="graph-node-popup"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Network className="h-4.5 w-4.5 text-[#6b38d4]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Concept Focused
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-0.5 rounded-full hover:bg-slate-100 text-slate-455"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-slate-955">
                {selectedNode.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-serif">
                {selectedNode.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-slate-400">
                Type: {selectedNode.page_type}
              </span>
              
              <Link
                href={`/u/${username}/${wikiSlug}/${selectedNode.slug}`}
                id="graph-popup-btn-open"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#6b38d4] text-white hover:bg-[#8455ef] rounded-md transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" /> Open Article
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
