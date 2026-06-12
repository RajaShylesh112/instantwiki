import React from "react"
import Link from "next/link"

export interface Token {
  type: "text" | "bold" | "italic" | "code" | "link" | "html-link" | "citation"
  text: string
  href?: string
  citationIdx?: number
}

/**
 * Splits plain text tokens using a regular expression and wraps matching groups into custom tokens.
 */
function splitTokens(
  tokens: Token[],
  regex: RegExp,
  createToken: (match: RegExpExecArray) => Token
): Token[] {
  const result: Token[] = []
  
  for (const token of tokens) {
    if (token.type !== "text") {
      result.push(token)
      continue
    }
    
    let lastIdx = 0
    let match
    regex.lastIndex = 0
    
    const text = token.text
    while ((match = regex.exec(text)) !== null) {
      const matchIdx = match.index
      const beforeText = text.substring(lastIdx, matchIdx)
      if (beforeText) {
        result.push({ type: "text", text: beforeText })
      }
      
      result.push(createToken(match))
      lastIdx = regex.lastIndex
    }
    
    const remainingText = text.substring(lastIdx)
    if (remainingText) {
      result.push({ type: "text", text: remainingText })
    }
  }
  
  return result
}

/**
 * Tokenizes line text into structured format tokens (links, citations, bold, italics, inline code).
 */
