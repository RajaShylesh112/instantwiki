"use client"

import { cn } from "@/lib/utils"
import CustomLink from "./custom-link"
import React from "react"

export function MainNav() {
  return (
    <div className="flex items-center gap-6">
      <CustomLink href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
        <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
          Instant Wiki
        </span>
      </CustomLink>
      <nav className="flex items-center gap-4 text-xs font-semibold font-mono text-slate-500">
        <CustomLink href="/" className="hover:text-slate-800 transition-colors">
          Dashboard
        </CustomLink>
      </nav>
    </div>
  )
}

