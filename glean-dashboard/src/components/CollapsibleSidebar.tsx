"use client"

import { useState, ReactNode, createContext, useContext } from "react"
import { PanelLeft, PanelRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CollapsibleSidebarContextType {
  isCollapsed: boolean
}

const CollapsibleSidebarContext = createContext<CollapsibleSidebarContextType | null>(null)

export function useCollapsibleSidebar() {
  const context = useContext(CollapsibleSidebarContext)
  return context
}

interface CollapsibleSidebarProps {
  children: ReactNode
  side?: "left" | "right"
  defaultCollapsed?: boolean
  collapsedWidth?: string
  expandedWidth?: string
  onCollapseChange?: (isCollapsed: boolean) => void
}

export function CollapsibleSidebar({
  children,
  side = "left",
  defaultCollapsed = false,
  collapsedWidth = "w-20",
  expandedWidth = "w-64",
  onCollapseChange,
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapseChange?.(newState)
  }

  return (
    <CollapsibleSidebarContext.Provider value={{ isCollapsed }}>
      <aside
        className={cn(
          "relative flex flex-col transition-all duration-300 ease-in-out bg-card",
          side === "left" ? "border-r border-border" : "border-l border-border",
          isCollapsed ? collapsedWidth : expandedWidth,
        )}
      >
        {/* Toggle button */}
        <div className={cn("flex items-center", side === "left" ? "justify-end" : "justify-start", "p-2 border-b border-border")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="shrink-0 h-7 w-7 hover:bg-accent"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {side === "left" ? (
              isCollapsed ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />
            ) : (
              isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </aside>
    </CollapsibleSidebarContext.Provider>
  )
}