export function tokenizeInline(text: string): Token[] {
  let tokens: Token[] = [{ type: "text", text }]
  
  // 1. HTML Links: <a href="URL" class="...">TEXT</a>
  tokens = splitTokens(tokens, /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match) => ({
    type: "html-link",
    text: match[2],
    href: match[1]
  }))
  
  // 2. Markdown Links: [TEXT](URL)
  tokens = splitTokens(tokens, /\[([^\]\n]+)\]\(([^)\n]+)\)/g, (match) => ({
    type: "link",
    text: match[1],
    href: match[2]
  }))
  
  // 3. Citations: [1], [2], [12]
  tokens = splitTokens(tokens, /\[(\d+)\]/g, (match) => ({
    type: "citation",
    text: match[0],
    citationIdx: parseInt(match[1], 10)
  }))
  
  // 4. Bold: **text** or __text__
  tokens = splitTokens(tokens, /(\*\*|__)(.*?)\1/g, (match) => ({
    type: "bold",
    text: match[2]
  }))
  
  // 5. Italic: *text* or _text_
  tokens = splitTokens(tokens, /(\*|_)(.*?)\1/g, (match) => ({
    type: "italic",
    text: match[2]
  }))
  
  // 6. Inline Code: `code`
  tokens = splitTokens(tokens, /`([^`\n]+)`/g, (match) => ({
    type: "code",
    text: match[1]
  }))
  
  return tokens
}

/**
 * Renders inline tokens into React Elements.
 */
export function renderInlineTokens(
  tokens: Token[],
  options?: {
    citations?: any[]
    onCitationClick?: (id: string) => void
  }
): React.ReactNode[] {
  return tokens.map((token, idx) => {
    switch (token.type) {
      case "bold":
        return <strong key={idx} className="font-bold text-slate-900 dark:text-zinc-100">{token.text}</strong>
      case "italic":
        return <em key={idx} className="italic text-slate-800 dark:text-zinc-200">{token.text}</em>
      case "code":
        return (
          <code key={idx} className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1.2 py-0.5 rounded font-mono text-[11px] text-slate-800 dark:text-zinc-200">
            {token.text}
          </code>
        )
      case "html-link":
      case "link":
        return (
          <Link
            key={idx}
            href={token.href || "#"}
            className="text-[#6b38d4] dark:text-purple-400 font-semibold hover:underline border-b border-dashed border-[#6b38d4]/30 dark:border-purple-400/30"
          >
            {token.text}
          </Link>
        )
      case "citation":
        if (options?.citations && token.citationIdx !== undefined) {
          const citation = options.citations[token.citationIdx - 1] || options.citations[0]
          if (citation) {
            return (
              <sup
                key={idx}
                onClick={() => options.onCitationClick?.(citation.id)}
                className={`font-bold font-mono text-[#6b38d4] rounded px-1 select-none transition-colors mx-0.5 ${
                  options.onCitationClick ? "cursor-pointer hover:bg-[#6b38d4]/10" : ""
                }`}
                title="Click to trace source evidence"
              >
                [{token.citationIdx}]
              </sup>
            )
          }
        }
        return <span key={idx} className="text-slate-500 dark:text-zinc-400 font-mono text-xs">[{token.citationIdx}]</span>
      default:
        return token.text
    }
  })
}

/**
 * Parses a full Markdown body string and groups lists, code blocks, headings, blockquotes, and paragraphs.
 */
export function renderMarkdownBody(
  bodyText: string,
  options?: {
    citations?: any[]
    onCitationClick?: (id: string) => void
  }
): React.ReactNode[] {
  const lines = (bodyText || "").split("\n")
  const elements: React.ReactNode[] = []
  
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let inList = false
  let listItems: React.ReactNode[] = []
  let listType: "ul" | "ol" = "ul"

  const flushList = (key: string | number) => {
    if (listItems.length > 0) {
      if (listType === "ul") {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-5 my-2.5 space-y-1 font-serif text-sm sm:text-base text-slate-700 dark:text-zinc-300">
            {listItems}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal pl-5 my-2.5 space-y-1 font-serif text-sm sm:text-base text-slate-700 dark:text-zinc-300">
            {listItems}
          </ol>
        )
      }
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // 1. Code block handling
    if (trimmed.startsWith("```")) {
      flushList(index)
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3.5 overflow-x-auto my-3.5 font-mono text-xs text-slate-800 dark:text-zinc-200 leading-normal">
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        )
        inCodeBlock = false
        codeBlockContent = []
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    // Empty lines trigger flushing list
    if (!trimmed) {
      flushList(index)
      return
    }

    // 2. Headings
    if (trimmed.startsWith("#")) {
      flushList(index)
      let level = 0
      while (trimmed[level] === "#") {
        level++
      }
      const headingText = trimmed.substring(level).trim()
      const headingId = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const tokens = tokenizeInline(headingText)
      const content = renderInlineTokens(tokens, options)

      const headingClasses = [
        "text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight font-serif border-b border-slate-200 dark:border-zinc-800 pb-1.5", // h1
        "text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight font-serif border-b border-slate-100 dark:border-zinc-800/80 pb-1", // h2
        "text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight font-serif pb-0.5", // h3
        "text-base sm:text-lg font-semibold text-slate-800 dark:text-zinc-200 mt-4 mb-2 font-serif", // h4
        "text-sm sm:text-base font-semibold text-slate-700 dark:text-zinc-300 mt-4 mb-2 font-serif", // h5
        "text-xs sm:text-sm font-semibold text-slate-650 dark:text-zinc-400 mt-4 mb-2 font-serif", // h6
      ]
      const HeadingTag = `h${Math.min(level, 6)}` as any
      const className = headingClasses[Math.min(level, 6) - 1]

      elements.push(
        <HeadingTag key={index} id={headingId} className={className}>
          {content}
        </HeadingTag>
      )
      return
    }

    // 3. Blockquotes
    if (trimmed.startsWith(">")) {
      flushList(index)
      const quoteText = trimmed.substring(1).trim()
      const tokens = tokenizeInline(quoteText)
      elements.push(
        <blockquote key={index} className="border-l-4 border-[#6b38d4] dark:border-purple-500 bg-slate-50 dark:bg-zinc-900 p-4 rounded-r-lg italic my-3 text-sm text-slate-700 dark:text-zinc-300">
          {renderInlineTokens(tokens, options)}
        </blockquote>
      )
      return
    }

    // 4. Horizontal Rules
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList(index)
      elements.push(<hr key={index} className="my-6 border-slate-200 dark:border-zinc-800" />)
      return
    }

    // 5. Unordered List Items
    if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("+")) {
      if (inList && listType !== "ul") {
        flushList(index)
      }
      inList = true
      listType = "ul"
      const itemText = trimmed.substring(1).trim()
      const tokens = tokenizeInline(itemText)
      listItems.push(
        <li key={`li-${index}`} className="leading-relaxed font-serif my-1">
          {renderInlineTokens(tokens, options)}
        </li>
      )
      return
    }

    // 6. Ordered List Items
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (orderedMatch) {
      if (inList && listType !== "ol") {
        flushList(index)
      }
      inList = true
      listType = "ol"
      const itemText = orderedMatch[2].trim()
      const tokens = tokenizeInline(itemText)
      listItems.push(
        <li key={`li-${index}`} className="leading-relaxed font-serif my-1">
          {renderInlineTokens(tokens, options)}
        </li>
      )
      return
    }

    // 7. Normal Paragraph
    flushList(index)
    const tokens = tokenizeInline(trimmed)
    elements.push(
      <p key={index} className="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-serif mb-4">
        {renderInlineTokens(tokens, options)}
      </p>
    )
  })

  // Flush any final list
  flushList("final")

  return elements
}
