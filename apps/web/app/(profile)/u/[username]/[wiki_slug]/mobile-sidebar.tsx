"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
        {children}
      </SheetContent>
    </Sheet>
  );
}
