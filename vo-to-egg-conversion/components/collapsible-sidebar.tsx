"use client"

import { useState } from "react"
import { Search, FolderOpen, Clock, Grid3x3, FileText, PanelLeft, PanelRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Search", icon: Search },
  { name: "Projects", icon: FolderOpen },
  { name: "Recent Chats", icon: Clock },
  { name: "Design Systems", icon: Grid3x3 },
  { name: "Templates", icon: FileText },
]

export function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Header with New Chat button and toggle */}
      <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col p-3 gap-3" : "p-4")}>
        <Button
          variant="outline"
          className={cn(
            "justify-center border-neutral-200 bg-white text-foreground hover:bg-neutral-50 transition-all duration-300",
            isCollapsed ? "w-10 h-10 p-0" : "flex-1",
          )}
        >
          {!isCollapsed && <span className="font-medium">New Chat</span>}
          {isCollapsed && <span className="text-lg">+</span>}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0 hover:bg-neutral-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
        </Button>
      </div>

      <nav className={cn("flex-1 py-2", isCollapsed ? "px-2" : "px-3")}>
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.name}
              className={cn(
                "group relative flex w-full items-center rounded-lg text-sm text-neutral-600 transition-colors hover:bg-neutral-100",
                isCollapsed ? "justify-center py-3 px-2" : "gap-3 px-3 py-2.5",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  isCollapsed ? "absolute opacity-0 pointer-events-none -z-10" : "opacity-100",
                )}
              >
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
