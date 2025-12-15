"use client"

import { useState } from "react"
import { Settings, Palette, Layers, Code2, Terminal, PanelLeft, PanelRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const panelItems = [
  { name: "Design", icon: Palette },
  { name: "Rules", icon: Layers },
  { name: "Vars", icon: Terminal },
  { name: "Settings", icon: Settings },
  { name: "Code", icon: Code2 },
]

export function CollapsibleRightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-l bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-80",
      )}
    >
      {/* Header with title and toggle */}
      <div className={cn("flex items-center border-b", isCollapsed ? "flex-col p-3 gap-3" : "justify-between p-4")}>
        {!isCollapsed && <h2 className="font-semibold text-sm">Panel Options</h2>}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0 hover:bg-neutral-100"
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
        </Button>
      </div>

      {/* Panel Content */}
      <div className={cn("flex-1 py-4", isCollapsed ? "px-2" : "px-4")}>
        <nav className="space-y-1">
          {panelItems.map((item) => {
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

        {/* Additional content section */}
        {!isCollapsed && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Code2 className="h-4 w-4 mr-2" />
                View Code
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Terminal className="h-4 w-4 mr-2" />
                Run Script
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
