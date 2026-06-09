"use client"

import { cn } from "@/lib/utils"
import CustomLink from "./custom-link"
import React from "react"

export function MainNav({ username }: { username: string | null }) {
  return (
    <div className="flex items-center gap-8 sm:gap-12">
      <CustomLink href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-[#6b38d4] to-[#006b5e] bg-clip-text text-transparent tracking-tight font-sans">
          instant.wiki
        </span>
      </CustomLink>
      <nav className="flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-slate-600 font-sans">
        <CustomLink 
          href="/" 
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-[#6b38d4]/5 hover:text-[#6b38d4] transition-all duration-200"
        >
          Dashboard
        </CustomLink>
        {username && (
          <>
            <CustomLink 
              href="/workspaces" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-[#6b38d4]/5 hover:text-[#6b38d4] transition-all duration-200"
            >
              Workspaces
            </CustomLink>
            <CustomLink 
              href={`/u/${username}`} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-[#6b38d4]/5 hover:text-[#6b38d4] transition-all duration-200"
            >
              Profile
            </CustomLink>
          </>
        )}
      </nav>
    </div>
  )
}

