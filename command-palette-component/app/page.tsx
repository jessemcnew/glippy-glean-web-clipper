"use client"

import { useState, useEffect } from "react"
import CommandPalette from "@/components/command-palette"

export default function Home() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleCommand = (commandId: string) => {
    console.log("[v0] Command executed:", commandId)
    // Handle command execution here
    // In a real Chrome extension, this would communicate with the background script
  }

  return (
    <main className="min-h-screen bg-[#0f0f11] flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-blue-400">Chrome Extension</span>
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight text-balance">Glippy Command Palette</h1>

          <p className="text-lg text-gray-400 text-pretty">
            A beautiful command palette for your web clipper. Save content to Glean with style and efficiency.
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            Open Command Palette
            <kbd className="px-2 py-1 text-xs bg-blue-700 rounded border border-blue-600 group-hover:bg-blue-600 transition-colors">
              ⌘K
            </kbd>
          </button>

          <p className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-[#1a1a1c] border border-[#2a2a2e] rounded text-gray-400">⌘K</kbd> or{" "}
            <kbd className="px-2 py-1 bg-[#1a1a1c] border border-[#2a2a2e] rounded text-gray-400">Ctrl+K</kbd> to open
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          {[
            { icon: "⚡", title: "Quick Actions", desc: "Clip, save, and capture instantly" },
            { icon: "🎯", title: "Smart Search", desc: "Fuzzy search with keyboard navigation" },
            { icon: "⌨️", title: "Shortcuts", desc: "Powerful keyboard shortcuts" },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg hover:border-[#3a3a3e] transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Available Commands */}
        <div className="pt-8 space-y-4">
          <h2 className="text-xl font-semibold text-white">Available Commands</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              { label: "Clip Selection", shortcut: null },
              { label: "Save URL", shortcut: "⌘⌥0" },
              { label: "Recent Clips", shortcut: "⌥1" },
              { label: "Capture Area", shortcut: "⌥2" },
              { label: "Capture Visible", shortcut: "⌥3" },
              { label: "Capture Full Page", shortcut: "⌥4" },
            ].map((cmd, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 bg-[#1a1a1c] border border-[#2a2a2e] rounded"
              >
                <span className="text-gray-300">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="px-2 py-1 text-xs bg-[#0f0f11] border border-[#2a2a2e] rounded text-gray-400">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} onCommand={handleCommand} />
    </main>
  )
}
