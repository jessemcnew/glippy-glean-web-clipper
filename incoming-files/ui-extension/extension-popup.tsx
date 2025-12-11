"use client"

import { Link, Download, Crop, Monitor, FileImage, Settings, ChevronRight, Sparkles } from "lucide-react"
import { useState } from "react"

const menuItems = [
  { icon: Link, label: "Save URL", shortcut: "⌘ ⌥ 0" },
  { icon: Download, label: "Recent Clips", shortcut: "⌥ 1", action: "reader" },
  { icon: Download, label: "Library", shortcut: null, action: "library" },
  { divider: true },
  { icon: Crop, label: "Capture Area", shortcut: "⌥ 2" },
  { icon: Monitor, label: "Capture Visible", shortcut: "⌥ 3" },
  { icon: FileImage, label: "Capture Page", shortcut: "⌥ 4" },
  { divider: true },
  { icon: Settings, label: "Preferences", action: "navigate" },
  { icon: Settings, label: "Configuration", action: "navigate" },
]

export default function ExtensionPopup() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleItemClick = (item: (typeof menuItems)[0]) => {
    if (item.action === "reader") {
      window.open("/reader", "_blank")
    } else if (item.action === "library") {
      window.open("/library", "_blank")
    }
  }

  const handleClipToGlean = () => {
    console.log("[v0] Clip to Glean clicked")
  }

  return (
    <div className="w-72 bg-zinc-800 shadow-2xl border border-zinc-700/50">
      <div className="p-4 bg-zinc-900 border-b border-zinc-700/50">
        <button
          onClick={handleClipToGlean}
          className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Clip to Glean</span>
        </button>
      </div>

      <div className="py-2">
        {menuItems.map((item, index) => {
          if (item.divider) {
            return <div key={index} className="h-px bg-zinc-700/50 my-1.5 mx-3" />
          }

          const Icon = item.icon!

          return (
            <button
              key={index}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-700/50 transition-colors text-left"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleItemClick(item)}
            >
              <Icon className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
              <span className="flex-1 text-zinc-100 text-sm font-medium">{item.label}</span>

              {item.shortcut && <span className="text-zinc-500 text-xs font-mono">{item.shortcut}</span>}

              {item.action === "navigate" && <ChevronRight className="w-4 h-4 text-zinc-500" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
