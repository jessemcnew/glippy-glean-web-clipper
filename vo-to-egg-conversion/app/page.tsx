"use client"

import { CollapsibleSidebar } from "@/components/collapsible-sidebar"
import { CollapsibleRightPanel } from "@/components/collapsible-right-panel"

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <CollapsibleSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Main Content Area</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            This layout includes collapsible panels on both the left and right sides. Both panels expand and collapse
            smoothly with synchronized animations, maintaining layout stability without overlap or jankiness.
          </p>
          <div className="space-y-4">
            <div className="p-6 border rounded-lg bg-neutral-50">
              <h2 className="font-semibold mb-2">Responsive Design</h2>
              <p className="text-sm text-muted-foreground">
                The main content area automatically adjusts its width based on the state of both side panels, ensuring
                optimal reading width and preventing content reflow issues.
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-neutral-50">
              <h2 className="font-semibold mb-2">Smooth Transitions</h2>
              <p className="text-sm text-muted-foreground">
                Both panels use CSS transitions with consistent timing (300ms) and easing functions to create smooth,
                professional animations when toggling between collapsed and expanded states.
              </p>
            </div>
          </div>
        </div>
      </main>
      <CollapsibleRightPanel />
    </div>
  )
}
