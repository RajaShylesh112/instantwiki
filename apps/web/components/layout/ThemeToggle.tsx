"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light"
    setTheme(activeTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    setTheme(nextTheme)
  }

  if (!mounted) {
    return (
      <div className="h-9 w-9 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-900 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm cursor-pointer"
      aria-label="Toggle Theme"
      id="btn-theme-toggle"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 transition-transform hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform hover:scale-110" />
      )}
    </button>
  )
}
