"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function MainNav({ username }: { username: string | null }) {
  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/pricing", label: "Pricing" },
    ...(username ? [
      { href: "/workspaces", label: "Workspaces" },
      { href: `/u/${username}`, label: "Profile" }
    ] : [])
  ]

  return (
    <div className="flex items-center gap-4 md:gap-8">
      {/* Mobile Nav Hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 p-6 flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-[#6b38d4] to-[#006b5e] dark:from-purple-400 dark:to-emerald-400 bg-clip-text text-transparent tracking-tight font-sans">
              instant.wiki
            </span>
          </Link>
          <div className="flex flex-col gap-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#6b38d4] dark:hover:text-purple-400 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-[#6b38d4] to-[#006b5e] dark:from-purple-400 dark:to-emerald-400 bg-clip-text text-transparent tracking-tight font-sans">
          instant.wiki
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex">
        <NavigationMenu>
          <NavigationMenuList className="flex items-center gap-1">
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink asChild className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-[#6b38d4]/10 hover:text-[#6b38d4] dark:hover:bg-purple-500/10 dark:hover:text-purple-400 font-semibold"
                )}>
                  <Link href={link.href}>
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  )
}
