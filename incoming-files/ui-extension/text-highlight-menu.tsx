"use client"

import { Sparkles, Bookmark, Type, Search } from "lucide-react"
import { useState, useEffect } from "react"

interface TextHighlightMenuProps {
  x: number
  y: number
  selectedText: string
  onAction: (action: string) => void
}

export default function TextHighlightMenu({ x, y, selectedText, onAction }: TextHighlightMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const menuItems = [
    { icon: Sparkles, label: "Clip to Glean", action: "clip-to-glean" },
    { icon: Bookmark, label: "Read it Later", action: "read-later" },
    { icon: Type, label: "Save Text", action: "save-text" },
    { icon: Search, label: "Search Glean", action: "search-glean" },
  ]

  useEffect(() => {
    setIsOpen(true)
  }, [])

  const handleAction = (action: string) => {
    onAction(action)
    setIsOpen(false)
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Radial menu container */}
      <div className={`relative transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-700 shadow-xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-zinc-100" />
          </div>
        </div>

        {/* Radial menu items */}
        <div className="relative w-64 h-64">
          {menuItems.map((item, index) => {
            const angle = (index * 360) / menuItems.length - 90
            const radius = 80
            const rad = (angle * Math.PI) / 180
            const x = Math.cos(rad) * radius
            const y = Math.sin(rad) * radius

            const Icon = item.icon

            return (
              <button
                key={index}
                onClick={() => handleAction(item.action)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`absolute top-1/2 left-1/2 transition-all duration-200 ${
                  hoveredIndex === index ? "scale-110" : "scale-100"
                }`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-14 h-14 rounded-full bg-zinc-800 border-2 ${
                      hoveredIndex === index ? "border-zinc-500" : "border-zinc-700"
                    } shadow-lg flex items-center justify-center hover:bg-zinc-700 transition-all backdrop-blur-sm`}
                  >
                    <Icon className="w-6 h-6 text-zinc-100" />
                  </div>
                  <span className="text-xs font-medium text-zinc-100 bg-zinc-900/95 px-2 py-1 rounded border border-zinc-700/50 whitespace-nowrap shadow-lg">
                    {item.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
